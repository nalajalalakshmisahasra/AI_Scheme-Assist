/**
 * Input Validation & Sanitization Utilities
 * Strict schema validation, format verification, and binary magic-bytes checking.
 */

import { Gender, Category, Occupation, DocumentType } from '../../types.ts';

// Verhoeff algorithm multiplication table
const verhoeffD = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];

// Verhoeff algorithm permutation table
const verhoeffP = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];

/**
 * Validates an Aadhaar number using the UIDAI-prescribed Verhoeff checksum algorithm
 */
export function isValidAadhaar(aadhaar: string): boolean {
  if (typeof aadhaar !== 'string') return false;
  const sanitized = aadhaar.replace(/[\s-]/g, '');
  if (!/^\d{12}$/.test(sanitized)) {
    return false;
  }
  // Disallow numbers starting with 0 or 1
  if (sanitized.startsWith('0') || sanitized.startsWith('1')) {
    return false;
  }

  let c = 0;
  const invertedArray = sanitized.split('').map(Number).reverse();

  for (let i = 0; i < invertedArray.length; i++) {
    c = verhoeffD[c][verhoeffP[i % 8][invertedArray[i]]];
  }

  return c === 0;
}

/**
 * Validates email format strictly
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  if (email.length > 254) return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim().toLowerCase());
}

/**
 * Validates 10-digit Indian Mobile number
 */
export function isValidIndianMobile(mobile: string): boolean {
  if (!mobile || typeof mobile !== 'string') return false;
  const sanitized = mobile.replace(/[\s-+]/g, '').slice(-10);
  return /^[6-9]\d{9}$/.test(sanitized);
}

/**
 * Sanitizes generic user text input to prevent XSS / script injections
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '') // remove direct tag brackets
    .trim();
}

/**
 * Allowed MIME types for government document uploads
 */
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp'
];

export const MAX_DOCUMENT_FILE_SIZE = 10 * 1024 * 1024; // 10 Megabytes

export function isAllowedMimeType(mimeType: string): boolean {
  if (typeof mimeType !== 'string') return false;
  return ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase().trim());
}

/**
 * Inspects binary magic-bytes (file header signatures) of an uploaded buffer.
 * Rejects disguised or malicious executables/scripts regardless of client-supplied MIME or extension.
 */
export function detectBufferMimeType(buffer: Buffer): string | null {
  if (!buffer || buffer.length < 4) return null;

  // 1. PDF Signature: %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D)
  if (
    buffer.length >= 5 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  ) {
    return 'application/pdf';
  }

  // 2. PNG Signature: \x89PNG\r\n\x1a\n (0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // 3. JPEG Signature: 0xFF, 0xD8, 0xFF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // 4. WebP Signature: RIFF....WEBP (0x52 0x49 0x46 0x46 at 0..3 and 0x57 0x45 0x42 0x50 at 8..11)
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  return null;
}

// -------------------------------------------------------------
// STRICT SCHEMA VALIDATION HELPERS
// -------------------------------------------------------------

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export const VALID_GENDERS: Gender[] = ['male', 'female', 'transgender', 'other'];
export const VALID_CATEGORIES: Category[] = ['General', 'OBC', 'SC', 'ST', 'EWS'];
export const VALID_OCCUPATIONS: Occupation[] = [
  'Farmer',
  'Laborer / Daily Wage',
  'Artisan / Small Business',
  'Student',
  'Unemployed',
  'Salaried Private',
  'Government Employee',
  'Senior Citizen / Retired',
  'Homemaker'
];
export const VALID_DOCUMENT_TYPES: DocumentType[] = [
  'income_certificate',
  'caste_certificate',
  'residence_certificate',
  'domicile_certificate',
  'disability_certificate',
  'ration_card',
  'bank_passbook',
  'land_record',
  'aadhaar_card',
  'other'
];

/**
 * Validates registration request payload strictly
 */
export function validateRegisterPayload(data: any): ValidationResult {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Request body must be a valid JSON object.' };
  }

  // fullName: string, 2..100 characters
  if (!data.fullName || typeof data.fullName !== 'string' || data.fullName.trim().length < 2 || data.fullName.trim().length > 100) {
    return { valid: false, error: 'Full name must be a string between 2 and 100 characters.' };
  }

  // email: strictly valid email, max 254 chars
  if (!data.email || !isValidEmail(data.email)) {
    return { valid: false, error: 'Please provide a valid email address.' };
  }

  // password: min 8 chars, max 128 chars
  if (!data.password || typeof data.password !== 'string' || data.password.length < 8 || data.password.length > 128) {
    return { valid: false, error: 'Password must be between 8 and 128 characters.' };
  }

  // optional mobileNumber
  if (data.mobileNumber && !isValidIndianMobile(data.mobileNumber)) {
    return { valid: false, error: 'Mobile number must be a valid 10-digit Indian phone number.' };
  }

  // optional gender
  if (data.gender && !VALID_GENDERS.includes(data.gender)) {
    return { valid: false, error: `Gender must be one of: ${VALID_GENDERS.join(', ')}` };
  }

  // optional category
  if (data.category && !VALID_CATEGORIES.includes(data.category)) {
    return { valid: false, error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` };
  }

  // optional annualIncome
  if (data.annualIncome !== undefined && (typeof data.annualIncome !== 'number' || data.annualIncome < 0 || data.annualIncome > 1000000000)) {
    return { valid: false, error: 'Annual income must be a valid non-negative number.' };
  }

  // optional landHoldingAcres
  if (data.landHoldingAcres !== undefined && (typeof data.landHoldingAcres !== 'number' || data.landHoldingAcres < 0 || data.landHoldingAcres > 100000)) {
    return { valid: false, error: 'Land holding must be a valid non-negative number of acres.' };
  }

  return { valid: true };
}

/**
 * Validates login request payload strictly
 */
export function validateLoginPayload(data: any): ValidationResult {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Request body must be a valid JSON object.' };
  }
  if (!data.email || !isValidEmail(data.email)) {
    return { valid: false, error: 'Please provide a valid email address.' };
  }
  if (!data.password || typeof data.password !== 'string' || data.password.length < 1 || data.password.length > 128) {
    return { valid: false, error: 'Password is required.' };
  }
  return { valid: true };
}

/**
 * Validates send-email-otp payload strictly
 */
export function validateSendOtpPayload(data: any): ValidationResult {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Request body must be a valid JSON object.' };
  }
  if (!data.email || !isValidEmail(data.email)) {
    return { valid: false, error: 'Please provide a valid email address.' };
  }
  if (data.purpose && (typeof data.purpose !== 'string' || data.purpose.length > 50)) {
    return { valid: false, error: 'Invalid purpose parameter.' };
  }
  return { valid: true };
}

/**
 * Validates verify-email-otp payload strictly
 */
export function validateVerifyOtpPayload(data: any): ValidationResult {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Request body must be a valid JSON object.' };
  }
  if (!data.email || !isValidEmail(data.email)) {
    return { valid: false, error: 'Please provide a valid email address.' };
  }
  if (!data.otp || typeof data.otp !== 'string' || !/^\d{6}$/.test(data.otp.trim())) {
    return { valid: false, error: 'OTP must be exactly 6 numeric digits.' };
  }
  return { valid: true };
}

/**
 * Validates ask-ai query payload strictly
 */
export function validateAskAIPayload(data: any): ValidationResult {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Request body must be a valid JSON object.' };
  }
  if (!data.query || typeof data.query !== 'string' || data.query.trim().length === 0) {
    return { valid: false, error: 'Query parameter is required and cannot be empty.' };
  }
  if (data.query.trim().length > 2000) {
    return { valid: false, error: 'Query exceeds maximum allowed length of 2000 characters.' };
  }
  return { valid: true };
}

/**
 * Validates citizen profile updates strictly
 */
export function validateProfileUpdatePayload(data: any): ValidationResult {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Request body must be a valid JSON object.' };
  }

  if (data.fullName !== undefined) {
    if (typeof data.fullName !== 'string' || data.fullName.trim().length < 2 || data.fullName.trim().length > 100) {
      return { valid: false, error: 'Full name must be between 2 and 100 characters.' };
    }
  }

  if (data.gender !== undefined && !VALID_GENDERS.includes(data.gender)) {
    return { valid: false, error: `Invalid gender. Must be one of: ${VALID_GENDERS.join(', ')}` };
  }

  if (data.category !== undefined && !VALID_CATEGORIES.includes(data.category)) {
    return { valid: false, error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` };
  }

  if (data.occupation !== undefined && !VALID_OCCUPATIONS.includes(data.occupation)) {
    return { valid: false, error: `Invalid occupation. Must be one of: ${VALID_OCCUPATIONS.join(', ')}` };
  }

  if (data.annualIncome !== undefined) {
    const inc = Number(data.annualIncome);
    if (isNaN(inc) || inc < 0 || inc > 1000000000) {
      return { valid: false, error: 'Annual income must be a valid non-negative number.' };
    }
  }

  if (data.landHoldingAcres !== undefined) {
    const acres = Number(data.landHoldingAcres);
    if (isNaN(acres) || acres < 0 || acres > 100000) {
      return { valid: false, error: 'Land holding must be a valid non-negative number of acres.' };
    }
  }

  if (data.disabilityPercentage !== undefined) {
    const dis = Number(data.disabilityPercentage);
    if (isNaN(dis) || dis < 0 || dis > 100) {
      return { valid: false, error: 'Disability percentage must be between 0 and 100.' };
    }
  }

  return { valid: true };
}
