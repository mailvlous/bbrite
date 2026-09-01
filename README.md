# Bbrite

<<<<<<< HEAD
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
=======
A private, single-user web writing application for managing your Quartz Garden repository.

**Write → Autosave → Publish → Garden**

## Features

- 📝 **Beautiful Markdown Editor** - Write with live preview
- 💾 **Online Autosave** - Drafts stored in Cloudflare D1
- 🌱 **Direct Publishing** - Push directly to GitHub/Quartz Garden
- 📱 **Responsive** - Works on desktop, tablet, and mobile
- 🎨 **Editorial Design** - Inspired by creative publishing tools
- ⌨️ **Keyboard Shortcuts** - Cmd/Ctrl+S to save, Cmd/Ctrl+Enter to publish
- 🔍 **Focus Mode** - Distraction-free writing environment

## Architecture

Built with:
- **Astro 5** - Static site generation with server endpoints
- **Cloudflare Workers** - Serverless backend
- **Cloudflare D1** - SQLite database for drafts
- **GitHub API** - Integration with Garden repository
- **CodeMirror** - Advanced Markdown editor
- **Unified/Remark/Rehype** - Markdown processing pipeline
- **Tailwind CSS** - Styling

## Setup

### Prerequisites
- Node.js 18+
- npm
- Cloudflare account
- GitHub personal access token

### Installation

```bash
npm install
```

### Environment Variables

Create `.env.local` or `wrangler.toml` with:

```
GITHUB_OWNER=mailvlous
GITHUB_REPO=garden
GITHUB_BRANCH=v4
GITHUB_TOKEN=your_github_token
CONTENT_PATH=content
```

The `GITHUB_TOKEN` is stored as a Cloudflare secret and never exposed to the browser.

### Database Setup

Initialize the D1 database:

```bash
wrangler d1 create bbrite_db
wrangler migrations apply
```

## Development

```bash
npm run dev
```

Open `http://localhost:3000`

## Building

```bash
npm run build
```

## Deployment

```bash
npm run deploy
```

Uses `wrangler deploy` to publish to Cloudflare Workers.

## Project Structure

```
src/
  ├── pages/
  │   ├── index.astro         # Home page
  │   ├── new.astro           # Editor / new post
  │   ├── posts.astro         # Published posts listing
  │   ├── drafts.astro        # Draft management
  │   └── api/
  │       ├── posts.ts        # GET posts
  │       ├── posts/[slug].ts # GET/PUT/DELETE post
  │       └── drafts/
  │           ├── index.ts    # GET/POST drafts
  │           └── [id].ts     # GET/PUT/DELETE draft
  ├── components/
  │   ├── BriteHeader.astro   # Navigation header
  │   └── Card.astro          # Post/draft card
  ├── layouts/
  │   └── Layout.astro        # Main template
  └── lib/
      ├── db.ts              # D1 database utilities
      ├── github.ts          # GitHub API client
      ├── markdown.ts        # Markdown rendering
      └── utils.ts           # Utilities (slugs, validation)
```

## Workflow

1. **Write** in the editor with live Markdown preview
2. **Save** automatically syncs to D1
3. **Switch Mode** - Edit/Split/Preview/Focus
4. **Publish** pushes to GitHub and Quartz Garden
5. **Continue** from any device with synced drafts

## API Routes

### Posts (Published)
- `GET /api/posts` - List all published posts
- `GET /api/posts/:slug` - Get specific post
- `PUT /api/posts/:slug` - Update post (publishes to GitHub)
- `DELETE /api/posts/:slug` - Delete post

### Drafts
- `GET /api/drafts` - List all drafts
- `POST /api/drafts` - Create new draft
- `GET /api/drafts/:id` - Get draft content
- `PUT /api/drafts/:id` - Update draft (autosave)
- `DELETE /api/drafts/:id` - Delete draft

## Security

- ✅ GitHub token never exposed to browser
- ✅ Path traversal protection
- ✅ Slug validation
- ✅ HTML sanitization in Markdown preview
- ✅ XSS protection with rehype-sanitize
- ✅ Request body validation

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd/Ctrl + S | Save draft |
| Cmd/Ctrl + Enter | Publish |
| Cmd/Ctrl + Shift + P | Command palette |
| Escape | Close modals / exit focus |

## Design Language

Editorial and playful visual direction:
- Large expressive typography
- Rounded cards and pills
- Warm color palette (blues, warm rust, sage green)
- Bold visual hierarchy
- Readable measure for writing

Inspired by:
- **Writing UX**: Wrighter
- **Visual Design**: Aardvark Book Club
- **Publishing**: Quartz

## Database Schema

```sql
CREATE TABLE drafts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  slug TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  metadata TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  github_path TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

## Troubleshooting

### GitHub Token Not Configured
Ensure `GITHUB_TOKEN` is set in your Cloudflare secrets/environment variables. It will never appear in API responses or browser code.

### D1 Database Not Found
Run `wrangler d1 create bbrite_db` and update your `wrangler.toml` with the database ID.

### Drafts Not Syncing
Check browser console for save status. Ensure D1 binding is properly configured in `wrangler.toml`.

## Future Enhancements

- [ ] Image uploads to Cloudflare R2
- [ ] Advanced search across drafts and posts
- [ ] Post scheduling
- [ ] Collaboration/sharing (for future multi-user version)
- [ ] Custom CSS themes
- [ ] Tag-based organization
- [ ] Backlink discovery
- [ ] Version history

## License

Private single-user application. All code is proprietary.
>>>>>>> 60b1fc0 (change ui)
