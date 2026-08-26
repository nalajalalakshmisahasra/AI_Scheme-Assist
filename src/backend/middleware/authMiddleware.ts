/**
 * JWT Authentication & Authorization Middleware
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../config/db.ts';
import { UserProfile } from '../../types.ts';
import { logger } from '../utils/logger.ts';

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const JWT_EXPIRES_IN = '7d';


export interface AuthenticatedRequest extends Request {
  user?: UserProfile;
  token?: string;
}

/**
 * Signs a JWT access token for an authenticated user
 */
export function generateAuthToken(user: UserProfile): string {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      fullName: user.fullName
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Express middleware to verify JWT tokens on protected routes
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Authentication required. Missing or malformed authorization header.'
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    const user = await db.users.findById(decoded.userId);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid session. User account not found.'
      });
      return;
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err: any) {
    logger.warn(`JWT verification failure: ${err.message}`);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired session token. Please log in again.'
    });
  }
}

/**
 * Optional authentication: extracts user if token provided, but does not block unauthenticated requests
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const user = await db.users.findById(decoded.userId);
      if (user) {
        req.user = user;
        req.token = token;
      }
    } catch {
      // Ignore token failure for optional auth
    }
  }
  next();
}
