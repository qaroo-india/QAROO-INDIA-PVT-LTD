/**
 * Allows only navigable URL schemes into an anchor's href.
 *
 * React escapes text but does not touch href, so a stored string beginning
 * `javascript:` runs when a visitor clicks the link. Three places feed a stored
 * value straight into an href: the resource links and social icons an admin
 * edits under Website Content, which render on public pages, and the legacy
 * `resumeLink` on a job application, which was supplied by the candidate and is
 * shown to an admin. None of them validated the scheme.
 *
 * Nothing stored today is dangerous - this closes the route rather than cleaning
 * up after it.
 *
 * @param {unknown} value the stored URL
 * @returns {string|undefined} the URL if it is safe to navigate to, else
 *   undefined - which React omits, leaving a non-navigable anchor rather than a
 *   link to "#" that looks clickable
 */
export function safeHref(value) {
  if (typeof value !== 'string') return undefined;
  const url = value.trim();
  if (!url) return undefined;

  // A protocol-relative URL silently adopts the page's scheme and points at
  // another host. Rejected rather than allowed: an external link should say
  // https:// explicitly, and this form is more often a mistake or an attempt to
  // make the destination less obvious.
  if (url.startsWith('//')) return undefined;

  // Site-relative paths and in-page references carry no scheme to abuse.
  if (url.startsWith('/') || url.startsWith('#') || url.startsWith('?')) return url;

  // A scheme is anything before the first colon, provided no / ? # precedes it.
  const colon = url.indexOf(':');
  if (colon === -1) return url; // a bare host or a relative path
  if (/[/?#]/.test(url.slice(0, colon))) return url;
  const scheme = url.slice(0, colon).toLowerCase();

  // Deliberately a short allowlist: a blocklist of `javascript:` is trivially
  // bypassed (tabs, newlines, entity encoding, `vbscript:`, `data:`).
  return ['http', 'https', 'mailto', 'tel'].includes(scheme) ? url : undefined;
}

export default safeHref;
