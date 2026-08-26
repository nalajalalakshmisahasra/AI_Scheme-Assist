/**
 * Authorized UIDAI Aadhaar e-KYC Verification Controller
 */

import { Response } from 'express';
import { db } from '../config/db.ts';
import { AuthenticatedRequest } from '../middleware/authMiddleware.ts';
import { initiateAadhaarKYC, verifyAadhaarOTP } from '../services/aadhaarService.ts';
import { isValidAadhaar } from '../utils/validators.ts';
import { logger } from '../utils/logger.ts';

export async function initiateAadhaarHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized.' });
    return;
  }

  const { aadhaarNumber } = req.body;

  if (!aadhaarNumber || typeof aadhaarNumber !== 'string' || !isValidAadhaar(aadhaarNumber)) {
    res.status(400).json({ success: false, message: 'Please provide a valid 12-digit Aadhaar number.' });
    return;
  }

  const result = await initiateAadhaarKYC(aadhaarNumber, req.user._id);
  res.status(result.success ? 200 : 400).json(result);
}

export async function verifyAadhaarOtpHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized.' });
    return;
  }

  const { transactionId, otp } = req.body;

  if (!transactionId || typeof transactionId !== 'string' || transactionId.trim().length === 0 || transactionId.length > 100) {
    res.status(400).json({ success: false, message: 'Valid Transaction ID is required.' });
    return;
  }

  if (!otp || typeof otp !== 'string' || !/^\d{6}$/.test(otp.trim())) {
    res.status(400).json({ success: false, message: 'OTP must be exactly 6 numeric digits.' });
    return;
  }

  const result = await verifyAadhaarOTP(transactionId.trim(), otp.trim(), req.user._id);


  if (result.success && result.maskedAadhaar) {
    // Update user profile with masked Aadhaar reference only (compliance requirement #3)
    await db.users.update(req.user._id, {
      aadhaarVerificationStatus: 'verified',
      aadhaarMaskedNumber: result.maskedAadhaar,
      aadhaarVerifiedAt: result.verifiedAt || new Date().toISOString(),
      aadhaarProviderRef: result.providerTxnRef
    });

    logger.audit('USER_AADHAAR_STATUS_UPDATED', req.user._id, {
      maskedAadhaar: result.maskedAadhaar,
      ref: result.providerTxnRef
    });
  }

  res.status(result.success ? 200 : 400).json(result);
}

export async function getAadhaarStatusHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
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
    status: user.aadhaarVerificationStatus || 'unverified',
    maskedAadhaar: user.aadhaarMaskedNumber || null,
    verifiedAt: user.aadhaarVerifiedAt || null,
    complianceNote: 'In accordance with UIDAI e-KYC guidelines, raw 12-digit Aadhaar numbers are never stored.'
  });
}
