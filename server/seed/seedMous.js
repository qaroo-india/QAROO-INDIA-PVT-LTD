import MOU from '../models/MOU.js';
import { MOUS } from '../data/seedData.js';
import { mouLogoFor } from './assets.js';

export async function seedMous(admin) {
  const existing = await MOU.countDocuments();
  if (existing > 0) {
    // The records are already there, but the logo files in public/logos were
    // never wired to them. Fill in the blanks without touching a logo an admin
    // has already chosen.
    let filled = 0;
    for (const doc of await MOU.find({ $or: [{ logo: '' }, { logo: { $exists: false } }, { logo: null }] })) {
      const logo = mouLogoFor(doc.name);
      if (!logo) continue;
      doc.logo = logo;
      await doc.save();
      filled += 1;
    }
    console.log(
      `${existing} MOUs already exist - skipped inserting` +
      (filled ? `, filled in ${filled} missing logo(s).` : ', no missing logos to fill.')
    );
    return;
  }

  const docs = MOUS.map((m) => ({
    ...m,
    status: 'published',
    logo: m.logo || mouLogoFor(m.name),
    images: m.images || [],
    sections: m.sections || [],
    createdBy: admin ? admin._id : null,
    updatedBy: admin ? admin._id : null,
  }));

  await MOU.insertMany(docs);
  console.log(`Seeded ${docs.length} MOUs.`);
}
