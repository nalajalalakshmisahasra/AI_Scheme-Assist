/**
 * AI Citizen Benefit Assistant - TypeScript Definitions
 */

export type Gender = 'male' | 'female' | 'transgender' | 'other';
export type Category = 'General' | 'OBC' | 'SC' | 'ST' | 'EWS';
export type Occupation = 'Farmer' | 'Laborer / Daily Wage' | 'Artisan / Small Business' | 'Student' | 'Unemployed' | 'Salaried Private' | 'Government Employee' | 'Senior Citizen / Retired' | 'Homemaker';
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'failed';

export type UserRole = 'citizen' | 'developer' | 'admin';

export type DocumentType =
  | 'income_certificate'
  | 'caste_certificate'
  | 'residence_certificate'
  | 'domicile_certificate'
  | 'disability_certificate'
  | 'ration_card'
  | 'bank_passbook'
  | 'land_record'
  | 'aadhaar_card'
  | 'other';

export interface UserProfile {
  _id: string;
  clerkUserId?: string;
  fullName: string;
  email: string;
  emailVerified: boolean;
  mobileNumber?: string;
  mobileVerified?: boolean;
  dateOfBirth?: string;
  age?: number;
  gender?: Gender;
  address?: {
    street?: string;
    city?: string;
    district?: string;
    state?: string;
    pincode?: string;
  };
  occupation?: Occupation;
  education?: string;
  annualIncome?: number; // In INR
  category?: Category;
  minorityStatus?: boolean;
  disabilityStatus?: boolean;
  disabilityPercentage?: number;
  landHoldingAcres?: number; // For farmer schemes
  familyMembersCount?: number;
  hasBPLCard?: boolean;
  rationCardNumber?: string;
  role?: UserRole;
  
  // Aadhaar Compliance Details (Only masked reference is stored)
  aadhaarVerificationStatus: VerificationStatus;
  aadhaarMaskedNumber?: string; // e.g., "XXXX-XXXX-4892"
  aadhaarVerifiedAt?: string;
  aadhaarProviderRef?: string;
  
  // DigiLocker Compliance Details
  digilockerVerificationStatus: VerificationStatus;
  digilockerVerifiedAt?: string;
  digilockerUserId?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  refreshToken?: string;
  user?: UserProfile;
  otpSent?: boolean;
  email?: string;
}

export interface OTPRecord {
  id: string;
  identifier: string; // Email or Mobile
  otpHash: string;
  purpose: 'registration' | 'login' | 'aadhaar_verify' | 'email_verify';
  expiresAt: number;
  verified: boolean;
  attempts: number;
  maxAttempts: number;
  createdAt: number;
}

export interface DocumentItem {
  id: string;
  userId: string;
  documentType: DocumentType;
  title: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number; // bytes
  storageKey: string;
  sha256Checksum: string;
  checksumSha256?: string;
  verificationStatus: VerificationStatus;
  verifiedVia?: 'manual' | 'digilocker' | 'e_district';
  digilockerDocId?: string;
  issuerAuthority?: string;
  uploadedAt: string;
  downloadUrl?: string; // Temporary signed token url
}

export interface GovernmentScheme {
  id: string;
  name: string;
  shortCode: string;
  ministry: string;
  type: 'Central' | 'State' | 'Centrally Sponsored';
  category: string;
  description: string;
  benefitType: string;
  benefitAmountText: string;
  benefitFrequency?: string;
  benefitAnnualValue: number; // In INR for calculation
  eligibilityCriteria: {
    maxAnnualIncome?: number;
    minAge?: number;
    maxAge?: number;
    allowedGenders?: Gender[];
    allowedCategories?: Category[];
    allowedOccupations?: Occupation[];
    requiresLandHolding?: boolean;
    maxLandHoldingAcres?: number;
    requiresDisability?: boolean;
    requiresBPL?: boolean;
    requiresMinority?: boolean;
    targetStates?: string[]; // Empty for pan-India
  };
  requiredDocuments: string[];
  applicationUrl: string;
  portalName: string;
}

export interface SchemeMatchResult {
  scheme: GovernmentScheme;
  isEligible: boolean;
  matchScore: number; // 0 - 100%
  eligibleReasons: string[];
  ineligibleReasons: string[];
  missingDocuments: string[];
  actionPlan: string[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  token?: string;
  user?: UserProfile;
  documents?: DocumentItem[];
  schemes?: GovernmentScheme[];
  answer?: string;
  deliveries?: any[];
  transactionId?: string;
  maskedAadhaar?: string;
  disclaimer?: string;
  stateToken?: string;
  authUrl?: string;
  status?: string;
  stats?: any;
  [key: string]: any;
}
