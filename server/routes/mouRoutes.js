import { Router } from 'express';
import {
  listMOUs,
  getMOU,
  createMOU,
  updateMOU,
  deleteMOU,
  togglePublish,
  listMOUCategories,
} from '../controllers/mouController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';
import { requireVerifiedApproved } from '../middleware/adminMiddleware.js';
import { requirePermission } from '../middleware/permissionMiddleware.js';

const router = Router();

// Public read (published only) and admin read (incl. drafts)
router.get('/', optionalAuth, listMOUs);
router.get('/categories', optionalAuth, listMOUCategories);
router.get('/:id', optionalAuth, getMOU);

// Protected mutations
router.post('/', protect, requireVerifiedApproved, requirePermission('mou.create'), createMOU);
router.put('/:id', protect, requireVerifiedApproved, requirePermission('mou.update'), updateMOU);
router.delete('/:id', protect, requireVerifiedApproved, requirePermission('mou.delete'), deleteMOU);
router.post('/:id/publish', protect, requireVerifiedApproved, requirePermission('mou.update'), togglePublish);

export default router;
