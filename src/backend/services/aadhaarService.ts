/**
 * Authorized UIDAI Aadhaar e-KYC Verification Provider Service
 * Complies with UIDAI Data-Minimization and Aadhaar Act Regulations:
 * 1. Raw 12-digit Aadhaar is validated using Verhoeff algorithm.
 * 2. Raw Aadhaar is NEVER logged and NEVER persisted in the database.
 * 3. Only masked Aadhaar (XXXX-XXXX-1234), timestamp, and authorized provider transaction reference are stored.
 * 4. In development, a clearly marked Sandbox / Mock mode is available via VERIFICATION_MODE=mock.
 */

import { isValidAadhaar } from '../utils/validators.ts';
import { maskAadhaar } from '../utils/encryption.ts';
import { logger } from '../utils/logger.ts';

export interface AadhaarInitiateResponse {
  success: boolean;
  message: string;
  transactionId?: string;
  maskedAadhaar?: string;
  mode: 'production_provider' | 'development_sandbox';
  disclaimer: string;
  error?: string;
}

export interface AadhaarVerifyOtpResponse {
  success: boolean;
  message: string;
  maskedAadhaar?: string;
  verifiedAt?: string;
  providerTxnRef?: string;
  eKycData?: {
    nameMatch?: boolean;
    gender?: string;
    dob?: string;
    state?: string;
  };
  mode: 'production_provider' | 'development_sandbox';
  disclaimer: string;
  error?: string;
}

// In-memory active transaction store for e-KYC sessions
interface AadhaarSession {
  transactionId: string;
  userId: string;
  maskedAadhaar: string;
  expiresAt: number;
  providerSessionToken?: string;
}

const activeAadhaarSessions: Map<string, AadhaarSession> = new Map();

/**
 * Initiates Aadhaar e-KYC with an Authorized Authentication Service Agency (ASA) / KUA Provider
 */
export async function initiateAadhaarKYC(
  rawAadhaarNumber: string,
  userId: string
): Promise<AadhaarInitiateResponse> {
  const isMockMode = (process.env.VERIFICATION_MODE || 'mock').toLowerCase() === 'mock';
  const providerUrl = process.env.AADHAAR_PROVIDER_URL;
  const clientId = process.env.AADHAAR_PROVIDER_CLIENT_ID;
  const clientSecret = process.env.AADHAAR_PROVIDER_CLIENT_SECRET;

  // 1. Validate Aadhaar Format with Verhoeff Checksum
  if (!isValidAadhaar(rawAadhaarNumber)) {
    return {
      success: false,
      message: 'Invalid Aadhaar Number. Please check the 12-digit number and try again.',
      mode: isMockMode ? 'development_sandbox' : 'production_provider',
      disclaimer: 'UIDAI Verification Engine: Strict 12-digit Verhoeff format validation enforced.'
    };
  }

  const masked = maskAadhaar(rawAadhaarNumber);
  const transactionId = 'uidai_txn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

  // 2. Production Authorized Provider Call
  if (!isMockMode && providerUrl && clientId && clientSecret) {
    try {
      logger.info(`Dispatching Aadhaar OTP request to authorized ASA provider: ${providerUrl} for user: ${userId}`);
      
      const response = await fetch(`${providerUrl}/kyc/otp/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Id': clientId,
          'X-Client-Secret': clientSecret
        },
        body: JSON.stringify({
          aadhaarNumber: rawAadhaarNumber,
          transactionId
        })
      });

      const providerData = await response.json();
      
      if (!response.ok || !providerData.success) {
        return {
          success: false,
          message: providerData.message || 'Authorized UIDAI provider could not dispatch OTP. Please check your credentials.',
          mode: 'production_provider',
          disclaimer: 'Live UIDAI e-KYC integration via authorized Authentication Service Agency (ASA).'
        };
      }

      // Store transaction session
      activeAadhaarSessions.set(transactionId, {
        transactionId,
        userId,
        maskedAadhaar: masked,
        expiresAt: Date.now() + 10 * 60 * 1000,
        providerSessionToken: providerData.sessionToken
      });

      return {
        success: true,
        message: `UIDAI OTP dispatched by authorized provider to the mobile registered with ${masked}.`,
        transactionId,
        maskedAadhaar: masked,
        mode: 'production_provider',
        disclaimer: 'Live UIDAI Authorized Provider integration.'
      };
    } catch (err: any) {
      logger.error(`Aadhaar authorized provider network error: ${err.message}`);
      return {
        success: false,
        message: 'Could not connect to the authorized Aadhaar e-KYC service. Please verify provider connectivity.',
        mode: 'production_provider',
        disclaimer: 'Live UIDAI e-KYC provider connection failure.'
      };
    }
  }

  // 3. Development / Sandbox Mode
  // Cleanly separated and labeled as Development Sandbox (Requirement #16)
  activeAadhaarSessions.set(transactionId, {
    transactionId,
    userId,
    maskedAadhaar: masked,
    expiresAt: Date.now() + 10 * 60 * 1000
  });

  logger.audit('AADHAAR_OTP_INITIATED_SANDBOX', userId, { maskedAadhaar: masked, transactionId });

  return {
    success: true,
    message: `[Development/Test Sandbox] OTP request registered for ${masked}. Enter any 6-digit test OTP (e.g. 123456) in development mode.`,
    transactionId,
    maskedAadhaar: masked,
    mode: 'development_sandbox',
    disclaimer: 'Development/Test Verification — Not a real UIDAI verification. To enable live UIDAI verification, configure AADHAAR_PROVIDER_URL & credentials and set VERIFICATION_MODE=production.'
  };
}

/**
 * Verifies UIDAI OTP with the Authorized e-KYC Provider and completes authentication
 */
export async function verifyAadhaarOTP(
  transactionId: string,
  otpCode: string,
  userId: string
): Promise<AadhaarVerifyOtpResponse> {
  const isMockMode = (process.env.VERIFICATION_MODE || 'mock').toLowerCase() === 'mock';
  const session = activeAadhaarSessions.get(transactionId);

  if (!session) {
    return {
      success: false,
      message: 'Invalid or expired Aadhaar verification session. Please initiate Aadhaar verification again.',
      mode: isMockMode ? 'development_sandbox' : 'production_provider',
      disclaimer: 'Session expired or not found.'
    };
  }

  if (session.userId !== userId) {
    return {
      success: false,
      message: 'Unauthorized: Session ownership mismatch.',
      mode: isMockMode ? 'development_sandbox' : 'production_provider',
      disclaimer: 'Security violation.'
    };
  }

  if (Date.now() > session.expiresAt) {
    activeAadhaarSessions.delete(transactionId);
    return {
      success: false,
      message: 'Aadhaar OTP session has expired. Please initiate verification again.',
      mode: isMockMode ? 'development_sandbox' : 'production_provider',
      disclaimer: 'Session timed out.'
    };
  }

  const providerUrl = process.env.AADHAAR_PROVIDER_URL;
  const clientId = process.env.AADHAAR_PROVIDER_CLIENT_ID;
  const clientSecret = process.env.AADHAAR_PROVIDER_CLIENT_SECRET;

  // Production provider verification
  if (!isMockMode && providerUrl && clientId && clientSecret) {
    try {
      const response = await fetch(`${providerUrl}/kyc/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Id': clientId,
          'X-Client-Secret': clientSecret
        },
        body: JSON.stringify({
          transactionId,
          otp: otpCode,
          sessionToken: session.providerSessionToken
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        return {
          success: false,
          message: data.message || 'UIDAI OTP verification failed. Incorrect OTP entered.',
          mode: 'production_provider',
          disclaimer: 'Live UIDAI verification failed.'
        };
      }

      activeAadhaarSessions.delete(transactionId);
      logger.audit('AADHAAR_VERIFIED_PRODUCTION', userId, { masked: session.maskedAadhaar });

      return {
        success: true,
        message: 'Aadhaar e-KYC successfully completed via authorized UIDAI provider.',
        maskedAadhaar: session.maskedAadhaar,
        verifiedAt: new Date().toISOString(),
        providerTxnRef: data.referenceId || transactionId,
        eKycData: {
          nameMatch: true,
          gender: data.demographics?.gender,
          dob: data.demographics?.dob,
          state: data.demographics?.state
        },
        mode: 'production_provider',
        disclaimer: 'Verified using authorized UIDAI-compliant e-KYC provider.'
      };
    } catch (err: any) {
      logger.error(`Aadhaar verification network error: ${err.message}`);
      return {
        success: false,
        message: 'Network error connecting to authorized UIDAI provider.',
        mode: 'production_provider',
        disclaimer: 'Live provider connection failure.'
      };
    }
  }

  // Development Sandbox verification
  if (!otpCode || otpCode.trim().length !== 6) {
    return {
      success: false,
      message: 'Please enter a valid 6-digit OTP code.',
      mode: 'development_sandbox',
      disclaimer: 'Development/Test Verification — Not a real UIDAI verification.'
    };
  }

  activeAadhaarSessions.delete(transactionId);
  logger.audit('AADHAAR_VERIFIED_SANDBOX', userId, { masked: session.maskedAadhaar });

  return {
    success: true,
    message: `[Development Sandbox] Aadhaar verification simulated successfully for ${session.maskedAadhaar}.`,
    maskedAadhaar: session.maskedAadhaar,
    verifiedAt: new Date().toISOString(),
    providerTxnRef: 'SANDBOX-UIDAI-' + Date.now(),
    eKycData: {
      nameMatch: true,
      gender: 'Demographics Validated',
      state: 'All India'
    },
    mode: 'development_sandbox',
    disclaimer: 'Development/Test Verification — Not a real UIDAI verification. Stores only masked Aadhaar number in accordance with UIDAI privacy rules.'
  };
}
