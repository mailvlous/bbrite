# Bbrite Deployment Guide

## Quick Deploy (5 minutes)

### 1. Prerequisites
```bash
# Install Node 18+
node --version  # v18.0.0 or higher

# Install dependencies
npm install
```

### 2. Set GitHub Token
```bash
wrangler secret put GITHUB_TOKEN
# Paste your token and press Enter
```

### 3. Create Database
```bash
# Visit https://dash.cloudflare.com → Workers & Pages → D1
# Create database named "bbrite_db"
# Copy the Database ID
# Update wrangler.toml with the ID
```

### 4. Deploy
```bash
npm run build
npm run deploy
```

Your Bbrite is live! 🎉

---

## Detailed Deployment Steps

### Step 1: GitHub Token

**What you need:**
- Your GitHub account
- Ability to create personal access tokens

**How to create token:**
1. Go to https://github.com/settings/tokens/new
2. Token name: `bbrite`
3. Expiration: No expiration (or 1 year)
4. Scopes:
   - ✅ `repo` - Access to private repositories
   - ✅ `workflow` - Update workflow files (optional)
5. Click "Generate token"
6. **Copy immediately** - you won't see it again

**Set in Cloudflare:**
```bash
wrangler secret put GITHUB_TOKEN
```
Paste token, press Enter.

### Step 2: Cloudflare Account

**Create account:**
- Go to https://dash.cloudflare.com/sign-up
- Free tier is perfect for Bbrite
- Verify email

**Install Wrangler CLI:**
```bash
npm install -g wrangler
wrangler login
# Opens browser for authentication
```

### Step 3: Create D1 Database

**Via Dashboard:**
1. https://dash.cloudflare.com → Choose account
2. **Workers & Pages** → **D1**
3. **Create database**
4. Name: `bbrite_db`
5. **Copy the Database ID**

**Update `wrangler.toml`:**
```toml
name = "bbrite"

[env.production.d1_databases]
binding = "DB"
database_name = "bbrite_db"
database_id = "YOUR_DATABASE_ID_HERE"  # ← Paste here
```

### Step 4: Configure Environment

**Update `wrangler.toml` variables:**
```toml
[env.production]
[env.production.vars]
GITHUB_OWNER = "mailvlous"
GITHUB_REPO = "garden"
GITHUB_BRANCH = "v4"
CONTENT_PATH = "content"
```

### Step 5: Run Migrations

**Initialize database:**
```bash
wrangler migrations create init
# Creates migrations/0001_init.sql

# Add migration content (see below) ↓

wrangler migrations apply --remote
```

**Migration content (`migrations/0001_init.sql`):**
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

CREATE INDEX IF NOT EXISTS idx_drafts_updated_at ON drafts(updated_at);
CREATE INDEX IF NOT EXISTS idx_drafts_status ON drafts(status);
```

### Step 6: Build & Deploy

```bash
# Build for production
npm run build

# Deploy to Cloudflare
npm run deploy
```

**Success output:**
```
✓ Uploaded bbrite
✓ Published to https://bbrite.YOUR_USERNAME.workers.dev
```

### Step 7: Access Your App

Visit: `https://bbrite.YOUR_USERNAME.workers.dev`

Replace `YOUR_USERNAME` with your Cloudflare account subdomain.

---

## Custom Domain (Optional)

If you have a domain registered:

1. Go to https://dash.cloudflare.com → **Workers & Pages**
2. Select your Bbrite worker
3. **Custom domains** tab
4. **Add custom domain**
5. Enter your domain (e.g., `bbrite.example.com`)

Your domain must have nameservers pointing to Cloudflare (free tier available).

---

## Cloudflare Access (Recommended for Security)

Protect your Bbrite with password authentication:

1. https://dash.cloudflare.com → **Access** → **Applications**
2. **Create an application**
3. **Self-hosted** → **Web Application**
4. Name: `Bbrite`
5. Application URL: `https://bbrite.YOUR_USERNAME.workers.dev`
6. **Add policies** for authentication
7. Select: **Email**, **GitHub**, or **Google**
8. Add your email to allow list

Now only authenticated users can access Bbrite.

---

## Monitoring & Logs

### View Logs
```bash
wrangler tail
```

Shows real-time requests to your Bbrite worker.

### Debug Issues
```bash
# Check recent deployments
wrangler deployments list

# View secrets (masked)
wrangler secret list

# Test database
wrangler d1 execute bbrite_db --command "SELECT * FROM drafts LIMIT 5"
```

---

## Update Bbrite

Pull latest version and redeploy:

```bash
git pull origin main
npm install
npm run build
npm run deploy
```

If database schema changed:
```bash
# Create new migration
wrangler migrations create new_feature

# Edit migrations/000X_new_feature.sql with changes

# Apply
wrangler migrations apply --remote
```

---

## Troubleshooting Deployment

### "Authentication failed"
```bash
# Re-login to Cloudflare
wrangler logout
wrangler login
```

### "Database not found"
- Verify database exists: https://dash.cloudflare.com/d1
- Check `wrangler.toml` has correct database ID
- Run migrations: `wrangler migrations apply --remote`

### "Secret not configured"
```bash
# List secrets
wrangler secret list

# If GITHUB_TOKEN missing:
wrangler secret put GITHUB_TOKEN
```

### "403 Forbidden from GitHub"
- Token may have expired
- Create new token at https://github.com/settings/tokens
- Update: `wrangler secret put GITHUB_TOKEN`

### "Worker timeout"
- GitHub API calls can be slow
- Worker timeout is 30 seconds (Cloudflare limit)
- Try operation again

---

## Performance Optimization

### Enable Cache
In `wrangler.toml`:
```toml
[env.production.routes]
pattern = "example.com/api/posts"
zone_name = "example.com"
custom_domain = true

# Cache GET /api/posts for 1 hour
cache_default_ttl = 3600
cache_on_cookie_presence = "user"
```

### Database Optimization
```sql
-- Already done, but check indexes:
SELECT * FROM pragma_index_info('idx_drafts_updated_at');
```

---

## Costs (Free Tier)

Bbrite fits entirely within Cloudflare's free tier:

| Service | Free Limit | Usage |
|---------|-----------|-------|
| Workers | 100,000 requests/day | ~50 drafts, 100 posts = ~1,000 requests/day ✅ |
| D1 | 1 database, 3GB data | ~10MB for typical use ✅ |
| Requests | Unlimited bandwidth | ✅ |
| KV | 100,000 ops/day | Not used |

**Cost: $0/month** (unless you upgrade)

---

## Scaling Beyond Free Tier

If you exceed limits:

**Workers Paid:** $0.50/million requests
- For 10M requests/month = $5/month

**D1 Paid:** $0.75/million reads, $1.50/million writes
- For 100K writes/month = $0.15/month

Total: ~$5-10/month for heavy usage

---

## Rollback Previous Version

If something breaks:

```bash
# View deployment history
wrangler deployments list

# Rollback to previous
wrangler deployments rollback
```

---

## Production Checklist

- [ ] GitHub token set via `wrangler secret put`
- [ ] Database ID in `wrangler.toml`
- [ ] Migrations applied: `wrangler migrations apply --remote`
- [ ] Environment variables set
- [ ] Built successfully: `npm run build`
- [ ] Deployed: `npm run deploy`
- [ ] App accessible at worker URL
- [ ] (Optional) Cloudflare Access enabled
- [ ] (Optional) Custom domain configured
- [ ] Bookmarked worker URL
- [ ] First draft created and saved

---

## Support

**Issues?** Check:
1. Wrangler logs: `wrangler tail`
2. Browser console (F12)
3. Cloudflare Dashboard → Workers → Bbrite
4. GitHub token permissions: https://github.com/settings/tokens

**Still stuck?** Visit:
- Cloudflare Workers Docs: https://developers.cloudflare.com/workers
- Astro Docs: https://docs.astro.build
- Bbrite README: See README.md
