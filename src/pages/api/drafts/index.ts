<<<<<<< HEAD
import type { APIRoute } from 'astro';
import { getDrafts, saveDraft } from '../../../lib/database';
import { json } from '../../../lib/runtime';
import { slugify } from '../../../lib/slug';

export const GET: APIRoute = ({ locals }) => json(getDrafts(locals.runtime.env.DB));
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const input = await request.json() as Partial<{ id:string; title:string; slug:string; content:string; metadata:Record<string,unknown> }>;
    const title = String(input.title || '').slice(0, 200);
    const draft = await saveDraft(locals.runtime.env.DB, { id: input.id || crypto.randomUUID(), title, slug: input.slug || slugify(title), content: String(input.content || '').slice(0, 500000), metadata: input.metadata || {}, status: 'draft', github_path: null, github_sha: null });
    return json(draft, 201);
  } catch { return json({ error: 'Could not save draft.' }, 400); }
=======
import type { APIRoute } from "astro";
import { listDrafts, saveDraft } from "../../../lib/db";
import type { Draft } from "../../../lib/db";
import { validateSlug, validateTitle, generateId } from "../../../lib/utils";

export const GET: APIRoute = async ({ locals }) => {
  try {
    const db = locals.runtime?.env?.DB;
    if (!db) {
      return new Response(
        JSON.stringify({ error: "Database not configured" }),
        { status: 500 }
      );
    }

    const drafts = await listDrafts(db);

    return new Response(JSON.stringify(drafts), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching drafts:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch drafts" }), {
      status: 500,
    });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = locals.runtime?.env?.DB;
    if (!db) {
      return new Response(
        JSON.stringify({ error: "Database not configured" }),
        { status: 500 }
      );
    }

    const { title, slug, content, metadata } = (await request.json()) as any;

    if (!validateTitle(title)) {
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

    const id = generateId();
    const now = Date.now();

    const draft: Draft = {
      id,
      title: title || "Untitled",
      slug: slug || "",
      content: content || "",
      metadata: metadata || { tags: [] },
      status: "draft",
      created_at: now,
      updated_at: now,
    };

    const saved = await saveDraft(db, draft);

    return new Response(JSON.stringify(saved), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating draft:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create draft" }),
      { status: 500 }
    );
  }
>>>>>>> 60b1fc0 (change ui)
};
