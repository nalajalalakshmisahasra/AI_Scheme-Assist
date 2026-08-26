/**
 * Rate Limiting Middleware
 * Protects endpoints against brute-force attacks, credential stuffing, and resource exhaustion.
 * Supports configurable thresholds, dual-key (IP + Account) tracking, and exponential backoff.
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.ts';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  endpointName: string;
  keyGenerator?: (req: Request) => string | string[]; // Support multi-key (IP + account)
  enableExponentialBackoff?: boolean;
}

interface RateRecord {
  count: number;
  resetTime: number;
  consecutiveFailures: number;
  lastAttemptTime: number;
}

const requestTrackers: Map<string, RateRecord> = new Map();

// Periodic cleanup of expired rate limit windows
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestTrackers.entries()) {
    if (now > record.resetTime && record.consecutiveFailures === 0) {
      requestTrackers.delete(key);
    }
  }
}, 60 * 1000);

export function createRateLimiter(config: RateLimitConfig) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const now = Date.now();

    // Determine tracking keys (IP + Account / Identifier)
    let keys: string[] = [`${config.endpointName}_ip_${ip}`];
    if (config.keyGenerator) {
      const customKeys = config.keyGenerator(req);
      if (Array.isArray(customKeys)) {
        keys.push(...customKeys.map(k => `${config.endpointName}_acc_${k}`));
      } else if (customKeys) {
        keys.push(`${config.endpointName}_acc_${customKeys}`);
      }
    }

    // Check rate limit across all associated keys
    for (const key of keys) {
      let record = requestTrackers.get(key);

      if (!record || now > record.resetTime) {
        record = {
          count: 1,
          resetTime: now + config.windowMs,
          consecutiveFailures: record?.consecutiveFailures || 0,
          lastAttemptTime: now
        };
        requestTrackers.set(key, record);
        continue;
      }

      // Check for exponential backoff if enabled and failures have occurred
      if (config.enableExponentialBackoff && record.consecutiveFailures >= 3) {
        const backoffSeconds = Math.min(300, Math.pow(2, record.consecutiveFailures - 3) * 5);
        const timeSinceLastAttempt = Math.floor((now - record.lastAttemptTime) / 1000);
        if (timeSinceLastAttempt < backoffSeconds) {
          const retryAfter = backoffSeconds - timeSinceLastAttempt;
          logger.warn(`Exponential backoff triggered for ${key}. Retry after ${retryAfter}s`);
          res.setHeader('Retry-After', retryAfter);
          res.status(429).json({
            success: false,
            message: `Too many attempts. Please wait ${retryAfter} seconds before trying again.`,
            retryAfter
          });
          return;
        }
      }

      if (record.count >= config.maxRequests) {
        const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
        logger.warn(`Rate limit exceeded on ${config.endpointName} (Key: ${key})`);

        res.setHeader('Retry-After', retryAfterSeconds);
        res.status(429).json({
          success: false,
          message: `Too many requests. Please wait ${retryAfterSeconds} seconds before trying again.`,
          retryAfter: retryAfterSeconds
        });
        return;
      }

      record.count += 1;
      record.lastAttemptTime = now;
      requestTrackers.set(key, record);
    }

    // Hook into response to track authentication failures for exponential backoff
    if (config.enableExponentialBackoff) {
      const originalJson = res.json.bind(res);
      res.json = function (body: any) {
        if (res.statusCode >= 400 && res.statusCode < 500) {
          for (const key of keys) {
            const rec = requestTrackers.get(key);
            if (rec) {
              rec.consecutiveFailures += 1;
              requestTrackers.set(key, rec);
            }
          }
        } else if (res.statusCode < 400) {
          for (const key of keys) {
            const rec = requestTrackers.get(key);
            if (rec) {
              rec.consecutiveFailures = 0;
              requestTrackers.set(key, rec);
            }
          }
        }
        return originalJson(body);
      };
    }

    next();
  };
}

// 1. Strict Authentication Limiter (Login, Registration) - Dual-Key (IP + Email) & Exponential Backoff
export const authRateLimiter = createRateLimiter({
  windowMs: Number(process.env.RATE_LIMIT_AUTH_WINDOW_MS) || 15 * 60 * 1000, // 15 min default
  maxRequests: Number(process.env.RATE_LIMIT_AUTH_MAX) || 15,
  endpointName: 'auth_route',
  keyGenerator: req => (req.body?.email ? String(req.body.email).toLowerCase().trim() : ''),
  enableExponentialBackoff: true
});

// 2. Strict OTP Limiter (Email OTP Send & Verify) - Dual-Key (IP + Target Email)
export const otpRateLimiter = createRateLimiter({
  windowMs: Number(process.env.RATE_LIMIT_OTP_WINDOW_MS) || 5 * 60 * 1000, // 5 min default
  maxRequests: Number(process.env.RATE_LIMIT_OTP_MAX) || 5,
  endpointName: 'otp_route',
  keyGenerator: req => (req.body?.email ? String(req.body.email).toLowerCase().trim() : ''),
  enableExponentialBackoff: true
});

// 3. Aadhaar Verification Limiter - Dual-Key (IP + Aadhaar Hash/Number)
export const aadhaarRateLimiter = createRateLimiter({
  windowMs: Number(process.env.RATE_LIMIT_AADHAAR_WINDOW_MS) || 10 * 60 * 1000, // 10 min default
  maxRequests: Number(process.env.RATE_LIMIT_AADHAAR_MAX) || 6,
  endpointName: 'aadhaar_verify',
  keyGenerator: req => (req.body?.aadhaarNumber ? String(req.body.aadhaarNumber).slice(-4) : (req.body?.transactionId || '')),
  enableExponentialBackoff: true
});

// 4. File Upload Limiter
export const uploadRateLimiter = createRateLimiter({
  windowMs: Number(process.env.RATE_LIMIT_UPLOAD_WINDOW_MS) || 10 * 60 * 1000, // 10 min default
  maxRequests: Number(process.env.RATE_LIMIT_UPLOAD_MAX) || 15,
  endpointName: 'doc_upload'
});

// 5. Moderate AI Generation Limiter (Gemini ask-ai)
export const aiRateLimiter = createRateLimiter({
  windowMs: Number(process.env.RATE_LIMIT_AI_WINDOW_MS) || 1 * 60 * 1000, // 1 min default
  maxRequests: Number(process.env.RATE_LIMIT_AI_MAX) || 15,
  endpointName: 'gemini_ai'
});

// 6. Moderate Public Endpoints Limiter (Scheme catalog, public queries)
export const publicRateLimiter = createRateLimiter({
  windowMs: Number(process.env.RATE_LIMIT_PUBLIC_WINDOW_MS) || 1 * 60 * 1000, // 1 min default
  maxRequests: Number(process.env.RATE_LIMIT_PUBLIC_MAX) || 60,
  endpointName: 'public_api'
});

// 7. Looser Authenticated Citizen Action Limiter
export const authenticatedUserRateLimiter = createRateLimiter({
  windowMs: Number(process.env.RATE_LIMIT_AUTH_USER_WINDOW_MS) || 1 * 60 * 1000, // 1 min default
  maxRequests: Number(process.env.RATE_LIMIT_AUTH_USER_MAX) || 120,
  endpointName: 'authenticated_user_action'
});
