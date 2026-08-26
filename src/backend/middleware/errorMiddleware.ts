/**
 * Global API Error Handling Middleware
 * Prevents information disclosure by returning sanitized, generic messages for 500 errors
 * while logging comprehensive error details and stack traces server-side.
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.ts';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = typeof err.status === 'number' ? err.status : (typeof err.statusCode === 'number' ? err.statusCode : 500);

  // Log full error details securely on the server
  logger.error(`API Error on [${req.method} ${req.originalUrl}] - Status ${statusCode}`, {
    message: err.message,
    stack: err.stack,
    name: err.name
  });

  // Client errors (4xx) can receive specific validation/auth feedback; server errors (5xx) get generic safe text
  const clientSafeMessage =
    statusCode >= 500
      ? 'An unexpected error occurred. Please try again later.'
      : (err.message || 'The requested operation could not be completed.');

  res.status(statusCode).json({
    success: false,
    message: clientSafeMessage
  });
}
