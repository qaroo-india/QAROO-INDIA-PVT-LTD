/**
 * The app-wide rate limiters, in one place.
 *
 * They used to be declared inside server.js, which meant the serverless entry
 * point could not reuse them. Each gets its own namespaced store so that the
 * global, auth and write tallies for one IP stay separate.
 */

import rateLimit from 'express-rate-limit';
import { sharedStore } from './mongoRateLimitStore.js';

const WINDOW = 15 * 60 * 1000;

const build = (prefix, max, message) =>
  rateLimit({
    windowMs: WINDOW,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    store: sharedStore(prefix),
    message: { success: false, message },
  });

/** Broad abuse protection across every API route. */
export const apiLimiter = build('api', 1000, 'Too many requests, please try again later');

/** Everything under /api/auth: login, register, reset, OTP. */
export const authLimiter = build('auth', 100, 'Too many requests, please try again later');

/**
 * Write-capable CMS mounts. Stricter than the global limit so abuse is blunted,
 * but loose enough that ordinary content reads over the same mounts are fine.
 */
export const writeLimiter = build('write', 300, 'Too many requests, please try again later');
