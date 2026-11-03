import { Router } from 'express';
import {
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
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  requireVerifiedApproved,
  requireSuperAdmin,
} from '../middleware/adminMiddleware.js';
import { requirePermission } from '../middleware/permissionMiddleware.js';

const router = Router();

// All admin management routes require an authenticated, verified, approved, super admin.
router.use(protect, requireVerifiedApproved, requireSuperAdmin);

router.get('/', requirePermission('admin.read'), listAdmins);
router.post('/', requirePermission('admin.create'), createAdmin);
router.put('/:id', requirePermission('admin.update'), updateAdmin);
router.delete('/:id', requirePermission('admin.delete'), deleteAdmin);
router.post('/:id/approve', requirePermission('admin.update'), approveAdmin);
router.post('/:id/reject', requirePermission('admin.update'), rejectAdmin);
router.post('/:id/send-otp', requirePermission('admin.update'), sendAdminOTP);
router.post('/:id/verify', requirePermission('admin.update'), verifyAdmin);
router.post('/:id/disable', requirePermission('admin.update'), toggleDisable);
router.put('/:id/permissions', requirePermission('permissions.manage'), updatePermissions);

export default router;
