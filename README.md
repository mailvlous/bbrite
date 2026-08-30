# Bbrite

Bbrite is a private, single-user Markdown writing app for the [mailvlous/garden](https://github.com/mailvlous/garden) Quartz repository. It keeps drafts online in Cloudflare D1 and only touches GitHub when publishing, updating, or deleting explicitly.

## Garden integration

The inspected Garden repository uses branch `v4`, Quartz `4.5.2`, a top-level `content/` directory, YAML frontmatter with `title`, `draft`, and list-form `tags`, KaTeX, GFM, Obsidian Markdown, and Shiki highlighting. Bbrite publishes Markdown to `content/<validated-slug>.md` on that branch. Existing posts are loaded through GitHub's Contents API and their SHA is required for updates and deletes, preventing silent overwrites.

## Local development

Requires Node.js 22+ and npm 10+.

```sh
npm install
npm run dev
npm run check
npm run build
```

For local API calls, set `GITHUB_TOKEN` in `.env` as a server-only variable. Never prefix it with `PUBLIC_`.

## Cloudflare setup

1. Install dependencies and authenticate:

```sh
npm install
npx wrangler login
```

2. Create D1 and copy its ID into `wrangler.jsonc`:

```sh
npx wrangler d1 create bbrite-db
npx wrangler d1 migrations apply bbrite-db --remote
```

3. Add a fine-grained GitHub token restricted to `mailvlous/garden` with Contents read/write permission:

```sh
npx wrangler secret put GITHUB_TOKEN
```

`GITHUB_OWNER`, `GITHUB_REPO`, and `GITHUB_BRANCH` are non-secret Wrangler variables. Cloudflare Access should protect the deployed Worker; Bbrite intentionally has no account or authentication layer.

4. Deploy:

```sh
npm run build
npx wrangler deploy
```

## Architecture

Astro runs as a Cloudflare Worker. D1 stores drafts and editor state; GitHub is the source of truth for published Markdown; Quartz builds the public Garden. Autosave is debounced to D1 and has a localStorage fallback for temporary network failures. Preview uses GFM Markdown plus DOMPurify in the browser.
