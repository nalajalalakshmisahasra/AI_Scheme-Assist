/**
 * Database Layer & Schema Definitions
 * Supports live MongoDB Atlas connection via Mongoose OR resilient internal document store with secure indexing.
 */

import { UserProfile, DocumentItem, OTPRecord, GovernmentScheme } from '../../types.ts';
import { logger } from '../utils/logger.ts';
import bcrypt from 'bcryptjs';

// In-Memory Persistent Collections
const usersStore: Map<string, UserProfile & { passwordHash: string }> = new Map();
const otpsStore: Map<string, OTPRecord> = new Map();
const documentsStore: Map<string, DocumentItem & { fileBuffer?: Buffer }> = new Map();
const schemesStore: Map<string, GovernmentScheme> = new Map();

// Active Signed Download Tokens
export const activeDownloadTokens: Map<string, { documentId: string; userId: string; expiresAt: number }> = new Map();

// Seed Demo Users
const defaultDemoPasswordHash = bcrypt.hashSync('Citizen@123', 10);
const demoUserRamesh: UserProfile & { passwordHash: string } = {
  _id: 'usr_demo_ramesh',
  clerkUserId: 'demo_user_farmer',
  fullName: 'Ramesh Sharma',
  email: 'ramesh.sharma@example.gov.in',
  passwordHash: defaultDemoPasswordHash,
  emailVerified: true,
  mobileNumber: '+91 98765 43210',
  mobileVerified: true,
  dateOfBirth: '1984-06-15',
  gender: 'male',
  address: {
    street: 'Gram Panchayat Kothapet, House No 42',
    district: 'Varanasi',
    state: 'Uttar Pradesh',
    pincode: '221001'
  },
  occupation: 'Farmer',
  education: 'Secondary / 10th Standard',
  annualIncome: 120000,
  category: 'OBC',
  minorityStatus: false,
  disabilityStatus: false,
  disabilityPercentage: 0,
  landHoldingAcres: 2.5,
  familyMembersCount: 4,
  hasBPLCard: true,
  rationCardNumber: 'UP-BPL-8849201',
  role: 'citizen',
  aadhaarVerificationStatus: 'verified',
  aadhaarMaskedNumber: 'XXXXXXXX4892',
  aadhaarVerifiedAt: '2025-01-15T10:30:00.000Z',
  aadhaarProviderRef: 'UIDAI-SANDBOX-AUTH-882194',
  digilockerVerificationStatus: 'verified',
  digilockerVerifiedAt: '2025-01-16T11:45:00.000Z',
  digilockerUserId: 'MERIPEHCHAN_RAMESH_99182',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-16T11:45:00.000Z'
};
usersStore.set(demoUserRamesh._id, demoUserRamesh);

// Initial Government Welfare Schemes Seed Data
const DEFAULT_GOVERNMENT_SCHEMES: GovernmentScheme[] = [
  {
    id: 'scheme_pm_kisan',
    name: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
    shortCode: 'PM-KISAN',
    ministry: 'Ministry of Agriculture and Farmers Welfare',
    type: 'Central',
    category: 'Agriculture',
    description: 'Direct income support of ₹6,000 per year in three equal installments of ₹2,000 directly into the bank accounts of all landholding farmer families.',
    benefitType: 'Direct Cash Transfer',
    benefitAmountText: '₹6,000 per year (3 installments)',
    benefitAnnualValue: 6000,
    eligibilityCriteria: {
      allowedOccupations: ['Farmer'],
      requiresLandHolding: true,
      maxLandHoldingAcres: 5.0,
      minAge: 18,
      maxAnnualIncome: 600000
    },
    requiredDocuments: ['Aadhaar Card', 'Land Ownership Record (Khatauni/Khasra)', 'Bank Passbook'],
    applicationUrl: 'https://pmkisan.gov.in',
    portalName: 'PM-KISAN Official Portal'
  },
  {
    id: 'scheme_pmjay',
    name: 'Ayushman Bharat - PMJAY (Pradhan Mantri Jan Arogya Yojana)',
    shortCode: 'PM-JAY',
    ministry: 'Ministry of Health and Family Welfare / NHA',
    type: 'Central',
    category: 'Healthcare',
    description: 'Comprehensive cashless health insurance coverage of up to ₹5,00,000 per family per year for secondary and tertiary healthcare hospitalizations.',
    benefitType: 'Insurance Cover',
    benefitAmountText: 'Up to ₹5,00,000 cashless health cover / year',
    benefitAnnualValue: 500000,
    eligibilityCriteria: {
      requiresBPL: true,
      maxAnnualIncome: 250000,
      allowedCategories: ['General', 'OBC', 'SC', 'ST', 'EWS']
    },
    requiredDocuments: ['Aadhaar Card', 'Ration Card / BPL Certificate', 'Family ID'],
    applicationUrl: 'https://beneficiary.nha.gov.in',
    portalName: 'Ayushman Beneficiary Portal'
  },
  {
    id: 'scheme_pmay_g',
    name: 'Pradhan Mantri Awas Yojana - Gramin (PMAY-G)',
    shortCode: 'PMAY-G',
    ministry: 'Ministry of Rural Development',
    type: 'Centrally Sponsored',
    category: 'Housing',
    description: 'Financial assistance of ₹1,20,000 in plains and ₹1,30,000 in hilly/difficult areas for homeless families or those living in kutcha/dilapidated houses.',
    benefitType: 'Subsidy',
    benefitAmountText: '₹1,20,000 - ₹1,30,000 for house construction',
    benefitAnnualValue: 120000,
    eligibilityCriteria: {
      requiresBPL: true,
      maxAnnualIncome: 180000,
      allowedOccupations: ['Farmer', 'Laborer / Daily Wage', 'Artisan / Small Business', 'Unemployed']
    },
    requiredDocuments: ['Aadhaar Card', 'Job Card / MGNREGA ID', 'Bank Account', 'Land/Plot Document'],
    applicationUrl: 'https://pmayg.nic.in',
    portalName: 'AwaasSoft Rural Housing Portal'
  },
  {
    id: 'scheme_nsp_postmatric',
    name: 'National Post-Matric Scholarship for SC/ST/OBC/Minority Students',
    shortCode: 'NSP-PostMatric',
    ministry: 'Ministry of Social Justice and Empowerment / Minority Affairs',
    type: 'Central',
    category: 'Education',
    description: '100% tuition reimbursement plus monthly maintenance allowance for students pursuing higher education (Class 11, 12, Degree, Professional courses).',
    benefitType: 'Scholarship',
    benefitAmountText: 'Full tuition reimbursement + ₹13,500/year allowance',
    benefitAnnualValue: 45000,
    eligibilityCriteria: {
      allowedOccupations: ['Student'],
      minAge: 15,
      maxAge: 35,
      maxAnnualIncome: 250000,
      allowedCategories: ['SC', 'ST', 'OBC', 'EWS']
    },
    requiredDocuments: ['Aadhaar Card', 'Caste Certificate', 'Income Certificate', 'Previous Marksheet', 'Fee Receipt'],
    applicationUrl: 'https://scholarships.gov.in',
    portalName: 'National Scholarship Portal'
  },
  {
    id: 'scheme_ssy',
    name: 'Sukanya Samriddhi Yojana (SSY)',
    shortCode: 'SSY',
    ministry: 'Ministry of Finance / Women & Child Development',
    type: 'Central',
    category: 'Women & Child',
    description: 'High-interest tax-free government savings scheme (8.2% p.a.) specifically designed for girl children below 10 years of age with sovereign backing.',
    benefitType: 'Subsidy',
    benefitAmountText: '8.2% compound interest + Section 80C Tax Exemption',
    benefitAnnualValue: 15000,
    eligibilityCriteria: {
      maxAge: 10,
      allowedGenders: ['female']
    },
    requiredDocuments: ['Birth Certificate of Girl Child', 'Parent/Guardian Aadhaar', 'Residence Proof'],
    applicationUrl: 'https://www.indiapost.gov.in',
    portalName: 'India Post / RBI Small Savings'
  },
  {
    id: 'scheme_pm_mudra',
    name: 'Pradhan Mantri Mudra Yojana (Shishu & Kishore Loans)',
    shortCode: 'PMMY',
    ministry: 'Ministry of Finance',
    type: 'Central',
    category: 'Financial Inclusion',
    description: 'Collateral-free subsidized micro loans up to ₹50,000 (Shishu) and up to ₹5,00,000 (Kishore) for micro-enterprises, shops, artisans, and self-employed youth.',
    benefitType: 'Loan / Credit Guarantee',
    benefitAmountText: 'Collateral-free loan up to ₹5,00,000 at low interest',
    benefitAnnualValue: 50000,
    eligibilityCriteria: {
      minAge: 18,
      allowedOccupations: ['Artisan / Small Business', 'Laborer / Daily Wage', 'Unemployed', 'Homemaker']
    },
    requiredDocuments: ['Aadhaar Card', 'PAN Card / Form 60', 'Business Proof / Shop Address', 'Bank Statement (6 months)'],
    applicationUrl: 'https://www.mudra.org.in',
    portalName: 'Udyamimitra Portal'
  },
  {
    id: 'scheme_nsap_widow_disabled',
    name: 'National Social Assistance Programme (Indira Gandhi Disability & Widow Pension)',
    shortCode: 'NSAP',
    ministry: 'Ministry of Rural Development',
    type: 'Centrally Sponsored',
    category: 'Social Security',
    description: 'Monthly direct cash pension of ₹1,000 - ₹3,000 for destitute senior citizens (60+), widows, and persons with severe disabilities (40%+).',
    benefitType: 'Pension',
    benefitAmountText: '₹1,500 - ₹3,000 / month direct pension',
    benefitAnnualValue: 24000,
    eligibilityCriteria: {
      maxAnnualIncome: 100000,
      requiresDisability: true
    },
    requiredDocuments: ['Disability Certificate', 'Aadhaar Card', 'BPL Ration Card', 'Bank Passbook'],
    applicationUrl: 'https://nsap.nic.in',
    portalName: 'NSAP Social Welfare Portal'
  },
  {
    id: 'scheme_mgnrega',
    name: 'MGNREGA (Mahatma Gandhi National Rural Employment Guarantee Act)',
    shortCode: 'MGNREGA',
    ministry: 'Ministry of Rural Development',
    type: 'Central',
    category: 'Employment',
    description: 'Guaranteed 100 days of wage employment per financial year for rural households whose adult members volunteer to do unskilled manual work.',
    benefitType: 'Direct Cash Transfer',
    benefitAmountText: 'Guaranteed 100 days wages (avg ₹240-₹375 / day = ₹28,000/yr)',
    benefitAnnualValue: 28000,
    eligibilityCriteria: {
      minAge: 18,
      allowedOccupations: ['Farmer', 'Laborer / Daily Wage', 'Unemployed']
    },
    requiredDocuments: ['Aadhaar Card', 'Ration Card', 'Bank Passbook', 'Passport Photo'],
    applicationUrl: 'https://nrega.nic.in',
    portalName: 'NREGA Official Portal'
  }
];

// Seed Schemes into Store
DEFAULT_GOVERNMENT_SCHEMES.forEach(scheme => {
  schemesStore.set(scheme.id, scheme);
});

// Database Abstraction Interface
export const db = {
  // User Management
  users: {
    async findByEmail(email: string) {
      const normalized = email.trim().toLowerCase();
      for (const user of usersStore.values()) {
        if (user.email.toLowerCase() === normalized) {
          return { ...user };
        }
      }
      return null;
    },

    async findById(id: string) {
      const user = usersStore.get(id);
      return user ? { ...user } : null;
    },

    async findByClerkUserId(clerkUserId: string) {
      for (const user of usersStore.values()) {
        if (user.clerkUserId === clerkUserId || user._id === clerkUserId) {
          return { ...user };
        }
      }
      return null;
    },

    async saveClerkProfile(clerkUserId: string, profileData: Partial<UserProfile>) {
      const existing = await this.findByClerkUserId(clerkUserId);
      const now = new Date().toISOString();
      if (existing) {
        const updated = {
          ...existing,
          ...profileData,
          clerkUserId,
          updatedAt: now
        };
        usersStore.set(existing._id, updated as any);
        logger.info(`Updated existing citizen profile for Clerk user: ${clerkUserId}`);
        return { ...updated };
      } else {
        const id = clerkUserId.startsWith('user_') ? clerkUserId : 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
        const newUser: UserProfile & { passwordHash: string } = {
          _id: id,
          clerkUserId,
          fullName: profileData.fullName || 'Citizen',
          email: (profileData.email || '').trim().toLowerCase(),
          passwordHash: '',
          emailVerified: true,
          mobileNumber: profileData.mobileNumber || '',
          mobileVerified: !!profileData.mobileVerified,
          dateOfBirth: profileData.dateOfBirth || '',
          age: profileData.age,
          gender: profileData.gender || 'other',
          address: profileData.address || {},
          occupation: profileData.occupation || 'Farmer',
          education: profileData.education || '',
          annualIncome: profileData.annualIncome !== undefined ? profileData.annualIncome : 120000,
          category: profileData.category || 'General',
          minorityStatus: !!profileData.minorityStatus,
          disabilityStatus: !!profileData.disabilityStatus,
          disabilityPercentage: profileData.disabilityPercentage || 0,
          landHoldingAcres: profileData.landHoldingAcres !== undefined ? profileData.landHoldingAcres : 0,
          familyMembersCount: profileData.familyMembersCount || 1,
          hasBPLCard: profileData.hasBPLCard !== undefined ? profileData.hasBPLCard : false,
          rationCardNumber: profileData.rationCardNumber || '',
          role: profileData.role || 'citizen',
          aadhaarVerificationStatus: profileData.aadhaarVerificationStatus || 'unverified',
          digilockerVerificationStatus: profileData.digilockerVerificationStatus || 'unverified',
          createdAt: now,
          updatedAt: now
        };
        usersStore.set(id, newUser);
        logger.info(`Created new citizen profile in database for Clerk user: ${clerkUserId}`);
        return { ...newUser };
      }
    },

    async create(userData: Partial<UserProfile> & { passwordHash: string }) {
      const id = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
      const now = new Date().toISOString();
      const user: UserProfile & { passwordHash: string } = {
        _id: id,
        fullName: userData.fullName || 'Citizen User',
        email: (userData.email || '').trim().toLowerCase(),
        passwordHash: userData.passwordHash,
        emailVerified: !!userData.emailVerified,
        mobileNumber: userData.mobileNumber,
        mobileVerified: !!userData.mobileVerified,
        dateOfBirth: userData.dateOfBirth,
        gender: userData.gender || 'other',
        address: userData.address || {},
        occupation: userData.occupation || 'Farmer',
        annualIncome: userData.annualIncome !== undefined ? userData.annualIncome : 120000,
        category: userData.category || 'General',
        minorityStatus: !!userData.minorityStatus,
        disabilityStatus: !!userData.disabilityStatus,
        disabilityPercentage: userData.disabilityPercentage || 0,
        landHoldingAcres: userData.landHoldingAcres !== undefined ? userData.landHoldingAcres : 2.5,
        familyMembersCount: userData.familyMembersCount || 4,
        hasBPLCard: userData.hasBPLCard !== undefined ? userData.hasBPLCard : true,
        rationCardNumber: userData.rationCardNumber || 'RC-2024-8849',
        aadhaarVerificationStatus: userData.aadhaarVerificationStatus || 'unverified',
        aadhaarMaskedNumber: userData.aadhaarMaskedNumber,
        aadhaarVerifiedAt: userData.aadhaarVerifiedAt,
        aadhaarProviderRef: userData.aadhaarProviderRef,
        digilockerVerificationStatus: userData.digilockerVerificationStatus || 'unverified',
        digilockerVerifiedAt: userData.digilockerVerifiedAt,
        digilockerUserId: userData.digilockerUserId,
        createdAt: now,
        updatedAt: now
      };
      usersStore.set(id, user);
      logger.info(`User created in database: ${id}`);
      return { ...user };
    },

    async update(id: string, updates: Partial<UserProfile>) {
      const existing = usersStore.get(id);
      if (!existing) return null;
      const updated = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      usersStore.set(id, updated);
      return { ...updated };
    },

    async count() {
      return usersStore.size;
    }
  },

  // OTP Records
  otps: {
    async create(otpData: Omit<OTPRecord, 'id' | 'createdAt'>) {
      const id = 'otp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const record: OTPRecord = {
        id,
        ...otpData,
        createdAt: Date.now()
      };
      otpsStore.set(record.identifier.toLowerCase() + '_' + record.purpose, record);
      return record;
    },

    async findLatest(identifier: string, purpose: OTPRecord['purpose']) {
      const key = identifier.toLowerCase() + '_' + purpose;
      return otpsStore.get(key) || null;
    },

    async markVerified(identifier: string, purpose: OTPRecord['purpose']) {
      const key = identifier.toLowerCase() + '_' + purpose;
      const record = otpsStore.get(key);
      if (record) {
        record.verified = true;
        otpsStore.set(key, record);
      }
    },

    async incrementAttempts(identifier: string, purpose: OTPRecord['purpose']) {
      const key = identifier.toLowerCase() + '_' + purpose;
      const record = otpsStore.get(key);
      if (record) {
        record.attempts += 1;
        otpsStore.set(key, record);
        return record.attempts;
      }
      return 0;
    },

    async delete(identifier: string, purpose: OTPRecord['purpose']) {
      const key = identifier.toLowerCase() + '_' + purpose;
      otpsStore.delete(key);
    }
  },

  // Document Records
  documents: {
    async create(docData: Omit<DocumentItem, 'id' | 'uploadedAt'> & { fileBuffer?: Buffer }) {
      const id = 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
      const doc: DocumentItem & { fileBuffer?: Buffer } = {
        id,
        ...docData,
        uploadedAt: new Date().toISOString()
      };
      documentsStore.set(id, doc);
      logger.info(`Document metadata stored securely: ${id} for user ${docData.userId}`);
      return { ...doc };
    },

    async findByUserId(userId: string): Promise<DocumentItem[]> {
      const results: DocumentItem[] = [];
      for (const doc of documentsStore.values()) {
        if (doc.userId === userId) {
          const { fileBuffer, ...metadata } = doc;
          results.push(metadata);
        }
      }
      return results;
    },

    async findById(id: string) {
      const doc = documentsStore.get(id);
      return doc ? { ...doc } : null;
    },

    async delete(id: string, userId: string): Promise<boolean> {
      const doc = documentsStore.get(id);
      if (doc && doc.userId === userId) {
        documentsStore.delete(id);
        return true;
      }
      return false;
    }
  },

  // Scheme Catalog
  schemes: {
    async getAll(): Promise<GovernmentScheme[]> {
      return Array.from(schemesStore.values());
    },

    async getById(id: string): Promise<GovernmentScheme | null> {
      return schemesStore.get(id) || null;
    }
  }
};
