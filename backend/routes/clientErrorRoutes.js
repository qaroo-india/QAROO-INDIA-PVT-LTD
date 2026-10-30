import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { sharedStore } from '../middleware/mongoRateLimitStore.js';
import { reportClientError, listClientErrors } from '../controllers/clientErrorController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireVerifiedApproved, requireSuperAdmin } from '../middleware/adminMiddleware.js';

const router = Router();

// This was the one public write with no limiter of its own, so it fell back to
// the global 1000 per 15 minutes - enough for a single IP to insert a thousand
// rows in that window. A genuine crash loop reports a handful of times, not
// dozens, so 30 is generous for real use and blunts scripted flooding.
const reportLimiter = rateLimit({
  store: sharedStore('error-report'),
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  // A dropped crash report must not itself look like a crash to the page.
  message: { success: true, message: 'Report throttled' },
});

// Public endpoint - browser crash reports.
router.post('/', reportLimiter, reportClientError);

// Review logged frontend errors (Super Admin only).
router.get('/', protect, requireVerifiedApproved, requireSuperAdmin, listClientErrors);

export default router;