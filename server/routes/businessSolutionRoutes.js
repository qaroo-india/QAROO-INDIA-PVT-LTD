import { Router } from 'express';
import {
  listSolutions,
  getSolutionBySlug,
  getSolution,
  createSolution,
  updateSolution,
  deleteSolution,
  togglePublish,
} from '../controllers/businessSolutionController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';
import { requireVerifiedApproved } from '../middleware/adminMiddleware.js';
import { requirePermission } from '../middleware/permissionMiddleware.js';

const router = Router();

router.get('/', optionalAuth, listSolutions);
router.get('/by-slug/:slug', optionalAuth, getSolutionBySlug);
router.get('/:id', optionalAuth, getSolution);

router.post('/', protect, requireVerifiedApproved, requirePermission('business.create'), createSolution);
router.put('/:id', protect, requireVerifiedApproved, requirePermission('business.update'), updateSolution);
router.delete('/:id', protect, requireVerifiedApproved, requirePermission('business.delete'), deleteSolution);
router.post('/:id/publish', protect, requireVerifiedApproved, requirePermission('business.update'), togglePublish);

export default router;
