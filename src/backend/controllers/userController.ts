/**
 * User Profile & Demographic Controller
 */

import { Request, Response } from 'express';
import { db } from '../config/db.ts';
import { AuthenticatedRequest } from '../middleware/authMiddleware.ts';
import { sanitizeInput, validateProfileUpdatePayload } from '../utils/validators.ts';
import { logger } from '../utils/logger.ts';

export async function getClerkProfileHandler(req: Request, res: Response): Promise<void> {
  const { clerkUserId } = req.params;
  if (!clerkUserId || typeof clerkUserId !== 'string' || clerkUserId.length > 255) {
    res.status(400).json({ success: false, message: 'Invalid Clerk User ID.' });
    return;
  }

  const user = await db.users.findByClerkUserId(clerkUserId);
  if (!user) {
    res.status(200).json({ success: true, user: null, hasProfile: false });
    return;
  }

  const { passwordHash: _, ...safeProfile } = user;
  res.status(200).json({ success: true, user: safeProfile, hasProfile: true });
}

export async function saveClerkProfileHandler(req: Request, res: Response): Promise<void> {
  const { clerkUserId, profileData } = req.body;
  if (!clerkUserId || typeof clerkUserId !== 'string' || clerkUserId.length > 255) {
    res.status(400).json({ success: false, message: 'Invalid Clerk User ID.' });
    return;
  }

  if (profileData) {
    const validation = validateProfileUpdatePayload(profileData);
    if (!validation.valid) {
      res.status(400).json({ success: false, message: validation.error });
      return;
    }
  }

  const user = await db.users.saveClerkProfile(clerkUserId, profileData || {});
  const { passwordHash: _, ...safeProfile } = user;
  logger.audit('CLERK_USER_PROFILE_SAVED', clerkUserId, { user: safeProfile.fullName });
  res.status(200).json({
    success: true,
    message: 'Citizen profile saved successfully.',
    user: safeProfile
  });
}

export async function getProfileHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized.' });
    return;
  }

  const user = await db.users.findById(req.user._id);
  if (!user) {
    res.status(404).json({ success: false, message: 'User profile not found.' });
    return;
  }

  const { passwordHash: _, ...safeProfile } = user;
  res.status(200).json({ success: true, user: safeProfile });
}

export async function updateProfileHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized.' });
    return;
  }

  const validation = validateProfileUpdatePayload(req.body);
  if (!validation.valid) {
    res.status(400).json({ success: false, message: validation.error });
    return;
  }

  const allowedUpdates = [
    'fullName',
    'mobileNumber',
    'dateOfBirth',
    'gender',
    'address',
    'occupation',
    'annualIncome',
    'category',
    'minorityStatus',
    'disabilityStatus',
    'disabilityPercentage',
    'landHoldingAcres',
    'familyMembersCount',
    'hasBPLCard',
    'rationCardNumber'
  ];

  const updateData: Record<string, any> = {};

  for (const field of allowedUpdates) {
    if (req.body[field] !== undefined) {
      if (typeof req.body[field] === 'string') {
        updateData[field] = sanitizeInput(req.body[field]);
      } else {
        updateData[field] = req.body[field];
      }
    }
  }

  const updatedUser = await db.users.update(req.user._id, updateData);
  if (!updatedUser) {
    res.status(404).json({ success: false, message: 'User profile could not be updated.' });
    return;
  }

  logger.audit('USER_PROFILE_UPDATED', req.user._id, { fields: Object.keys(updateData) });

  const { passwordHash: _, ...safeProfile } = updatedUser;
  res.status(200).json({
    success: true,
    message: 'Citizen profile updated successfully.',
    user: safeProfile
  });
}


export async function getDashboardStatsHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized.' });
    return;
  }

  const user = await db.users.findById(req.user._id);
  const documents = await db.documents.findByUserId(req.user._id);
  const allSchemes = await db.schemes.getAll();

  const isAadhaarVerified = user?.aadhaarVerificationStatus === 'verified';
  const isDigiLockerVerified = user?.digilockerVerificationStatus === 'verified';
  const isEmailVerified = !!user?.emailVerified;

  const trustScore = (isEmailVerified ? 30 : 0) + (isAadhaarVerified ? 40 : 0) + (isDigiLockerVerified ? 30 : 0);

  res.status(200).json({
    success: true,
    stats: {
      trustScore,
      documentsCount: documents.length,
      totalCatalogSchemes: allSchemes.length,
      verifications: {
        email: isEmailVerified,
        aadhaar: isAadhaarVerified,
        digilocker: isDigiLockerVerified
      }
    }
  });
}
