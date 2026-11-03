import CSRProject from '../models/CSRProject.js';
import { pageOf } from '../utils/pagination.js';
import { hasPermission } from '../utils/permissions.js';
import { uploadImage } from '../services/imageService.js';
import { CSR_CATEGORIES } from '../data/categories.js';
import { escapeRegex } from '../utils/escapeRegex.js';

const normalizeProject = (b) => ({
  year: b.year || '',
  tag: b.tag || '',
  title: b.title || '',
  desc: b.desc || '',
  partner: b.partner || '',
  location: b.location || '',
  beneficiaries: b.beneficiaries || '',
  image: b.image || '',
  status: b.status === 'published' ? 'published' : 'draft',
});

const listCSRCategories = async (_req, res, next) => {
  try {
    const distinct = await CSRProject.distinct('tag');
    const categories = Array.from(
      new Set([...CSR_CATEGORIES, ...distinct.filter((t) => t && String(t).trim() !== '')])
    );
    res.json({ success: true, data: { categories } });
  } catch (err) {
    next(err);
  }
};

const listCSR = async (req, res, next) => {
  try {
    const { year, status, search } = req.query;
    const query = {};
    const seeDrafts = hasPermission(req.admin, 'csr.read');
    if (!seeDrafts) query.status = 'published';
    if (year) query.year = year;
    if (status && status !== 'all' && seeDrafts) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: escapeRegex(search), $options: 'i' } },
        { partner: { $regex: escapeRegex(search), $options: 'i' } },
        { tag: { $regex: escapeRegex(search), $options: 'i' } },
      ];
    }
    // Bounded, with the matching total alongside, so a caller can always tell
    // whether it is looking at the whole set. See utils/pagination.js.
    const { limit, skip } = pageOf(req);
    const total = await CSRProject.countDocuments(query);
    const projects = await CSRProject.find(query)
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .sort('-year')
      .skip(skip)
      .limit(limit);
    res.json({ success: true, count: projects.length, total, data: { projects } });
  } catch (err) {
    next(err);
  }
};

const getCSR = async (req, res, next) => {
  try {
    const project = await CSRProject.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (!hasPermission(req.admin, 'csr.read') && project.status !== 'published') {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.json({ success: true, data: { project } });
  } catch (err) {
    next(err);
  }
};

const createCSR = async (req, res, next) => {
  try {
    const body = req.body || {};
    if (!body.title || !body.year) {
      return res.status(400).json({ success: false, message: 'Title and year are required' });
    }
    const image = await uploadImage(body.image, 'qaroo/csr');
    const project = await CSRProject.create({
      ...normalizeProject({ ...body, image }),
      createdBy: req.admin._id,
      updatedBy: req.admin._id,
    });
    res.status(201).json({ success: true, message: 'CSR project created', data: { project } });
  } catch (err) {
    next(err);
  }
};

const updateCSR = async (req, res, next) => {
  try {
    const project = await CSRProject.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    const body = req.body || {};
    const image = await uploadImage(body.image, 'qaroo/csr');
    Object.assign(project, normalizeProject({ ...body, image }));
    project.updatedBy = req.admin._id;
    await project.save();
    res.json({ success: true, message: 'CSR project updated', data: { project } });
  } catch (err) {
    next(err);
  }
};

const deleteCSR = async (req, res, next) => {
  try {
    const project = await CSRProject.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    await project.deleteOne();
    res.json({ success: true, message: 'CSR project deleted' });
  } catch (err) {
    next(err);
  }
};

const togglePublish = async (req, res, next) => {
  try {
    const project = await CSRProject.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    project.status = project.status === 'published' ? 'draft' : 'published';
    project.updatedBy = req.admin._id;
    await project.save();
    res.json({ success: true, message: project.status === 'published' ? 'Project published' : 'Project unpublished', data: { project } });
  } catch (err) {
    next(err);
  }
};

export { listCSR, getCSR, createCSR, updateCSR, deleteCSR, togglePublish, listCSRCategories };
