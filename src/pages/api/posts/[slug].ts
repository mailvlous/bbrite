<<<<<<< HEAD
import type { APIRoute } from 'astro';
import { deletePost, getPost, writePost } from '../../../lib/github';
import { serializeMarkdown } from '../../../lib/frontmatter';
import { getEnv, json } from '../../../lib/runtime';
import { isValidSlug } from '../../../lib/slug';

export const GET: APIRoute = async ({ params, locals }) => { try { if (!isValidSlug(params.slug!)) return json({ error: 'Invalid slug.' }, 400); return json(await getPost(getEnv({ locals } as never), params.slug!)); } catch { return json({ error: 'Could not connect to GitHub.' }, 502); } };
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    if (!isValidSlug(params.slug!)) return json({ error: 'Invalid slug.' }, 400);
    const input = await request.json() as { title?:string; content?:string; metadata?:Record<string,unknown>; sha?:string };
    if (!input.sha) return json({ error: 'A current GitHub SHA is required.' }, 409);
    const metadata = { ...(input.metadata || {}), title: String(input.title || params.slug), draft: false };
    const result = await writePost(getEnv({ locals } as never), params.slug!, serializeMarkdown(metadata, String(input.content || '')), `Update: ${metadata.title}`, input.sha);
    return json({ ok: true, sha: result.content?.sha });
  } catch (error) { return json({ error: error instanceof Error ? error.message : 'Could not publish changes.' }, 409); }
};
export const DELETE: APIRoute = async ({ params, request, locals }) => {
  try { const input = await request.json() as { sha?:string; title?:string }; if (!input.sha) return json({ error: 'A current GitHub SHA is required.' }, 409); await deletePost(getEnv({ locals } as never), params.slug!, input.sha, input.title || params.slug!); return new Response(null, { status: 204 }); }
  catch (error) { return json({ error: error instanceof Error ? error.message : 'Could not delete post.' }, 409); }
=======
import type { APIRoute } from "astro";
import { createGitHubAPI } from "../../../lib/github";
import { renderMarkdown } from "../../../lib/markdown";
import { isPathTraversal, sanitizePath } from "../../../lib/utils";

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const { slug } = params;

    if (!slug || isPathTraversal(slug) || typeof slug !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid slug" }),
        { status: 400 }
      );
    }

    const token = locals.runtime?.env?.GITHUB_TOKEN;
    if (!token) {
      return new Response(
        JSON.stringify({ error: "GitHub token not configured" }),
        { status: 500 }
      );
    }

    const github = createGitHubAPI(locals.runtime?.env);
    const post = await github.getPost(sanitizePath(slug));

    if (!post) {
      return new Response(
        JSON.stringify({ error: "Post not found" }),
        { status: 404 }
      );
    }

    const { html, excerpt } = await renderMarkdown(post.content);

    return new Response(
      JSON.stringify({
        ...post,
        html,
        excerpt,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching post:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch post" }),
      { status: 500 }
    );
  }
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    const { slug } = params;

    if (!slug || isPathTraversal(slug) || typeof slug !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid slug" }),
        { status: 400 }
      );
    }

    const token = locals.runtime?.env?.GITHUB_TOKEN;
    if (!token) {
      return new Response(
        JSON.stringify({ error: "GitHub token not configured" }),
        { status: 500 }
      );
    }

    const { content, frontmatter } = await request.json() as any;

    if (!content || !frontmatter) {
      return new Response(
        JSON.stringify({ error: "Missing content or frontmatter" }),
        { status: 400 }
      );
    }

    const github = createGitHubAPI(locals.runtime?.env);
    const post = await github.getPost(sanitizePath(slug));

    if (!post) {
      return new Response(
        JSON.stringify({ error: "Post not found" }),
        { status: 404 }
      );
    }

    const fullContent = github.formatFrontmatter(frontmatter) + content;
    const newSha = await github.updateFile(
      post.path,
      fullContent,
      post.sha,
      `chore: update post ${slug}`
    );

    return new Response(
      JSON.stringify({ success: true, sha: newSha.sha }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error updating post:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update post" }),
      { status: 500 }
    );
  }
};

export const DELETE: APIRoute = async ({ params, request, locals }) => {
  try {
    const { slug } = params;

    if (!slug || isPathTraversal(slug) || typeof slug !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid slug" }),
        { status: 400 }
      );
    }

    const token = locals.runtime?.env?.GITHUB_TOKEN;
    if (!token) {
      return new Response(
        JSON.stringify({ error: "GitHub token not configured" }),
        { status: 500 }
      );
    }

    const github = createGitHubAPI(locals.runtime?.env);
    const post = await github.getPost(sanitizePath(slug));

    if (!post) {
      return new Response(
        JSON.stringify({ error: "Post not found" }),
        { status: 404 }
      );
    }

    await github.deleteFile(
      post.path,
      post.sha,
      `chore: delete post ${slug}`
    );

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error deleting post:", error);
    return new Response(
      JSON.stringify({ error: "Failed to delete post" }),
      { status: 500 }
    );
  }
>>>>>>> 60b1fc0 (change ui)
};
