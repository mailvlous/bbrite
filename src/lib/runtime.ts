import { env } from "cloudflare:workers";

export function getEnv(): Env {
  return env as unknown as Env;
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
}