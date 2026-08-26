import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

// Route Modules
import authRoutes from './src/backend/routes/authRoutes.ts';
import aadhaarRoutes from './src/backend/routes/aadhaarRoutes.ts';
import digilockerRoutes from './src/backend/routes/digilockerRoutes.ts';
import userRoutes from './src/backend/routes/userRoutes.ts';
import documentRoutes from './src/backend/routes/documentRoutes.ts';
import schemeRoutes from './src/backend/routes/schemeRoutes.ts';
import { errorHandler } from './src/backend/middleware/errorMiddleware.ts';
import { lastDevEmailDeliveries } from './src/backend/services/emailService.ts';
import { logger } from './src/backend/utils/logger.ts';
import { db } from './src/backend/config/db.ts';
import { hashPassword } from './src/backend/utils/encryption.ts';

export async function createApp() {
  const app = express();
  const PORT = 3000;

  // Security Headers & Middlewares
  app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  }));
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Request Auditing Middleware
  app.use((req, _res, next) => {
    if (req.path.startsWith('/api/')) {
      logger.info(`[API_REQ] ${req.method} ${req.path}`);
    }
    next();
  });

  // Seed default demo citizen account for smooth developer testing
  (async () => {
    try {
      const demoEmail = 'ramesh.sharma@example.gov.in';
      const existing = await db.users.findByEmail(demoEmail);
      if (!existing) {
        const passwordHash = await hashPassword('Citizen@123');
        await db.users.create({
          fullName: 'Ramesh Kumar Sharma',
          email: demoEmail,
          passwordHash,
          emailVerified: true,
          mobileNumber: '9876543210',
          mobileVerified: true,
          dateOfBirth: '1984-06-15',
          gender: 'male',
          address: {
            street: 'Village Rampur, Post Office Bilaspur',
            city: 'Bilaspur',
            district: 'Bilaspur',
            state: 'Uttar Pradesh',
            pincode: '201301'
          },
          occupation: 'Farmer',
          annualIncome: 140000,
          category: 'OBC',
          landHoldingAcres: 3.2,
          hasBPLCard: true,
          rationCardNumber: 'UP-NFSA-2024-99881',
          familyMembersCount: 5,
          minorityStatus: false,
          disabilityStatus: false,
          aadhaarVerificationStatus: 'verified',
          aadhaarMaskedNumber: 'XXXX-XXXX-7821',
          aadhaarVerifiedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
          aadhaarProviderRef: 'UIDAI-PROD-ASA-99482',
          digilockerVerificationStatus: 'verified',
          digilockerVerifiedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          digilockerUserId: 'DL-MERIPEHCHAN-RAMESH'
        });
        logger.info('Demo citizen account pre-seeded: ramesh.sharma@example.gov.in (Password: Citizen@123)');
      }
    } catch (err: any) {
      logger.error(`Seed error: ${err.message}`);
    }
  })();

  // -------------------------------------------------------------
  // API ROUTES
  // -------------------------------------------------------------

  // Health Check & Backend Status Endpoint
  app.get('/api/health', async (_req: Request, res: Response) => {
    const userCount = await db.users.count();
    const schemes = await db.schemes.getAll();
    const isMockMode = (process.env.VERIFICATION_MODE || 'mock').toLowerCase() === 'mock';

    res.status(200).json({
      status: 'operational',
      service: 'AI Citizen Benefit Assistant Backend',
      version: '2.0.0-production-ready',
      timestamp: new Date().toISOString(),
      environment: {
        verificationMode: isMockMode ? 'mock (Development Sandbox)' : 'production (UIDAI / DigiLocker Live)',
        geminiApiKeyConfigured: !!process.env.GEMINI_API_KEY,
        storageProvider: process.env.STORAGE_PROVIDER || 'local_vault'
      },
      stats: {
        registeredCitizens: userCount,
        welfareSchemesCatalog: schemes.length
      }
    });
  });

  // Developer Sandbox Inspector: Live OTP Stream (Only active in non-production development environments)
  app.get('/api/dev/last-otp', (_req: Request, res: Response) => {
    if (process.env.NODE_ENV === 'production') {
      res.status(403).json({
        success: false,
        message: 'Endpoint disabled in production mode.'
      });
      return;
    }
    res.status(200).json({
      success: true,
      deliveries: lastDevEmailDeliveries
    });
  });


  // Mount Feature Routers
  app.use('/api/auth', authRoutes);
  app.use('/api/aadhaar', aadhaarRoutes);
  app.use('/api/digilocker', digilockerRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/documents', documentRoutes);
  app.use('/api/schemes', schemeRoutes);

  // Global API Error Handler
  app.use(errorHandler);

  // -------------------------------------------------------------
  // VITE / STATIC FILE SERVING
  // -------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      root: __dirname,
      configFile: path.join(__dirname, 'vite.config.ts'),
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

    return app;
}

if (!process.env.VERCEL) {
  createApp().then((app) => {
    const PORT = Number(process.env.PORT) || 3000;

    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server running on http://0.0.0.0:${PORT}`);
      logger.info(`Backend APIs available at /api/*`);
    });
  });
}
