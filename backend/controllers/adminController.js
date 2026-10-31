import Admin from '../models/Admin.js';
import {
  ALL_PERMISSIONS,
  isPermissionValid,
} from '../utils/permissions.js';
import { generateOTP } from '../utils/generateToken.js';
import {
  sendApprovalEmail,
  sendRejectionEmail,
  sendAdminVerificationOTPEmail,
  sendVerificationSuccessEmail,
} from '../services/emailService.js';
import { issueResetToken } from '../utils/resetToken.js';
import { clientUrl } from '../config/site.js';

const listAdmins = async (req, res, next) => {
  try {
    const admins = await Admin.find().select('-password').sort('-createdAt');
    res.json({ success: true, data: { admins } });
  } catch (err) {
    next(err);
  }
};

const approveAdmin = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
    admin.isApproved = true;
    admin.isDisabled = false;
    await admin.save();
    await sendApprovalEmail(admin.email, admin.name);
    res.json({ success: true, message: 'Admin approved', data: { admin } });
  } catch (err) {
    next(err);
  }
};

const rejectAdmin = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
    admin.isApproved = false;
    await admin.save();
    await sendRejectionEmail(admin.email, admin.name);
    res.json({ success: true, message: 'Admin rejected', data: { admin } });
  } catch (err) {
    next(err);
  }
};

const toggleDisable = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
    if (admin.role === 'superadmin') {
      return res.status(403).json({ success: false, message: 'Cannot disable a Super Admin' });
    }
    admin.isDisabled = !admin.isDisabled;
    await admin.save();
    res.json({ success: true, message: admin.isDisabled ? 'Admin disabled' : 'Admin enabled', data: { admin } });
  } catch (err) {
    next(err);
  }
};

const deleteAdmin = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
    if (admin.role === 'superadmin') {
      return res.status(403).json({ success: false, message: 'Cannot delete a Super Admin' });
    }
    await admin.deleteOne();
    res.json({ success: true, message: 'Admin deleted' });
  } catch (err) {
    next(err);
  }
};

const updatePermissions = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
    if (admin.role === 'superadmin') {
      return res.status(403).json({ success: false, message: 'Super Admin already has all permissions' });
    }
    const { permissions } = req.body || {};
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ success: false, message: 'Permissions must be an array' });
    }
    const valid = permissions.filter((p) => isPermissionValid(p));
    admin.permissions = [...new Set(valid)];
    await admin.save();
    res.json({ success: true, message: 'Permissions updated', data: { admin } });
  } catch (err) {
    next(err);
  }
};

const updateAdmin = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
    const { name, role } = req.body || {};
    if (admin.role === 'superadmin' && role && role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Cannot demote a Super Admin' });
    }
    if (name) admin.name = name;
    if (role && ['superadmin', 'admin'].includes(role)) admin.role = role;
    await admin.save();
    res.json({ success: true, message: 'Admin updated', data: { admin } });
  } catch (err) {
    next(err);
  }
};

const createAdmin = async (req, res, next) => {
  try {
    const { name, email, password, role, permissions } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }
    if (password.length < 8) {
      return res.status(422).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const existing = await Admin.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An admin with this email already exists' });
    }

    const sanitizedRole = role === 'superadmin' ? 'superadmin' : 'admin';
    const cleanPerms = Array.isArray(permissions)
      ? [...new Set(permissions.filter((p) => isPermissionValid(p)))]
      : [];

    // The Super Admin is creating this account, so it is approved right away.
    // The new admin still must verify their email via the emailed OTP before first login.
    const otp = generateOTP();
    const admin = await Admin.create({
      name,
      email: email.toLowerCase(),
      password,
      role: sanitizedRole,
      permissions: sanitizedRole === 'superadmin' ? ALL_PERMISSIONS : cleanPerms,
      isEmailVerified: false,
      isApproved: true,
      isDisabled: false,
      verificationOTP: otp,
      verificationOTPExpires: new Date(Date.now() + 10 * 60 * 1000),
      // Temporary plaintext copy used for the confirmation email sent after verification.
      createdBy: req.admin?._id || null,
    });

    try {
      await sendAdminVerificationOTPEmail(
        req.admin.email,
        req.admin.name,
        admin.name,
        admin.email,
        otp
      );
    } catch (err) {
      console.error('Failed to send OTP email:', err.message);
    }

    res.status(201).json({
      success: true,
      message: 'Admin created. A verification code has been sent to your email.',
      data: { admin },
    });
  } catch (err) {
    next(err);
  }
};

const sendAdminOTP = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
    if (admin.isEmailVerified) {
      return res.status(400).json({ success: false, message: 'This admin is already verified' });
    }
    const otp = generateOTP();
    admin.verificationOTP = otp;
    admin.verificationOTPExpires = new Date(Date.now() + 10 * 60 * 1000);
    await admin.save();
    try {
      await sendAdminVerificationOTPEmail(req.admin.email, req.admin.name, admin.name, admin.email, otp);
    } catch (err) {
      console.error('Failed to send OTP email:', err.message);
    }
    res.json({ success: true, message: 'Verification code sent to your email' });
  } catch (err) {
    next(err);
  }
};

const verifyAdmin = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
    if (admin.isEmailVerified) {
      return res.status(400).json({ success: false, message: 'This admin is already verified' });
    }
    const { otp } = req.body || {};
    if (!admin.verificationOTP || String(admin.verificationOTP) !== String(otp)) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }
    if (admin.verificationOTPExpires && admin.verificationOTPExpires < new Date()) {
      return res.status(400).json({ success: false, message: 'Verification code has expired. Send a new code.' });
    }
    admin.isEmailVerified = true;
    admin.verificationOTP = null;
    admin.verificationOTPExpires = null;

    // The new admin chooses their own password from a single-use link, rather
    // than being emailed the one the Super Admin typed. That password is still
    // a valid login - it was hashed at creation - so nothing is lost if it was
    // handed over in person; it is simply never stored in the clear or put in
    // an inbox.
    const rawToken = issueResetToken(admin);
    await admin.save();

    const setPasswordUrl = clientUrl(`/admin/reset-password?token=${rawToken}`);
    try {
      const sent = await sendVerificationSuccessEmail(admin.email, admin.name, setPasswordUrl);
      console.log(`[Confirm email] To: ${admin.email} sent: ${!sent.skipped}`);
    } catch (err) {
      console.error('Failed to send verification success email:', err.message);
    }
    res.json({ success: true, message: `${admin.name} is now verified and can sign in.`, data: { admin } });
  } catch (err) {
    next(err);
  }
};

export {
  listAdmins,
  createAdmin,
  sendAdminOTP,
  verifyAdmin,
  approveAdmin,
  rejectAdmin,
  toggleDisable,
  deleteAdmin,
  updatePermissions,
  updateAdmin,
};
