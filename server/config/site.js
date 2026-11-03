/**
 * The site's public origin as the backend knows it.
 *
 * The seeds write canonicalUrl onto records, so the value has to exist on this
 * side too. It is overridable with SITE_URL because a staging deploy needs its
 * own canonicals, and kept in step with src/data/site.js on the frontend.
 */
export const SITE_URL = (process.env.SITE_URL || 'https://www.qaroo.in').replace(/\/+$/, '');

/** An absolute URL for a site-relative path. */
export const absoluteUrl = (path = '/') => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

/**
 * The one origin to put in a link we email out.
 *
 * CLIENT_URL is a comma-separated CORS allowlist, so it routinely holds several
 * origins. Interpolating it straight into a URL produced links like
 * `http://localhost:5173,http://localhost:5174,...:5174/admin/reset-password`,
 * which breaks every verification, approval and password-reset email. The first
 * entry is the canonical one by convention, so that is what gets linked.
 *
 * Falls back to SITE_URL, then to the dev server, so a link is never built from
 * an empty string.
 */
export function clientOrigin() {
  const first = String(process.env.CLIENT_URL || '')
    .split(',')[0]
    .trim()
    .replace(/\/+$/, '');
  return first || SITE_URL || 'http://localhost:5173';
}

/** An absolute URL on the client origin, for links sent by email. */
export const clientUrl = (path = '/') =>
  `${clientOrigin()}${path.startsWith('/') ? path : `/${path}`}`;
