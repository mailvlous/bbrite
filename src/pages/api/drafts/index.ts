import type { APIRoute } from 'astro';
import { getDrafts, saveDraft } from '../../../lib/database';
import { json } from '../../../lib/runtime';
import { slugify } from '../../../lib/slug';

export const GET: APIRoute = ({ locals }) => json(getDrafts(locals.runtime.env.DB));
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const input = await request.json() as Partial<{ id:string; title:string; slug:string; content:string; metadata:Record<string,unknown> }>;
    const title = String(input.title || '').slice(0, 200);
    const draft = await saveDraft(locals.runtime.env.DB, { id: input.id || crypto.randomUUID(), title, slug: input.slug || slugify(title), content: String(input.content || '').slice(0, 500000), metadata: input.metadata || {}, status: 'draft', github_path: null, github_sha: null });
    return json(draft, 201);
  } catch { return json({ error: 'Could not save draft.' }, 400); }
};
