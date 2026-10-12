import type { APIRoute } from "astro";
import { guardUser, unauthorized } from "../../../lib/access";
import { createGitHubAPI } from "../../../lib/github";
import { getEnv, json } from "../../../lib/runtime";
import { isPathTraversal } from "../../../lib/utils";

const CONTENT_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  pdf: "application/pdf",
};

export const GET: APIRoute = async ({ params, locals }) => {
  if (!guardUser(locals)) return unauthorized();

  const path = params.path;
  if (!path || isPathTraversal(path) || path.includes("/")) {
    return json({ error: "Invalid asset path." }, 400);
  }

  const extension = path.split(".").pop()?.toLowerCase() || "";
  const contentType = CONTENT_TYPES[extension];
  if (!contentType) return json({ error: "Unsupported asset type." }, 415);

  try {
    const file = await createGitHubAPI(getEnv()).getFile(`content/assets/${path}`);
    if (!file?.isFile) return json({ error: "Asset not found." }, 404);

    const bytes = Uint8Array.from(Buffer.from(file.content.replace(/\s/g, ""), "base64"));
    return new Response(bytes.buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=300",
        "X-Content-Type-Options": "nosniff",
        ...(extension === "pdf" ? { "Content-Disposition": `inline; filename="${path}"` } : {}),
      },
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Could not load asset." }, 502);
  }
};
