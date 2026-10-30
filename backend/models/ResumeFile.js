import mongoose from 'mongoose';

/**
 * An uploaded resume, stored in the database.
 *
 * This exists for deployments with no persistent filesystem. On serverless the
 * disk is read-only and anything written to /tmp dies with the instance, so the
 * choice was previously Cloudinary or nothing - and "nothing" meant job
 * applications, the only data on this site that cannot be regenerated, were
 * silently lost.
 *
 * Binary blobs in MongoDB are not the general answer for file storage, but they
 * are the right trade here: resumes are capped at 3MB (well inside the 16MB
 * BSON document limit, so GridFS is unnecessary), arrive a handful at a time,
 * and are read rarely - only when an admin opens one. Cloudinary remains
 * preferred and is still tried first; this is the fallback that makes the
 * feature work at all without it.
 *
 * The document is deliberately separate from JobApplication so that listing
 * applications never drags megabytes of file data into memory.
 */
const resumeFileSchema = new mongoose.Schema(
  {
    data: { type: Buffer, required: true },
    mime: { type: String, required: true },
    size: { type: Number, required: true },
    // The extension, kept so a download can be named sensibly without
    // re-deriving it from the mime type.
    ext: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.models.ResumeFile || mongoose.model('ResumeFile', resumeFileSchema);
