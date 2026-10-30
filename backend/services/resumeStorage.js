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
 * @returns {Promise<{url: string, path: string, mime: string}>}
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

  // On serverless there is no writable, persistent filesystem - the bundle is
  // read-only and /tmp dies with the instance - so the disk fallback cannot
  // work. Fail loudly and specifically here rather than letting mkdir throw
  // EROFS, which reaches the applicant as "Something went wrong" and tells
  // whoever reads the logs nothing about the actual cause.
  if (onServerless) {
    throw new Error(
      'Resume uploads need Cloudinary on this deployment: a serverless function has no '
      + 'persistent disk. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.'
    );
  }

  const buffer = Buffer.from(match[2], 'base64');
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
  try {
    await fs.promises.unlink(file);
  } catch {
    // Already gone - nothing to do.
  }
}
