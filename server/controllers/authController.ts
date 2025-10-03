/**
 * Authentication Controller
 * Handles all authentication-related operations with proper error handling
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { securityService } from '../services/securityService';
import { passwordService } from '../services/passwordService';
import { auditService } from '../services/auditService';
import { createServiceLogger } from '../utils/logger';
import { 
  loginUserSchema, 
  registerUserSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema 
} from '@shared/schema';
// Import des classes d'erreur
import { SecurityError, AuthenticationError, ValidationError } from '../errors/SecurityErrors';
import { AuthService } from '../auth';

const logger = createServiceLogger('AuthController');

export class AuthController {
  /**
   * Enhanced login with comprehensive security checks
   */
  static async login(req: Request, res: Response) {
    const startTime = Date.now();
    const ipAddress = req.ip || '127.0.0.1';
    const userAgent = req.get('User-Agent');

    try {
      // Validate request body
      const { email, password, mfaCode } = loginUserSchema.extend({
        mfaCode: z.string().optional()
      }).parse(req.body);

      logger.info('Login attempt started', {
        email,
        ipAddress,
        userAgent
      });

      // Use our enhanced security service for authentication
      const result = await securityService.authenticateUser({
        email,
        password,
        mfaCode,
        ipAddress,
        userAgent
      });

      if (!result.success) {
        logger.warn('Login attempt failed', {
          email,
          ipAddress,
          error: result.error,
          requiresMfa: result.requiresMfa,
          requiresCaptcha: result.requiresCaptcha
        });

        return res.status(401).json({ 
          message: result.error,
          requiresMfa: result.requiresMfa,
          requiresCaptcha: result.requiresCaptcha,
          code: 'LOGIN_FAILED'
        });
      }

      // Ensure user exists
      if (!result.user) {
        return res.status(500).json({
          message: 'Authentication error',
          code: 'USER_NOT_FOUND'
        });
      }

      // Regenerate session to prevent session fixation attacks
      req.session.regenerate((regenerateErr) => {
        if (regenerateErr) {
          logger.error('Session regeneration error', regenerateErr);
          return res.status(500).json({
            message: 'Session error',
            code: 'SESSION_ERROR'
          });
        }

        req.logIn(result.user!, (err) => {
          if (err) {
            logger.error('Session login error', err);
            return res.status(500).json({ 
              message: 'Session error',
              code: 'SESSION_ERROR'
            });
          }
          
          logger.info('Login successful', {
            userId: result.user?.id,
            email,
            ipAddress,
            duration: Date.now() - startTime
          });

          res.json({ 
            user: result.user, 
            sessionToken: result.sessionToken,
            message: 'Login successful' 
          });
        });
      });
    } catch (error) {
      logger.error('Login error', error as Error, {
        email: req.body?.email,
        ipAddress,
        duration: Date.now() - startTime
      });

      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid request format', 
          errors: error.errors,
          code: 'VALIDATION_ERROR'
        });
      }

      if (error instanceof AuthenticationError) {
        return res.status(error.statusCode).json({
          message: error.message,
          code: error.code
        });
      }

      res.status(500).json({ 
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * User registration with security validation
   */
  static async register(req: Request, res: Response) {
    const startTime = Date.now();
    const ipAddress = req.ip || '127.0.0.1';
    const userAgent = req.get('User-Agent');

    try {
      const userData = registerUserSchema.parse(req.body);
      
      logger.info('Registration attempt started', {
        email: userData.email,
        ipAddress,
        userAgent
      });

      // Validate password strength
      const passwordValidation = await passwordService.validatePassword(userData.password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          message: 'Password does not meet security requirements',
          errors: passwordValidation.errors,
          code: 'WEAK_PASSWORD'
        });
      }

      // Use AuthService for registration (assuming it exists)
      const authService = (await import('../auth')).AuthService;
      const result = await authService.registerUser(userData, ipAddress, userAgent);

      if (result.success && result.user) {
        logger.info('Registration successful', {
          userId: result.user?.id,
          email: userData.email,
          ipAddress,
          duration: Date.now() - startTime
        });

        // Automatically log in the user after registration
        req.login(result.user, (err) => {
          if (err) {
            logger.error('Auto-login after registration failed', err);
            return res.status(201).json({
              user: result.user,
              message: 'Registration successful, but auto-login failed. Please log in manually.'
            });
          }

          logger.info('User auto-logged in after registration', {
            userId: result.user?.id
          });

          res.status(201).json({
            user: result.user,
            message: 'Registration successful'
          });
        });
      } else {
        logger.warn('Registration failed', {
          email: userData.email,
          ipAddress,
          error: result.error
        });

        res.status(400).json({ 
          message: result.error || 'Registration failed',
          code: 'REGISTRATION_FAILED'
        });
      }
    } catch (error) {
      logger.error('Registration error', error as Error, {
        email: req.body?.email,
        ipAddress,
        duration: Date.now() - startTime
      });

      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid request format', 
          errors: error.errors,
          code: 'VALIDATION_ERROR'
        });
      }

      res.status(500).json({ 
        message: 'Registration failed',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Secure logout with session cleanup
   */
  static async logout(req: Request, res: Response) {
    const startTime = Date.now();
    const userId = req.securityContext?.userId;
    const sessionToken = req.securityContext?.sessionToken;
    const ipAddress = req.ip || '127.0.0.1';

    try {
      // Revoke session in our security system
      if (sessionToken) {
        const { SessionService } = await import('../services/sessionService');
        await SessionService.revokeSession(sessionToken, 'User logout');
      }

      // Log security event
      if (userId) {
        await auditService.logSecurityEvent({
          userId,
          eventType: 'logout',
          eventDescription: 'User logged out',
          ipAddress,
          userAgent: req.get('User-Agent'),
          isSuccessful: true,
          sessionId: sessionToken,
        });
      }

      req.logout((err) => {
        if (err) {
          logger.error('Logout error', err, { userId, ipAddress });
          return res.status(500).json({ 
            message: 'Logout failed',
            code: 'LOGOUT_ERROR'
          });
        }
        
        // Optionally regenerate session after logout for extra security
        req.session.regenerate((regenerateErr) => {
          if (regenerateErr) {
            logger.error('Session regeneration after logout error', regenerateErr);
            // Don't fail the logout if session regeneration fails
          }
          
          logger.info('Logout successful', {
            userId,
            ipAddress,
            duration: Date.now() - startTime
          });

          res.json({ 
            message: 'Logout successful',
            code: 'LOGOUT_SUCCESS'
          });
        });
      });
    } catch (error) {
      logger.error('Logout error', error as Error, {
        userId,
        ipAddress,
        duration: Date.now() - startTime
      });

      res.status(500).json({ 
        message: 'Logout failed',
        code: 'LOGOUT_ERROR'
      });
    }
  }

  /**
   * Get current user information
   */
  static async getCurrentUser(req: Request, res: Response) {
    try {
      // Get userId from req.user (set by Passport)
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const storage = (await import('../storage')).storage;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ 
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }
      
      // Initialize LLM configurations if needed
      try {
        const llmService = (await import('../services/llmService')).llmService;
        const existingSettings = await storage.getLlmSettings(userId);
        if (existingSettings.length === 0) {
          await llmService.initializeFromEnvironment(userId);
        }
      } catch (error) {
        logger.error('Error initializing LLM configurations', error as Error);
        // Don't fail the request if LLM initialization fails
      }
      
      // Return safe user without password hash
      const { passwordHash, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      logger.error('Get current user error', error as Error);
      res.status(500).json({ 
        message: 'Failed to fetch user',
        code: 'FETCH_USER_ERROR'
      });
    }
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(req: Request, res: Response) {
    const startTime = Date.now();
    const ipAddress = req.ip || '127.0.0.1';
    const userAgent = req.get('User-Agent');

    try {
      const { email } = passwordResetRequestSchema.parse(req.body);
      
      logger.info('Password reset requested', {
        email,
        ipAddress,
        userAgent
      });

      // Find user by email
      const { storage } = await import('../storage');
      const user = await storage.getUserByEmail(email);

      if (user) {
        await passwordService.generateResetToken(
          user.id,
          ipAddress,
          userAgent
        );
      }

      // Always return success to prevent email enumeration
      logger.info('Password reset request processed', {
        email,
        ipAddress,
        duration: Date.now() - startTime
      });

      res.json({
        message: 'If the email exists, a reset link has been sent.',
        code: 'RESET_REQUEST_SENT'
      });
    } catch (error) {
      logger.error('Password reset request error', error as Error, {
        email: req.body?.email,
        ipAddress,
        duration: Date.now() - startTime
      });

      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid email', 
          errors: error.errors,
          code: 'VALIDATION_ERROR'
        });
      }

      res.status(500).json({ 
        message: 'Failed to process password reset request',
        code: 'RESET_REQUEST_ERROR'
      });
    }
  }

  /**
   * Confirm password reset
   */
  static async confirmPasswordReset(req: Request, res: Response) {
    const startTime = Date.now();
    const ipAddress = req.ip || '127.0.0.1';

    try {
      const { token, newPassword } = passwordResetConfirmSchema.parse(req.body);
      
      const result = await passwordService.resetPassword(token, newPassword);
      
      if (result.success) {
        logger.info('Password reset successful', {
          ipAddress,
          duration: Date.now() - startTime
        });

        res.json({ 
          message: 'Password reset successfully',
          code: 'RESET_SUCCESS'
        });
      } else {
        logger.warn('Password reset failed', {
          ipAddress,
          error: result.error
        });

        res.status(400).json({ 
          message: result.error,
          code: 'RESET_FAILED'
        });
      }
    } catch (error) {
      logger.error('Password reset confirmation error', error as Error, {
        ipAddress,
        duration: Date.now() - startTime
      });

      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid reset data', 
          errors: error.errors,
          code: 'VALIDATION_ERROR'
        });
      }

      res.status(500).json({ 
        message: 'Failed to reset password',
        code: 'RESET_ERROR'
      });
    }
  }
}
