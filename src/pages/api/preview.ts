import type { APIRoute } from "astro";
import { renderMarkdown } from "../../lib/markdown";
import { guardUser, unauthorized } from "../../lib/access";

export const POST: APIRoute = async ({ request, locals }) => {
  if (!guardUser(locals)) return unauthorized();
  try {
    const { content } = (await request.json()) as { content: string };

    if (!content || typeof content !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid content" }),
        { status: 400 }
      );
    }

    const rendered = await renderMarkdown(content);
    const html = rendered.html
      .replace(/src="\/assets\//g, 'src="/api/assets/')
      .replace(/href="\/assets\//g, 'href="/api/assets/');
    const { excerpt } = rendered;

    return new Response(
      JSON.stringify({ html, excerpt }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error rendering preview:", error);
    return new Response(
      JSON.stringify({ error: "Failed to render preview" }),
      { status: 500 }
    );
  }
};
