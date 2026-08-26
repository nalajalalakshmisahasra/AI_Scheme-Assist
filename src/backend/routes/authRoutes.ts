import { Router } from 'express';
import {
  registerHandler,
  sendEmailOtpHandler,
  verifyEmailOtpHandler,
  loginHandler,
  getCurrentUserHandler,
  logoutHandler
} from '../controllers/authController.ts';
import { requireAuth } from '../middleware/authMiddleware.ts';
import { authRateLimiter, otpRateLimiter, authenticatedUserRateLimiter } from '../middleware/rateLimitMiddleware.ts';

const router = Router();

// /api/auth/send-email-otp
router.post('/send-email-otp', otpRateLimiter, sendEmailOtpHandler);

// /api/auth/verify-email-otp
router.post('/verify-email-otp', otpRateLimiter, verifyEmailOtpHandler);

// /api/auth/register
router.post('/register', authRateLimiter, registerHandler);

// /api/auth/login
router.post('/login', authRateLimiter, loginHandler);

// /api/auth/me
router.get('/me', requireAuth, authenticatedUserRateLimiter, getCurrentUserHandler);

// /api/auth/logout
router.post('/logout', logoutHandler);

export default router;
