import type { APIRoute } from "astro";
import { getDraft, saveDraft, deleteDraft } from "../../../lib/db";
import type { Draft } from "../../../lib/db";
import { renderMarkdown } from "../../../lib/markdown";
import { validateSlug, validateTitle } from "../../../lib/utils";

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const { id } = params;
    const db = locals.runtime?.env?.DB;

    if (!db || !id) {
      return new Response(
        JSON.stringify({ error: "Database not configured or invalid ID" }),
        { status: 500 }
      );
    }

    const draft = await getDraft(db, id);

    if (!draft) {
      return new Response(
        JSON.stringify({ error: "Draft not found" }),
        { status: 404 }
      );
    }

    const { html, excerpt } = await renderMarkdown(draft.content);

    return new Response(
      JSON.stringify({
        ...draft,
        html,
        excerpt,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching draft:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch draft" }),
      { status: 500 }
    );
  }
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    const { id } = params;
    const db = locals.runtime?.env?.DB;

    if (!db || !id) {
      return new Response(
        JSON.stringify({ error: "Database not configured or invalid ID" }),
        { status: 500 }
      );
    }

    const { title, slug, content, metadata, status } = (await request.json()) as any;

    if (title && !validateTitle(title)) {
      return new Response(
        JSON.stringify({ error: "Invalid title" }),
        { status: 400 }
      );
    }

    if (slug && !validateSlug(slug)) {
      return new Response(
        JSON.stringify({ error: "Invalid slug" }),
        { status: 400 }
      );
    }

    const draft = await getDraft(db, id);

    if (!draft) {
      return new Response(
        JSON.stringify({ error: "Draft not found" }),
        { status: 404 }
      );
    }

    const updated: Draft = {
      ...draft,
      title: title ?? draft.title,
      slug: slug ?? draft.slug,
      content: content ?? draft.content,
      metadata: metadata ?? draft.metadata,
      status: status ?? draft.status,
    };

    const saved = await saveDraft(db, updated);

    return new Response(JSON.stringify(saved), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating draft:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update draft" }),
      { status: 500 }
    );
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const { id } = params;
    const db = locals.runtime?.env?.DB;

    if (!db || !id) {
      return new Response(
        JSON.stringify({ error: "Database not configured or invalid ID" }),
        { status: 500 }
      );
    }

    const draft = await getDraft(db, id);

    if (!draft) {
      return new Response(
        JSON.stringify({ error: "Draft not found" }),
        { status: 404 }
      );
    }

    await deleteDraft(db, id);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting draft:", error);
    return new Response(
      JSON.stringify({ error: "Failed to delete draft" }),
      { status: 500 }
    );
  }
};
