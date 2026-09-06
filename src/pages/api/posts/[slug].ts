import type { APIRoute } from "astro";
import { createGitHubAPI } from "../../../lib/github";
import { renderMarkdown } from "../../../lib/markdown";
import { getEnv } from "../../../lib/runtime";
import { guardUser, unauthorized } from "../../../lib/access";
import { isPathTraversal, sanitizePath } from "../../../lib/utils";

export const GET: APIRoute = async ({ params, locals }) => {
  if (!guardUser(locals)) return unauthorized();
  try {
    const { slug } = params;

    if (!slug || isPathTraversal(slug) || typeof slug !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid slug" }),
        { status: 400 }
      );
    }

    const token = getEnv().GITHUB_TOKEN;
    if (!token) {
      return new Response(
        JSON.stringify({ error: "GitHub token not configured" }),
        { status: 500 }
      );
    }

    const github = createGitHubAPI(getEnv());
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
  if (!guardUser(locals)) return unauthorized();
  try {
    const { slug } = params;

    if (!slug || isPathTraversal(slug) || typeof slug !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid slug" }),
        { status: 400 }
      );
    }

    const token = getEnv().GITHUB_TOKEN;
    if (!token) {
      return new Response(
        JSON.stringify({ error: "GitHub token not configured" }),
        { status: 500 }
      );
    }

    const { content, frontmatter } = (await request.json()) as any;

    if (!content || !frontmatter) {
      return new Response(
        JSON.stringify({ error: "Missing content or frontmatter" }),
        { status: 400 }
      );
    }

    const github = createGitHubAPI(getEnv());
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

export const DELETE: APIRoute = async ({ params, locals }) => {
  if (!guardUser(locals)) return unauthorized();
  try {
    const { slug } = params;

    if (!slug || isPathTraversal(slug) || typeof slug !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid slug" }),
        { status: 400 }
      );
    }

    const token = getEnv().GITHUB_TOKEN;
    if (!token) {
      return new Response(
        JSON.stringify({ error: "GitHub token not configured" }),
        { status: 500 }
      );
    }

    const github = createGitHubAPI(getEnv());
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
};
