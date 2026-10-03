import type { FetchOptions, FetchResult, Fetcher } from "./types";

/**
 * A polite fetcher for the venues' sites: one request at a time per host,
 * 1.2 to 2 seconds apart, the headers a current desktop browser sends (ten
 * of the sources sit behind a WAF that turns away anything less), a
 * timeout, one retry on a network error or 5xx, conditional requests when
 * the last run saved an ETag, and robots.txt honoured for `User-agent: *`.
 */

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

export const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent": UA,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
  "sec-ch-ua": '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"macOS"',
};

const JSON_HEADERS: Record<string, string> = {
  "User-Agent": UA,
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin",
};

const IMAGE_HEADERS: Record<string, string> = {
  "User-Agent": UA,
  Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Sec-Fetch-Dest": "image",
  "Sec-Fetch-Mode": "no-cors",
  "Sec-Fetch-Site": "cross-site",
};

/** Hosts whose robots.txt disallows the pages we would need (found in the source audit). Never fetched. */
export const NEVER_FETCH = ["ticketing.floridastudiotheatre.org", "westcoastblacktheatre.my.salesforce-sites.com"];

export type PoliteOptions = {
  minGapMs?: number;
  maxGapMs?: number;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
  /** Read robots.txt once per host (default true). */
  robots?: boolean;
};

/** Parse the Disallow/Allow rules that apply to every crawler (`User-agent: *`). */
export function robotsRules(txt: string): { allow: string[]; disallow: string[] } {
  const allow: string[] = [];
  const disallow: string[] = [];
  let applies = false;
  let inAgents = false;
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    if (!line) continue;
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1]!.toLowerCase();
    const value = m[2]!.trim();
    if (key === "user-agent") {
      if (!inAgents) applies = false;
      inAgents = true;
      if (value === "*") applies = true;
      continue;
    }
    inAgents = false;
    if (!applies) continue;
    if (key === "disallow" && value) disallow.push(value);
    if (key === "allow" && value) allow.push(value);
  }
  return { allow, disallow };
}

function ruleMatches(rule: string, path: string): boolean {
  const anchored = rule.endsWith("$");
  const body = anchored ? rule.slice(0, -1) : rule;
  const re = new RegExp(`^${body.split("*").map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*")}${anchored ? "$" : ""}`);
  return re.test(path);
}

/** Longest match wins; Allow wins a tie (Google's reading of the spec). */
export function robotsAllows(rules: { allow: string[]; disallow: string[] }, path: string): boolean {
  let best = -1;
  let allowed = true;
  for (const r of rules.disallow) if (ruleMatches(r, path) && r.length > best) (best = r.length), (allowed = false);
  for (const r of rules.allow) if (ruleMatches(r, path) && r.length >= best) (best = r.length), (allowed = true);
  return allowed;
}

export class RobotsDenied extends Error {
  constructor(url: string) {
    super(`robots.txt disallows ${url}`);
  }
}

export function politeFetcher(opts: PoliteOptions = {}): Fetcher & { requests: () => number } {
  const minGap = opts.minGapMs ?? 1200;
  const maxGap = opts.maxGapMs ?? 2000;
  const timeoutMs = opts.timeoutMs ?? 20_000;
  const doFetch = opts.fetchImpl ?? fetch;
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const now = opts.now ?? Date.now;
  const queues = new Map<string, Promise<unknown>>();
  const lastAt = new Map<string, number>();
  const robots = new Map<string, Promise<{ allow: string[]; disallow: string[] } | null>>();
  let count = 0;

  async function spaced<T>(host: string, task: () => Promise<T>): Promise<T> {
    const prev = queues.get(host) ?? Promise.resolve();
    const run = prev.catch(() => undefined).then(async () => {
      const last = lastAt.get(host);
      if (last !== undefined) {
        const gap = minGap + Math.random() * (maxGap - minGap);
        const wait = last + gap - now();
        if (wait > 0) await sleep(wait);
      }
      try {
        return await task();
      } finally {
        lastAt.set(host, now());
      }
    });
    queues.set(host, run);
    return run;
  }

  async function raw(url: string, o: FetchOptions): Promise<FetchResult> {
    const base = o.accept === "json" ? JSON_HEADERS : o.binary ? IMAGE_HEADERS : BROWSER_HEADERS;
    const headers: Record<string, string> = { ...base, ...(o.headers ?? {}) };
    if (o.etag) headers["If-None-Match"] = o.etag;
    if (o.lastModified) headers["If-Modified-Since"] = o.lastModified;
    const ctrl = new AbortController();
    const limit = o.timeoutMs ?? timeoutMs;
    const timer = setTimeout(() => ctrl.abort(), limit);
    // A second guard: a server that sends headers and then stalls the body must not hold the host's queue.
    let guard: ReturnType<typeof setTimeout> | undefined;
    const stalled = new Promise<never>((_, reject) => {
      guard = setTimeout(() => reject(new Error(`timed out after ${limit + 5000}ms`)), limit + 5000);
    });
    count += 1;
    try {
      return await Promise.race([stalled, request()]);
    } finally {
      clearTimeout(timer);
      clearTimeout(guard);
    }
    async function request(): Promise<FetchResult> {
      const res = await doFetch(url, { method: o.method ?? "GET", body: o.body, headers, redirect: "follow", signal: ctrl.signal });
      const bytes = o.binary && res.status !== 304 ? new Uint8Array(await res.arrayBuffer()) : undefined;
      const text = res.status === 304 || o.binary ? "" : await res.text();
      const h: Record<string, string> = {};
      res.headers.forEach((v, k) => (h[k] = v));
      return { url: res.url || url, status: res.status, ok: res.ok, text, bytes, headers: h, notModified: res.status === 304 };
    }
  }

  async function rulesFor(origin: string, host: string) {
    let p = robots.get(host);
    if (!p) {
      p = spaced(host, () => raw(`${origin}/robots.txt`, { timeoutMs: 10_000 }))
        .then((r) => (r.ok && !/<html/i.test(r.text.slice(0, 500)) ? robotsRules(r.text) : null))
        .catch(() => null);
      robots.set(host, p);
    }
    return p;
  }

  const fetcher = (async (url: string, o: FetchOptions = {}): Promise<FetchResult> => {
    const u = new URL(url);
    if (NEVER_FETCH.includes(u.hostname)) throw new RobotsDenied(url);
    if (opts.robots !== false) {
      const rules = await rulesFor(u.origin, u.hostname);
      if (rules && !robotsAllows(rules, u.pathname + u.search)) throw new RobotsDenied(url);
    }
    let attempt = 0;
    for (;;) {
      try {
        const r = await spaced(u.hostname, () => raw(url, o));
        if ((r.status >= 500 || r.status === 429) && attempt === 0) {
          attempt += 1;
          await sleep(maxGap * 2);
          continue;
        }
        return r;
      } catch (err) {
        if (attempt === 0 && !(err instanceof RobotsDenied)) {
          attempt += 1;
          await sleep(maxGap * 2);
          continue;
        }
        throw err;
      }
    }
  }) as Fetcher & { requests: () => number };
  fetcher.requests = () => count;
  return fetcher;
}

/** A fetcher over saved files, for the adapter tests: url → body. */
export function fixtureFetcher(files: Record<string, string>, status: Record<string, number> = {}): Fetcher & { seen: string[] } {
  const seen: string[] = [];
  const f = (async (url: string) => {
    seen.push(url);
    const body = files[url];
    if (body === undefined) return { url, status: status[url] ?? 404, ok: false, text: "", headers: {} };
    const code = status[url] ?? 200;
    return { url, status: code, ok: code < 400, text: body, headers: {} };
  }) as Fetcher & { seen: string[] };
  f.seen = seen;
  return f;
}
