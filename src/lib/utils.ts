import { nanoid } from "nanoid";

export function generateId(): string {
  return nanoid(12);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function validateSlug(slug: string): boolean {
  return /^[a-z0-9]+([-_][a-z0-9]+)*$/.test(slug) && slug.length > 0;
}

export function validateTitle(title: string): boolean {
  return title.trim().length > 0 && title.length <= 200;
}

export function isPathTraversal(path: string): boolean {
  // Prevent directory traversal attacks
  return path.includes("..") || path.startsWith("/") || path.includes("\\");
}

export function sanitizePath(path: string): string {
  return path.replace(/[^a-zA-Z0-9/_.-]/g, "");
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
