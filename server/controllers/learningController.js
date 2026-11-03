import LearningProgram from '../models/LearningProgram.js';
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

const normalizeProgram = (b) => ({
  title: b.title || '',
  slug: (b.slug || slugify(b.title)).toLowerCase().replace(/[^a-z0-9-]/g, ''),
  desc: b.desc || '',
  shortDescription: b.shortDescription || b.desc || '',
  fullDescription: b.fullDescription || '',
  skills: cleanArr(b.skills),
  category: b.category || '',
  image: b.image || '',
  status: b.status === 'published' ? 'published' : 'draft',
  displayOrder: Number.isFinite(Number(b.displayOrder)) ? Number(b.displayOrder) : 0,

  highlights: cleanArr(b.highlights),
  learn: cleanArr(b.learn),
  tools: cleanArr(b.tools),
  modules: cleanObjArr(b.modules, ['items']),
  careers: cleanArr(b.careers),
  audience: cleanArr(b.audience),
  benefits: cleanArr(b.benefits),
  certification: b.certification || '',
  placement: b.placement || '',
  modes: cleanArr(b.modes),
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

// Ensures the slug is unique against other programs (excluding a given id).
async function ensureUniqueSlug(slug, excludeId) {
  let candidate = slug || '';
  let n = 1;
  while (true) {
    const query = { slug: candidate };
    if (excludeId) query._id = { $ne: excludeId };
    const dup = await LearningProgram.findOne(query).select('_id');
    if (!dup) return candidate;
    n += 1;
    candidate = `${slug}-${n}`;
  }
}

const listPrograms = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const query = {};
    const seeDrafts = hasPermission(req.admin, 'learning.read');
    if (!seeDrafts) query.status = 'published';
    if (status && status !== 'all' && seeDrafts) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: escapeRegex(search), $options: 'i' } },
        { desc: { $regex: escapeRegex(search), $options: 'i' } },
        { category: { $regex: escapeRegex(search), $options: 'i' } },
      ];
    }
    // Bounded, with the matching total alongside, so a caller can always tell
    // whether it is looking at the whole set. See utils/pagination.js.
    const { limit, skip } = pageOf(req);
    const total = await LearningProgram.countDocuments(query);
    const programs = await LearningProgram.find(query)
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .sort({ displayOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit);
    res.json({ success: true, count: programs.length, total, data: { programs } });
  } catch (err) {
    next(err);
  }
};

const getProgramBySlug = async (req, res, next) => {
  try {
    const slug = req.params.slug?.toLowerCase();
    const query = { slug, status: 'published' };
    const program = await LearningProgram.findOne(query);
    if (!program) return res.status(404).json({ success: false, message: 'Program not found' });
    res.json({ success: true, data: { program } });
  } catch (err) {
    next(err);
  }
};

const getProgram = async (req, res, next) => {
  try {
    const program = await LearningProgram.findById(req.params.id);
    if (!program) return res.status(404).json({ success: false, message: 'Program not found' });
    // This route is optionalAuth so the admin can load a draft to edit. Without
    // this check an unauthenticated caller holding an id could read one too.
    if (!hasPermission(req.admin, 'learning.read') && program.status !== 'published') {
      return res.status(404).json({ success: false, message: 'Program not found' });
    }
    res.json({ success: true, data: { program } });
  } catch (err) {
    next(err);
  }
};

const createProgram = async (req, res, next) => {
  try {
    const body = req.body || {};
    if (!body.title) {
      return res.status(400).json({ success: false, message: 'Program title is required' });
    }
    const image = await uploadImage(body.image, 'qaroo/learning');
    const normalized = normalizeProgram({ ...body, image });
    normalized.slug = await ensureUniqueSlug(normalized.slug);
    const program = await LearningProgram.create({
      ...normalized,
      createdBy: req.admin._id,
      updatedBy: req.admin._id,
    });
    res.status(201).json({ success: true, message: 'Learning program created', data: { program } });
  } catch (err) {
    next(err);
  }
};

const updateProgram = async (req, res, next) => {
  try {
    const program = await LearningProgram.findById(req.params.id);
    if (!program) return res.status(404).json({ success: false, message: 'Program not found' });
    const body = req.body || {};
    const image = await uploadImage(body.image, 'qaroo/learning');
    const normalized = normalizeProgram({ ...body, image });
    normalized.slug = await ensureUniqueSlug(normalized.slug, program._id);
    program.set(normalized);
    program.updatedBy = req.admin._id;
    await program.save();
    res.json({ success: true, message: 'Learning program updated', data: { program } });
  } catch (err) {
    next(err);
  }
};

const deleteProgram = async (req, res, next) => {
  try {
    const program = await LearningProgram.findById(req.params.id);
    if (!program) return res.status(404).json({ success: false, message: 'Program not found' });
    await program.deleteOne();
    res.json({ success: true, message: 'Learning program deleted' });
  } catch (err) {
    next(err);
  }
};

const togglePublish = async (req, res, next) => {
  try {
    const program = await LearningProgram.findById(req.params.id);
    if (!program) return res.status(404).json({ success: false, message: 'Program not found' });
    program.status = program.status === 'published' ? 'draft' : 'published';
    program.updatedBy = req.admin._id;
    await program.save();
    res.json({ success: true, message: program.status === 'published' ? 'Program published' : 'Program unpublished', data: { program } });
  } catch (err) {
    next(err);
  }
};

export { listPrograms, getProgramBySlug, getProgram, createProgram, updateProgram, deleteProgram, togglePublish };
