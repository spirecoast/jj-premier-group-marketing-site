-- ============================================================================
-- 0011_search_score_fusion.sql
--
-- search_scored(): site search fused on scores, not ranks. It replaces
-- search_hybrid() (0010), which fused with reciprocal rank fusion. RRF only
-- sees each list's order, so a weak neighbour that happens to rank first gets
-- the same boost as a strong one, and the fused number means nothing on its
-- own: it can't be thresholded, and gibberish came back as theater listings.
--
-- For every candidate (the nearest 40 by cosine through the HNSW index, plus
-- the best 40 full-text matches), both scores are computed and put on a fixed
-- 0..1 scale that keeps their size:
--
--   semantic = (cosine - 0.82) / (0.92 - 0.82), clamped to 0..1. gte-small
--              puts gibberish at 0.79-0.82 against this index and strong
--              matches at 0.90-0.94 (measured, lib/search/eval).
--   keyword  = sqrt(share of the query's words the chunk contains, each word
--              weighted by its IDF in the index). 1 when every word is there,
--              whatever the chunk's length; a chunk that only shares a common
--              word ("price", "fix") scores low. Words the index has never
--              seen count against the match, so nonsense stays near 0.
--   score    = 0.8 * semantic + 0.2 * keyword (a convex combination)
--              + 0.15 when the title is exactly the query ("Bird Key").
--
-- A row is returned only if score >= 0.2. In words: a chunk with no keyword
-- in common needs cosine >= 0.845; a chunk with no semantic signal needs
-- every word of the query; anything between needs some of both. When nothing
-- reaches 0.2 the search returns nothing. With a null embedding (the query
-- couldn't be embedded) the same formula runs with semantic = 0, so only
-- chunks with every word come back. A query with quotes or a minus sign keeps
-- its strict web-search meaning: only chunks that match it are returned.
--
-- hnsw.ef_search is raised to 200 for the call: at the default (40) the
-- index missed the true nearest neighbour for 2 of the 50 eval queries
-- (recall@40 0.92); at 200 recall@40 is 1.0 on this index (about 1,700 rows).
--
-- The weights, the cosine scale and the threshold were tuned on
-- lib/search/eval/queries.json (scripts/search-eval.ts); see docs/SITE.md.
--
-- Execute is revoked from the API roles, like search_hybrid: the site calls
-- it as postgres over DATABASE_URL. search_hybrid is left in place for now.
-- ============================================================================

-- Load pgvector in this session first: CREATE FUNCTION checks the SET clause
-- below, and hnsw.ef_search only exists once the library is loaded (without
-- this, Postgres refuses it as an unknown parameter).
SELECT '[1]'::extensions.vector;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.search_scored(
  query_text text,
  query_embedding extensions.vector(384),
  match_count int DEFAULT 10,
  semantic_weight float DEFAULT 0.8,
  cos_floor float DEFAULT 0.82,
  cos_ceiling float DEFAULT 0.92,
  title_boost float DEFAULT 0.15,
  min_score float DEFAULT 0.2,
  candidates int DEFAULT 40
)
RETURNS TABLE (
  id text,
  kind text,
  title text,
  section_title text,
  url text,
  snippet text,
  score float,
  cosine float,
  keyword float
)
LANGUAGE sql
STABLE
SET search_path = public, extensions, pg_catalog
SET hnsw.ef_search = 200
AS $$
  WITH q AS (
    SELECT s.strict,
           s.strict_mode,
           CASE
             WHEN s.strict_mode THEN s.strict
             ELSE coalesce(
               (SELECT to_tsquery('simple', string_agg(quote_literal(l), ' | '))
                  FROM unnest(tsvector_to_array(to_tsvector('english', query_text))) AS l),
               s.strict)
           END AS tsq,
           strip(to_tsvector('english', query_text))::text AS qlex
      FROM (SELECT websearch_to_tsquery('english', query_text) AS strict,
                   query_text ~ '(^|\s)-\S|"' AS strict_mode) s
  ),
  -- Each distinct query word with its IDF in the index (BM25's form, always > 0).
  terms AS (
    SELECT to_tsquery('simple', quote_literal(l)) AS lq,
           ln(1 + (n.total - df.n + 0.5) / (df.n + 0.5)) AS idf
      FROM unnest(tsvector_to_array(to_tsvector('english', query_text))) AS l
     CROSS JOIN (SELECT count(*)::float AS total FROM public.search_documents) n
     CROSS JOIN LATERAL (
       SELECT count(*)::float AS n FROM public.search_documents d
        WHERE d.fts @@ to_tsquery('simple', quote_literal(l))
     ) df
  ),
  nearest AS (
    SELECT d.id
      FROM public.search_documents d
     WHERE query_embedding IS NOT NULL AND d.embedding IS NOT NULL
     ORDER BY d.embedding <=> query_embedding
     LIMIT candidates
  ),
  full_text AS (
    SELECT d.id
      FROM public.search_documents d, q
     WHERE d.fts @@ q.tsq
     ORDER BY (d.fts @@ q.strict) DESC, ts_rank_cd(d.fts, q.tsq, 1) DESC, d.id
     LIMIT candidates
  ),
  scored AS (
    SELECT d.id,
           coalesce(1 - (d.embedding <=> query_embedding), 0) AS cosine,
           CASE
             WHEN q.strict_mode THEN (d.fts @@ q.strict)::int::float
             ELSE coalesce(sqrt((SELECT sum(t.idf) FILTER (WHERE d.fts @@ t.lq) / nullif(sum(t.idf), 0) FROM terms t)), 0)
           END AS keyword,
           q.strict_mode AND NOT (d.fts @@ q.strict) AS excluded,
           strip(to_tsvector('english', d.title))::text = q.qlex AS title_match
      FROM (SELECT id FROM nearest UNION SELECT id FROM full_text) c
      JOIN public.search_documents d ON d.id = c.id
     CROSS JOIN q
  ),
  fused AS (
    SELECT s.id, s.cosine, s.keyword,
           semantic_weight * greatest(0, least(1, (s.cosine - cos_floor) / (cos_ceiling - cos_floor)))
             + (1 - semantic_weight) * s.keyword
             + CASE WHEN s.title_match THEN title_boost ELSE 0 END AS score
      FROM scored s
     WHERE NOT s.excluded
  )
  SELECT d.id, d.kind, d.title, d.section_title, d.url,
         CASE
           WHEN d.fts @@ q.tsq THEN ts_headline('english', d.body, q.tsq,
             'StartSel=' || chr(57344) || ', StopSel=' || chr(57345) || ', MaxFragments=2, MaxWords=24, MinWords=10, FragmentDelimiter=" … "')
           ELSE left(d.body, 280)
         END AS snippet,
         f.score::float,
         f.cosine::float,
         f.keyword::float
    FROM fused f
    JOIN public.search_documents d ON d.id = f.id
   CROSS JOIN q
   -- A hair of tolerance: 1 - 0.8 is 0.19999999999999996 in floating point,
   -- and a chunk with every word and no semantic signal should land on 0.2.
   WHERE f.score >= min_score - 1e-9
   ORDER BY f.score DESC, d.id
   LIMIT least(greatest(match_count, 1), 50);
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.search_scored(text, extensions.vector, int, float, float, float, float, float, int) FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
-- search_hybrid() (0010) is no longer called by the site. Drop it once this
-- has been live for a while (kept for now so a rollback is a one-line change
-- in lib/search/query.ts):
-- DROP FUNCTION IF EXISTS public.search_hybrid(text, extensions.vector, int, float, float, int, float);
