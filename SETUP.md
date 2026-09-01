# Bbrite Setup & Deployment Guide

## Prerequisites

- **Node.js 18+** - Download from https://nodejs.org
- **npm** - Comes with Node.js
- **GitHub Account** - For publishing to Garden repository
- **Cloudflare Account** - Free tier is sufficient for personal use

## Step 1: Install Dependencies

```bash
cd bbrite
npm install
```

## Step 2: Set Up GitHub Authentication

### Create a Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Give it a name like `bbrite`
4. Select scopes:
   - `repo` (full control of private repositories)
   - `workflow` (if you plan to trigger actions)
5. Copy the token - you'll use it in the next step

### Important: Keep Your Token Secure
- **Never commit this token to Git**
- **Never expose it in browser code**
- Bbrite only sends it server-side to Cloudflare Workers

## Step 3: Local Development Setup

### Create `.env.local` (for local development)

```
GITHUB_OWNER=mailvlous
GITHUB_REPO=garden
GITHUB_BRANCH=v4
GITHUB_TOKEN=your_github_token_here
CONTENT_PATH=content
```

### Verify Your Garden Repository

The setup script will verify these details:

```bash
npm run setup
```

This checks:
- ✅ Default branch
- ✅ Content path
- ✅ Quartz version
- ✅ Frontmatter schema
- ✅ File structure

## Step 4: Run Locally

```bash
npm run dev
```

Open http://localhost:3000

### Features to test:
- [ ] Create a new draft
- [ ] Autosave (check browser DevTools)
- [ ] Preview Markdown
- [ ] Toggle preview modes
- [ ] Export as Markdown

## Step 5: Create Cloudflare Database

### Via Cloudflare Dashboard

1. Log in to https://dash.cloudflare.com
2. Go to **Workers & Pages** > **D1**
3. Create a new database named `bbrite_db`
4. Note the Database ID

### Via Wrangler CLI

```bash
wrangler d1 create bbrite_db
```

Copy the database ID from the output.

## Step 6: Configure `wrangler.toml`

Edit `wrangler.toml` and update:

```toml
[env.production.d1_databases]
binding = "DB"
database_name = "bbrite_db"
database_id = "YOUR_ACTUAL_DATABASE_ID"
```

Get the ID from Cloudflare Dashboard or the wrangler output.

## Step 7: Set Up Cloudflare Secrets

Your GitHub token should never be in version control. Store it in Cloudflare Secrets:

```bash
wrangler secret put GITHUB_TOKEN
```

Paste your GitHub token and press Enter.

Verify it's set:

```bash
wrangler secret list
```

## Step 8: Run Migrations

Initialize the D1 database schema:

```bash
wrangler migrations create init_schema
```

Create a migration file at `migrations/0001_init_schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS drafts (
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

CREATE INDEX IF NOT EXISTS idx_drafts_updated_at
ON drafts(updated_at);

CREATE INDEX IF NOT EXISTS idx_drafts_status
ON drafts(status);
```

Apply migrations:

```bash
wrangler migrations apply --remote
```

## Step 9: Deploy to Cloudflare

```bash
npm run build
npm run deploy
```

## Step 10: Access Your Deployment

Your Bbrite app is now live at:
```
https://bbrite.your-account.workers.dev
```

(Replace `your-account` with your Cloudflare account subdomain)

## Step 11: Set Up Cloudflare Access (Optional but Recommended)

Since this is a personal app, protect it with Cloudflare Access:

1. Go to https://dash.cloudflare.com
2. **Access** > **Applications**
3. Create new application
4. Point to your Bbrite worker
5. Add authentication (email or SSO)

Now only you can access Bbrite!

## Troubleshooting

### "GitHub Token Not Configured"
- Ensure you ran `wrangler secret put GITHUB_TOKEN`
- Check that it's set: `wrangler secret list`

### "Database Not Found"
- Create database: `wrangler d1 create bbrite_db`
- Update `wrangler.toml` with the correct database ID
- Run migrations: `wrangler migrations apply --remote`

### Drafts Not Syncing
- Check browser console (F12) for error messages
- Verify D1 is configured in `wrangler.toml`
- Ensure you've run migrations

### Posts Not Fetching from GitHub
- Verify GitHub token is valid
- Check GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH match your Garden repo
- Confirm the content path is correct (usually `content/`)

### "403 Forbidden" from GitHub API
- Your token may have expired
- Create a new token and update via `wrangler secret put GITHUB_TOKEN`

## Environment Variables Reference

| Variable | Required | Example | Notes |
|----------|----------|---------|-------|
| `GITHUB_OWNER` | ✅ | `mailvlous` | GitHub username |
| `GITHUB_REPO` | ✅ | `garden` | Repository name |
| `GITHUB_BRANCH` | ✅ | `v4` | Default branch to publish to |
| `GITHUB_TOKEN` | ✅ | (secret) | Personal access token - set via `wrangler secret` |
| `CONTENT_PATH` | ❌ | `content` | Where Markdown files are stored, defaults to `content/` |

## Workflow: Write → Publish

### For Drafts
1. Click **New** to create draft
2. Write in Markdown
3. Auto-saves every ~1-2 seconds to D1
4. Browse/manage in **Drafts** section

### For Publishing
1. From draft, click **Publish**
2. Optionally update metadata (slug, tags)
3. Bbrite creates/updates file in your Garden repo
4. GitHub triggers Quartz to rebuild
5. Your post is live on `garden.mailvlous.github.io`

### Editing Published Posts
1. Go to **Posts**
2. Click post to open it
3. Edit and save (saves as draft first)
4. Click **Publish Changes**
5. Updates GitHub and Quartz

## Performance Tips

- **Database Indexes**: Already optimized for draft lookups
- **Markdown Caching**: Preview caching on client-side reduces API calls
- **Cloudflare Cache**: Consider enabling Workers cache for `GET /api/posts`

## Security Checklist

- ✅ GitHub token stored in Cloudflare Secrets (not in code)
- ✅ Path traversal protection on all file operations
- ✅ HTML sanitization in Markdown preview
- ✅ XSS protection with rehype-sanitize
- ✅ HTTPS only via Cloudflare
- ✅ D1 uses parameterized queries (no SQL injection)
- ✅ Request body validation on all endpoints
- ✅ Cloudflare Access protects the app (optional)

## Updating Bbrite

Pull latest changes:

```bash
git pull origin main
npm install
npm run build
npm run deploy
```

If database schema changes, run new migrations:

```bash
wrangler migrations apply --remote
```

## Getting Help

- **Astro Docs**: https://docs.astro.build
- **Cloudflare Workers**: https://developers.cloudflare.com/workers
- **Cloudflare D1**: https://developers.cloudflare.com/d1
- **GitHub API**: https://docs.github.com/en/rest
- **Quartz**: https://quartz.jzhao.xyz

## Next Steps

1. ✅ Get writing! Start with your first draft
2. Test the full publish workflow
3. Try different Markdown features
4. Customize colors in `Layout.astro`
5. Add custom domain (if desired)

Enjoy Bbrite! 🌟
