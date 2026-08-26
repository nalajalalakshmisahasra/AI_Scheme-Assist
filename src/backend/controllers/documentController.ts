/**
 * Private Document Vault & Secure Storage Controller
 */

import { Response } from 'express';
import { db } from '../config/db.ts';
import { AuthenticatedRequest } from '../middleware/authMiddleware.ts';
import {
  uploadPrivateDocument,
  createSignedDownloadUrl,
  getDocumentStream
} from '../services/storageService.ts';
import { sanitizeInput } from '../utils/validators.ts';
import { logger } from '../utils/logger.ts';

export async function uploadDocumentHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized.' });
    return;
  }

  const file = req.file;
  if (!file) {
    res.status(400).json({ success: false, message: 'No document file provided for upload.' });
    return;
  }

  const { documentType = 'other', title } = req.body;

  const result = await uploadPrivateDocument(
    req.user._id,
    documentType,
    sanitizeInput(title || file.originalname),
    file.originalname,
    file.mimetype,
    file.buffer
  );

  res.status(result.success ? 201 : 400).json(result);
}

export async function listDocumentsHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized.' });
    return;
  }

  const documents = await db.documents.findByUserId(req.user._id);

  // Attach signed temporary download URLs
  const enrichedDocs = await Promise.all(
    documents.map(async doc => {
      const { downloadUrl } = await createSignedDownloadUrl(doc.id, req.user!._id);
      return {
        ...doc,
        downloadUrl
      };
    })
  );

  res.status(200).json({
    success: true,
    documents: enrichedDocs
  });
}

export async function getDocumentByIdHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized.' });
    return;
  }

  const { id } = req.params;
  const doc = await db.documents.findById(id);

  if (!doc || doc.userId !== req.user._id) {
    res.status(404).json({ success: false, message: 'Document not found.' });
    return;
  }

  const { downloadUrl } = await createSignedDownloadUrl(doc.id, req.user._id);
  const { fileBuffer: _, ...safeDoc } = doc;

  res.status(200).json({
    success: true,
    document: {
      ...safeDoc,
      downloadUrl
    }
  });
}

export async function downloadFileHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    res.status(401).json({ success: false, message: 'Signed download token is required.' });
    return;
  }

  const result = await getDocumentStream(id, token, req.user?._id);

  if (!result.success || !result.buffer) {
    res.status(403).json({ success: false, message: result.error || 'Access denied.' });
    return;
  }

  const safeFileName = (result.fileName || 'document.pdf').replace(/["\r\n\\]/g, '_');

  res.setHeader('Content-Type', result.mimeType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"`);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'");
  res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

  res.send(result.buffer);
}

export async function deleteDocumentHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized.' });
    return;
  }

  const { id } = req.params;
  const deleted = await db.documents.delete(id, req.user._id);

  if (!deleted) {
    res.status(404).json({ success: false, message: 'Document not found or permission denied.' });
    return;
  }

  logger.audit('DOCUMENT_DELETED', req.user._id, { docId: id });

  res.status(200).json({
    success: true,
    message: 'Document deleted from private storage.'
  });
}
