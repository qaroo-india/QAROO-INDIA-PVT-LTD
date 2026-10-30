/**
 * The canonical category lists for MOU and CSR records.
 *
 * These used to be imported from the frontend's src/data/, which made the API
 * depend on frontend source at runtime. That breaks a deployment where the
 * backend is built from its own directory: a Vercel project with Root Directory
 * "backend" never uploads anything above it, so the import would not resolve
 * and the function would fail to build.
 *
 * The frontend keeps its own copy, used as the initial value and the offline
 * fallback for the category pickers while the live list loads from
 * /api/csr/categories and /api/mous/categories. The duplication is deliberate,
 * so each side deploys standalone - and backend/test/integration.test.js
 * asserts the copies are identical, so drift fails the test run rather than
 * turning up as a mismatched dropdown.
 *
 * Keep in step with frontend/src/data/mouCategories.js and
 * frontend/src/data/csrCategories.js.
 */

/** MOU tag options. */
export const MOU_CATEGORIES = [
  'Skill Development',
  'Skill University',
  'Institution Partnership',
  'Career Training',
  'National Ecosystem',
  'Regulatory Body',
  'Unverified',
];

/**
 * CSR category presets. The API serves these merged with the distinct tags
 * already stored, so a new category added through the admin UI appears for
 * future projects without a code change.
 */
export const CSR_CATEGORIES = [
  'Skill Development',
  'Skill University',
  'Institution Partnership',
  'Career Training',
  'National Ecosystem',
  'Regulatory Body',
  'Digital Empowerment',
  'Education Access',
  'Entrepreneurship',
  'Placements',
  'Vocational Training',
  'Women Empowerment',
];
