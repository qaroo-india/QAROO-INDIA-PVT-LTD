import { hasPermission } from '../utils/permissions.js';

// Builds a middleware that requires a specific permission.
// Super Admin automatically passes all permission checks.
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    if (req.admin.role === 'superadmin') return next();
    if (!hasPermission(req.admin, permission)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action',
      });
    }
    next();
  };
}
