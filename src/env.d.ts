/// <reference types="astro/client" />

type D1Database = import('@cloudflare/workers-types').D1Database;

interface Env {
  DB: D1Database;
  GITHUB_TOKEN: string;
  GITHUB_OWNER: string;
  GITHUB_REPO: string;
  GITHUB_BRANCH: string;
  CONTENT_PATH: string;
  ACCESS_TEAM_DOMAIN: string;
  ACCESS_AUD: string;
  ACCESS_ALLOWED_EMAIL: string;
}

declare module "cloudflare:workers" {
  export const env: Env;
}

declare namespace App {
  interface Locals {
    user?: { email: string; sub: string };
  }
}

interface Window {
  showToast?: (message: string, type?: "success" | "error" | "info" | "warning") => void;
}
