import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import Admin from '../models/Admin.js';
import { clientUrl } from '../config/site.js';
import { tokenPredatesPasswordChange } from '../middleware/authMiddleware.js';
import { hashResetToken, issueResetToken } from '../utils/resetToken.js';
import {
  generateVerificationToken,
  generateOTP,
  authCookieOptions,
  clearAuthCookies,
  ACCESS_COOKIE_MAX_AGE,
  REFRESH_COOKIE_MAX_AGE,
} from '../utils/generateToken.js';
import {
  sendVerificationEmail,
  sendPasswordChangeOtpEmail,
  sendPasswordResetEmail,
} from '../services/emailService.js';
import { ALL_PERMISSIONS } from '../utils/permissions.js';

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'Name, email and password are required' });
    }
    if (password.length < 8) {
      return res
        .status(422)
        .json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const existing = await Admin.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An admin with this email already exists' });
    }

    // A brand-new database lets the first registrant CLAIM the Super Admin slot.
    // The sparse-unique `bootstrap` marker makes the claim atomic, so concurrent
    // first registrants cannot both win. Promotion only completes after the
    // registrant verifies their email (see verifyEmail).
    const mayBootstrap = (await Admin.estimatedDocumentCount()) === 0;

    const createPending = (bootstrap) =>
      Admin.create({
        name,
        email: email.toLowerCase(),
        password,
        role: 'admin',
        permissions: [],
        isEmailVerified: false,
        isApproved: false,
        bootstrap,
        verificationToken: generateVerificationToken(),
        verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

    let admin;
    try {
      admin = await createPending(mayBootstrap ? true : undefined);
    } catch (err) {
      // Another concurrent registration claimed the bootstrap slot: fall back
      // to a plain pending admin instead of failing the request.
      if (err && err.code === 11000 && /bootstrap/i.test(String(err.message))) {
        admin = await createPending(undefined);
      } else {
        throw err;
      }
    }

    await sendVerificationEmail(admin.email, admin.verificationToken);

    res.status(201).json({
      success: true,
      message: admin.bootstrap
        ? 'Super Admin slot claimed. Verify your email to activate the account.'
        : 'Admin registered. Please check your email to verify your account.',
      data: { admin },
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // +password: the hash is select: false, and this is the only place it is needed.
    const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');
    if (!admin || !(await admin.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!admin.isEmailVerified) {
      return res.status(403).json({ success: false, message: 'Please verify your email' });
    }
    if (!admin.isApproved) {
      return res.status(403).json({ success: false, message: 'Your account is waiting for Super Admin approval' });
    }
    if (admin.isDisabled) {
      return res.status(403).json({ success: false, message: 'Your account has been disabled' });
    }

    const accessToken = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
    );
    const refreshToken = jwt.sign(
      { id: admin._id },
      process.env.JWT_SECRET + '_refresh',
      { algorithm: 'HS256', expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    const base = authCookieOptions();
    res.cookie('accessToken', accessToken, { ...base, maxAge: ACCESS_COOKIE_MAX_AGE });
    res.cookie('refreshToken', refreshToken, { ...base, maxAge: REFRESH_COOKIE_MAX_AGE });

    res.json({ success: true, message: 'Login successful', data: { admin, accessToken } });
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const token = (req.cookies && req.cookies.refreshToken) || (req.body && req.body.refreshToken);
    if (!token) {
      return res.status(401).json({ success: false, message: 'No refresh token' });
    }
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET + '_refresh', { algorithms: ['HS256'] });
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }
    const admin = await Admin.findById(decoded.id).select('+passwordChangedAt');
    if (!admin || admin.isDisabled) {
      return res.status(401).json({ success: false, message: 'Account no longer available' });
    }
    // Re-apply the same gate as login: a rejected or unverified admin must not
    // keep minting access tokens from an older refresh token.
    if (!admin.isEmailVerified || !admin.isApproved) {
      clearAuthCookies(res);
      return res.status(401).json({ success: false, message: 'Account no longer available' });
    }
    // The access tokens expire in 15 minutes, but the refresh token lasts a
    // week - so this is the check that actually stops a session elsewhere from
    // outliving a password change.
    if (tokenPredatesPasswordChange(decoded, admin)) {
      clearAuthCookies(res);
      return res.status(401).json({ success: false, message: 'Password was changed. Please sign in again.' });
    }
    const accessToken = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
    );
    res.cookie('accessToken', accessToken, { ...authCookieOptions(), maxAge: ACCESS_COOKIE_MAX_AGE });
    res.json({ success: true, data: { accessToken } });
  } catch (err) {
    next(err);
  }
};

const logout = (req, res) => {
  clearAuthCookies(res);
  res.json({ success: true, message: 'Logged out successfully' });
};

const getMe = async (req, res) => {
  res.json({
    success: true,
    data: { admin: req.admin },
  });
};

// Deletes ONLY the currently authenticated admin's own account.
// The identity comes from the verified token (req.admin), never from a
// client-supplied ID, so a user can never delete another admin.
const deleteMe = async (req, res, next) => {
  try {
    const admin = req.admin;
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    // Never allow a Super Admin to delete themselves via this endpoint;
    // remove Super Admins only through the superadmin-gated admin management.
    if (admin.role === 'superadmin') {
      return res.status(403).json({ success: false, message: 'Super Admin accounts cannot be deleted this way' });
    }
    await Admin.deleteOne({ _id: admin._id });
    clearAuthCookies(res);
    res.json({ success: true, message: 'Your account has been deleted' });
  } catch (err) {
    next(err);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params || {};
    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is required' });
    }
    const admin = await Admin.findOne({ verificationToken: token });
    if (!admin) {
      return res.status(400).json({ success: false, message: 'Invalid verification token' });
    }
    if (admin.verificationTokenExpires && admin.verificationTokenExpires < new Date()) {
      return res.status(400).json({ success: false, message: 'Verification token has expired' });
    }
    const wasBootstrap = admin.bootstrap === true;
    admin.isEmailVerified = true;
    admin.verificationToken = null;
    admin.verificationTokenExpires = null;
    if (wasBootstrap) {
      // The first registrant who proves their email owns the Super Admin slot.
      admin.role = 'superadmin';
      admin.permissions = ALL_PERMISSIONS;
      admin.isApproved = true;
    }
    await admin.save();
    res.json({
      success: true,
      message: wasBootstrap
        ? 'Email verified. Your Super Admin account is now active.'
        : 'Email verified successfully. Your account is now pending Super Admin approval.',
      data: { admin },
    });
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body || {};
    const admin = await Admin.findOne({ email: (email || '').toLowerCase() });
    if (admin) {
      // The raw token only ever exists here and in the email; the database
      // keeps its digest.
      const rawToken = issueResetToken(admin);
      await admin.save();
      const link = clientUrl(`/admin/reset-password?token=${rawToken}`);
      try {
        const sent = await sendPasswordResetEmail(admin.email, admin.name, link);
        console.log(`[Password reset] To: ${admin.email} sent: ${!sent.skipped}`);
      } catch (err) {
        console.error('Failed to send password reset email:', err.message);
      }
    }
    // Always return success to avoid user enumeration.
    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params || {};
    const { password } = req.body || {};
    if (!password || password.length < 8) {
      return res.status(422).json({ success: false, message: 'Password must be at least 8 characters' });
    }
    // Looked up by digest, and only against the reset field - a verification
    // token must not be usable to set a password.
    if (!token) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }
    const admin = await Admin.findOne({ resetTokenHash: hashResetToken(token) })
      .select('+resetTokenHash +resetTokenExpires');
    if (!admin) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }
    if (admin.resetTokenExpires && admin.resetTokenExpires < new Date()) {
      admin.resetTokenHash = null;
      admin.resetTokenExpires = null;
      await admin.save();
      return res.status(400).json({ success: false, message: 'Reset token has expired' });
    }
    admin.password = password;
    admin.resetTokenHash = null;
    admin.resetTokenExpires = null;
    await admin.save();
    // The reset is only meaningful if any session opened with the old password
    // cannot continue on this browser.
    clearAuthCookies(res);
    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    next(err);
  }
};

/** Guesses allowed against any single emailed code before it is discarded. */
const MAX_OTP_ATTEMPTS = 5;


/**
 * Compares two one-time codes without leaking their contents through timing.
 *
 * `===` on a secret returns as soon as two characters differ, which is a
 * measurable signal. Lengths are compared first because timingSafeEqual throws
 * on a mismatch, and a length difference is not worth hiding - the form makes
 * the expected length obvious anyway.
 */
const otpMatches = (stored, supplied) => {
  const a = Buffer.from(String(stored ?? ''), 'utf8');
  const b = Buffer.from(String(supplied ?? ''), 'utf8');
  if (a.length === 0 || a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

// Logged-in admin requests a password change => OTP emailed to their registered admin email.
const sendPasswordChangeOtp = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin?._id).select('+passwordOTPAttempts');
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
    const otp = generateOTP();
    admin.passwordOTP = otp;
    // A fresh code starts with a full allowance; otherwise a resend would
    // inherit the previous code's exhausted counter.
    admin.passwordOTPAttempts = 0;
    admin.passwordOTPExpires = new Date(Date.now() + 10 * 60 * 1000);
    await admin.save();
    try {
      const sent = await sendPasswordChangeOtpEmail(admin.email, admin.name, otp);
      console.log(`[Password change OTP] To: ${admin.email} sent: ${!sent.skipped}`);
    } catch (err) {
      console.error('Failed to send password change OTP email:', err.message);
    }
    res.json({ success: true, message: 'Verification code sent to your email.' });
  } catch (err) {
    next(err);
  }
};

// Completes the password change after email-OTP verification.
const changePassword = async (req, res, next) => {
  try {
    const { newPassword, otp } = req.body || {};
    if (!newPassword || newPassword.length < 8) {
      return res.status(422).json({ success: false, message: 'New password must be at least 8 characters' });
    }
    if (!otp) {
      return res.status(400).json({ success: false, message: 'Verification code is required' });
    }
    const admin = await Admin.findById(req.admin?._id)
      .select('+passwordOTP +passwordOTPExpires +passwordOTPAttempts');
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

    if (!admin.passwordOTP) {
      return res.status(400).json({ success: false, message: 'No verification code has been requested. Request one first.' });
    }

    // Expiry before correctness, so a stale code is never reported as wrong and
    // cannot burn an attempt.
    if (admin.passwordOTPExpires && admin.passwordOTPExpires < new Date()) {
      admin.passwordOTP = null;
      admin.passwordOTPExpires = null;
      admin.passwordOTPAttempts = 0;
      await admin.save();
      return res.status(400).json({ success: false, message: 'Verification code has expired. Request a new one.' });
    }

    if (!otpMatches(admin.passwordOTP, otp)) {
      admin.passwordOTPAttempts = (admin.passwordOTPAttempts || 0) + 1;
      const left = MAX_OTP_ATTEMPTS - admin.passwordOTPAttempts;
      if (left <= 0) {
        // Discard the code rather than lock the account: the holder can request
        // a fresh one, while a guesser only ever gets MAX_OTP_ATTEMPTS tries at
        // any single code.
        admin.passwordOTP = null;
        admin.passwordOTPExpires = null;
        admin.passwordOTPAttempts = 0;
        await admin.save();
        return res.status(400).json({
          success: false,
          message: 'Too many incorrect codes. That code is no longer valid - request a new one.',
        });
      }
      await admin.save();
      return res.status(400).json({
        success: false,
        message: `Invalid verification code. ${left} attempt${left === 1 ? '' : 's'} remaining.`,
      });
    }

    admin.password = newPassword;
    admin.passwordOTP = null;
    admin.passwordOTPExpires = null;
    admin.passwordOTPAttempts = 0;
    await admin.save();

    // The change is only meaningful if the old session cannot continue, and the
    // client signs out straight after this, so clear the cookies server-side
    // too rather than relying on it.
    clearAuthCookies(res);
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
};

export {
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
};
