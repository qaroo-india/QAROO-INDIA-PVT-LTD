import { Router } from 'express';
import {
  listPrograms,
  getProgramBySlug,
  getProgram,
  createProgram,
  updateProgram,
  deleteProgram,
  togglePublish,
} from '../controllers/learningController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';
import { requireVerifiedApproved } from '../middleware/adminMiddleware.js';
import { requirePermission } from '../middleware/permissionMiddleware.js';

const router = Router();

router.get('/', optionalAuth, listPrograms);
router.get('/by-slug/:slug', optionalAuth, getProgramBySlug);
router.get('/:id', optionalAuth, getProgram);

router.post('/', protect, requireVerifiedApproved, requirePermission('learning.create'), createProgram);
router.put('/:id', protect, requireVerifiedApproved, requirePermission('learning.update'), updateProgram);
router.delete('/:id', protect, requireVerifiedApproved, requirePermission('learning.delete'), deleteProgram);
router.post('/:id/publish', protect, requireVerifiedApproved, requirePermission('learning.update'), togglePublish);

export default router;
