// Ensures the authenticated admin is verified, approved and not disabled.
export function requireVerifiedApproved(req, res, next) {
  if (!req.admin) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
  if (!req.admin.isEmailVerified) {
    return res.status(403).json({ success: false, message: 'Please verify your email' });
  }
  if (!req.admin.isApproved) {
    return res.status(403).json({ success: false, message: 'Your account is waiting for Super Admin approval' });
  }
  if (req.admin.isDisabled) {
    return res.status(403).json({ success: false, message: 'Your account has been disabled' });
  }
  next();
}

// Restricts a route to Super Admins only.
export function requireSuperAdmin(req, res, next) {
  if (!req.admin || req.admin.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'This action requires Super Admin privileges' });
  }
  next();
}
