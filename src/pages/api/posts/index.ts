import type { APIRoute } from "astro";
import { listPosts, writePost } from "../../../lib/github";
import { serializeMarkdown } from "../../../lib/frontmatter";
import { getEnv, json } from "../../../lib/runtime";
import { guardUser, unauthorized } from "../../../lib/access";
import { isValidFolder, isValidSlug, postKey } from "../../../lib/slug";

export const GET: APIRoute = async ({ locals }) => {
  if (!guardUser(locals)) return unauthorized();
  try {
    return json(await listPosts(getEnv()));
  } catch {
    return json({ error: "Could not connect to GitHub." }, 502);
  }
};
export const POST: APIRoute = async ({ request, locals }) => {
  if (!guardUser(locals)) return unauthorized();
  try {
    const input = (await request.json()) as {
      title?: string;
      slug?: string;
      folder?: string;
      content?: string;
      metadata?: Record<string, unknown>;
    };
    if (!input.slug || !isValidSlug(input.slug))
      return json({ error: "Invalid slug." }, 400);
    const folder = String(input.folder || "").trim();
    if (!isValidFolder(folder))
      return json(
        {
          error:
            "Invalid folder. Use letters, numbers, spaces, hyphens, underscores, and forward slashes.",
        },
        400,
      );
    const key = postKey(folder, input.slug);
    const metadata = {
      ...(input.metadata || {}),
      title: String(input.title || input.slug),
      draft: false,
      published: new Date().toISOString().slice(0, 10),
    };
    const result = await writePost(
      getEnv(),
      key,
      serializeMarkdown(metadata, String(input.content || "")),
      `Publish: ${metadata.title}`,
    );
    return json({ ok: true, sha: result.content?.sha, path: key });
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error ? error.message : "Could not publish post.",
      },
      400,
    );
  }
};
