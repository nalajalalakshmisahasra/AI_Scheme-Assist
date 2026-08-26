/**
 * Secure OTP Generation & Verification Service
 * Guarantees plain-text OTPs are NEVER stored. Only cryptographic hashes are retained.
 */

import { db } from '../config/db.ts';
import { generateSecureNumericOTP, hashOTP, verifyOTPHash } from '../utils/encryption.ts';
import { sendEmailOTP } from './emailService.ts';
import { logger } from '../utils/logger.ts';
import { OTPRecord } from '../../types.ts';

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const OTP_RESEND_COOLDOWN_MS = 45 * 1000; // 45 seconds cooldown
const MAX_ATTEMPTS = 3;

export async function requestAndSendOTP(
  identifier: string,
  purpose: OTPRecord['purpose'],
  recipientName: string = 'Citizen'
): Promise<{ success: boolean; message: string; cooldownRemaining?: number }> {
  const normalizedId = identifier.trim().toLowerCase();

  // Check existing OTP for cooldown
  const existing = await db.otps.findLatest(normalizedId, purpose);
  if (existing) {
    const elapsed = Date.now() - existing.createdAt;
    if (elapsed < OTP_RESEND_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000);
      return {
        success: false,
        message: `Please wait ${remainingSeconds} seconds before requesting a new OTP.`,
        cooldownRemaining: remainingSeconds
      };
    }
  }

  // 1. Generate random crypto 6-digit OTP
  const rawOTP = generateSecureNumericOTP(6);

  // 2. Hash OTP using secure HMAC
  const otpHash = hashOTP(rawOTP, normalizedId);

  // 3. Store only the hash, expiry, and zero attempts
  await db.otps.create({
    identifier: normalizedId,
    otpHash,
    purpose,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
    verified: false,
    attempts: 0,
    maxAttempts: MAX_ATTEMPTS
  });

  // 4. Dispatch OTP via Email service
  await sendEmailOTP({
    toEmail: normalizedId,
    recipientName,
    otpCode: rawOTP,
    purposeText: purpose === 'registration' ? 'Citizen Registration' : 'Account Authentication'
  });

  logger.audit('OTP_GENERATED_AND_DISPATCHED', normalizedId, { purpose });

  return {
    success: true,
    message: `A 6-digit verification code has been dispatched to ${normalizedId}. It expires in 5 minutes.`
  };
}

export async function verifySubmittedOTP(
  identifier: string,
  submittedOTP: string,
  purpose: OTPRecord['purpose']
): Promise<{ success: boolean; message: string }> {
  const normalizedId = identifier.trim().toLowerCase();

  if (!submittedOTP || submittedOTP.trim().length !== 6) {
    return { success: false, message: 'Invalid OTP format. Please enter a 6-digit code.' };
  }

  const record = await db.otps.findLatest(normalizedId, purpose);
  if (!record) {
    return { success: false, message: 'No active OTP request found. Please request a new verification code.' };
  }

  // Check expiration
  if (Date.now() > record.expiresAt) {
    await db.otps.delete(normalizedId, purpose);
    return { success: false, message: 'Verification code has expired. Please request a new code.' };
  }

  // Check retry attempts
  if (record.attempts >= record.maxAttempts) {
    await db.otps.delete(normalizedId, purpose);
    logger.warn(`OTP brute-force limit reached for identifier: ${normalizedId}`);
    return {
      success: false,
      message: 'Maximum verification attempts exceeded. For your security, this code is now invalidated. Please request a new one.'
    };
  }

  // Verify hash safely
  const isValid = verifyOTPHash(submittedOTP.trim(), normalizedId, record.otpHash);

  if (!isValid) {
    const attemptsMade = await db.otps.incrementAttempts(normalizedId, purpose);
    const attemptsLeft = record.maxAttempts - attemptsMade;
    logger.audit('OTP_VERIFICATION_FAILED', normalizedId, { attemptsMade, attemptsLeft });
    return {
      success: false,
      message: attemptsLeft > 0
        ? `Incorrect verification code. ${attemptsLeft} attempt(s) remaining.`
        : 'Incorrect verification code. Maximum attempts reached. Please request a new code.'
    };
  }

  // Mark verified and delete to prevent replay attacks
  await db.otps.markVerified(normalizedId, purpose);
  await db.otps.delete(normalizedId, purpose);

  logger.audit('OTP_VERIFICATION_SUCCESSFUL', normalizedId, { purpose });

  return {
    success: true,
    message: 'OTP verified successfully.'
  };
}
