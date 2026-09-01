<<<<<<< HEAD
import type { APIRoute } from 'astro';
import { getDraft, removeDraft, saveDraft } from '../../../lib/database';
import { json } from '../../../lib/runtime';

export const GET: APIRoute = async ({ params, locals }) => { const draft = await getDraft(locals.runtime.env.DB, params.id!); return draft ? json(draft) : json({ error: 'Draft not found' }, 404); };
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    const existing = await getDraft(locals.runtime.env.DB, params.id!);
    const input = await request.json() as Partial<typeof existing>;
    const draft = await saveDraft(locals.runtime.env.DB, { ...(existing || { id: params.id!, title: '', slug: '', content: '', metadata: {}, status: 'draft', github_path: null, github_sha: null }), ...input, id: params.id!, title: String(input.title ?? existing?.title ?? '').slice(0, 200), content: String(input.content ?? existing?.content ?? '').slice(0, 500000), metadata: input.metadata || existing?.metadata || {} });
    return json(draft);
  } catch { return json({ error: 'Could not save draft.' }, 400); }
};
export const DELETE: APIRoute = async ({ params, locals }) => { await removeDraft(locals.runtime.env.DB, params.id!); return new Response(null, { status: 204 }); };
=======
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
>>>>>>> 60b1fc0 (change ui)
