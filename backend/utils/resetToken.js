import crypto from 'node:crypto';

/**
 * Issuing and checking the single-use token behind a password-set link.
 *
 * Used by two flows that are really the same mechanism:
 *   - forgot-password, where an existing admin asks for a reset
 *   - admin onboarding, where a newly verified admin chooses their first
 *     password instead of being emailed one
 *
 * Only the digest is stored, so reading the database does not yield usable
 * links. No salt and no bcrypt: the token is 32 random bytes, so it is not
 * guessable and there is nothing for a precomputed table to attack - and a
 * plain digest keeps the lookup one indexed query.
 */

/** A fresh token. The raw value exists only here and in the email. */
export const newResetToken = () => crypto.randomBytes(32).toString('hex');

/** The digest of a token, as stored. */
export const hashResetToken = (token) =>
  crypto.createHash('sha256').update(String(token)).digest('hex');

/** How long a link stays valid. */
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

/**
 * Stamps a fresh reset token onto an admin document and returns the raw value
 * to put in the link. Does not save - the caller decides when.
 */
export function issueResetToken(admin, ttlMs = RESET_TOKEN_TTL_MS) {
  const raw = newResetToken();
  admin.resetTokenHash = hashResetToken(raw);
  admin.resetTokenExpires = new Date(Date.now() + ttlMs);
  return raw;
}
