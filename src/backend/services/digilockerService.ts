/**
 * Authorized DigiLocker / MeriPehchan OAuth2.0 Consent & Document Service
 * Follows the official National DigiLocker API standards:
 * - Redirects users to official DigiLocker / MeriPehchan consent screen.
 * - Never asks for user DigiLocker passwords in-app.
 * - Exchanges authorized OAuth2 authorization codes for scoped access tokens.
 * - Pulls only user-authorized issued documents (Income Cert, Caste Cert, Ration Card, etc.).
 * - Fully isolated Mock / Sandbox mode for local testing when VERIFICATION_MODE=mock.
 */

import { logger } from '../utils/logger.ts';
import { generateRandomToken } from '../utils/encryption.ts';

export interface DigiLockerAuthInitResponse {
  success: boolean;
  authorizationUrl: string;
  stateToken: string;
  mode: 'production_oauth2' | 'development_sandbox';
  disclaimer: string;
}

export interface DigiLockerIssuedDocument {
  docType: string;
  title: string;
  issuer: string;
  docId: string;
  dateOfIssue: string;
  status: 'VERIFIED_BY_ISSUER';
  verifiedAttributes: Record<string, any>;
}

// In-memory OAuth2 state token registry to prevent CSRF attacks
const activeOAuthStates: Map<string, { userId: string; createdAt: number }> = new Map();

/**
 * Initiates the DigiLocker OAuth2 consent flow
 */
export function initiateDigiLockerAuth(userId: string): DigiLockerAuthInitResponse {
  const isMockMode = (process.env.VERIFICATION_MODE || 'mock').toLowerCase() === 'mock';
  const clientId = process.env.DIGILOCKER_CLIENT_ID;
  const redirectUri = process.env.DIGILOCKER_REDIRECT_URI || 'http://localhost:3000/api/digilocker/callback';
  
  // Generate cryptographic CSRF state token
  const stateToken = generateRandomToken(16);
  activeOAuthStates.set(stateToken, { userId, createdAt: Date.now() });

  if (!isMockMode && clientId && clientId !== 'your_digilocker_app_client_id') {
    const digiLockerOAuthBase = 'https://digilocker.meripehchan.gov.in/public/oauth2/1/authorize';
    const scope = 'openid profile doc_read';
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      state: stateToken,
      scope
    });

    const authorizationUrl = `${digiLockerOAuthBase}?${params.toString()}`;

    logger.info(`Generated live DigiLocker OAuth2 redirect URL for user: ${userId}`);

    return {
      success: true,
      authorizationUrl,
      stateToken,
      mode: 'production_oauth2',
      disclaimer: 'Live DigiLocker / MeriPehchan official OAuth 2.0 consent gateway.'
    };
  }

  // Development Sandbox Flow
  // Provides an in-app interactive consent dialogue simulating the DigiLocker OAuth2 consent screen
  logger.audit('DIGILOCKER_AUTH_INITIATED_SANDBOX', userId, { stateToken });

  return {
    success: true,
    authorizationUrl: `/api/digilocker/consent-sandbox?state=${stateToken}`,
    stateToken,
    mode: 'development_sandbox',
    disclaimer: 'Development/Test Verification — Not a real DigiLocker verification. To connect live MeriPehchan/DigiLocker, configure DIGILOCKER_CLIENT_ID and set VERIFICATION_MODE=production.'
  };
}

/**
 * Validates OAuth2 callback from DigiLocker and exchanges code for authorized issued certificates
 */
export async function handleDigiLockerCallback(
  code: string,
  stateToken: string
): Promise<{
  success: boolean;
  message: string;
  userId?: string;
  documents?: DigiLockerIssuedDocument[];
  mode: 'production_oauth2' | 'development_sandbox';
  disclaimer: string;
}> {
  const isMockMode = (process.env.VERIFICATION_MODE || 'mock').toLowerCase() === 'mock';
  const stateRecord = activeOAuthStates.get(stateToken);

  if (!stateRecord) {
    return {
      success: false,
      message: 'Invalid or expired OAuth2 state token. Please restart DigiLocker authorization.',
      mode: isMockMode ? 'development_sandbox' : 'production_oauth2',
      disclaimer: 'CSRF token mismatch.'
    };
  }

  const { userId } = stateRecord;
  activeOAuthStates.delete(stateToken); // Clean up state token

  // Production DigiLocker Token Exchange
  if (!isMockMode) {
    const clientId = process.env.DIGILOCKER_CLIENT_ID;
    const clientSecret = process.env.DIGILOCKER_CLIENT_SECRET;
    const redirectUri = process.env.DIGILOCKER_REDIRECT_URI || 'http://localhost:3000/api/digilocker/callback';

    try {
      logger.info(`Exchanging DigiLocker auth code for access token (User: ${userId})`);
      
      const tokenRes = await fetch('https://digilocker.meripehchan.gov.in/public/oauth2/1/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          grant_type: 'authorization_code',
          client_id: clientId || '',
          client_secret: clientSecret || '',
          redirect_uri: redirectUri
        })
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.access_token) {
        return {
          success: false,
          message: 'DigiLocker OAuth token exchange failed. Unauthorized request.',
          mode: 'production_oauth2',
          disclaimer: 'Production OAuth error.'
        };
      }

      // Fetch user's authorized issued certificates
      const docRes = await fetch('https://digilocker.meripehchan.gov.in/public/oauth2/1/issued_documents', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      const docData = await docRes.json();

      logger.audit('DIGILOCKER_DOCUMENTS_PULLED_PRODUCTION', userId, { docCount: docData.items?.length || 0 });

      return {
        success: true,
        message: 'Successfully authenticated with DigiLocker. Authorized documents imported.',
        userId,
        documents: docData.items || [],
        mode: 'production_oauth2',
        disclaimer: 'Official MeriPehchan / DigiLocker authorization.'
      };
    } catch (err: any) {
      logger.error(`DigiLocker OAuth network error: ${err.message}`);
      return {
        success: false,
        message: 'Could not connect to DigiLocker OAuth2 servers.',
        mode: 'production_oauth2',
        disclaimer: 'Connection timeout.'
      };
    }
  }

  // Development Sandbox Simulated Authorized Documents
  const mockAuthorizedDocuments: DigiLockerIssuedDocument[] = [
    {
      docType: 'income_certificate',
      title: 'Income Certificate (Revenue Department)',
      issuer: 'State Revenue & e-District Administration',
      docId: 'DL-INC-2024-' + Math.floor(100000 + Math.random() * 900000),
      dateOfIssue: '2024-04-15',
      status: 'VERIFIED_BY_ISSUER',
      verifiedAttributes: {
        annualIncome: 120000,
        validUpto: '2027-03-31',
        digitallySignedBy: 'Sub-Divisional Magistrate (SDM)'
      }
    },
    {
      docType: 'caste_certificate',
      title: 'Community / Caste Certificate',
      issuer: 'Department of Social Welfare',
      docId: 'DL-CST-2023-' + Math.floor(100000 + Math.random() * 900000),
      dateOfIssue: '2023-08-20',
      status: 'VERIFIED_BY_ISSUER',
      verifiedAttributes: {
        category: 'OBC',
        digitallySignedBy: 'District Revenue Officer'
      }
    },
    {
      docType: 'ration_card',
      title: 'National Food Security (NFSA) Ration Card',
      issuer: 'Department of Food & Civil Supplies',
      docId: 'DL-RC-2024-' + Math.floor(100000 + Math.random() * 900000),
      dateOfIssue: '2024-01-10',
      status: 'VERIFIED_BY_ISSUER',
      verifiedAttributes: {
        cardType: 'PHH (Priority Household / BPL)',
        familyUnits: 4
      }
    }
  ];

  logger.audit('DIGILOCKER_VERIFIED_SANDBOX', userId, { importedCount: mockAuthorizedDocuments.length });

  return {
    success: true,
    message: '[Development Sandbox] DigiLocker consent granted. 3 issued certificates retrieved with digital signatures.',
    userId,
    documents: mockAuthorizedDocuments,
    mode: 'development_sandbox',
    disclaimer: 'Development/Test Verification — Not a real DigiLocker verification. To configure official DigiLocker credentials, set DIGILOCKER_CLIENT_ID and VERIFICATION_MODE=production.'
  };
}
