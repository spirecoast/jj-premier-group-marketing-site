import { inArray, sql } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { searchDocuments } from "@/lib/db/schema";
import type { SearchStore, StoredRow, WriteRow } from "./indexer";

/** search_documents over DATABASE_URL (Drizzle + postgres-js). */
export function drizzleStore(db: Database): SearchStore {
  return {
    async existing(): Promise<StoredRow[]> {
      return db
        .select({
          id: searchDocuments.id,
          contentHash: searchDocuments.contentHash,
          hasEmbedding: sql<boolean>`${searchDocuments.embedding} is not null`,
        })
        .from(searchDocuments);
    },
    async upsert(rows: WriteRow[]) {
      if (!rows.length) return;
      await db
        .insert(searchDocuments)
        .values(
          rows.map((r) => ({
            id: r.id,
            kind: r.kind,
            title: r.title,
            sectionTitle: r.sectionTitle ?? null,
            url: r.url,
            body: r.body,
            contentHash: r.contentHash,
            embedding: r.embedding,
          })),
        )
        .onConflictDoUpdate({
          target: searchDocuments.id,
          set: {
            kind: sql`excluded.kind`,
            title: sql`excluded.title`,
            sectionTitle: sql`excluded.section_title`,
            url: sql`excluded.url`,
            body: sql`excluded.body`,
            contentHash: sql`excluded.content_hash`,
            embedding: sql`excluded.embedding`,
            updatedAt: sql`now()`,
          },
        });
    },
    async remove(ids: string[]) {
      if (!ids.length) return;
      await db.delete(searchDocuments).where(inArray(searchDocuments.id, ids));
    },
  };
}
