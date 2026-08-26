/**
 * AI-Powered Citizen Scheme Matching & Benefit Optimization Service
 * Uses Google GenAI SDK (gemini-3.7-flash) on the server side to analyze citizen demographic attributes,
 * identify missed benefits, calculate total annual financial entitlement, and generate personalized action plans.
 */

import { GoogleGenAI, Type } from '@google/genai';
import { db } from '../config/db.ts';
import { UserProfile, GovernmentScheme, SchemeMatchResult } from '../../types.ts';
import { logger } from '../utils/logger.ts';

// Lazy initialization of GoogleGenAI client on the server side
let genAIClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return genAIClient;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Execute Gemini model generation with retry and fallback across supported models
 */
async function generateContentWithFallback(
  ai: GoogleGenAI,
  params: {
    contents: string;
    systemInstruction?: string;
  }
): Promise<string | null> {
  const candidateModels = ['gemini-2.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.7-flash'];

  for (const model of candidateModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.systemInstruction
            ? { systemInstruction: params.systemInstruction }
            : undefined
        });

        if (response.text && response.text.trim().length > 0) {
          return response.text.trim();
        }
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        const isTransient = errMsg.includes('503') || errMsg.includes('429') || errMsg.includes('UNAVAILABLE') || errMsg.includes('high demand');
        
        if (isTransient && attempt === 0) {
          // Wait briefly before retrying
          await sleep(500);
          continue;
        }
        // If second attempt or non-transient, proceed to fallback model
        break;
      }
    }
  }

  return null;
}

/**
 * Calculates deterministic eligibility for a single scheme against a citizen profile
 */
export function evaluateSchemeEligibility(user: UserProfile, scheme: GovernmentScheme): SchemeMatchResult {
  const criteria = scheme.eligibilityCriteria;
  const eligibleReasons: string[] = [];
  const ineligibleReasons: string[] = [];
  const missingDocuments: string[] = [];

  let matchPoints = 100;

  // 1. Income check
  if (criteria.maxAnnualIncome !== undefined && user.annualIncome !== undefined) {
    if (user.annualIncome <= criteria.maxAnnualIncome) {
      eligibleReasons.push(`Annual income (₹${user.annualIncome.toLocaleString('en-IN')}) is within the scheme ceiling of ₹${criteria.maxAnnualIncome.toLocaleString('en-IN')}.`);
    } else {
      ineligibleReasons.push(`Annual income (₹${user.annualIncome.toLocaleString('en-IN')}) exceeds the scheme ceiling of ₹${criteria.maxAnnualIncome.toLocaleString('en-IN')}.`);
      matchPoints -= 40;
    }
  }

  // 2. Occupation check
  if (criteria.allowedOccupations && criteria.allowedOccupations.length > 0) {
    if (user.occupation && criteria.allowedOccupations.includes(user.occupation)) {
      eligibleReasons.push(`Occupation matches scheme target: ${user.occupation}.`);
    } else {
      ineligibleReasons.push(`Scheme requires occupation in: ${criteria.allowedOccupations.join(', ')}. Your profile: ${user.occupation || 'Not specified'}.`);
      matchPoints -= 35;
    }
  }

  // 3. Category / Caste check
  if (criteria.allowedCategories && criteria.allowedCategories.length > 0) {
    if (user.category && criteria.allowedCategories.includes(user.category)) {
      eligibleReasons.push(`Social category (${user.category}) qualifies for this welfare initiative.`);
    } else {
      ineligibleReasons.push(`Targeted to categories: ${criteria.allowedCategories.join(', ')}. Profile: ${user.category || 'General'}.`);
      matchPoints -= 30;
    }
  }

  // 4. Land holding check
  if (criteria.requiresLandHolding) {
    if ((user.landHoldingAcres || 0) > 0 && (user.landHoldingAcres || 0) <= (criteria.maxLandHoldingAcres || 10)) {
      eligibleReasons.push(`Land holding of ${user.landHoldingAcres} acres fulfills farmer qualification.`);
    } else if ((user.landHoldingAcres || 0) === 0) {
      ineligibleReasons.push('Scheme requires agricultural land ownership proof.');
      matchPoints -= 40;
    }
  }

  // 5. BPL check
  if (criteria.requiresBPL) {
    if (user.hasBPLCard || (user.annualIncome && user.annualIncome < 200000)) {
      eligibleReasons.push('BPL / Priority Household status confirmed.');
    } else {
      ineligibleReasons.push('Requires BPL / Priority Ration Card endorsement.');
      matchPoints -= 25;
    }
  }

  // 6. Disability check
  if (criteria.requiresDisability) {
    if (user.disabilityStatus) {
      eligibleReasons.push('Disability welfare criteria satisfied.');
    } else {
      ineligibleReasons.push('Scheme specifically targeted for persons with disabilities.');
      matchPoints -= 50;
    }
  }

  const isEligible = ineligibleReasons.length === 0;
  const matchScore = Math.max(0, Math.min(100, isEligible ? 95 : matchPoints));

  const actionPlan: string[] = isEligible
    ? [
        `Submit application via ${scheme.portalName} (${scheme.applicationUrl})`,
        `Attach required documents: ${scheme.requiredDocuments.join(', ')}`,
        'Ensure bank account is Aadhaar-seeded for Direct Benefit Transfer (DBT).'
      ]
    : [
        'Review eligibility criteria adjustments.',
        'Upload supporting documents to update income or category assessment.'
      ];

  return {
    scheme,
    isEligible,
    matchScore,
    eligibleReasons,
    ineligibleReasons,
    missingDocuments: scheme.requiredDocuments,
    actionPlan
  };
}

/**
 * Matches citizen profile against the entire scheme database with AI enrichment
 */
export async function matchCitizenBenefits(user: UserProfile): Promise<{
  totalSchemesEvaluated: number;
  eligibleSchemes: SchemeMatchResult[];
  missedBenefits: SchemeMatchResult[];
  totalAnnualBenefitValue: number;
  aiExecutiveSummary: string;
}> {
  const allSchemes = await db.schemes.getAll();
  const evaluations = allSchemes.map(scheme => evaluateSchemeEligibility(user, scheme));

  const eligibleSchemes = evaluations
    .filter(e => e.isEligible)
    .sort((a, b) => b.scheme.benefitAnnualValue - a.scheme.benefitAnnualValue);

  const missedBenefits = evaluations
    .filter(e => !e.isEligible && e.matchScore >= 40)
    .sort((a, b) => b.matchScore - a.matchScore);

  const totalAnnualBenefitValue = eligibleSchemes.reduce(
    (sum, e) => sum + e.scheme.benefitAnnualValue,
    0
  );

  let aiExecutiveSummary = `Based on your profile as a ${user.occupation || 'Citizen'} residing with an annual income of ₹${(user.annualIncome || 120000).toLocaleString('en-IN')}, you qualify for ${eligibleSchemes.length} key government benefit programs providing an estimated ₹${totalAnnualBenefitValue.toLocaleString('en-IN')} per year in direct transfers and welfare coverage.`;

  // Attempt server-side Gemini AI summary enrichment if API key exists
  const ai = getAIClient();
  if (ai) {
    try {
      const prompt = `Citizen Profile:
- Occupation: ${user.occupation}
- Annual Income: ₹${user.annualIncome}
- Category: ${user.category}
- Land Holding: ${user.landHoldingAcres} acres
- BPL Status: ${user.hasBPLCard ? 'Yes' : 'No'}
- Disability: ${user.disabilityStatus ? 'Yes' : 'No'}
- State/Location: ${user.address?.state || 'All India'}

Eligible Schemes (${eligibleSchemes.length}):
${eligibleSchemes.map(s => `- ${s.scheme.name} (Value: ${s.scheme.benefitAmountText})`).join('\n')}

Provide a concise, encouraging 2-sentence executive summary advising this citizen on their top welfare entitlements and immediate next steps for maximum benefit realization.`;

      const generatedSummary = await generateContentWithFallback(ai, { contents: prompt });
      if (generatedSummary) {
        aiExecutiveSummary = generatedSummary;
      }
    } catch (err: any) {
      logger.warn(`Gemini AI summary generation fallback used: ${err?.message || err}`);
    }
  }

  return {
    totalSchemesEvaluated: allSchemes.length,
    eligibleSchemes,
    missedBenefits,
    totalAnnualBenefitValue,
    aiExecutiveSummary
  };
}

/**
 * Citizen Benefit AI Assistant Q&A Chat
 */
export async function askCitizenBenefitAI(
  userQuery: string,
  userProfile?: UserProfile
): Promise<string> {
  const ai = getAIClient();
  if (!ai) {
    return 'The AI Assistant is currently operating in standard mode. You can explore your matched schemes and eligibility rules in the dashboard above.';
  }

  try {
    const profileContext = userProfile
      ? `User Profile Context: Occupation: ${userProfile.occupation}, Annual Income: ₹${userProfile.annualIncome}, Category: ${userProfile.category}, State: ${userProfile.address?.state || 'India'}.`
      : 'General citizen inquiry.';

    const systemInstruction = `You are Scheme Assist AI, an expert, empathetic government welfare and citizen benefit assistant in India.
Your mission is to guide citizens clearly regarding government schemes (Central & State), eligibility requirements, required documents, DBT bank seeding, and application steps on official portals (pmkisan.gov.in, scholarships.gov.in, beneficiary.nha.gov.in, etc.). Keep answers actionable, clear, bulleted, and in simple language.`;

    const generatedResponse = await generateContentWithFallback(ai, {
      contents: `${profileContext}\n\nCitizen Question: ${userQuery}`,
      systemInstruction
    });

    return generatedResponse || 'I am ready to help you with government schemes. You can ask about eligibility, document requirements, or portal application links for schemes like PM-KISAN, Ayushman Bharat, or PM Awas Yojana.';
  } catch (err: any) {
    logger.error(`Gemini AI Assistant error: ${err?.message || err}`);
    return 'AI assistance service is temporarily busy. Please refer to the scheme criteria listed on this portal.';
  }
}
