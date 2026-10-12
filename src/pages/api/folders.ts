import type { APIRoute } from "astro";
import { guardUser, unauthorized } from "../../lib/access";
import { createGitHubAPI } from "../../lib/github";
import { getEnv, json } from "../../lib/runtime";
import { isValidFolder } from "../../lib/slug";
import { moveFilesToTrash } from "../../lib/trash";

const MAX_FILES_PER_DELETE = 25;

export const DELETE: APIRoute = async ({ request, locals }) => {
  if (!guardUser(locals)) return unauthorized();

  try {
    const input = await request.json() as { folder?: unknown };
    const folder = typeof input.folder === "string" ? input.folder.trim() : "";
    const normalized = folder.toLowerCase();
    if (!folder || !isValidFolder(folder) || normalized === "assets" || normalized.startsWith("assets/")) {
      return json({ error: "Invalid or protected folder." }, 400);
    }

    const env = getEnv();
    const github = createGitHubAPI(env);
    const root = `${env.CONTENT_PATH || "content"}/${folder}`;
    const files: Array<{ path: string; sha: string }> = [];

    const collect = async (path: string): Promise<void> => {
      const entries = await github.listFiles(path);
      for (const entry of entries) {
        if (entry.isFile) files.push({ path: entry.path, sha: entry.sha });
        else await collect(entry.path);
        if (files.length > MAX_FILES_PER_DELETE) return;
      }
    };

    await collect(root);
    if (files.length === 0) return json({ error: "Folder not found or already empty." }, 404);
    if (files.length > MAX_FILES_PER_DELETE) {
      return json({ error: `Folder contains more than ${MAX_FILES_PER_DELETE} files and cannot be deleted at once.` }, 413);
    }

    const manifest = await moveFilesToTrash(env, "folder", folder, files);
    return json({ ok: true, folder, moved: files.length, trashId: manifest.id });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Could not move folder to trash." }, 502);
  }
};
