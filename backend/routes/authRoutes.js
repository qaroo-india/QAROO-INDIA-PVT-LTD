import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { sharedStore } from '../middleware/mongoRateLimitStore.js';
import {
  register,
  login,
  refresh,
  logout,
  getMe,
  deleteMe,
  verifyEmail,
  forgotPassword,
  resetPassword,
  sendPasswordChangeOtp,
  changePassword,
} from '../controllers/authController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';
import { requireVerifiedApproved } from '../middleware/adminMiddleware.js';

const router = Router();

// All four of these are credential-recovery endpoints, which the shared
// /api/auth allowance of 100 per window is far too generous for: each one
// either sends mail to an address the caller names, or lets the caller guess at
// a secret. They are declared together, and above the routes, because a
// `const` referenced by a router.post() call higher up the file would throw.

/** Sends mail to a caller-named address, so it can flood a mailbox. */
const forgotLimiter = rateLimit({
  store: sharedStore('forgot'),
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many reset requests. Try again in 15 minutes.' },
});

/** Sends an OTP to the signed-in admin's own mailbox. */
const otpSendLimiter = rateLimit({
  store: sharedStore('otp-send'),
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many verification codes requested. Try again in 15 minutes.' },
});

/**
 * Guards the endpoints where a caller submits a secret: the 6-digit OTP and the
 * reset token. The OTP also has a per-code attempt limit in the controller;
 * this bounds the rate across codes and from a single address.
 */
const otpVerifyLimiter = rateLimit({
  store: sharedStore('otp-verify'),
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Try again in 15 minutes.' },
});

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', protect, requireVerifiedApproved, getMe);
router.delete('/me', protect, deleteMe);
router.get('/verify-email/:token', optionalAuth, verifyEmail);

router.post('/forgot-password', forgotLimiter, forgotPassword);
router.post('/reset-password/:token', otpVerifyLimiter, resetPassword);

// Protected password change, authorised by an email OTP sent to the admin's
// registered address. The current password is deliberately not required: proving
// control of the registered mailbox is the factor.
router.post('/change-password', protect, otpVerifyLimiter, changePassword);
router.post('/change-password/send-otp', protect, otpSendLimiter, sendPasswordChangeOtp);

export default router;
