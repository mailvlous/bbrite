export function slugify(title: string): string {
  return title.toLowerCase().trim().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 80;
}

export function isValidFolder(folder: string): boolean {
  if (folder === "") return true;
  if (folder.length > 240 || folder.startsWith("/") || folder.endsWith("/")) return false;
  return folder.split("/").every((segment) =>
    segment.length <= 80 && /^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/.test(segment)
  );
}

export function postKey(folder: string, slug: string): string {
  return folder ? `${folder}/${slug}` : slug;
}
