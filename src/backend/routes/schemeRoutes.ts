import { Router } from 'express';
import {
  listSchemesHandler,
  getSchemeByIdHandler,
  matchCitizenSchemesHandler,
  askAssistantHandler
} from '../controllers/schemeController.ts';
import { optionalAuth } from '../middleware/authMiddleware.ts';
import { aiRateLimiter, publicRateLimiter } from '../middleware/rateLimitMiddleware.ts';

const router = Router();

// /api/schemes
router.get('/', publicRateLimiter, listSchemesHandler);

// /api/schemes/match (Evaluates eligibility for citizen profile)
router.post('/match', publicRateLimiter, optionalAuth, matchCitizenSchemesHandler);
router.get('/match', publicRateLimiter, optionalAuth, matchCitizenSchemesHandler);

// /api/schemes/ask-ai (Interactive citizen welfare Q&A)
router.post('/ask-ai', aiRateLimiter, optionalAuth, askAssistantHandler);

// /api/schemes/:id
router.get('/:id', publicRateLimiter, getSchemeByIdHandler);

export default router;
