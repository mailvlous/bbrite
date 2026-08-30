import type { APIRoute } from 'astro';
import { deletePost, getPost, writePost } from '../../../lib/github';
import { serializeMarkdown } from '../../../lib/frontmatter';
import { getEnv, json } from '../../../lib/runtime';
import { isValidSlug } from '../../../lib/slug';

export const GET: APIRoute = async ({ params, locals }) => { try { if (!isValidSlug(params.slug!)) return json({ error: 'Invalid slug.' }, 400); return json(await getPost(getEnv({ locals } as never), params.slug!)); } catch { return json({ error: 'Could not connect to GitHub.' }, 502); } };
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    if (!isValidSlug(params.slug!)) return json({ error: 'Invalid slug.' }, 400);
    const input = await request.json() as { title?:string; content?:string; metadata?:Record<string,unknown>; sha?:string };
    if (!input.sha) return json({ error: 'A current GitHub SHA is required.' }, 409);
    const metadata = { ...(input.metadata || {}), title: String(input.title || params.slug), draft: false };
    const result = await writePost(getEnv({ locals } as never), params.slug!, serializeMarkdown(metadata, String(input.content || '')), `Update: ${metadata.title}`, input.sha);
    return json({ ok: true, sha: result.content?.sha });
  } catch (error) { return json({ error: error instanceof Error ? error.message : 'Could not publish changes.' }, 409); }
};
export const DELETE: APIRoute = async ({ params, request, locals }) => {
  try { const input = await request.json() as { sha?:string; title?:string }; if (!input.sha) return json({ error: 'A current GitHub SHA is required.' }, 409); await deletePost(getEnv({ locals } as never), params.slug!, input.sha, input.title || params.slug!); return new Response(null, { status: 204 }); }
  catch (error) { return json({ error: error instanceof Error ? error.message : 'Could not delete post.' }, 409); }
};
