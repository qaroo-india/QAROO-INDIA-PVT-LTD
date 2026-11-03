import { Router } from 'express';
import {
  getPageContent,
  updatePageContent,
  listPageKeys,
} from '../controllers/pageController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';
import { requireVerifiedApproved } from '../middleware/adminMiddleware.js';
import { requirePermission } from '../middleware/permissionMiddleware.js';

const router = Router();

// Public read of any page content
router.get('/pages', optionalAuth, listPageKeys);
router.get('/:page', optionalAuth, getPageContent);

// Permission map: each page update requires its corresponding permission
const PAGE_PERMISSION = {
  home: 'home.update',
  about: 'about.update',
  business: 'business.update',
  learning: 'learning.update',
  csr: 'csr.update',
  contact: 'contact.update',
  mou: 'mou.update',
  footer: 'footer.update',
  careers: 'careers.update',
};

router.put('/:page', protect, requireVerifiedApproved, (req, res, next) => {
  const perm = PAGE_PERMISSION[req.params.page];
  if (!perm) return res.status(400).json({ success: false, message: 'Invalid page key' });
  return requirePermission(perm)(req, res, next);
}, updatePageContent);

export default router;
