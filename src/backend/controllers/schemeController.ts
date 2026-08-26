/**
 * Government Schemes & AI Benefit Matching Controller
 */

import { Request, Response } from 'express';
import { db } from '../config/db.ts';
import { AuthenticatedRequest } from '../middleware/authMiddleware.ts';
import { matchCitizenBenefits, askCitizenBenefitAI } from '../services/geminiSchemeService.ts';
import { sanitizeInput, validateAskAIPayload } from '../utils/validators.ts';


export async function listSchemesHandler(req: Request, res: Response): Promise<void> {
  const { category, type, benefitType, search } = req.query;
  let schemes = await db.schemes.getAll();

  if (category && typeof category === 'string') {
    schemes = schemes.filter(s => s.category.toLowerCase() === category.toLowerCase());
  }

  if (type && typeof type === 'string') {
    schemes = schemes.filter(s => s.type.toLowerCase() === type.toLowerCase());
  }

  if (benefitType && typeof benefitType === 'string') {
    schemes = schemes.filter(s => s.benefitType.toLowerCase() === benefitType.toLowerCase());
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    schemes = schemes.filter(
      s =>
        s.name.toLowerCase().includes(q) ||
        s.shortCode.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.ministry.toLowerCase().includes(q)
    );
  }

  res.status(200).json({
    success: true,
    count: schemes.length,
    schemes
  });
}

export async function getSchemeByIdHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const scheme = await db.schemes.getById(id);

  if (!scheme) {
    res.status(404).json({ success: false, message: 'Scheme not found.' });
    return;
  }

  res.status(200).json({
    success: true,
    scheme
  });
}

export async function matchCitizenSchemesHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  // If user is authenticated via JWT, use req.user
  let profile = req.user;

  // Check if clerkUserId or profile is provided in body / query
  if (!profile && req.body?.clerkUserId) {
    const found = await db.users.findByClerkUserId(req.body.clerkUserId);
    if (found) {
      profile = found;
    }
  }

  if (!profile && req.body && typeof req.body === 'object' && req.body.occupation && req.body.annualIncome !== undefined) {
    profile = req.body;
  }

  // If no citizen profile exists, do NOT return fake personalized data
  if (!profile) {
    const allSchemes = await db.schemes.getAll();
    res.status(200).json({
      success: true,
      requiresAuth: true,
      message: 'Sign in and complete your citizen profile to view personalized scheme eligibility.',
      data: {
        totalSchemesEvaluated: allSchemes.length,
        eligibleSchemes: [],
        missedBenefits: [],
        totalAnnualBenefitValue: 0,
        aiExecutiveSummary: 'Sign in and complete your citizen profile to view personalized scheme eligibility and calculate your maximum benefit entitlements.'
      }
    });
    return;
  }

  const result = await matchCitizenBenefits(profile);

  res.status(200).json({
    success: true,
    data: result
  });
}

export async function askAssistantHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  const validation = validateAskAIPayload(req.body);
  if (!validation.valid) {
    res.status(400).json({
      success: false,
      message: validation.error
    });
    return;
  }

  const { query } = req.body;
  const answer = await askCitizenBenefitAI(sanitizeInput(query), req.user);

  res.status(200).json({
    success: true,
    answer
  });
}
