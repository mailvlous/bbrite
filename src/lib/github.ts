import { parseMarkdown } from './frontmatter';

const CONTENT_ROOT = 'content';
export type GithubFile = { path: string; sha: string; content: string; title: string; slug: string; metadata: Record<string, unknown> };

function pathFor(slug: string) { return `${CONTENT_ROOT}/${slug}.md`; }
function apiUrl(env: Env, path: string) { return `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${path}`; }
async function request(env: Env, path: string, init: RequestInit = {}) {
  if (!env.GITHUB_TOKEN) throw new Error('GitHub is not configured');
  return fetch(apiUrl(env, path), { ...init, headers: { accept: 'application/vnd.github+json', authorization: `Bearer ${env.GITHUB_TOKEN}`, 'x-github-api-version': '2022-11-28', ...init.headers } });
}

export async function listPosts(env: Env) {
  const response = await request(env, CONTENT_ROOT);
  if (!response.ok) throw new Error('Could not connect to GitHub');
  const items = await response.json() as Array<{ name: string; path: string; type: string }>;
  return items.filter(item => item.type === 'file' && item.name.endsWith('.md')).map(item => ({ slug: item.name.slice(0, -3), title: item.name.slice(0, -3), path: item.path }));
}

export async function getPost(env: Env, slug: string): Promise<GithubFile> {
  const response = await request(env, pathFor(slug));
  if (response.status === 404) throw new Error('Post not found');
  if (!response.ok) throw new Error('Could not connect to GitHub');
  const file = await response.json() as { content: string; sha: string; path: string };
  const content = Buffer.from(file.content, 'base64').toString('utf8');
  const parsed = parseMarkdown(content);
  return { path: file.path, sha: file.sha, content: parsed.body, title: String(parsed.metadata.title || slug), slug, metadata: parsed.metadata };
}

export async function writePost(env: Env, slug: string, content: string, message: string, sha?: string) {
  const response = await request(env, pathFor(slug), { method: 'PUT', body: JSON.stringify({ message, content: Buffer.from(content).toString('base64'), branch: env.GITHUB_BRANCH, ...(sha ? { sha } : {}) }) });
  if (response.status === 409 || response.status === 422) throw new Error('This post changed in GitHub. Reload before publishing.');
  if (!response.ok) throw new Error('GitHub rejected the request');
  return await response.json() as { content?: { sha?: string } };
}

export async function deletePost(env: Env, slug: string, sha: string, title: string) {
  const response = await request(env, pathFor(slug), { method: 'DELETE', body: JSON.stringify({ message: `Delete: ${title}`, sha, branch: env.GITHUB_BRANCH }) });
  if (response.status === 409 || response.status === 422) throw new Error('This post changed in GitHub. Reload before deleting.');
  if (!response.ok) throw new Error('GitHub rejected the request');
}
