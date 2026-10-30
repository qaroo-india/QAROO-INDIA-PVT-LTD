import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { uploadDocument } from './imageService.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/** Where resumes land when no remote storage is configured. */
export const RESUME_DIR = path.resolve(dirname, '../uploads/resumes');

const MIME_EXT = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

export const RESUME_MIMES = Object.keys(MIME_EXT);

/**
 * Largest resume accepted, decoded. Comfortably above any real CV.
 * Owned here rather than in the controller so the route that accepts the upload
 * and the service that writes it cannot drift to two different limits.
 *
 * Lower on serverless: Vercel rejects a function request body over 4.5MB at the
 * platform edge, before any of this code runs, and base64 inflates a file by
 * 4/3. A 5MB file arrives as ~6.7MB of JSON and would be refused with an opaque
 * 413 that the applicant cannot act on. 3MB encodes to ~4MB, which fits with
 * room for the other form fields.
 */
const onServerless = Boolean(process.env.VERCEL);

/**
 * Whether to keep the file in MongoDB rather than on the local disk.
 *
 * Forced on serverless, where there is no persistent disk at all. Opt in
 * elsewhere with RESUME_STORE=mongo, which is also what you want behind more
 * than one instance: two containers do not share a filesystem, so a resume
 * written by one is a 404 from the other.
 */
const useDatabaseStore = () => onServerless || process.env.RESUME_STORE === 'mongo';
export const MAX_RESUME_BYTES = Number(process.env.MAX_RESUME_BYTES)
  || (onServerless ? 3 * 1024 * 1024 : 5 * 1024 * 1024);

/**
 * Stores a resume and returns where it went.
 *
 * Cloudinary is used when it is configured; otherwise the file is written to
 * the server's own disk. Local files are only reachable through the
 * permission-gated download route, which is stricter than a public Cloudinary
 * raw URL - a resume is personal data and should not sit on a guessable URL.
 *
 * @param {string} dataUrl base64 data URL from the browser
 * @returns {Promise<{url: string, path: string, mime: string, fileId?: string}>}
 *   Exactly one of url (remote), fileId (database) or path (local disk) is set.
 */
export async function storeResume(dataUrl) {
  const match = /^data:([^;]+);base64,(.*)$/s.exec(dataUrl || '');
  if (!match) throw new Error('Resume must be an uploaded file');

  const mime = match[1].toLowerCase();
  if (!MIME_EXT[mime]) throw new Error('Resume must be a PDF or Word document');

  // Checked before the upload, not after: the global 15mb JSON body limit is the
  // only other bound, and it rejects with a bare 413 that tells the applicant
  // nothing. Base64 carries ~4 bytes per 3, so compare against the encoded
  // length rather than decoding an oversized payload into memory first.
  const approxBytes = Math.floor((match[2].length * 3) / 4);
  if (approxBytes > MAX_RESUME_BYTES) {
    throw new Error(
      `Resume must be ${Math.round(MAX_RESUME_BYTES / (1024 * 1024))}MB or smaller`
    );
  }

  // Try remote storage first, so configuring Cloudinary later needs no code change.
  const remote = await uploadDocument(dataUrl, 'qaroo/resumes');
  if (remote) return { url: remote, path: '', mime };

  const buffer = Buffer.from(match[2], 'base64');

  // No writable persistent disk on serverless - the bundle is read-only and
  // /tmp dies with the instance - so keep the file in the database instead.
  // Also available anywhere via RESUME_STORE=mongo.
  if (useDatabaseStore()) {
    const ResumeFile = (await import('../models/ResumeFile.js')).default;
    const doc = await ResumeFile.create({
      data: buffer,
      mime,
      size: buffer.length,
      ext: MIME_EXT[mime],
    });
    return { url: '', path: '', mime, fileId: String(doc._id) };
  }

  await fs.promises.mkdir(RESUME_DIR, { recursive: true });

  // Name is generated, never taken from the upload: a user-supplied name is a
  // path-traversal vector and can collide.
  const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${MIME_EXT[mime]}`;
  await fs.promises.writeFile(path.join(RESUME_DIR, name), buffer);

  return { url: '', path: name, mime };
}

/**
 * Resolves a stored resume to an absolute path, refusing anything that escapes
 * the resume directory.
 *
 * @param {string} name stored filename
 * @returns {string|null}
 */
export function resumeFilePath(name) {
  if (!name || typeof name !== 'string') return null;
  const resolved = path.resolve(RESUME_DIR, name);
  const root = path.resolve(RESUME_DIR);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) return null;
  return fs.existsSync(resolved) ? resolved : null;
}

/** Removes a stored resume; missing files are not an error. */
export async function deleteResume(name) {
  const file = resumeFilePath(name);
  if (!file) return;
  await fs.promises.unlink(file).catch(() => {});
}

/** Removes a database-stored resume. Safe to call with a missing id. */
export async function deleteResumeFile(fileId) {
  if (!fileId) return;
  try {
    const ResumeFile = (await import('../models/ResumeFile.js')).default;
    await ResumeFile.deleteOne({ _id: fileId });
  } catch { /* already gone, or an id that was never valid */ }
}

/** Reads a database-stored resume, or null when it is not there. */
export async function readResumeFile(fileId) {
  if (!fileId) return null;
  try {
    const ResumeFile = (await import('../models/ResumeFile.js')).default;
    const doc = await ResumeFile.findById(fileId);
    if (!doc) return null;
    return { data: doc.data, mime: doc.mime, ext: doc.ext, size: doc.size };
  } catch {
    return null;
  }
}
