-- ============================================================================
-- 0010_search.sql
--
-- Site search: one table of content chunks and one hybrid query function.
--
--   * search_documents: a row per chunk of the site's own content (a guide
--     section, a neighborhood, a Tide issue part, an Encore event or venue, a
--     main page), written by lib/search/indexer.ts over DATABASE_URL.
--     embedding is gte-small (384 dims, unit length) from the `embed` Edge
--     Function; fts is generated from title (A), section_title (B) and body
--     (C) with the english config. content_hash decides what gets re-embedded.
--   * search_hybrid(): full-text and vector search, each ranked on its own,
--     combined with reciprocal rank fusion (the pattern in Supabase's hybrid
--     search guide), with a highlighted excerpt from ts_headline. Highlights
--     are wrapped in U+E000 / U+E001 (private-use characters, never in the
--     content) so the page can mark them up without trusting any HTML.
--
-- RLS on with no policies and execute revoked from the API roles: the
-- anon/authenticated keys can read nothing. The site queries through the
-- postgres role (DATABASE_URL), as it does for every other table.
--
-- Written to be re-runnable (IF NOT EXISTS / OR REPLACE): it was applied
-- through the Supabase connector before being logged in
-- drizzle.__drizzle_migrations.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "search_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"section_title" text,
	"url" text NOT NULL,
	"body" text NOT NULL,
	"content_hash" text NOT NULL,
	"embedding" extensions.vector(384),
	"fts" tsvector GENERATED ALWAYS AS (setweight(to_tsvector('english'::regconfig, coalesce(title, '')), 'A') || setweight(to_tsvector('english'::regconfig, coalesce(section_title, '')), 'B') || setweight(to_tsvector('english'::regconfig, body), 'C')) STORED,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "search_documents_kind_check" CHECK ("search_documents"."kind" in ('guide', 'neighborhood', 'post', 'event', 'venue', 'page'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "search_documents_embedding_idx" ON "search_documents" USING hnsw ("embedding" extensions.vector_cosine_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "search_documents_fts_idx" ON "search_documents" USING gin ("fts");
--> statement-breakpoint
ALTER TABLE "search_documents" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON TABLE "search_documents" FROM anon, authenticated;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.search_hybrid(
  query_text text,
  query_embedding extensions.vector(384),
  match_count int DEFAULT 10,
  full_text_weight float DEFAULT 1,
  semantic_weight float DEFAULT 1,
  rrf_k int DEFAULT 50,
  min_similarity float DEFAULT 0
)
RETURNS TABLE (
  id text,
  kind text,
  title text,
  section_title text,
  url text,
  snippet text,
  score float,
  keyword_rank int,
  semantic_rank int
)
LANGUAGE sql
STABLE
SET search_path = public, extensions, pg_catalog
AS $$
  -- strict: the query as typed, in web-search syntax (every word, "phrases",
  -- -not, or). loose: any of its words. A plain question ("do I need flood
  -- insurance") rarely has every word in one chunk, so plain queries match
  -- on any word and rank chunks that match every word first; a query that
  -- uses quotes or a minus sign keeps its strict meaning.
  WITH q AS (
    SELECT s.strict,
           CASE
             WHEN query_text ~ '(^|\s)-\S|"' THEN s.strict
             ELSE coalesce(
               (SELECT to_tsquery('simple', string_agg(quote_literal(l), ' | '))
                  FROM unnest(tsvector_to_array(to_tsvector('english', query_text))) AS l),
               s.strict)
           END AS tsq
      FROM (SELECT websearch_to_tsquery('english', query_text) AS strict) s
  ),
  full_text AS (
    SELECT d.id,
           row_number() OVER (ORDER BY (d.fts @@ q.strict) DESC, ts_rank_cd(d.fts, q.tsq) DESC, d.id) AS rank_ix
      FROM public.search_documents d, q
     WHERE d.fts @@ q.tsq
     ORDER BY rank_ix
     LIMIT least(match_count, 30) * 2
  ),
  -- The nearest neighbours first (an index scan on the HNSW index), ranked after.
  nearest AS (
    SELECT d.id, d.embedding <=> query_embedding AS distance
      FROM public.search_documents d
     WHERE d.embedding IS NOT NULL
     ORDER BY d.embedding <=> query_embedding
     LIMIT least(match_count, 30) * 2
  ),
  semantic AS (
    SELECT n.id, row_number() OVER (ORDER BY n.distance, n.id) AS rank_ix
      FROM nearest n
     WHERE 1 - n.distance >= min_similarity
  ),
  fused AS (
    SELECT coalesce(f.id, s.id) AS id,
           coalesce(1.0 / (rrf_k + f.rank_ix), 0.0) * full_text_weight
             + coalesce(1.0 / (rrf_k + s.rank_ix), 0.0) * semantic_weight AS score,
           f.rank_ix::int AS keyword_rank,
           s.rank_ix::int AS semantic_rank
      FROM full_text f
      FULL OUTER JOIN semantic s ON f.id = s.id
     ORDER BY score DESC, id
     LIMIT least(match_count, 30)
  )
  SELECT d.id, d.kind, d.title, d.section_title, d.url,
         CASE
           WHEN d.fts @@ q.tsq THEN ts_headline('english', d.body, q.tsq,
             'StartSel=' || chr(57344) || ', StopSel=' || chr(57345) || ', MaxFragments=2, MaxWords=24, MinWords=10, FragmentDelimiter=" … "')
           ELSE left(d.body, 280)
         END AS snippet,
         fused.score::float AS score,
         fused.keyword_rank,
         fused.semantic_rank
    FROM fused
    JOIN public.search_documents d ON d.id = fused.id
    CROSS JOIN q
   ORDER BY fused.score DESC, d.id;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.search_hybrid(text, extensions.vector, int, float, float, int, float) FROM PUBLIC, anon, authenticated;
