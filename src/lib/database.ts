export type Draft = { id: string; title: string; slug: string; content: string; metadata: Record<string, unknown>; status: string; github_path: string | null; github_sha: string | null; created_at: number; updated_at: number };

export async function getDrafts(db: D1Database) { const result = await db.prepare('SELECT * FROM drafts ORDER BY updated_at DESC').all<Draft>(); return result.results; }
export async function getDraft(db: D1Database, id: string) { return db.prepare('SELECT * FROM drafts WHERE id = ?').bind(id).first<Draft>(); }
export async function saveDraft(db: D1Database, draft: Omit<Draft, 'created_at' | 'updated_at'> & { created_at?: number }) {
  const now = Date.now();
  await db.prepare(`INSERT INTO drafts (id,title,slug,content,metadata,status,github_path,github_sha,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,slug=excluded.slug,content=excluded.content,metadata=excluded.metadata,status=excluded.status,github_path=excluded.github_path,github_sha=excluded.github_sha,updated_at=excluded.updated_at`).bind(draft.id, draft.title, draft.slug, draft.content, JSON.stringify(draft.metadata), draft.status, draft.github_path, draft.github_sha, draft.created_at || now, now).run();
  return getDraft(db, draft.id);
}
export async function removeDraft(db: D1Database, id: string) { await db.prepare('DELETE FROM drafts WHERE id = ?').bind(id).run(); }
