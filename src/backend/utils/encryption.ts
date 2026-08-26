import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const SALT_ROUNDS = 10;
const OTP_SALT = process.env.OTP_SALT || crypto.randomBytes(32).toString('hex');

/**
 * Hashes a plaintext user password using bcrypt.
 */

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compares a plaintext password against a stored bcrypt hash.
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Computes a secure HMAC-SHA256 hash of an OTP code before storage.
 * Ensures plain-text OTPs are never stored in memory or databases.
 */
export function hashOTP(otp: string, identifier: string): string {
  return crypto
    .createHmac('sha256', OTP_SALT)
    .update(`${identifier}:${otp}`)
    .digest('hex');
}

/**
 * Compares a user-provided OTP against a stored secure OTP hash.
 */
export function verifyOTPHash(otp: string, identifier: string, storedHash: string): boolean {
  const computedHash = hashOTP(otp, identifier);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(computedHash, 'hex'),
      Buffer.from(storedHash, 'hex')
    );
  } catch {
    return false;
  }
}

/**
 * Masks an Aadhaar number to comply with UIDAI data-minimization rules.
 * Accepts a 12-digit Aadhaar and returns "XXXX-XXXX-1234"
 */
export function maskAadhaar(aadhaarNumber: string): string {
  const sanitized = aadhaarNumber.replace(/[\s-]/g, '');
  if (sanitized.length !== 12) {
    return 'XXXX-XXXX-XXXX';
  }
  const lastFour = sanitized.slice(-4);
  return `XXXX-XXXX-${lastFour}`;
}

/**
 * Generates a random crypto-secure numeric OTP of specified length (default 6 digits)
 */
export function generateSecureNumericOTP(length: number = 6): string {
  const digits = '0123456789';
  let otp = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    otp += digits[randomBytes[i] % 10];
  }
  return otp;
}

/**
 * Generates a cryptographically strong random token for temporary access / sessions
 */
export function generateRandomToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}
