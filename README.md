# Bbrite

Bbrite is a private, single-user Markdown writing app for the
[`mailvlous/garden`](https://github.com/mailvlous/garden) Quartz repository. It
stores drafts in Cloudflare D1 and only writes to GitHub when a post is
explicitly published, updated, or deleted.

## Architecture

- Astro runs as a Cloudflare Worker.
- Cloudflare D1 stores drafts and editor state.
- GitHub is the source of truth for published Markdown.
- Quartz builds the public Garden from `content/*.md` on branch `v4`.
- Cloudflare Access protects every page and API route.

Published posts use YAML frontmatter with `title`, `draft`, and list-form
`tags`. Updates and deletes require the current GitHub file SHA, which prevents
silent overwrites. Autosave is debounced to D1 and uses local storage as a
temporary fallback when the network is unavailable.

## Requirements

- Node.js 22
- npm 10 or newer
- A Cloudflare account with Workers, D1, and Access
- A fine-grained GitHub token restricted to `mailvlous/garden`, with Contents
  read/write permission

## Local development

```sh
npm install
npm run dev
```

Copy `.env.example` to `.env` and replace its placeholder values. Keep
`GITHUB_TOKEN` server-side and never give it a `PUBLIC_` prefix. Access remains
fail-closed locally: requests are rejected unless a valid Cloudflare Access JWT
for the configured identity is present.

Validate changes with:

```sh
npm run check
npm run build
```

## Cloudflare deployment

1. Authenticate and create the D1 database:

   ```sh
   npx wrangler login
   npx wrangler d1 create bbrite-db
   ```

2. Replace the D1 database ID and Access placeholders in `wrangler.jsonc`.

3. Apply the migrations:

   ```sh
   npx wrangler d1 migrations apply bbrite-db --remote
   ```

4. Store the GitHub token as a Worker secret:

   ```sh
   npx wrangler secret put GITHUB_TOKEN
   ```

5. Configure a Cloudflare Access application for the Worker using the same
   audience and exact allowed email recorded in `wrangler.jsonc`. See
   `PRIVATE_ACCESS.md` for the required policy.

6. Build and deploy:

   ```sh
   npm run build
   npm run deploy
   ```

## Main routes

- `/` — dashboard
- `/new` — new post editor
- `/drafts` — draft management
- `/posts` — published posts
- `/api/drafts/*` — D1 draft operations
- `/api/posts/*` — GitHub post operations
- `/api/preview` — Markdown preview

Every route is private. Bbrite intentionally has no application-level password
or development authentication bypass; Cloudflare Access is the identity
boundary, and route handlers also require the verified user in server locals.
