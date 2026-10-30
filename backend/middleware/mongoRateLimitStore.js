/**
 * A rate-limit store backed by MongoDB.
 *
 * express-rate-limit's default MemoryStore counts hits in the process that
 * handled the request. On a long-running server that is exactly right. On
 * serverless it is close to useless: every cold start begins with an empty
 * counter and concurrent invocations each keep their own, so a limit of 5 per
 * window becomes "5 per instance, for as many instances as the platform cares
 * to start". The login, forgot-password and OTP-send limits would stop being
 * limits at all.
 *
 * Counting in the database instead gives one shared counter. Documents carry an
 * `expiresAt` and a TTL index removes them, so the collection does not grow.
 *
 * Implements the express-rate-limit v7 Store interface.
 */

import mongoose from 'mongoose';

const COLLECTION = 'ratelimits';

let indexPromise = null;

/** Creates the TTL index once per process. */
async function ensureIndex(col) {
  if (!indexPromise) {
    // expireAfterSeconds: 0 means "remove when the date in this field passes".
    indexPromise = col
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'ratelimit_ttl' })
      .catch((err) => {
        // A missing index means stale documents linger, which is untidy but not
        // incorrect - every read already compares expiresAt itself.
        console.warn(`[ratelimit] could not create TTL index: ${err.message}`);
      });
  }
  return indexPromise;
}

export class MongoRateLimitStore {
  /**
   * @param {object} opts
   * @param {string} opts.prefix Namespaces this limiter's counters, so the
   *   auth, write and global limiters do not share a tally for the same IP.
   */
  constructor({ prefix = 'rl' } = {}) {
    this.prefix = prefix;
    this.windowMs = 60_000;
  }

  /** express-rate-limit hands us its resolved options. */
  init(options) {
    this.windowMs = options.windowMs;
  }

  get collection() {
    if (mongoose.connection.readyState !== 1) return null;
    return mongoose.connection.db.collection(COLLECTION);
  }

  key(k) {
    return `${this.prefix}:${k}`;
  }

  async increment(k) {
    const col = this.collection;
    const now = new Date();

    // No database: fall back to permitting the request rather than failing the
    // API outright. A rate limiter that returns 500 turns a transient database
    // blip into a total outage, and the endpoints that matter most here have a
    // second, stateful defence anyway - the per-code OTP attempt counter lives
    // on the admin document, so brute-forcing a code stays bounded even if this
    // store is unavailable.
    if (!col) {
      return { totalHits: 1, resetTime: new Date(now.getTime() + this.windowMs) };
    }

    const id = this.key(k);
    const resetTime = new Date(now.getTime() + this.windowMs);

    try {
      await ensureIndex(col);

      // Increment only while the window is still open.
      const open = await col.findOneAndUpdate(
        { _id: id, expiresAt: { $gt: now } },
        { $inc: { hits: 1 } },
        { returnDocument: 'after' }
      );
      const hit = open?.value ?? open;
      if (hit && typeof hit.hits === 'number') {
        return { totalHits: hit.hits, resetTime: hit.expiresAt };
      }

      // Absent or expired: open a new window. Two racing requests can both land
      // here and both write hits:1, costing at most one extra request through
      // the limit - acceptable, and far cheaper than a transaction.
      const started = await col.findOneAndUpdate(
        { _id: id },
        { $set: { hits: 1, expiresAt: resetTime } },
        { upsert: true, returnDocument: 'after' }
      );
      const fresh = started?.value ?? started;
      return { totalHits: fresh?.hits ?? 1, resetTime: fresh?.expiresAt ?? resetTime };
    } catch (err) {
      console.warn(`[ratelimit] store unavailable, allowing request: ${err.message}`);
      return { totalHits: 1, resetTime };
    }
  }

  async decrement(k) {
    const col = this.collection;
    if (!col) return;
    try {
      await col.updateOne({ _id: this.key(k), hits: { $gt: 0 } }, { $inc: { hits: -1 } });
    } catch { /* a failed decrement only makes the limit slightly stricter */ }
  }

  async resetKey(k) {
    const col = this.collection;
    if (!col) return;
    try {
      await col.deleteOne({ _id: this.key(k) });
    } catch { /* nothing to do */ }
  }

  async resetAll() {
    const col = this.collection;
    if (!col) return;
    try {
      await col.deleteMany({ _id: { $regex: `^${this.prefix}:` } });
    } catch { /* nothing to do */ }
  }
}

/**
 * Whether counters must be shared across processes.
 *
 * Vercel sets VERCEL=1 in every runtime. RATE_LIMIT_STORE=mongo forces it on
 * for any other platform that scales to more than one instance - including PM2
 * in cluster mode, where the same problem applies on a single machine.
 */
export const needsSharedStore = () =>
  process.env.RATE_LIMIT_STORE === 'mongo' || Boolean(process.env.VERCEL);

/** A store instance when one is needed, or undefined to keep the default. */
export const sharedStore = (prefix) =>
  (needsSharedStore() ? new MongoRateLimitStore({ prefix }) : undefined);
