import { Router } from 'express';
import {
  listJobs,
  getJobBySlug,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  togglePublish,
} from '../controllers/careerController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';
import { requireVerifiedApproved } from '../middleware/adminMiddleware.js';
import { requirePermission } from '../middleware/permissionMiddleware.js';

const router = Router();

// optionalAuth so an authenticated admin sees drafts through the same endpoints
// the public site uses, matching the other content verticals.
router.get('/', optionalAuth, listJobs);
router.get('/by-slug/:slug', optionalAuth, getJobBySlug);
router.get('/:id', optionalAuth, getJob);

router.post('/', protect, requireVerifiedApproved, requirePermission('careers.create'), createJob);
router.put('/:id', protect, requireVerifiedApproved, requirePermission('careers.update'), updateJob);
router.delete('/:id', protect, requireVerifiedApproved, requirePermission('careers.delete'), deleteJob);
router.post('/:id/publish', protect, requireVerifiedApproved, requirePermission('careers.update'), togglePublish);

export default router;
