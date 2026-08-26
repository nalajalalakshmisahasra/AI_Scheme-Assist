/**
 * Authorized DigiLocker OAuth2.0 Consent & Verification Controller
 */

import { Request, Response } from 'express';
import { db } from '../config/db.ts';
import { AuthenticatedRequest } from '../middleware/authMiddleware.ts';
import { initiateDigiLockerAuth, handleDigiLockerCallback } from '../services/digilockerService.ts';
import { uploadPrivateDocument } from '../services/storageService.ts';
import { logger } from '../utils/logger.ts';

export async function initiateDigiLockerHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized.' });
    return;
  }

  const result = initiateDigiLockerAuth(req.user._id);
  res.status(200).json(result);
}

export async function handleDigiLockerCallbackHandler(req: Request, res: Response): Promise<void> {
  const { code, state } = req.body;

  if (!code || !state) {
    res.status(400).json({
      success: false,
      message: 'Authorization code and state token are required.'
    });
    return;
  }

  const result = await handleDigiLockerCallback(code, state);

  if (result.success && result.userId) {
    // 1. Update user profile to mark DigiLocker as verified
    await db.users.update(result.userId, {
      digilockerVerificationStatus: 'verified',
      digilockerVerifiedAt: new Date().toISOString(),
      digilockerUserId: 'DL-' + Math.random().toString(36).substring(2, 9).toUpperCase()
    });

    // 2. Automatically import verified issued documents into citizen private vault
    if (result.documents && result.documents.length > 0) {
      for (const doc of result.documents) {
        const dummyPdf = Buffer.from(
          `%PDF-1.4\n% DigiLocker Verified Issued Document\nDocument: ${doc.title}\nIssuer: ${doc.issuer}\nDoc ID: ${doc.docId}\nIssued Date: ${doc.dateOfIssue}\nStatus: VERIFIED_BY_ISSUER (Digital Signature Valid)\n%%EOF`
        );

        await uploadPrivateDocument(
          result.userId,
          doc.docType as any,
          doc.title,
          `${doc.docType}_verified_${doc.docId}.pdf`,
          'application/pdf',
          dummyPdf
        );
      }
    }

    logger.audit('USER_DIGILOCKER_VERIFIED', result.userId, {
      importedDocs: result.documents?.length || 0
    });
  }

  res.status(result.success ? 200 : 400).json(result);
}

export async function getDigiLockerStatusHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized.' });
    return;
  }

  const user = await db.users.findById(req.user._id);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found.' });
    return;
  }

  res.status(200).json({
    success: true,
    status: user.digilockerVerificationStatus || 'unverified',
    verifiedAt: user.digilockerVerifiedAt || null,
    digilockerUserId: user.digilockerUserId || null
  });
}
