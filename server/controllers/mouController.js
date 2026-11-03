import MOU from '../models/MOU.js';
import { pageOf } from '../utils/pagination.js';
import { hasPermission } from '../utils/permissions.js';
import { uploadImage } from '../services/imageService.js';
import { MOU_CATEGORIES } from '../data/categories.js';
import { escapeRegex } from '../utils/escapeRegex.js';

const normalizeTag = (tag) => {
  if (typeof tag !== 'string') return '';
  return tag.trim().replace(/\s+/g, ' ');
};

const listMOUCategories = async (_req, res, next) => {
  try {
    const distinct = await MOU.distinct('tag');
    const categories = Array.from(
      new Set([...MOU_CATEGORIES, ...distinct.filter((t) => t && String(t).trim() !== '')])
    );
    res.json({ success: true, data: { categories } });
  } catch (err) {
    next(err);
  }
};

const listMOUs = async (req, res, next) => {
  try {
    const { status, search, tag } = req.query;
    const query = {};

    // Drafts are part of the editing workflow, so they follow the same read
    // permission the admin UI uses to decide whether to show this section.
    const seeDrafts = hasPermission(req.admin, 'mou.read');
    if (seeDrafts) query.status = status && status !== 'all' ? status : { $in: ['published', 'draft'] };
    else query.status = 'published';

    if (status && status !== 'all' && seeDrafts) query.status = status;

    if (tag && tag !== 'All') query.tag = tag;

    if (search) {
      query.$or = [
        { name: { $regex: escapeRegex(search), $options: 'i' } },
        { blurb: { $regex: escapeRegex(search), $options: 'i' } },
        { tag: { $regex: escapeRegex(search), $options: 'i' } },
      ];
    }

    // Bounded, with the matching total alongside, so a caller can always tell
    // whether it is looking at the whole set. See utils/pagination.js.
    const { limit, skip } = pageOf(req);
    const total = await MOU.countDocuments(query);
    const mous = await MOU.find(query)
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .sort('-updatedAt')
      .skip(skip)
      .limit(limit);

    res.json({ success: true, count: mous.length, total, data: { mous } });
  } catch (err) {
    next(err);
  }
};

const getMOU = async (req, res, next) => {
  try {
    const mou = await MOU.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');
    if (!mou) return res.status(404).json({ success: false, message: 'MOU not found' });
    if (!hasPermission(req.admin, 'mou.read') && mou.status !== 'published') {
      return res.status(404).json({ success: false, message: 'MOU not found' });
    }
    res.json({ success: true, data: { mou } });
  } catch (err) {
    next(err);
  }
};

const normalizeSections = (sections) => {
  if (!Array.isArray(sections)) return [];
  return sections.map((s) => ({
    heading: s.heading || '',
    paragraphs: Array.isArray(s.paragraphs) ? s.paragraphs.filter(Boolean) : [],
    list: Array.isArray(s.list) ? s.list.filter(Boolean) : [],
    pathway: Array.isArray(s.pathway) ? s.pathway.filter(Boolean) : [],
    note: s.note || '',
  }));
};

const createMOU = async (req, res, next) => {
  try {
    const { tag, name, blurb, logo, images, sections, status } = req.body || {};
    const normalizedTag = normalizeTag(tag);
    if (!name) {
      return res.status(400).json({ success: false, message: 'MOU name is required' });
    }
    if (!normalizedTag) {
      return res.status(400).json({ success: false, message: 'MOU category is required' });
    }

    const normalized = normalizeSections(sections);

    const rawImages = Array.isArray(images) ? images.filter(Boolean) : [];
    const normalizedImages = [];
    for (const img of rawImages) {
      normalizedImages.push(await uploadImage(img, 'qaroo/mou'));
    }

    const mou = await MOU.create({
      tag: normalizedTag,
      name,
      blurb: blurb || '',
      logo: logo ? await uploadImage(logo, 'qaroo/mou') : '',
      images: normalizedImages,
      sections: normalized,
      status: status === 'published' ? 'published' : 'draft',
      createdBy: req.admin._id,
      updatedBy: req.admin._id,
    });

    res.status(201).json({ success: true, message: 'MOU created successfully', data: { mou } });
  } catch (err) {
    next(err);
  }
};

const updateMOU = async (req, res, next) => {
  try {
    const mou = await MOU.findById(req.params.id);
    if (!mou) return res.status(404).json({ success: false, message: 'MOU not found' });

    const { tag, name, blurb, logo, images, sections, status } = req.body || {};

    if (tag !== undefined && tag !== null && String(tag).trim() !== '') {
      mou.tag = normalizeTag(tag);
    }
    if (name !== undefined) mou.name = name;
    if (blurb !== undefined) mou.blurb = blurb;
    if (logo !== undefined) mou.logo = logo ? await uploadImage(logo, 'qaroo/mou') : '';
    if (images !== undefined) {
      const raw = Array.isArray(images) ? images.filter(Boolean) : [];
      const uploaded = [];
      for (const img of raw) uploaded.push(await uploadImage(img, 'qaroo/mou'));
      mou.images = uploaded;
    }
    if (sections !== undefined) mou.sections = normalizeSections(sections);
    if (status !== undefined) mou.status = status === 'published' ? 'published' : 'draft';
    mou.updatedBy = req.admin._id;

    await mou.save();
    res.json({ success: true, message: 'MOU updated successfully', data: { mou } });
  } catch (err) {
    next(err);
  }
};

const deleteMOU = async (req, res, next) => {
  try {
    const mou = await MOU.findById(req.params.id);
    if (!mou) return res.status(404).json({ success: false, message: 'MOU not found' });
    await mou.deleteOne();
    res.json({ success: true, message: 'MOU deleted successfully' });
  } catch (err) {
    next(err);
  }
};

const togglePublish = async (req, res, next) => {
  try {
    const mou = await MOU.findById(req.params.id);
    if (!mou) return res.status(404).json({ success: false, message: 'MOU not found' });
    mou.status = mou.status === 'published' ? 'draft' : 'published';
    mou.updatedBy = req.admin._id;
    await mou.save();
    res.json({
      success: true,
      message: mou.status === 'published' ? 'MOU published' : 'MOU unpublished',
      data: { mou },
    });
  } catch (err) {
    next(err);
  }
};

export { listMOUs, getMOU, createMOU, updateMOU, deleteMOU, togglePublish, listMOUCategories };
