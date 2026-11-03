import PageContent from '../models/PageContent.js';
import { PAGE_CONTENT } from '../data/seedData.js';

/**
 * Seeds page content, and fills in keys a stored page is missing.
 *
 * This used to skip any page that already existed, which meant a key added to
 * PAGE_CONTENT later could never reach a database that had been seeded once -
 * the About page's partner list being the case that exposed it. Now a missing
 * key is added and an existing one is left exactly as it is, so nothing an
 * admin has edited through Website Content is overwritten.
 */
export async function seedContent(admin) {
  for (const [page, data] of Object.entries(PAGE_CONTENT)) {
    const existing = await PageContent.findOne({ page });

    if (!existing) {
      await PageContent.create({ page, data, updatedBy: admin ? admin._id : null });
      console.log(`Seeded page content "${page}".`);
      continue;
    }

    // Only top-level keys are considered. Going deeper would mean guessing
    // whether a shorter stored array is an edit or an omission, and an edit
    // must win.
    const stored = existing.data || {};
    const added = Object.keys(data).filter((key) => stored[key] === undefined);

    if (added.length === 0) {
      console.log(`Page content "${page}" already complete - skipping.`);
      continue;
    }

    const merged = { ...stored };
    for (const key of added) merged[key] = data[key];

    // Mixed paths need an explicit mark, or Mongoose will not persist the change.
    existing.data = merged;
    existing.markModified('data');
    if (admin) existing.updatedBy = admin._id;
    await existing.save();

    console.log(`Page content "${page}" - added missing key(s): ${added.join(', ')}.`);
  }
}
