// Generates a URL-safe slug from a title (e.g. "Cloud Computing" -> "cloud-computing").
export function slugify(title) {
  if (!title) return '';
  return String(title)
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}
