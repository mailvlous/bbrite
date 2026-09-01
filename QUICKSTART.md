# Bbrite Quick Start

Get Bbrite running in 10 minutes.

## 1. Clone or Setup

```bash
cd bbrite
npm install
```

## 2. Create GitHub Token

Visit: https://github.com/settings/tokens/new

- Token name: `bbrite`
- Scope: `repo` (full control of repositories)
- Copy the token

## 3. Set Local Environment

Create `.env.local`:
```
GITHUB_OWNER=mailvlous
GITHUB_REPO=garden
GITHUB_BRANCH=v4
GITHUB_TOKEN=your_token_here
CONTENT_PATH=content
```

## 4. Run Locally

```bash
npm run dev
```

Open http://localhost:3000

## 5. Test Features

✅ Create new draft
✅ Write Markdown
✅ Preview with split view
✅ Toggle focus mode
✅ Export as Markdown

## 6. Deploy to Cloudflare (Optional)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full instructions.

```bash
# Quick deploy
wrangler secret put GITHUB_TOKEN
npm run build
npm run deploy
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd/Ctrl + S | Save draft |
| Cmd/Ctrl + Shift + P | Command palette |
| Escape | Close modals |

## Architecture

- **Frontend**: Astro SSR with client components
- **Backend**: Cloudflare Workers (serverless)
- **Database**: Cloudflare D1 (SQLite)
- **Git**: GitHub API for Garden integration

## Troubleshooting

**Drafts not saving?**
- Check browser console (F12)
- Ensure GitHub token is set

**GitHub API errors?**
- Verify token has `repo` scope
- Token might have expired

**Build fails?**
- Run `npm install` again
- Delete `node_modules` and reinstall

## Next Steps

1. 📝 Write your first draft
2. 🚀 Test the publish workflow
3. 📱 Try on mobile
4. 🎨 Customize colors in `Layout.astro`
5. 🌐 Deploy to production

Enjoy writing! ✨
