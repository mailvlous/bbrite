import type { APIRoute } from "astro";
import { guardUser, unauthorized } from "../../../lib/access";
import { getEnv, json } from "../../../lib/runtime";
import { restoreTrash } from "../../../lib/trash";

export const POST: APIRoute = async ({ params, locals }) => {
  if (!guardUser(locals)) return unauthorized();
  const id = params.id || "";
  try {
    const restored = await restoreTrash(getEnv(), id);
    return json({ ok: true, restored });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not restore trash entry.";
    return json({ error: message }, message.includes("not found") ? 404 : 409);
  }
};
