export function slugify(text = '') {
  return String(text)
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[/]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}
