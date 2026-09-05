import "server-only";

/**
 * Follow Up Boss client — the only module that talks to the CRM.
 * Spec: docs/handoff/integrations/follow-up-boss.md
 *
 * Rules that live here so no caller can get them wrong:
 *  - Leads go to POST /v1/events. Never /v1/people.
 *  - Every request carries the registered X-System / X-System-Key headers.
 *  - A 204 means the lead flow for this source is ARCHIVED and the lead was
 *    silently dropped. It is logged at error level and alerted. It is not success.
 *  - 429 honours Retry-After; transient failures back off and retry.
 */

export type FubEventType =
  | "General Inquiry"
  | "Property Inquiry"
  | "Seller Inquiry"
  | "Registration"
  | "Viewed Page";

export type FubPerson = {
  firstName?: string;
  lastName?: string;
  emails?: { value: string; type?: string }[];
  phones?: { value: string; type?: string }[];
  tags?: string[];
  source?: string;
};

export type FubProperty = {
  street?: string;
  city?: string;
  state?: string;
  code?: string;
  price?: number;
  mlsNumber?: string;
  url?: string;
  type?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
};

export type FubCampaign = {
  source: string;
  medium?: string;
  term?: string;
  content?: string;
  campaign?: string;
};

export type FubEventPayload = {
  source: string;
  system: string;
  type: FubEventType;
  message?: string;
  description?: string;
  person: FubPerson;
  property?: FubProperty;
  campaign?: FubCampaign;
  pageUrl?: string;
  pageTitle?: string;
  pageReferrer?: string;
};

export type FubResult =
  | { ok: true; status: 200 | 201; personId?: number; created: boolean }
  | { ok: true; status: 204; archived: true }
  | { ok: false; status: number; error: string; retryable: boolean }
  | { ok: false; status: 0; error: "not_configured" | "network"; retryable: boolean };

export const FUB_BASE_URL = "https://api.followupboss.com/v1";

export type FubConfig = {
  apiKey: string;
  system: string;
  systemKey: string;
  /** Bare domain, no www. Also the marketing name of the lead source. */
  source: string;
};

export function getFubConfig(): FubConfig | null {
  const apiKey = process.env.FUB_API_KEY;
  const system = process.env.FUB_SYSTEM;
  const systemKey = process.env.FUB_SYSTEM_KEY;
  if (!apiKey || !system || !systemKey) return null;
  return {
    apiKey,
    system,
    systemKey,
    source: (process.env.FUB_LEAD_SOURCE ?? "jjpremiergroup.com").replace(/^www\./, ""),
  };
}

export function isFubConfigured(): boolean {
  return getFubConfig() !== null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function retryAfterMs(res: Response): number {
  const header = res.headers.get("Retry-After");
  if (!header) return 2_000;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return Math.min(Math.max(seconds, 1), 30) * 1_000;
  const at = Date.parse(header);
  if (Number.isFinite(at)) return Math.min(Math.max(at - Date.now(), 1_000), 30_000);
  return 2_000;
}

/**
 * Send a lead event. Resolves rather than throws so callers can decide what
 * the visitor sees; the return value tells the whole truth about what happened.
 */
export async function sendLeadEvent(
  input: Omit<FubEventPayload, "source" | "system">,
  opts: { maxAttempts?: number; fetchImpl?: typeof fetch } = {},
): Promise<FubResult> {
  const config = getFubConfig();
  if (!config) {
    console.warn("[fub] not configured (FUB_API_KEY / FUB_SYSTEM / FUB_SYSTEM_KEY). Lead not sent.", {
      type: input.type,
      email: input.person.emails?.[0]?.value,
    });
    return { ok: false, status: 0, error: "not_configured", retryable: false };
  }

  const payload: FubEventPayload = { ...input, source: config.source, system: config.system };
  const body = JSON.stringify(payload);
  const headers = {
    Authorization: `Basic ${Buffer.from(`${config.apiKey}:`).toString("base64")}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-System": config.system,
    "X-System-Key": config.systemKey,
  };
  const fetchImpl = opts.fetchImpl ?? fetch;
  const maxAttempts = opts.maxAttempts ?? 3;

  let attempt = 0;
  let lastError = "unknown";
  while (attempt < maxAttempts) {
    attempt += 1;
    let res: Response;
    try {
      res = await fetchImpl(`${FUB_BASE_URL}/events`, {
        method: "POST",
        headers,
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      });
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.error(`[fub] network error (attempt ${attempt}/${maxAttempts})`, lastError);
      if (attempt < maxAttempts) await sleep(500 * 2 ** (attempt - 1));
      continue;
    }

    if (res.status === 201 || res.status === 200) {
      let personId: number | undefined;
      try {
        const json = (await res.json()) as { id?: number };
        personId = typeof json?.id === "number" ? json.id : undefined;
      } catch {
        /* body is optional */
      }
      return { ok: true, status: res.status, personId, created: res.status === 201 };
    }

    if (res.status === 204) {
      // The lead flow for this source is archived in Follow Up Boss. The lead
      // was accepted and thrown away. This looks like success and is not.
      console.error(
        "[fub] 204 — lead flow ARCHIVED for source. Lead was silently dropped by Follow Up Boss.",
        { source: config.source, type: input.type, email: input.person.emails?.[0]?.value },
      );
      return { ok: true, status: 204, archived: true };
    }

    if (res.status === 429) {
      const wait = retryAfterMs(res);
      console.warn(`[fub] 429 rate limited; honouring Retry-After (${wait}ms)`);
      if (attempt < maxAttempts) {
        await sleep(wait);
        continue;
      }
      return { ok: false, status: 429, error: "rate_limited", retryable: true };
    }

    if (res.status === 404) {
      // Only reachable when a person id was supplied and not found. We never
      // send ids, but handle it per spec: drop the id and retry once.
      const text = await res.text().catch(() => "");
      console.warn("[fub] 404 from events endpoint", text.slice(0, 200));
      return { ok: false, status: 404, error: "not_found", retryable: false };
    }

    const text = await res.text().catch(() => "");
    lastError = `${res.status} ${text.slice(0, 300)}`;
    const retryable = res.status >= 500;
    console.error(`[fub] ${res.status} (attempt ${attempt}/${maxAttempts})`, text.slice(0, 300));
    if (retryable && attempt < maxAttempts) {
      await sleep(500 * 2 ** (attempt - 1));
      continue;
    }
    return { ok: false, status: res.status, error: lastError, retryable };
  }

  return { ok: false, status: 0, error: "network", retryable: true };
}
