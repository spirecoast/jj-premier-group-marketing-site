/**
 * The client for the `embed` Edge Function (supabase/functions/embed): gte-small
 * running inside Supabase, 384 dimensions, unit length. Called with the
 * project's anon key; the function touches no database.
 *
 * The function stops when a call has used its CPU budget and returns the
 * first texts with `complete: false`; this client sends the rest again, runs
 * a few calls at once, and retries a failed call with backoff.
 */

export const EMBED_DIMS = 384;

export type EmbedConfig = { url: string; key: string };

/** Where the function lives. SEARCH_EMBED_URL overrides the default <project>/functions/v1/embed. */
export function embedConfig(env: Record<string, string | undefined> = process.env): EmbedConfig | null {
  const base = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const url = env.SEARCH_EMBED_URL?.trim() || (base ? `${base.replace(/\/+$/, "")}/functions/v1/embed` : "");
  if (!url || !key || !/^https:\/\//.test(url)) return null;
  return { url, key };
}

export class EmbedError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = "EmbedError";
  }
}

export type EmbedOptions = {
  config: EmbedConfig;
  /** Texts per call. The function takes up to 64 and returns what fits its CPU budget. */
  batchSize?: number;
  /** Calls in flight at once. */
  concurrency?: number;
  /** Per call. */
  timeoutMs?: number;
  /** Retries per call for timeouts, 5xx and the platform's 546 (worker limit). */
  retries?: number;
  fetchImpl?: typeof fetch;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callOnce(texts: string[], o: Required<Omit<EmbedOptions, "config" | "fetchImpl">> & Pick<EmbedOptions, "config" | "fetchImpl">): Promise<number[][]> {
  const f = o.fetchImpl ?? fetch;
  let res: Response;
  try {
    res = await f(o.config.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${o.config.key}`, apikey: o.config.key, "Content-Type": "application/json" },
      body: JSON.stringify({ texts }),
      signal: AbortSignal.timeout(o.timeoutMs),
      cache: "no-store",
    });
  } catch (err) {
    throw new EmbedError(`embed request failed: ${err instanceof Error ? err.message : String(err)}`, null, true);
  }
  type Body = { embeddings?: unknown; error?: string } | null;
  let body: Body = null;
  try {
    body = (await res.json()) as Body;
  } catch {
    body = null;
  }
  if (!res.ok) {
    const retryable = res.status >= 500 || res.status === 429;
    throw new EmbedError(`embed returned ${res.status}${body?.error ? `: ${body.error}` : ""}`, res.status, retryable);
  }
  const out = body?.embeddings;
  if (!Array.isArray(out) || out.length === 0 || out.length > texts.length) throw new EmbedError("embed returned no embeddings", res.status, true);
  for (const e of out) {
    if (!Array.isArray(e) || e.length !== EMBED_DIMS || !e.every((x) => typeof x === "number" && Number.isFinite(x))) {
      throw new EmbedError(`embed returned a vector that isn't ${EMBED_DIMS} finite numbers`, res.status, false);
    }
  }
  return out as number[][];
}

/** Embeddings for every text, in order. Throws when a call fails past its retries. */
export async function embedTexts(texts: string[], opts: EmbedOptions): Promise<number[][]> {
  const o = { batchSize: 16, concurrency: 4, timeoutMs: 20_000, retries: 3, ...opts };
  const result: (number[] | undefined)[] = new Array(texts.length);
  const queue: number[] = texts.map((_, i) => i);
  let failure: unknown = null;

  const worker = async () => {
    while (queue.length && !failure) {
      const batch = queue.splice(0, o.batchSize);
      for (let attempt = 0; ; attempt += 1) {
        try {
          const got = await callOnce(
            batch.map((i) => texts[i]!),
            o,
          );
          got.forEach((e, j) => (result[batch[j]!] = e));
          // A partial answer: the rest goes back to the front of the queue.
          if (got.length < batch.length) queue.unshift(...batch.slice(got.length));
          break;
        } catch (err) {
          const retryable = err instanceof EmbedError ? err.retryable : true;
          if (!retryable || attempt >= o.retries) {
            failure = err;
            return;
          }
          await sleep(400 * 2 ** attempt);
        }
      }
    }
  };

  await Promise.all(Array.from({ length: Math.max(1, Math.min(o.concurrency, texts.length)) }, worker));
  if (failure) throw failure;
  const missing = result.findIndex((e) => !e);
  if (missing >= 0) throw new EmbedError(`no embedding for text ${missing}`, null, true);
  return result as number[][];
}

/** One query, fast: a single call, a short timeout, one retry. */
export async function embedQuery(text: string, config: EmbedConfig, fetchImpl?: typeof fetch): Promise<number[]> {
  const [e] = await embedTexts([text], { config, batchSize: 1, concurrency: 1, timeoutMs: 4_000, retries: 1, fetchImpl });
  return e!;
}
