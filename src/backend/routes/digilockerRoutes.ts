import { Router } from 'express';
import {
  initiateDigiLockerHandler,
  handleDigiLockerCallbackHandler,
  getDigiLockerStatusHandler
} from '../controllers/digilockerController.ts';
import { requireAuth } from '../middleware/authMiddleware.ts';
import { authenticatedUserRateLimiter, publicRateLimiter } from '../middleware/rateLimitMiddleware.ts';

const router = Router();

// /api/digilocker/authorize
router.get('/authorize', requireAuth, authenticatedUserRateLimiter, initiateDigiLockerHandler);

// /api/digilocker/callback
router.post('/callback', publicRateLimiter, handleDigiLockerCallbackHandler);

// /api/digilocker/status
router.get('/status', requireAuth, authenticatedUserRateLimiter, getDigiLockerStatusHandler);

export default router;
