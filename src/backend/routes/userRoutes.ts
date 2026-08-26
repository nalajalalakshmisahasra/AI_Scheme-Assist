import { Router } from 'express';
import {
  getProfileHandler,
  updateProfileHandler,
  getDashboardStatsHandler,
  getClerkProfileHandler,
  saveClerkProfileHandler
} from '../controllers/userController.ts';
import { requireAuth } from '../middleware/authMiddleware.ts';
import { authenticatedUserRateLimiter, publicRateLimiter } from '../middleware/rateLimitMiddleware.ts';

const router = Router();

// Clerk-authenticated user profile endpoints
router.get('/clerk/:clerkUserId', publicRateLimiter, getClerkProfileHandler);
router.post('/clerk-onboard', authenticatedUserRateLimiter, saveClerkProfileHandler);

// /api/users/profile
router.get('/profile', requireAuth, authenticatedUserRateLimiter, getProfileHandler);

// /api/users/profile/update
router.post('/profile/update', requireAuth, authenticatedUserRateLimiter, updateProfileHandler);
router.put('/profile', requireAuth, authenticatedUserRateLimiter, updateProfileHandler);

// /api/users/stats
router.get('/stats', requireAuth, authenticatedUserRateLimiter, getDashboardStatsHandler);

export default router;
