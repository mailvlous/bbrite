import type { APIRoute } from "astro";
import { createGitHubAPI } from "../../lib/github";

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const token = locals.runtime?.env?.GITHUB_TOKEN;
    if (!token) {
      return new Response(
        JSON.stringify({ error: "GitHub token not configured" }),
        { status: 500 }
      );
    }

    const github = createGitHubAPI(locals.runtime?.env);
    const posts = await github.listPosts();

    return new Response(JSON.stringify(posts), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch posts" }), {
      status: 500,
    });
  }
};
