import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { sharedStore } from '../middleware/mongoRateLimitStore.js';
import {
  submitApplication,
  listApplications,
  getApplication,
  setStatus,
  deleteApplication,
  downloadResume,
} from '../controllers/applicationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireVerifiedApproved } from '../middleware/adminMiddleware.js';
import { requirePermission } from '../middleware/permissionMiddleware.js';

const router = Router();

// Public submission, rate-limited like the contact form. Applications carry a
// file upload, so the window is a little tighter than contact's 10.
const submitLimiter = rateLimit({
  store: sharedStore('application-submit'),
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many applications submitted. Please try again later.' },
});

router.post('/', submitLimiter, submitApplication);

// Admin routes
router.use(protect, requireVerifiedApproved);

router.get('/', requirePermission('applications.read'), listApplications);
router.get('/:id', requirePermission('applications.read'), getApplication);
router.get('/:id/resume', requirePermission('applications.read'), downloadResume);
router.post('/:id/status', requirePermission('applications.update'), setStatus);
router.delete('/:id', requirePermission('applications.delete'), deleteApplication);

export default router;
