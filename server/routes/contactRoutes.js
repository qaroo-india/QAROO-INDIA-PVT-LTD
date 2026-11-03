import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { sharedStore } from '../middleware/mongoRateLimitStore.js';
import {
  submitContact,
  listMessages,
  getMessage,
  markRead,
  resolveMessage,
  saveRemarks,
  deleteMessage,
} from '../controllers/contactController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireVerifiedApproved } from '../middleware/adminMiddleware.js';
import { requirePermission } from '../middleware/permissionMiddleware.js';

const router = Router();

// Public submission - rate-limited to prevent spam/abuse without blocking
// real visitors (10 submissions per 15 minutes per IP is generous for a
// human, while stopping scripted flooding). Admin operations below are not
// throttled.
const submitLimiter = rateLimit({
  store: sharedStore('contact-submit'),
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many submissions. Please try again later.' },
});

// Public submission
router.post('/', submitLimiter, submitContact);

// Admin routes
router.use(protect, requireVerifiedApproved);

router.get('/', requirePermission('contact.read'), listMessages);
router.get('/:id', requirePermission('contact.read'), getMessage);
router.post('/:id/read', requirePermission('contact.read'), markRead);
router.post('/:id/resolve', requirePermission('contact.read'), resolveMessage);
router.post('/:id/remarks', requirePermission('contact.update'), saveRemarks);
router.delete('/:id', requirePermission('contact.delete'), deleteMessage);

export default router;
