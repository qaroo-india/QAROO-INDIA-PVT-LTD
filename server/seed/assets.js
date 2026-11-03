/**
 * Resolves the static assets the seed records point at.
 *
 * The seeds used to write `image: ''` for every learning programme and
 * business solution, and never set a MOU logo at all, even though the files
 * were sitting in `public/`. These helpers wire them up - but only ever to a
 * file that is actually present, checked at seed time, so a record can never
 * end up with a path that 404s. A missing file yields an empty string, which
 * every consumer already treats as "nothing published".
 *
 * Paths are stored relative to the site root, not as absolute URLs, so the
 * same database works on localhost and in production, and the files are served
 * by the web server (or a CDN) rather than streamed out of MongoDB.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
/** Repo-root `public/`, which is what gets deployed as the site root. */
export const PUBLIC_DIR = path.resolve(HERE, '../../public');

/** True when `/foo/bar.pdf` exists under public/. */
export function assetExists(sitePath) {
  if (!sitePath) return false;
  const rel = sitePath.replace(/^\/+/, '');
  // Nothing may escape public/, even from a hand-edited data file.
  const resolved = path.resolve(PUBLIC_DIR, rel);
  const root = path.resolve(PUBLIC_DIR);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) return false;
  return fs.existsSync(resolved) && fs.statSync(resolved).isFile();
}

/** The site path if the file is there, otherwise ''. */
export const assetOrEmpty = (sitePath) => (assetExists(sitePath) ? sitePath : '');

/**
 * Where a published brochure lives for a record.
 *
 * `group` matters: `digital-marketing` and `ui-ux-design` each exist as both a
 * learning programme and a business solution, so the two are kept in separate
 * folders and the slug alone does not identify the document.
 *
 * @param {'learning'|'business'} group
 * @param {string} slug
 * @returns {string} site path, or '' when nothing is published
 */
export function brochureFor(group, slug) {
  if (!group || !slug) return '';
  return assetOrEmpty(`/brochures/${group}/${slug}.pdf`);
}

/**
 * Logo files for the signed MOUs, keyed by the partner name in the seed data.
 *
 * Matched by name rather than derived from it: these filenames are
 * abbreviations ("dsra", "igec", "srie") that no slug rule would produce.
 */
const MOU_LOGOS = {
  'EduBridge Learning Pvt. Ltd.': 'edubridge.png',
  'SCOPE Global Skills University': 'scope.png',
  'Skill Development Network': 'sdn.png',
  'SNS College of Engineering': 'sns.png',
  'Sri Ranganathar Institute of Engineering and Technology': 'srie.jpg',
  'A.V.P. College of Arts and Science': 'avp.jpg',
  'Dr. SNS Rajalakshmi College of Arts and Science': 'dsra.png',
  'NSP Career Point': 'nsp.jpg',
  'NSDC (National Skill Development Corporation)': 'nsdc.jpg',
  NCVET: 'ncvet.jpg',
  'Medhavi Skills University': 'medhavi.png',
  AISECT: 'aisect.png',
  'Innovative Gurukul Education & Charitable Trust, BGL': 'igec.png',
  'Christ the King Engineering College': 'ckp.png',
};

/**
 * The logo for a MOU partner, or '' when there is no file for it.
 * Falls back to a loose match so a small punctuation change in the seed copy
 * does not silently drop the logo.
 */
export function mouLogoFor(name) {
  if (!name) return '';
  const direct = MOU_LOGOS[name];
  if (direct) return assetOrEmpty(`/logos/${direct}`);

  const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '');
  const target = norm(name);

  // Exact match once punctuation and spacing are ignored.
  for (const [key, file] of Object.entries(MOU_LOGOS)) {
    if (norm(key) === target) return assetOrEmpty(`/logos/${file}`);
  }

  // Then the longest key that is a prefix of the name, which covers a record an
  // admin has qualified - "SNS College of Engineering-coimbatore" is still the
  // SNS College of Engineering. Longest wins so that a shorter, more general
  // key cannot claim a name that a more specific one matches.
  let best = '';
  let bestLen = 0;
  for (const [key, file] of Object.entries(MOU_LOGOS)) {
    const k = norm(key);
    if (k.length > bestLen && (target.startsWith(k) || k.startsWith(target))) {
      best = file;
      bestLen = k.length;
    }
  }
  return best ? assetOrEmpty(`/logos/${best}`) : '';
}

/** The company mark, used where a record has no image of its own. */
export const QAROO_LOGO = assetOrEmpty('/logos/qaroo-logo.png');
