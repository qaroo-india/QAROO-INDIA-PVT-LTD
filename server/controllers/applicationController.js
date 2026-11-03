import JobApplication from '../models/JobApplication.js';
import { pageOf } from '../utils/pagination.js';
import JobPosting from '../models/JobPosting.js';
import {
  storeResume,
  resumeFilePath,
  deleteResume,
  deleteResumeFile,
  readResumeFile,
  MAX_RESUME_BYTES,
} from '../services/resumeStorage.js';
import { escapeRegex } from '../utils/escapeRegex.js';

const ALLOWED_RESUME = /^data:application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document);base64,/i;

/**
 * Public submission. The vacancy is resolved server-side from its slug so a
 * candidate cannot attach an application to a draft or non-existent role, and
 * the title is snapshotted onto the record.
 */
const submitApplication = async (req, res, next) => {
  try {
    const {
      jobSlug,
      name,
      fatherName,
      email,
      phone,
      parentMobile,
      address,
      qualification,
      experience,
      declaration,
      resumeFile,
      resumeName,
    } = req.body || {};

    if (!name || !email || !phone) {
      return res
        .status(400)
        .json({ success: false, message: 'Name, email and mobile number are required' });
    }
    // Checked server-side as well as in the form: the declaration is the record
    // of the candidate's agreement, so it cannot rely on a client-side tick.
    if (declaration !== true) {
      return res
        .status(400)
        .json({ success: false, message: 'Please accept the declaration before submitting' });
    }

    const job = jobSlug
      ? await JobPosting.findOne({ slug: String(jobSlug).toLowerCase(), status: 'published' })
      : null;
    if (jobSlug && !job) {
      return res.status(404).json({ success: false, message: 'That role is no longer open' });
    }

    // Resume: an uploaded file, or nothing.
    let stored = { url: '', path: '', mime: '' };
    if (resumeFile) {
      if (!ALLOWED_RESUME.test(resumeFile)) {
        return res
          .status(400)
          .json({ success: false, message: 'Resume must be a PDF or Word document' });
      }
      // base64 inflates by ~4/3; check the decoded size.
      const base64 = resumeFile.slice(resumeFile.indexOf(',') + 1);
      if (Math.floor((base64.length * 3) / 4) > MAX_RESUME_BYTES) {
        return res.status(400).json({
          success: false,
          message: `Resume must be under ${Math.round(MAX_RESUME_BYTES / (1024 * 1024))}MB`,
        });
      }
      try {
        stored = await storeResume(resumeFile);
      } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
    }

    // Bounded before storage: this endpoint is public and the JSON body limit is
    // 15MB, so the text fields are capped the same way the resume is.
    const application = await JobApplication.create({
      job: job?._id || null,
      jobTitle: job?.title || '',
      jobSlug: job?.slug || '',
      name: String(name).slice(0, 120),
      fatherName: String(fatherName || '').slice(0, 120),
      email: String(email).slice(0, 200),
      phone: String(phone).slice(0, 40),
      parentMobile: String(parentMobile || '').slice(0, 40),
      address: String(address || '').slice(0, 1000),
      qualification: String(qualification || '').slice(0, 500),
      experience: String(experience || '').slice(0, 2000),
      declaration: true,
      resumeUrl: stored.url,
      resumePath: stored.path,
      resumeFileId: stored.fileId || null,
      resumeMime: stored.mime,
      resumeName: String(resumeName || '').slice(0, 255),
    });

    res.status(201).json({
      success: true,
      message: 'Application received. Our team will review it and get back to you.',
      data: { application: { _id: application._id } },
    });
  } catch (err) {
    next(err);
  }
};

const listApplications = async (req, res, next) => {
  try {
    const { status, search, job, role, from, to } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (job) query.jobSlug = job;
    if (role && role !== 'all') {
      query.jobTitle = { $regex: `^${escapeRegex(role)}$`, $options: 'i' };
    }
    const fromDate = from && !Number.isNaN(Date.parse(from)) ? new Date(`${from}T00:00:00.000Z`) : null;
    const toDate = to && !Number.isNaN(Date.parse(to)) ? new Date(`${to}T23:59:59.999Z`) : null;
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = fromDate;
      if (toDate) query.createdAt.$lte = toDate;
    }
    if (search) {
      query.$or = [
        { name: { $regex: escapeRegex(search), $options: 'i' } },
        { email: { $regex: escapeRegex(search), $options: 'i' } },
        { jobTitle: { $regex: escapeRegex(search), $options: 'i' } },
      ];
    }
    const { limit, skip } = pageOf(req);
    const total = await JobApplication.countDocuments(query);
    const applications = await JobApplication.find(query).sort('-createdAt').skip(skip).limit(limit);
    const roles = await JobApplication.distinct('jobTitle');
    res.json({ success: true, count: applications.length, total, data: { applications, roles } });
  } catch (err) {
    next(err);
  }
};

const getApplication = async (req, res, next) => {
  try {
    const application = await JobApplication.findById(req.params.id);
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
    res.json({ success: true, data: { application } });
  } catch (err) {
    next(err);
  }
};

const STAGES = ['new', 'reviewed', 'scheduled', 'rejected'];
const ATTENDANCE = ['', 'yes', 'no'];

const setStatus = async (req, res, next) => {
  try {
    const { status, notes, interviewAttended } = req.body || {};

    if (status && !STAGES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Unknown application status' });
    }
    if (interviewAttended !== undefined && !ATTENDANCE.includes(interviewAttended)) {
      return res.status(400).json({ success: false, message: 'Unknown interview attendance value' });
    }

    const application = await JobApplication.findById(req.params.id);
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

    if (status) application.status = status;
    if (interviewAttended !== undefined) application.interviewAttended = interviewAttended;
    if (typeof notes === 'string') application.notes = notes;

    await application.save();
    res.json({ success: true, message: 'Application updated', data: { application } });
  } catch (err) {
    next(err);
  }
};

const deleteApplication = async (req, res, next) => {
  try {
    const application = await JobApplication.findById(req.params.id);
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
    // Remove the stored file as well, so deleting an application does not leave
    // the candidate's resume behind on disk.
    if (application.resumePath) await deleteResume(application.resumePath);
    if (application.resumeFileId) await deleteResumeFile(application.resumeFileId);
    await application.deleteOne();
    res.json({ success: true, message: 'Application deleted' });
  } catch (err) {
    next(err);
  }
};

/**
 * Streams a resume to an authorised admin. Local files are never served
 * statically - they are only reachable here, behind applications.read.
 *
 * `?inline=1` serves it for viewing in the browser; without it the file is sent
 * as an attachment. The preview modal needs inline, because a download
 * disposition cannot render inside an iframe.
 */
const downloadResume = async (req, res, next) => {
  try {
    const application = await JobApplication.findById(req.params.id);
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

    if (application.resumeUrl) return res.redirect(application.resumeUrl);

    // Stored in the database when the host has no persistent disk. Sent from
    // memory rather than streamed: the cap is 3MB, so buffering is cheaper than
    // the ceremony of a GridFS stream.
    if (application.resumeFileId) {
      const stored = await readResumeFile(application.resumeFileId);
      if (!stored) return res.status(404).json({ success: false, message: 'No resume on file' });
      // Sanitised because it goes into a response header.
      const name = `${application.name.replace(/[^\w.-]+/g, '_')}-resume.${stored.ext || 'pdf'}`;
      res.type(stored.mime || application.resumeMime || 'application/octet-stream');
      res.setHeader(
        'Content-Disposition',
        `${req.query.inline === '1' ? 'inline' : 'attachment'}; filename="${name}"`
      );
      return res.send(stored.data);
    }

    const file = resumeFilePath(application.resumePath);
    if (!file) return res.status(404).json({ success: false, message: 'No resume on file' });

    const ext = application.resumePath.split('.').pop();
    // Sanitised because it goes into a response header.
    const safeName = `${application.name.replace(/[^\w.-]+/g, '_')}-resume.${ext}`;
    if (application.resumeMime) res.type(application.resumeMime);

    if (req.query.inline === '1') {
      res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
      return res.sendFile(file);
    }
    return res.download(file, safeName);
  } catch (err) {
    return next(err);
  }
};

export {
  submitApplication,
  listApplications,
  getApplication,
  setStatus,
  deleteApplication,
  downloadResume,
};
