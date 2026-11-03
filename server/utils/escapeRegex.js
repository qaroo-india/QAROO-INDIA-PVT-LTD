// Escapes a user-supplied string so it can be used safely inside a RegExp.
// Prevents regex/ReDoS injection via search/filter parameters.
export function escapeRegex(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}