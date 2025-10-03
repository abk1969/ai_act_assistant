/**
 * Security Middleware
 * Robust middleware for authentication, authorization, and security checks
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { securityConfig } from '../config/security';
import { securityService } from '../services/securityService';
import { sessionService } from '../services/sessionService';
import { auditService } from '../services/auditService';
import { logger, createServiceLogger } from '../utils/logger';
import { SecurityError, AuthenticationError, SessionError } from '../types/security';

const middlewareLogger = createServiceLogger('SecurityMiddleware');

// Extend Express Request type to include security context
declare global {
  namespace Express {
    interface Request {
      securityContext?: {
        userId: string;
        sessionToken: string;
        ipAddress: string;
        userAgent?: string;
        riskScore: number;
      };
    }
  }
}

/**
 * Basic authentication middleware - only checks Passport session
 */
export const basicAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({
      message: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }
  next();
};

/**
 * Enhanced authentication middleware with session validation
 */
export const enhancedAuth = async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const ipAddress = req.ip || '127.0.0.1';
  const userAgent = req.get('User-Agent');

  try {
    // Check if user is authenticated via Passport
    if (!req.isAuthenticated() || !req.user) {
      middlewareLogger.warn('Authentication failed - no valid session', {
        ipAddress,
        userAgent,
        path: req.path
      });
      
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userId = (req.user as any).id;
    const sessionToken = req.sessionID;

    // Validate session with our security service
    const session = await sessionService.validateSession(sessionToken, ipAddress);
    
    if (!session || session.userId !== userId) {
      middlewareLogger.warn('Session validation failed', {
        userId,
        sessionToken: sessionToken.substring(0, 8) + '...',
        ipAddress
      });
      
      // Force logout
      req.logout((err) => {
        if (err) middlewareLogger.error('Logout error during session validation', err);
      });
      
      return res.status(401).json({ 
        message: 'Session invalid or expired',
        code: 'SESSION_INVALID'
      });
    }

    // Check for suspicious session activity
    if (session.riskScore && session.riskScore > 70) {
      middlewareLogger.warn('High-risk session detected', {
        userId,
        sessionToken: sessionToken.substring(0, 8) + '...',
        riskScore: session.riskScore,
        ipAddress
      });
      
      // Log security event
      await auditService.logSecurityEvent({
        userId,
        eventType: 'suspicious_activity',
        eventDescription: 'High-risk session activity detected',
        ipAddress,
        userAgent,
        sessionId: sessionToken,
        isSuccessful: false,
        additionalData: { riskScore: session.riskScore }
      });
      
      // For very high risk, force re-authentication
      if (session.riskScore > 90) {
        return res.status(401).json({ 
          message: 'Re-authentication required due to suspicious activity',
          code: 'REAUTH_REQUIRED'
        });
      }
    }

    // Add security context to request
    req.securityContext = {
      userId,
      sessionToken,
      ipAddress,
      userAgent,
      riskScore: session.riskScore || 0
    };

    middlewareLogger.debug('Authentication successful', {
      userId,
      ipAddress,
      path: req.path,
      duration: Date.now() - startTime
    });

    next();
  } catch (error) {
    middlewareLogger.error('Authentication middleware error', error as Error, {
      ipAddress,
      userAgent,
      path: req.path,
      duration: Date.now() - startTime
    });
    
    res.status(500).json({ 
      message: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * MFA validation middleware
 */
export const requireMFA = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.securityContext) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const { userId } = req.securityContext;
    const { mfaService } = await import('../services/mfaService');
    const mfaStatus = await mfaService.getMfaStatus(userId);

    if (!mfaStatus.enabled) {
      middlewareLogger.warn('MFA required but not enabled', {
        userId,
        path: req.path
      });
      
      return res.status(403).json({ 
        message: 'Multi-factor authentication required',
        code: 'MFA_REQUIRED'
      });
    }

    next();
  } catch (error) {
    middlewareLogger.error('MFA middleware error', error as Error);
    res.status(500).json({ 
      message: 'MFA validation error',
      code: 'MFA_ERROR'
    });
  }
};

/**
 * Admin role validation middleware
 */
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.securityContext) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const { userId } = req.securityContext;
    
    // For now, we'll implement a simple admin check
    // In a real application, you'd check user roles from database
    const user = req.user as any;
    const isAdmin = user.email?.endsWith('@admin.com') || user.role === 'admin';

    if (!isAdmin) {
      middlewareLogger.warn('Admin access denied', {
        userId,
        email: user.email,
        path: req.path
      });
      
      await auditService.logSecurityEvent({
        userId,
        eventType: 'unauthorized_access',
        eventDescription: `Unauthorized admin access attempt to ${req.path}`,
        ipAddress: req.securityContext.ipAddress,
        userAgent: req.securityContext.userAgent,
        isSuccessful: false,
      });
      
      return res.status(403).json({ 
        message: 'Admin privileges required',
        code: 'ADMIN_REQUIRED'
      });
    }

    next();
  } catch (error) {
    middlewareLogger.error('Admin middleware error', error as Error);
    res.status(500).json({ 
      message: 'Authorization error',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Rate limiting middleware
 */
export const createRateLimit = (options?: {
  windowMs?: number;
  max?: number;
  message?: string;
}) => {
  const config = securityConfig.getRateLimitConfig();
  
  return rateLimit({
    windowMs: options?.windowMs || config.windowMs,
    max: options?.max || config.max,
    message: {
      message: options?.message || 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: config.standardHeaders,
    legacyHeaders: config.legacyHeaders,
    handler: (req, res) => {
      middlewareLogger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('User-Agent')
      });
      
      res.status(429).json({
        message: options?.message || 'Too many requests, please try again later',
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }
  });
};

/**
 * Security audit middleware - logs all requests
 */
export const auditMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const originalSend = res.send;

  res.send = function(data) {
    const duration = Date.now() - startTime;
    const userId = req.securityContext?.userId;
    const ipAddress = req.ip || '127.0.0.1';
    const userAgent = req.get('User-Agent');

    // Log the request
    logger.request(
      req.method,
      req.path,
      res.statusCode,
      duration,
      userId,
      ipAddress,
      userAgent
    );

    // Log security-relevant requests
    if (req.path.startsWith('/api/auth') || req.path.startsWith('/api/security')) {
      auditService.logSecurityEvent({
        userId,
        eventType: 'api_access',
        eventDescription: `${req.method} ${req.path}`,
        ipAddress,
        userAgent,
        isSuccessful: res.statusCode < 400,
        additionalData: {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration
        }
      }).catch(error => {
        middlewareLogger.error('Failed to log security event', error);
      });
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Error handling middleware for security errors
 */
export const securityErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  middlewareLogger.error('Security error occurred', error, {
    path: req.path,
    method: req.method,
    userId: req.securityContext?.userId,
    ipAddress: req.ip
  });

  if (error instanceof SecurityError) {
    return res.status(error.statusCode).json({
      message: error.message,
      code: error.code
    });
  }

  if (error instanceof AuthenticationError) {
    return res.status(401).json({
      message: error.message,
      code: error.code
    });
  }

  if (error instanceof SessionError) {
    return res.status(401).json({
      message: error.message,
      code: error.code
    });
  }

  // Default error response
  res.status(500).json({
    message: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
};

// Export rate limiting presets
export const authRateLimit = createRateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes (reduced for development)
  max: 50, // 50 attempts per window (increased for development)
  message: 'Too many authentication attempts, please try again later'
});

export const apiRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many API requests, please try again later'
});

export const strictRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: 'Too many requests to sensitive endpoint, please try again later'
});
