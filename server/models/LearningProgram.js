import { FirestoreModel } from '../db/FirestoreModel.js';
import { PROGRAMS } from '../../src/data/programs.js';
import { brochureFor } from '../seed/assets.js';
import { SITE_URL } from '../config/site.js';

const initialPrograms = (PROGRAMS || []).map((p, i) => ({
  id: `prog-${p.slug}`,
  _id: `prog-${p.slug}`,
  title: p.pageName,
  pageName: p.pageName,
  slug: p.slug,
  desc: p.shortDescription,
  shortDescription: p.shortDescription,
  fullDescription: p.fullDescription,
  skills: p.learn || [],
  category: 'Career Track',
  image: '',
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

  createdAt: new Date(),
  updatedAt: new Date(),
}));

const LearningProgram = new FirestoreModel('learning_programs', {}, initialPrograms);
export default LearningProgram;
