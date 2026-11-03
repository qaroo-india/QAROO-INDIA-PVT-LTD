import BusinessSolution from '../models/BusinessSolution.js';
import { pageOf } from '../utils/pagination.js';
import { hasPermission } from '../utils/permissions.js';
import { uploadImage } from '../services/imageService.js';
import { slugify } from '../utils/slug.js';
import { escapeRegex } from '../utils/escapeRegex.js';

const cleanArr = (v) => (Array.isArray(v) ? v.filter((x) => x && String(x).trim() !== '') : v || []);
const cleanObjArr = (v, otherKeys = []) =>
  Array.isArray(v)
    ? v
        .filter((x) => x && typeof x === 'object')
        .map((x) => {
          const obj = { ...x };
          for (const k of otherKeys) {
            if (Array.isArray(obj[k])) obj[k] = obj[k].filter((y) => String(y).trim() !== '');
          }
          return obj;
        })
        .filter((x) => String(x.title || x.q || '').trim() !== '')
    : v || [];

const normalizeSolution = (b) => ({
  title: b.title || b.pageName || '',
  pageName: b.pageName || b.title || '',
  slug: (b.slug || slugify(b.title || b.pageName)).toLowerCase().replace(/[^a-z0-9-]/g, ''),
  shortDescription: b.shortDescription || '',
  fullDescription: b.fullDescription || '',
  image: b.image || '',
  status: b.status === 'published' ? 'published' : 'draft',
  displayOrder: Number.isFinite(Number(b.displayOrder)) ? Number(b.displayOrder) : 0,

  services: cleanArr(b.services),
  features: cleanArr(b.features),
  benefits: cleanArr(b.benefits),
  useCases: cleanArr(b.useCases),
  audience: cleanArr(b.audience),
  problems: cleanArr(b.problems),
  solutions: cleanArr(b.solutions),
  techniques: cleanArr(b.techniques),
  process: cleanObjArr(b.process, ['items']),
  industries: cleanArr(b.industries),
  whyChoose: cleanArr(b.whyChoose),
  faq: cleanObjArr(b.faq),
  cta: b.cta || '',

  keyword: b.keyword || '',
  seoTitle: b.seoTitle || '',
  seoDescription: b.seoDescription || '',
  seoKeywords: cleanArr(b.seoKeywords),
  ogTitle: b.ogTitle || '',
  ogDescription: b.ogDescription || '',
  ogImage: b.ogImage || b.image || '',
  canonicalUrl: b.canonicalUrl || '',
});

async function ensureUniqueSlug(slug, excludeId) {
  let candidate = slug || '';
  let n = 1;
  while (true) {
    const query = { slug: candidate };
    if (excludeId) query._id = { $ne: excludeId };
    const dup = await BusinessSolution.findOne(query).select('_id');
    if (!dup) return candidate;
    n += 1;
    candidate = `${slug}-${n}`;
  }
}

const listSolutions = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const query = {};
    const seeDrafts = hasPermission(req.admin, 'business.read');
    if (!seeDrafts) query.status = 'published';
    if (status && status !== 'all' && seeDrafts) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: escapeRegex(search), $options: 'i' } },
        { pageName: { $regex: escapeRegex(search), $options: 'i' } },
      ];
    }
    // Bounded, with the matching total alongside, so a caller can always tell
    // whether it is looking at the whole set. See utils/pagination.js.
    const { limit, skip } = pageOf(req);
    const total = await BusinessSolution.countDocuments(query);
    const solutions = await BusinessSolution.find(query)
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .sort({ displayOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit);
    res.json({ success: true, count: solutions.length, total, data: { solutions } });
  } catch (err) {
    next(err);
  }
};

const getSolutionBySlug = async (req, res, next) => {
  try {
    const slug = req.params.slug?.toLowerCase();
    const solution = await BusinessSolution.findOne({ slug, status: 'published' });
    if (!solution) return res.status(404).json({ success: false, message: 'Solution not found' });
    res.json({ success: true, data: { solution } });
  } catch (err) {
    next(err);
  }
};

const getSolution = async (req, res, next) => {
  try {
    const solution = await BusinessSolution.findById(req.params.id);
    if (!solution) return res.status(404).json({ success: false, message: 'Solution not found' });
    // optionalAuth route: without this an unauthenticated caller holding an id
    // could read an unpublished solution.
    if (!hasPermission(req.admin, 'business.read') && solution.status !== 'published') {
      return res.status(404).json({ success: false, message: 'Solution not found' });
    }
    res.json({ success: true, data: { solution } });
  } catch (err) {
    next(err);
  }
};

const createSolution = async (req, res, next) => {
  try {
    const body = req.body || {};
    if (!body.title && !body.pageName) {
      return res.status(400).json({ success: false, message: 'Solution title is required' });
    }
    const image = await uploadImage(body.image, 'qaroo/business');
    const normalized = normalizeSolution({ ...body, image });
    normalized.slug = await ensureUniqueSlug(normalized.slug);
    const solution = await BusinessSolution.create({
      ...normalized,
      createdBy: req.admin._id,
      updatedBy: req.admin._id,
    });
    res.status(201).json({ success: true, message: 'Business solution created', data: { solution } });
  } catch (err) {
    next(err);
  }
};

const updateSolution = async (req, res, next) => {
  try {
    const solution = await BusinessSolution.findById(req.params.id);
    if (!solution) return res.status(404).json({ success: false, message: 'Solution not found' });
    const body = req.body || {};
    const image = await uploadImage(body.image, 'qaroo/business');
    const normalized = normalizeSolution({ ...body, image });
    normalized.slug = await ensureUniqueSlug(normalized.slug, solution._id);
    solution.set(normalized);
    solution.updatedBy = req.admin._id;
    await solution.save();
    res.json({ success: true, message: 'Business solution updated', data: { solution } });
  } catch (err) {
    next(err);
  }
};

const deleteSolution = async (req, res, next) => {
  try {
    const solution = await BusinessSolution.findById(req.params.id);
    if (!solution) return res.status(404).json({ success: false, message: 'Solution not found' });
    await solution.deleteOne();
    res.json({ success: true, message: 'Business solution deleted' });
  } catch (err) {
    next(err);
  }
};

const togglePublish = async (req, res, next) => {
  try {
    const solution = await BusinessSolution.findById(req.params.id);
    if (!solution) return res.status(404).json({ success: false, message: 'Solution not found' });
    solution.status = solution.status === 'published' ? 'draft' : 'published';
    solution.updatedBy = req.admin._id;
    await solution.save();
    res.json({ success: true, message: solution.status === 'published' ? 'Solution published' : 'Solution unpublished', data: { solution } });
  } catch (err) {
    next(err);
  }
};

export { listSolutions, getSolutionBySlug, getSolution, createSolution, updateSolution, deleteSolution, togglePublish };
