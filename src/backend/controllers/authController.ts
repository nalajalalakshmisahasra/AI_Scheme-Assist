/**
 * Authentication & Registration Controller
 */

import { Request, Response } from 'express';
import { db } from '../config/db.ts';
import { hashPassword, comparePassword } from '../utils/encryption.ts';
import {
  isValidEmail,
  sanitizeInput,
  validateRegisterPayload,
  validateLoginPayload,
  validateSendOtpPayload,
  validateVerifyOtpPayload
} from '../utils/validators.ts';
import { requestAndSendOTP, verifySubmittedOTP } from '../services/otpService.ts';
import { generateAuthToken, AuthenticatedRequest } from '../middleware/authMiddleware.ts';
import { logger } from '../utils/logger.ts';

export async function sendEmailOtpHandler(req: Request, res: Response): Promise<void> {
  const validation = validateSendOtpPayload(req.body);
  if (!validation.valid) {
    res.status(400).json({ success: false, message: validation.error });
    return;
  }

  const { email, fullName, purpose = 'registration' } = req.body;
  const result = await requestAndSendOTP(email, purpose, fullName ? sanitizeInput(fullName) : 'Citizen');
  res.status(result.success ? 200 : 400).json(result);
}

export async function verifyEmailOtpHandler(req: Request, res: Response): Promise<void> {
  const validation = validateVerifyOtpPayload(req.body);
  if (!validation.valid) {
    res.status(400).json({ success: false, message: validation.error });
    return;
  }

  const { email, otp, purpose = 'registration' } = req.body;
  const result = await verifySubmittedOTP(email, otp.trim(), purpose);

  if (result.success) {
    // If the user already exists, mark their email as verified
    const user = await db.users.findByEmail(email);
    if (user) {
      await db.users.update(user._id, { emailVerified: true });
    }
  }

  res.status(result.success ? 200 : 400).json(result);
}

export async function registerHandler(req: Request, res: Response): Promise<void> {
  const validation = validateRegisterPayload(req.body);
  if (!validation.valid) {
    res.status(400).json({ success: false, message: validation.error });
    return;
  }

  const {
    fullName,
    email,
    password,
    mobileNumber,
    dateOfBirth,
    gender,
    address,
    occupation,
    annualIncome,
    category,
    minorityStatus,
    disabilityStatus,
    disabilityPercentage,
    landHoldingAcres,
    hasBPLCard,
    rationCardNumber,
    emailVerified = false
  } = req.body;

  // 2. Check unique email constraint
  const existingUser = await db.users.findByEmail(email.trim().toLowerCase());
  if (existingUser) {
    res.status(409).json({
      success: false,
      message: 'An account with this email already exists. Please log in or use a different email.'
    });
    return;
  }

  // 3. Hash password securely
  const passwordHash = await hashPassword(password);

  // 4. Create user in database
  const newUser = await db.users.create({
    fullName: sanitizeInput(fullName),
    email: email.trim().toLowerCase(),
    passwordHash,
    emailVerified: !!emailVerified,
    mobileNumber: mobileNumber ? sanitizeInput(mobileNumber) : undefined,
    dateOfBirth: typeof dateOfBirth === 'string' ? sanitizeInput(dateOfBirth) : undefined,
    gender,
    address: address && typeof address === 'object' ? {
      street: address.street ? sanitizeInput(address.street) : undefined,
      city: address.city ? sanitizeInput(address.city) : undefined,
      district: address.district ? sanitizeInput(address.district) : undefined,
      state: address.state ? sanitizeInput(address.state) : undefined,
      pincode: address.pincode ? sanitizeInput(address.pincode) : undefined
    } : {},
    occupation,
    annualIncome: annualIncome !== undefined ? Number(annualIncome) : 120000,
    category,
    minorityStatus: !!minorityStatus,
    disabilityStatus: !!disabilityStatus,
    disabilityPercentage: disabilityPercentage ? Number(disabilityPercentage) : 0,
    landHoldingAcres: landHoldingAcres !== undefined ? Number(landHoldingAcres) : 0,
    hasBPLCard: !!hasBPLCard,
    rationCardNumber: rationCardNumber ? sanitizeInput(rationCardNumber) : undefined,
    aadhaarVerificationStatus: 'unverified',
    digilockerVerificationStatus: 'unverified'
  });

  // 5. Generate JWT token
  const token = generateAuthToken(newUser);

  logger.audit('USER_REGISTERED', newUser._id, { email: newUser.email });

  const { passwordHash: _, ...safeProfile } = newUser;

  res.status(201).json({
    success: true,
    message: 'Citizen account registered successfully.',
    token,
    user: safeProfile
  });
}

export async function loginHandler(req: Request, res: Response): Promise<void> {
  const validation = validateLoginPayload(req.body);
  if (!validation.valid) {
    res.status(400).json({ success: false, message: validation.error });
    return;
  }

  const { email, password } = req.body;


  // Find user
  const user = await db.users.findByEmail(email);
  if (!user) {
    res.status(401).json({ success: false, message: 'Invalid email or password.' });
    return;
  }

  // Compare bcrypt password
  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    logger.warn(`Failed login attempt for user: ${email}`);
    res.status(401).json({ success: false, message: 'Invalid email or password.' });
    return;
  }

  const token = generateAuthToken(user);
  logger.audit('USER_LOGGED_IN', user._id, { email: user.email });

  const { passwordHash: _, ...safeProfile } = user;

  res.status(200).json({
    success: true,
    message: 'Logged in successfully.',
    token,
    user: safeProfile
  });
}

export async function getCurrentUserHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated.' });
    return;
  }

  const user = await db.users.findById(req.user._id);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found.' });
    return;
  }

  const { passwordHash: _, ...safeProfile } = user;

  res.status(200).json({
    success: true,
    user: safeProfile
  });
}

export async function logoutHandler(_req: Request, res: Response): Promise<void> {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
}
