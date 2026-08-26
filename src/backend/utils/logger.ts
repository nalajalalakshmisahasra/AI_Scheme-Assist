/**
 * Safe Audit & Event Logger
 * Sanitizes log output to ensure no passwords, OTPs, raw Aadhaar numbers, or tokens are logged.
 */

const SENSITIVE_KEYS = [
  'password',
  'passwordHash',
  'otp',
  'otpCode',
  'otpHash',
  'aadhaar',
  'aadhaarNumber',
  'rawAadhaar',
  'token',
  'accessToken',
  'refreshToken',
  'client_secret',
  'secret',
  'storageSecret',
  'pin'
];

function sanitizeLogObject(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    // Redact potential 12-digit Aadhaar numbers in strings
    let sanitized = obj.replace(/\b\d{4}[-\s]?\d{4}[-\s]?(\d{4})\b/g, 'XXXX-XXXX-$1');
    // Redact potential 6-digit OTPs in strings
    sanitized = sanitized.replace(/\bOTP\s*[:=]?\s*\d{6}\b/gi, 'OTP:[REDACTED]');
    return sanitized;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeLogObject);
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      if (SENSITIVE_KEYS.some(sKey => key.toLowerCase().includes(sKey.toLowerCase()))) {
        cleaned[key] = '[REDACTED_SECURE]';
      } else {
        cleaned[key] = sanitizeLogObject(val);
      }
    }
    return cleaned;
  }
  return obj;
}

export const logger = {
  info: (message: string, meta?: any) => {
    const timestamp = new Date().toISOString();
    if (meta) {
      console.log(`[INFO] [${timestamp}] ${message}`, sanitizeLogObject(meta));
    } else {
      console.log(`[INFO] [${timestamp}] ${message}`);
    }
  },
  warn: (message: string, meta?: any) => {
    const timestamp = new Date().toISOString();
    if (meta) {
      console.warn(`[WARN] [${timestamp}] ${message}`, sanitizeLogObject(meta));
    } else {
      console.warn(`[WARN] [${timestamp}] ${message}`);
    }
  },
  error: (message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    const errorMsg = error instanceof Error ? error.message : error;
    console.error(`[ERROR] [${timestamp}] ${message}: ${errorMsg}`);
  },
  audit: (action: string, actorId: string, details?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[AUDIT_TRAIL] [${timestamp}] Action: ${action} | Actor: ${actorId}`, sanitizeLogObject(details || {}));
  }
};
