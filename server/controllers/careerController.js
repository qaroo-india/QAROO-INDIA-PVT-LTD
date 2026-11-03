import JobPosting from '../models/JobPosting.js';
import { pageOf } from '../utils/pagination.js';
import { hasPermission } from '../utils/permissions.js';
import JobApplication from '../models/JobApplication.js';
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
        .filter((x) => String(x.title || '').trim() !== '')
    : v || [];

const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'TEMPORARY', 'INTERN', 'OTHER'];

const normalizeJob = (b) => ({
  title: b.title || b.pageName || '',
  pageName: b.pageName || b.title || '',
  slug: (b.slug || slugify(b.title || b.pageName)).toLowerCase().replace(/[^a-z0-9-]/g, ''),
  status: b.status === 'published' ? 'published' : 'draft',
  displayOrder: Number.isFinite(Number(b.displayOrder)) ? Number(b.displayOrder) : 0,

  jobType: b.jobType || '',
  experience: b.experience || '',
  department: b.department || '',
  location: b.location || '',
  employmentType: EMPLOYMENT_TYPES.includes(b.employmentType) ? b.employmentType : 'FULL_TIME',
  overview: b.overview || '',

  responsibilities: cleanArr(b.responsibilities),
  techStack: cleanObjArr(b.techStack, ['items']),
  requiredSkills: cleanArr(b.requiredSkills),
  preferredSkills: cleanArr(b.preferredSkills),
  qualifications: cleanArr(b.qualifications),
  trainingAreas: cleanArr(b.trainingAreas),
  idealCandidate: cleanArr(b.idealCandidate),
  benefits: cleanArr(b.benefits),
  knowledgeAreas: cleanArr(b.knowledgeAreas),
  note: b.note || '',

  keyword: b.keyword || '',
  seoTitle: b.seoTitle || '',
  seoDescription: b.seoDescription || '',
  seoKeywords: cleanArr(b.seoKeywords),
  ogTitle: b.ogTitle || '',
  ogDescription: b.ogDescription || '',
  ogImage: b.ogImage || '',
  canonicalUrl: b.canonicalUrl || '',
});

async function ensureUniqueSlug(slug, excludeId) {
  let candidate = slug || '';
  let n = 1;
  while (true) {
    const query = { slug: candidate };
    if (excludeId) query._id = { $ne: excludeId };
    const dup = await JobPosting.findOne(query).select('_id');
    if (!dup) return candidate;
    n += 1;
    candidate = `${slug}-${n}`;
  }
}

const listJobs = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const query = {};
    // Visitors only ever see published vacancies; admins can filter.
    const seeDrafts = hasPermission(req.admin, 'careers.read');
    if (!seeDrafts) query.status = 'published';
    if (status && status !== 'all' && seeDrafts) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: escapeRegex(search), $options: 'i' } },
        { department: { $regex: escapeRegex(search), $options: 'i' } },
      ];
    }
    const { limit, skip } = pageOf(req);
    const total = await JobPosting.countDocuments(query);
    const jobs = await JobPosting.find(query).sort('displayOrder createdAt').skip(skip).limit(limit);
    res.json({ success: true, count: jobs.length, total, data: { jobs } });
  } catch (err) {
    next(err);
  }
};

const getJobBySlug = async (req, res, next) => {
  try {
    const slug = String(req.params.slug || '').toLowerCase();
    const query = { slug };
    if (!hasPermission(req.admin, 'careers.read')) query.status = 'published';
    const job = await JobPosting.findOne(query);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, data: { job } });
  } catch (err) {
    next(err);
  }
};

const getJob = async (req, res, next) => {
  try {
    const job = await JobPosting.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, data: { job } });
  } catch (err) {
    next(err);
  }
};

const createJob = async (req, res, next) => {
  try {
    const payload = normalizeJob(req.body || {});
    if (!payload.title) {
      return res.status(400).json({ success: false, message: 'Job title is required' });
    }
    payload.slug = await ensureUniqueSlug(payload.slug || slugify(payload.title));
    payload.createdBy = req.admin?._id || null;
    payload.updatedBy = req.admin?._id || null;
    const job = await JobPosting.create(payload);
    res.status(201).json({ success: true, message: 'Job posting created', data: { job } });
  } catch (err) {
    next(err);
  }
};

const updateJob = async (req, res, next) => {
  try {
    const job = await JobPosting.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const payload = normalizeJob({ ...job.toObject(), ...req.body });
    payload.slug = await ensureUniqueSlug(payload.slug || slugify(payload.title), job._id);
    payload.updatedBy = req.admin?._id || null;

    Object.assign(job, payload);
    await job.save();
    res.json({ success: true, message: 'Job posting updated', data: { job } });
  } catch (err) {
    next(err);
  }
};

const deleteJob = async (req, res, next) => {
  try {
    const job = await JobPosting.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    await job.deleteOne();
    // Applications are deliberately kept: they hold the candidate's details and
    // a title/slug snapshot, so removing a vacancy must not erase people who
    // already applied to it.
    const orphaned = await JobApplication.countDocuments({ job: job._id });
    res.json({
      success: true,
      message: orphaned
        ? `Job posting deleted. ${orphaned} application(s) kept.`
        : 'Job posting deleted',
    });
  } catch (err) {
    next(err);
  }
};

const togglePublish = async (req, res, next) => {
  try {
    const job = await JobPosting.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    job.status = job.status === 'published' ? 'draft' : 'published';
    job.updatedBy = req.admin?._id || null;
    await job.save();
    res.json({
      success: true,
      message: job.status === 'published' ? 'Job published' : 'Job unpublished',
      data: { job },
    });
  } catch (err) {
    next(err);
  }
};

export { listJobs, getJobBySlug, getJob, createJob, updateJob, deleteJob, togglePublish };
