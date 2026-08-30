import type { APIRoute } from 'astro';
export const GET: APIRoute = () => new Response(JSON.stringify({ ok: true, app: 'bbrite' }), { headers: { 'content-type': 'application/json' } });
