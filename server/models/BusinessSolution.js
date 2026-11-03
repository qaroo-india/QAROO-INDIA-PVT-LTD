import { FirestoreModel } from '../db/FirestoreModel.js';
import { BUSINESS_SOLUTIONS } from '../../src/data/businessSolutions.js';
import { brochureFor } from '../seed/assets.js';
import { SITE_URL } from '../config/site.js';

const initialSolutions = (BUSINESS_SOLUTIONS || []).map((s, i) => ({
  id: `biz-${s.slug}`,
  _id: `biz-${s.slug}`,
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

  createdAt: new Date(),
  updatedAt: new Date(),
}));

const BusinessSolution = new FirestoreModel('business_solutions', {}, initialSolutions);
export default BusinessSolution;
