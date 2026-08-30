/// <reference types="astro/client" />

type D1Database = import('@cloudflare/workers-types').D1Database;
interface Env {
  DB: D1Database;
  GITHUB_TOKEN: string;
  GITHUB_OWNER: string;
  GITHUB_REPO: string;
  GITHUB_BRANCH: string;
}

declare namespace App {
  interface Locals {
    runtime: { env: Env };
  }
}
