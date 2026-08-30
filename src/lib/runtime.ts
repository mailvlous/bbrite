import type { APIContext } from 'astro';

export function getEnv(context: APIContext): Env {
  const runtime = context.locals.runtime;
  if (runtime?.env) return runtime.env;
  return {
    DB: undefined as never,
    GITHUB_TOKEN: import.meta.env.GITHUB_TOKEN,
    GITHUB_OWNER: import.meta.env.GITHUB_OWNER || 'mailvlous',
    GITHUB_REPO: import.meta.env.GITHUB_REPO || 'garden',
    GITHUB_BRANCH: import.meta.env.GITHUB_BRANCH || 'v4',
  };
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
}
