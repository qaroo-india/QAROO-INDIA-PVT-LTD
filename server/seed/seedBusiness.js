import BusinessSolution from '../models/BusinessSolution.js';
import { BUSINESS_SOLUTIONS } from '../../src/data/businessSolutions.js';
import { brochureFor } from './assets.js';
import { SITE_URL } from '../config/site.js';

// Seeds/updates business solutions from the existing rich content source so the
// data-driven frontend has full solution + SEO data. Slug-based upsert is safe
// to re-run and never deletes existing records.
export async function seedBusiness(admin) {
  const docs = BUSINESS_SOLUTIONS.map((s, i) => ({
    title: s.pageName,
    pageName: s.pageName,
    slug: s.slug,
    shortDescription: s.shortDescription,
    fullDescription: s.fullDescription,
    image: '',
    brochure: brochureFor('business', s.slug),
    status: 'published',
    displayOrder: i + 1,

    services: s.services || [],
    features: s.features || [],
    benefits: s.benefits || [],
    useCases: s.useCases || [],
    audience: s.audience || [],
    problems: s.problems || [],
    solutions: s.solutions || [],
    techniques: s.techniques || [],
    process: s.process || [],
    industries: s.industries || [],
    whyChoose: s.whyChoose || [],
    faq: s.faq || [],
    cta: s.cta || '',

    keyword: s.keyword || '',
    seoTitle: s.metaTitle || '',
    seoDescription: s.metaDescription || '',
    seoKeywords: s.keyword ? [s.keyword] : [],
    ogTitle: s.metaTitle || '',
    ogDescription: s.metaDescription || '',
    ogImage: '',
    canonicalUrl: `${SITE_URL}/business-solutions/${s.slug}`,

    createdBy: admin ? admin._id : null,
    updatedBy: admin ? admin._id : null,
  }));

  for (const doc of docs) {
    const existing = await BusinessSolution.findOne({ slug: doc.slug });
    if (existing) {
      await BusinessSolution.updateOne({ _id: existing._id }, { $set: { ...doc, updatedBy: admin ? admin._id : existing.updatedBy } });
      console.log(`Updated business solution "${doc.title}"`);
    } else {
      await BusinessSolution.create(doc);
      console.log(`Seeded business solution "${doc.title}"`);
    }
  }
  console.log(`Business solutions sync complete (${docs.length} total).`);
}
