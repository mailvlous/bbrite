import { createGitHubAPI, type GitHubAPI } from "./github";

const TRASH_ROOT = ".bbrite-trash";
const MAX_TRASH_FILES = 25;

export interface TrashFile {
  originalPath: string;
  trashPath: string;
}

export interface TrashManifest {
  id: string;
  type: "note" | "folder";
  label: string;
  deletedAt: string;
  files: TrashFile[];
}

function decodeBase64(value: string): string {
  return Buffer.from(value.replace(/\s/g, ""), "base64").toString("utf-8");
}

function assertTrashId(id: string): void {
  if (!/^[a-z0-9-]+$/.test(id)) throw new Error("Invalid trash entry.");
}

function safeRepositoryPath(path: string): boolean {
  return path.startsWith("content/") && !path.includes("..") && !path.includes("\\");
}

export async function moveFilesToTrash(
  env: Env,
  type: TrashManifest["type"],
  label: string,
  files: Array<{ path: string; sha: string }>
): Promise<TrashManifest> {
  if (files.length === 0) throw new Error("Nothing to move to trash.");
  if (files.length > MAX_TRASH_FILES) throw new Error(`A maximum of ${MAX_TRASH_FILES} files can be moved at once.`);
  if (files.some((file) => !safeRepositoryPath(file.path))) throw new Error("Trash source path is invalid.");

  const github = createGitHubAPI(env);
  const now = new Date();
  const id = `${now.toISOString().replace(/\D/g, "").slice(0, 14)}-${crypto.randomUUID().slice(0, 8)}`;
  const manifest: TrashManifest = { id, type, label, deletedAt: now.toISOString(), files: [] };

  // Copy everything first. Originals are only removed after the recycle entry is complete.
  for (const file of files) {
    const source = await github.getFile(file.path);
    if (!source?.isFile) throw new Error(`Could not read ${file.path}.`);
    const trashPath = `${TRASH_ROOT}/${id}/files/${file.path}`;
    await github.createBase64File(trashPath, source.content.replace(/\s/g, ""), `Trash: ${label}`);
    manifest.files.push({ originalPath: file.path, trashPath });
  }

  await github.createFile(`${TRASH_ROOT}/${id}/manifest.json`, JSON.stringify(manifest, null, 2), `Trash manifest: ${label}`);

  for (const file of files) {
    await github.deleteFile(file.path, file.sha, `Move to trash: ${label}`);
  }

  return manifest;
}

async function readManifest(github: GitHubAPI, id: string): Promise<TrashManifest | null> {
  assertTrashId(id);
  const file = await github.getFile(`${TRASH_ROOT}/${id}/manifest.json`);
  if (!file?.isFile) return null;
  const parsed = JSON.parse(decodeBase64(file.content)) as TrashManifest;
  if (parsed.id !== id || !Array.isArray(parsed.files)) throw new Error("Trash manifest is invalid.");
  if (parsed.files.some((item) =>
    !safeRepositoryPath(item.originalPath) ||
    item.trashPath !== `${TRASH_ROOT}/${id}/files/${item.originalPath}`
  )) throw new Error("Trash manifest contains an unsafe path.");
  return parsed;
}

export async function listTrash(env: Env): Promise<TrashManifest[]> {
  const github = createGitHubAPI(env);
  const entries = await github.listFiles(TRASH_ROOT);
  const manifests: TrashManifest[] = [];
  for (const entry of entries.slice(0, 100)) {
    if (entry.isFile) continue;
    try {
      const manifest = await readManifest(github, entry.name);
      if (manifest) manifests.push(manifest);
    } catch (error) {
      console.error(`Could not read trash entry ${entry.name}:`, error);
    }
  }
  return manifests.sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));
}

export async function restoreTrash(env: Env, id: string): Promise<TrashManifest> {
  const github = createGitHubAPI(env);
  const manifest = await readManifest(github, id);
  if (!manifest) throw new Error("Trash entry not found.");

  const copies: Array<{ item: TrashFile; content: string; sha: string; exists: boolean }> = [];
  for (const item of manifest.files) {
    const trashed = await github.getFile(item.trashPath);
    if (!trashed?.isFile) throw new Error(`Trash copy is missing: ${item.originalPath}`);
    const original = await github.getFile(item.originalPath);
    const content = trashed.content.replace(/\s/g, "");
    if (original && original.content.replace(/\s/g, "") !== content) {
      throw new Error(`Cannot restore because ${item.originalPath} already contains different content.`);
    }
    copies.push({ item, content, sha: trashed.sha, exists: Boolean(original) });
  }

  for (const copy of copies) {
    if (!copy.exists) await github.createBase64File(copy.item.originalPath, copy.content, `Restore: ${manifest.label}`);
  }
  for (const copy of copies) {
    await github.deleteFile(copy.item.trashPath, copy.sha, `Restore from trash: ${manifest.label}`);
  }
  const manifestFile = await github.getFile(`${TRASH_ROOT}/${id}/manifest.json`);
  if (manifestFile?.isFile) await github.deleteFile(manifestFile.path, manifestFile.sha, `Restore complete: ${manifest.label}`);

  return manifest;
}
