/**
 * The site's public origin, in one place.
 *
 * It was previously written out as a literal in 133 places across index.html,
 * robots.txt, sitemap.xml, the seed files and four components, all pointing at
 * a domain with no DNS records. Anything that builds a canonical, an og:url or
 * a sitemap entry reads it from here so the next change is one edit.
 *
 * No trailing slash: callers append a path that already begins with one.
 */
export const SITE_URL = 'https://www.qaroo.in';

/** An absolute URL for a site-relative path. */
export const absoluteUrl = (path = '/') => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
