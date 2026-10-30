import mongoose from 'mongoose';

const jobApplicationSchema = new mongoose.Schema(
  {
    // The vacancy applied for. jobTitle/jobSlug are snapshots taken at submit
    // time so an application still reads correctly if the posting is later
    // edited or deleted.
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'JobPosting', default: null, index: true },
    jobTitle: { type: String, default: '' },
    jobSlug: { type: String, default: '' },

    // Candidate
    // Capped in the schema too - this model is written from a public endpoint.
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 120 },
    fatherName: { type: String, default: '', trim: true, maxlength: 120 },
    email: { type: String, required: [true, 'Email is required'], lowercase: true, trim: true, maxlength: 200 },
    // 'phone' is the candidate's own mobile - kept under this name because
    // records already exist under it.
    phone: { type: String, default: '', trim: true, maxlength: 40 },
    parentMobile: { type: String, default: '', trim: true, maxlength: 40 },
    address: { type: String, default: '', maxlength: 1000 },
    qualification: { type: String, default: '', maxlength: 500 },
    experience: { type: String, default: '', maxlength: 2000 },

    // The candidate confirmed their details are true. Stored rather than merely
    // enforced in the form, so there is a record of the agreement.
    declaration: { type: Boolean, default: false },

    // Uploaded resume. resumeUrl is set when remote storage is configured;
    // otherwise resumePath holds the filename on this server, reachable only
    // through the permission-gated download route.
    resumeUrl: { type: String, default: '' },
    resumePath: { type: String, default: '' },
    // Set instead of resumePath when the file lives in the database,
    // which is how deployments without a persistent disk store it.
    resumeFileId: { type: mongoose.Schema.Types.ObjectId, ref: 'ResumeFile', default: null },
    resumeMime: { type: String, default: '' },
    resumeName: { type: String, default: '', maxlength: 255 },
    // Legacy: the form no longer collects a link, but records created while it
    // did keep theirs so nothing already submitted is lost.
    resumeLink: { type: String, default: '' },

    // Pipeline stage. 'shortlisted' is retained only so records created before
    // the stages changed can still be saved; it is not offered in the admin.
    status: {
      type: String,
      enum: ['new', 'reviewed', 'scheduled', 'rejected', 'shortlisted'],
      default: 'new',
    },
    // Tri-state on purpose: before the interview the answer is neither yes nor
    // no, and "not recorded" must not read as "did not attend".
    interviewAttended: { type: String, enum: ['', 'yes', 'no'], default: '' },
    // Free-text remarks on where the candidate stands.
    notes: { type: String, default: '', maxlength: 5000 },
  },
  // createdAt is the application date - stored automatically, nothing for the
  // candidate or an admin to fill in.
  { timestamps: true }
);

export default mongoose.model('JobApplication', jobApplicationSchema);
