// Client-side editor utilities
export interface DraftData {
  id?: string;
  title: string;
  slug: string;
  content: string;
  metadata: {
    tags?: string[];
    date?: string;
    [key: string]: any;
  };
  status: "draft" | "published";
}

export async function saveDraft(draft: DraftData): Promise<DraftData> {
  const url = draft.id ? `/api/drafts/${draft.id}` : `/api/drafts`;
  const method = draft.id ? "PUT" : "POST";

  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(draft),
  });

  if (!response.ok) {
    throw new Error(`Failed to save draft: ${response.status}`);
  }

  return response.json();
}

export async function publishPost(
  slug: string,
  content: string,
  frontmatter: Record<string, any>
): Promise<{ success: boolean }> {
  const response = await fetch(`/api/posts/${slug}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, frontmatter }),
  });

  if (!response.ok) {
    throw new Error(`Failed to publish: ${response.status}`);
  }

  return response.json();
}

export async function renderPreview(content: string): Promise<string> {
  const response = await fetch("/api/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    throw new Error("Failed to render preview");
  }

  const data = await response.json();
  return data.html;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function createFrontmatter(data: {
  title: string;
  tags?: string[];
  draft?: boolean;
  [key: string]: any;
}): Record<string, any> {
  return {
    title: data.title || "Untitled",
    draft: data.draft ?? false,
    tags: data.tags ?? [],
    ...data,
  };
}

export function parseTags(tagString: string): string[] {
  return tagString
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

export function formatTags(tags: string[]): string {
  return tags.join(", ");
}

export async function deleteDraft(id: string): Promise<void> {
  const response = await fetch(`/api/drafts/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete draft: ${response.status}`);
  }
}

export async function deletePost(slug: string): Promise<void> {
  const response = await fetch(`/api/posts/${slug}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete post: ${response.status}`);
  }
}
