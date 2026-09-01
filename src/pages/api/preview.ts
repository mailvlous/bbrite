import type { APIRoute } from "astro";
import { renderMarkdown } from "../../lib/markdown";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { content } = (await request.json()) as { content: string };

    if (!content || typeof content !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid content" }),
        { status: 400 }
      );
    }

    const { html, excerpt } = await renderMarkdown(content);

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
