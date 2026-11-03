import LearningProgram from '../models/LearningProgram.js';
import { PROGRAMS } from '../../src/data/programs.js';
import { brochureFor } from './assets.js';
import { SITE_URL } from '../config/site.js';

// Seeds/updates learning programs from the existing rich content source so the
// data-driven frontend has full course + SEO data. Uses slug-based upsert so it
// is safe to re-run and never deletes existing records.
export async function seedLearning(admin) {
  const docs = PROGRAMS.map((p, i) => ({
    title: p.pageName,
    pageName: p.pageName,
    slug: p.slug,
    desc: p.shortDescription,
    shortDescription: p.shortDescription,
    fullDescription: p.fullDescription,
    skills: p.learn || [],
    category: 'Career Track',
    image: '',
    // Only set when the file is really in public/, so a record never points
    // at a brochure that 404s.
    brochure: brochureFor('learning', p.slug),
    status: 'published',
    displayOrder: i + 1,

    highlights: p.highlights || [],
    learn: p.learn || [],
    tools: p.tools || [],
    modules: p.modules || [],
    careers: p.careers || [],
    audience: p.audience || [],
    benefits: p.benefits || [],
    certification: p.certification || '',
    placement: p.placement || '',
    modes: p.modes || [],
    faq: p.faq || [],
    cta: p.cta || '',

    keyword: p.keyword || '',
    seoTitle: p.metaTitle || '',
    seoDescription: p.metaDescription || '',
    seoKeywords: p.keyword ? [p.keyword] : [],
    ogTitle: p.metaTitle || '',
    ogDescription: p.metaDescription || '',
    ogImage: '',
    canonicalUrl: `${SITE_URL}/learning-programs/${p.slug}`,

    createdBy: admin ? admin._id : null,
    updatedBy: admin ? admin._id : null,
  }));

  for (const doc of docs) {
    const existing = await LearningProgram.findOne({ slug: doc.slug });
    if (existing) {
      await LearningProgram.updateOne({ _id: existing._id }, { $set: { ...doc, updatedBy: admin ? admin._id : existing.updatedBy } });
      console.log(`Updated learning program "${doc.title}"`);
    } else {
      await LearningProgram.create(doc);
      console.log(`Seeded learning program "${doc.title}"`);
    }
  }
  console.log(`Learning programs sync complete (${docs.length} total).`);
}
