import { Router } from 'express';
import {
  uploadDocumentHandler,
  listDocumentsHandler,
  getDocumentByIdHandler,
  downloadFileHandler,
  deleteDocumentHandler
} from '../controllers/documentController.ts';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.ts';
import { documentUpload } from '../middleware/uploadMiddleware.ts';
import { uploadRateLimiter, authenticatedUserRateLimiter, publicRateLimiter } from '../middleware/rateLimitMiddleware.ts';

const router = Router();

// /api/documents/upload
router.post('/upload', requireAuth, uploadRateLimiter, documentUpload.single('file'), uploadDocumentHandler);

// /api/documents
router.get('/', requireAuth, authenticatedUserRateLimiter, listDocumentsHandler);

// /api/documents/:id
router.get('/:id', requireAuth, authenticatedUserRateLimiter, getDocumentByIdHandler);

// /api/documents/:id/download (Validates signed temporary token)
router.get('/:id/download', optionalAuth, publicRateLimiter, downloadFileHandler);

// /api/documents/:id/delete or DELETE /api/documents/:id
router.delete('/:id', requireAuth, authenticatedUserRateLimiter, deleteDocumentHandler);
router.post('/:id/delete', requireAuth, authenticatedUserRateLimiter, deleteDocumentHandler);

export default router;
