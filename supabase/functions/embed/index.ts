// Supabase Edge Function `embed`: text in, gte-small embeddings out.
//
// POST { texts: string[] }  ->  { model, dims, complete, embeddings: number[][] }
// (384 dims, unit length, in input order). `complete: false` means the call
// ran out of CPU budget and `embeddings` covers only the first texts; send the
// rest again (lib/search/embed.ts does).
//
// Deployed with verify_jwt on; the site calls it with the project's anon key
// (lib/search/embed.ts). It touches no database and keeps no state, so the
// anon key reaches nothing through it but the model. Requests are bounded: at
// most 64 texts, 2,000 characters each (gte-small truncates at 512 tokens
// anyway); anything larger is a 400.
//
// This file is the source of truth for the deployed function. Redeploy after
// any change with `supabase functions deploy embed` or the Supabase MCP
// `deploy_edge_function` tool (verify_jwt: true).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const MAX_TEXTS = 64;
const MAX_CHARS = 2000;
/** Stop starting new texts after this much time in the model (the request's CPU cap is about 2s). */
const BUDGET_MS = 900;

const session = new Supabase.ai.Session("gte-small");

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", Connection: "keep-alive" } });

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Body must be JSON" }, 400);
  }
  const texts = (body as { texts?: unknown } | null)?.texts;
  if (!Array.isArray(texts) || texts.length === 0) return json({ error: "texts must be a non-empty array of strings" }, 400);
  if (texts.length > MAX_TEXTS) return json({ error: `At most ${MAX_TEXTS} texts per call` }, 400);
  for (const t of texts) {
    if (typeof t !== "string" || t.trim().length === 0) return json({ error: "Every text must be a non-empty string" }, 400);
    if (t.length > MAX_CHARS) return json({ error: `Each text must be at most ${MAX_CHARS} characters` }, 400);
  }

  try {
    const embeddings: number[][] = [];
    const started = performance.now();
    // One at a time: the model runs on the function's own CPU, which the
    // platform caps per request (a 546 WORKER_LIMIT past it). Once the time
    // spent passes the budget, stop and return what's done with
    // `complete: false`; the caller sends the rest in its next call. The
    // first text is always embedded, so every call makes progress.
    for (const t of texts as string[]) {
      if (embeddings.length > 0 && performance.now() - started > BUDGET_MS) break;
      const out = (await session.run(t, { mean_pool: true, normalize: true })) as number[];
      embeddings.push(Array.from(out));
    }
    return json({ model: "gte-small", dims: embeddings[0]?.length ?? 0, complete: embeddings.length === texts.length, embeddings });
  } catch (err) {
    console.error("embed failed", err instanceof Error ? err.message : String(err));
    return json({ error: "Embedding failed" }, 500);
  }
});
