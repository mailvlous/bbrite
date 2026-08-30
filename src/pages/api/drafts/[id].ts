import type { APIRoute } from 'astro';
import { getDraft, removeDraft, saveDraft } from '../../../lib/database';
import { json } from '../../../lib/runtime';

export const GET: APIRoute = async ({ params, locals }) => { const draft = await getDraft(locals.runtime.env.DB, params.id!); return draft ? json(draft) : json({ error: 'Draft not found' }, 404); };
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    const existing = await getDraft(locals.runtime.env.DB, params.id!);
    const input = await request.json() as Partial<typeof existing>;
    const draft = await saveDraft(locals.runtime.env.DB, { ...(existing || { id: params.id!, title: '', slug: '', content: '', metadata: {}, status: 'draft', github_path: null, github_sha: null }), ...input, id: params.id!, title: String(input.title ?? existing?.title ?? '').slice(0, 200), content: String(input.content ?? existing?.content ?? '').slice(0, 500000), metadata: input.metadata || existing?.metadata || {} });
    return json(draft);
  } catch { return json({ error: 'Could not save draft.' }, 400); }
};
export const DELETE: APIRoute = async ({ params, locals }) => { await removeDraft(locals.runtime.env.DB, params.id!); return new Response(null, { status: 204 }); };
