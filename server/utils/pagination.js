/**
 * Bounds a list query.
 *
 * Every list endpoint used to return its whole collection: `Model.find(query)`
 * with no cap. That is fine at today's record counts and unbounded as the site
 * fills up - one slow response can hold a connection while the JSON is built,
 * and the admin dashboard asks six of these endpoints at once on load.
 *
 * The cap is deliberately generous so no existing page changes what it shows,
 * and `total` is returned alongside so a caller can always tell whether it is
 * looking at everything. Nothing is hidden silently: `count` is what came back,
 * `total` is what matched.
 */

/** Default rows per request when the caller does not ask for a size. */
export const DEFAULT_LIMIT = 1000;

/** Ceiling a caller can raise the limit to. */
export const MAX_LIMIT = 5000;

/**
 * Reads `?limit=` and `?skip=` off a request, clamped to sane bounds.
 *
 * @param {import('express').Request} req
 * @returns {{limit: number, skip: number}}
 */
export function pageOf(req) {
  const asked = parseInt(req.query?.limit, 10);
  const limit = Number.isFinite(asked) && asked > 0 ? Math.min(asked, MAX_LIMIT) : DEFAULT_LIMIT;
  const skipped = parseInt(req.query?.skip, 10);
  const skip = Number.isFinite(skipped) && skipped > 0 ? skipped : 0;
  return { limit, skip };
}
