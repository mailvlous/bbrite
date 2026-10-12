import type { APIRoute } from "astro";
import { guardUser, unauthorized } from "../../lib/access";
import { createGitHubAPI } from "../../lib/github";
import { getEnv, json } from "../../lib/runtime";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_PDF_BYTES = 10 * 1024 * 1024;
const ASSET_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

function safeBaseName(name: string): string {
  return name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "uploaded-file";
}

export const POST: APIRoute = async ({ request, locals }) => {
  if (!guardUser(locals)) return unauthorized();

  try {
    const form = await request.formData();
    const asset = form.get("asset") || form.get("image");
    if (!(asset instanceof File)) return json({ error: "No file was provided." }, 400);

    const extension = ASSET_EXTENSIONS[asset.type] || (asset.name.toLowerCase().endsWith(".pdf") ? "pdf" : undefined);
    if (!extension) return json({ error: "Use a PNG, JPEG, GIF, WebP, or PDF file." }, 415);
    const maxBytes = extension === "pdf" ? MAX_PDF_BYTES : MAX_IMAGE_BYTES;
    if (asset.size === 0 || asset.size > maxBytes) {
      return json({ error: `${extension === "pdf" ? "PDF" : "Image"} must be between 1 byte and ${maxBytes / 1024 / 1024} MB.` }, 413);
    }

    const bytes = new Uint8Array(await asset.arrayBuffer());
    if (extension === "pdf" && new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") {
      return json({ error: "The selected file is not a valid PDF." }, 415);
    }

    const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
    const suffix = crypto.randomUUID().slice(0, 8);
    const filename = `${safeBaseName(asset.name)}-${stamp}-${suffix}.${extension}`;
    const repositoryPath = `content/assets/${filename}`;
    const base64 = Buffer.from(bytes).toString("base64");

    const result = await createGitHubAPI(getEnv()).createBase64File(
      repositoryPath,
      base64,
      `Upload ${extension === "pdf" ? "PDF" : "image"}: ${filename}`
    );

    return json({
      ok: true,
      filename,
      path: repositoryPath,
      url: `/assets/${filename}`,
      type: extension === "pdf" ? "pdf" : "image",
      sha: result.sha,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Could not upload file." }, 502);
  }
};
