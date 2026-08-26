import { Router } from 'express';
import {
  initiateAadhaarHandler,
  verifyAadhaarOtpHandler,
  getAadhaarStatusHandler
} from '../controllers/aadhaarController.ts';
import { requireAuth } from '../middleware/authMiddleware.ts';
import { aadhaarRateLimiter, authenticatedUserRateLimiter } from '../middleware/rateLimitMiddleware.ts';

const router = Router();

// /api/aadhaar/initiate
router.post('/initiate', requireAuth, aadhaarRateLimiter, initiateAadhaarHandler);

// /api/aadhaar/verify-otp
router.post('/verify-otp', requireAuth, aadhaarRateLimiter, verifyAadhaarOtpHandler);

// /api/aadhaar/status
router.get('/status', requireAuth, authenticatedUserRateLimiter, getAadhaarStatusHandler);

export default router;
