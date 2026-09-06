import type { APIRoute } from 'astro';
import { guardUser, unauthorized } from '../../lib/access';
export const GET: APIRoute = ({ locals }) => { if (!guardUser(locals)) return unauthorized(); return new Response(JSON.stringify({ ok: true, app: 'bbrite' }), { headers: { 'content-type': 'application/json' } }); };
