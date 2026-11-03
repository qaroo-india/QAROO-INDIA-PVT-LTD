import { Router } from 'express';
import {
  listCSR,
  getCSR,
  createCSR,
  updateCSR,
  deleteCSR,
  togglePublish,
  listCSRCategories,
} from '../controllers/csrController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';
import { requireVerifiedApproved } from '../middleware/adminMiddleware.js';
import { requirePermission } from '../middleware/permissionMiddleware.js';

const router = Router();

router.get('/', optionalAuth, listCSR);
router.get('/categories', optionalAuth, listCSRCategories);
router.get('/:id', optionalAuth, getCSR);

router.post('/', protect, requireVerifiedApproved, requirePermission('csr.create'), createCSR);
router.put('/:id', protect, requireVerifiedApproved, requirePermission('csr.update'), updateCSR);
router.delete('/:id', protect, requireVerifiedApproved, requirePermission('csr.delete'), deleteCSR);
router.post('/:id/publish', protect, requireVerifiedApproved, requirePermission('csr.update'), togglePublish);

export default router;
