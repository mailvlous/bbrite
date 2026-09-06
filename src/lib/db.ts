// Database schema management
export async function initializeDatabase(db: D1Database) {
  // Create drafts table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS drafts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '',
      slug TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      metadata TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'draft',
      github_path TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_drafts_updated_at
    ON drafts(updated_at);

    CREATE INDEX IF NOT EXISTS idx_drafts_status
    ON drafts(status);
  `);
}

export interface Draft {
  id: string;
  title: string;
  slug: string;
  content: string;
  metadata: {
    tags?: string[];
    [key: string]: any;
  };
  status: "draft" | "published";
  github_path?: string;
  created_at: number;
  updated_at: number;
}

export async function saveDraft(
  db: D1Database,
  draft: Draft
): Promise<Draft> {
  const now = Date.now();
  const draft_to_save = {
    ...draft,
    updated_at: now,
    metadata: JSON.stringify(draft.metadata || {}),
  };

  await db
    .prepare(
      `
    INSERT INTO drafts (id, title, slug, content, metadata, status, github_path, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title=excluded.title,
      slug=excluded.slug,
      content=excluded.content,
      metadata=excluded.metadata,
      status=excluded.status,
      github_path=excluded.github_path,
      updated_at=excluded.updated_at
  `
    )
    .bind(
      draft.id,
      draft.title,
      draft.slug,
      draft.content,
      draft_to_save.metadata,
      draft.status,
      draft.github_path || null,
      draft.created_at,
      now
    )
    .run();

  return { ...draft, updated_at: now };
}

export async function getDraft(db: D1Database, id: string): Promise<Draft | null> {
  const result = await db
    .prepare("SELECT * FROM drafts WHERE id = ?")
    .bind(id)
    .first<any>();

  if (!result) return null;

  return {
    ...result,
    metadata: JSON.parse(result.metadata || "{}"),
  };
}

export async function listDrafts(db: D1Database): Promise<Draft[]> {
  const results = await db
    .prepare("SELECT * FROM drafts WHERE status = 'draft' ORDER BY updated_at DESC")
    .all<any>();

  return results.results.map((r: any) => ({
    ...r,
    metadata: JSON.parse(r.metadata || "{}"),
  }));
}

export async function deleteDraft(db: D1Database, id: string): Promise<void> {
  await db.prepare("DELETE FROM drafts WHERE id = ?").bind(id).run();
}
