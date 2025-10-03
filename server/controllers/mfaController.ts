/**
 * MFA Controller
 * Handles Multi-Factor Authentication operations
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { mfaService } from '../services/mfaService';
import { auditService } from '../services/auditService';
import { createServiceLogger } from '../utils/logger';
import { 
  mfaSetupSchema, 
  mfaVerificationSchema 
} from '@shared/schema';
import { MFAError, ValidationError } from '../types/security';

const logger = createServiceLogger('MFAController');

export class MFAController {
  /**
   * Get MFA status for current user
   */
  static async getMFAStatus(req: Request, res: Response) {
    const startTime = Date.now();
    const userId = req.securityContext?.userId;

    try {
      if (!userId) {
        return res.status(401).json({ 
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      logger.debug('MFA status requested', { userId });

      const status = await mfaService.getMfaStatus(userId);
      
      logger.info('MFA status retrieved', {
        userId,
        enabled: status.enabled,
        duration: Date.now() - startTime
      });

      res.json(status);
    } catch (error) {
      logger.error('Error fetching MFA status', error as Error, {
        userId,
        duration: Date.now() - startTime
      });

      res.status(500).json({ 
        message: 'Failed to fetch MFA status',
        code: 'FETCH_MFA_STATUS_ERROR'
      });
    }
  }

  /**
   * Setup MFA for user (generate QR code and backup codes)
   */
  static async setupMFA(req: Request, res: Response) {
    const startTime = Date.now();
    const userId = req.securityContext?.userId;
    const userEmail = (req.user as any)?.email;

    try {
      if (!userId || !userEmail) {
        return res.status(401).json({ 
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      logger.info('MFA setup initiated', { userId, userEmail });

      const { secret, qrCodeUrl, backupCodes } = await mfaService.generateTotpSecret(userId, userEmail);

      // Log MFA setup initiation
      await auditService.logSecurityEvent({
        userId,
        eventType: 'mfa_setup_initiated',
        eventDescription: 'MFA setup process started',
        ipAddress: req.securityContext?.ipAddress,
        userAgent: req.securityContext?.userAgent,
        isSuccessful: true,
      });

      logger.info('MFA setup data generated', {
        userId,
        userEmail,
        backupCodesCount: backupCodes.length,
        duration: Date.now() - startTime
      });

      res.json({
        secret,
        qrCodeUrl,
        backupCodes,
        message: 'MFA setup initiated. Please verify with the code from your authenticator app.'
      });
    } catch (error) {
      logger.error('Error setting up MFA', error as Error, {
        userId,
        userEmail,
        duration: Date.now() - startTime
      });

      res.status(500).json({ 
        message: 'Failed to setup MFA',
        code: 'MFA_SETUP_ERROR'
      });
    }
  }

  /**
   * Enable MFA after verification
   */
  static async enableMFA(req: Request, res: Response) {
    const startTime = Date.now();
    const userId = req.securityContext?.userId;

    try {
      if (!userId) {
        return res.status(401).json({ 
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const { secret, verificationCode, backupCodes, recoveryEmail } = mfaSetupSchema.parse(req.body);
      
      logger.info('MFA enable requested', { userId });

      await mfaService.enableMfa(userId, {
        secret,
        verificationCode,
        backupCodes,
        recoveryEmail
      });

      await auditService.logSecurityEvent({
        userId,
        eventType: 'mfa_enabled',
        eventDescription: 'MFA enabled for user account',
        ipAddress: req.securityContext?.ipAddress,
        userAgent: req.securityContext?.userAgent,
        isSuccessful: true,
      });

      logger.info('MFA enabled successfully', {
        userId,
        hasRecoveryEmail: !!recoveryEmail,
        duration: Date.now() - startTime
      });

      res.json({ 
        message: 'MFA enabled successfully',
        code: 'MFA_ENABLED'
      });
    } catch (error) {
      logger.error('Error enabling MFA', error as Error, {
        userId,
        duration: Date.now() - startTime
      });

      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid MFA data', 
          errors: error.errors,
          code: 'VALIDATION_ERROR'
        });
      }

      if (error instanceof MFAError) {
        return res.status(error.statusCode).json({
          message: error.message,
          code: error.code
        });
      }

      res.status(400).json({ 
        message: error.message || 'Failed to enable MFA',
        code: 'MFA_ENABLE_ERROR'
      });
    }
  }

  /**
   * Disable MFA with verification
   */
  static async disableMFA(req: Request, res: Response) {
    const startTime = Date.now();
    const userId = req.securityContext?.userId;

    try {
      if (!userId) {
        return res.status(401).json({ 
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const { code } = mfaVerificationSchema.parse(req.body);
      
      logger.info('MFA disable requested', { userId });

      await mfaService.disableMfa(userId, code);

      await auditService.logSecurityEvent({
        userId,
        eventType: 'mfa_disabled',
        eventDescription: 'MFA disabled for user account',
        ipAddress: req.securityContext?.ipAddress,
        userAgent: req.securityContext?.userAgent,
        isSuccessful: true,
      });

      logger.info('MFA disabled successfully', {
        userId,
        duration: Date.now() - startTime
      });

      res.json({ 
        message: 'MFA disabled successfully',
        code: 'MFA_DISABLED'
      });
    } catch (error) {
      logger.error('Error disabling MFA', error as Error, {
        userId,
        duration: Date.now() - startTime
      });

      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid verification code', 
          errors: error.errors,
          code: 'VALIDATION_ERROR'
        });
      }

      if (error instanceof MFAError) {
        return res.status(error.statusCode).json({
          message: error.message,
          code: error.code
        });
      }

      res.status(400).json({ 
        message: error.message || 'Failed to disable MFA',
        code: 'MFA_DISABLE_ERROR'
      });
    }
  }

  /**
   * Regenerate backup codes
   */
  static async regenerateBackupCodes(req: Request, res: Response) {
    const startTime = Date.now();
    const userId = req.securityContext?.userId;

    try {
      if (!userId) {
        return res.status(401).json({ 
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const { code } = mfaVerificationSchema.parse(req.body);
      
      logger.info('MFA backup codes regeneration requested', { userId });

      const newBackupCodes = await mfaService.regenerateBackupCodes(userId, code);

      await auditService.logSecurityEvent({
        userId,
        eventType: 'mfa_backup_codes_regenerated',
        eventDescription: 'MFA backup codes regenerated',
        ipAddress: req.securityContext?.ipAddress,
        userAgent: req.securityContext?.userAgent,
        isSuccessful: true,
      });

      logger.info('MFA backup codes regenerated', {
        userId,
        newCodesCount: newBackupCodes.length,
        duration: Date.now() - startTime
      });

      res.json({ 
        backupCodes: newBackupCodes,
        message: 'New backup codes generated successfully',
        code: 'BACKUP_CODES_REGENERATED'
      });
    } catch (error) {
      logger.error('Error regenerating backup codes', error as Error, {
        userId,
        duration: Date.now() - startTime
      });

      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid verification code', 
          errors: error.errors,
          code: 'VALIDATION_ERROR'
        });
      }

      if (error instanceof MFAError) {
        return res.status(error.statusCode).json({
          message: error.message,
          code: error.code
        });
      }

      res.status(400).json({ 
        message: error.message || 'Failed to regenerate backup codes',
        code: 'BACKUP_CODES_ERROR'
      });
    }
  }

  /**
   * Verify MFA code (for testing purposes)
   */
  static async verifyMFA(req: Request, res: Response) {
    const startTime = Date.now();
    const userId = req.securityContext?.userId;

    try {
      if (!userId) {
        return res.status(401).json({ 
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const { code } = mfaVerificationSchema.parse(req.body);
      
      logger.debug('MFA verification requested', { userId });

      const result = await mfaService.verifyMfa(userId, code);

      logger.info('MFA verification completed', {
        userId,
        isValid: result.isValid,
        isBackupCode: result.isBackupCode,
        duration: Date.now() - startTime
      });

      res.json({
        isValid: result.isValid,
        isBackupCode: result.isBackupCode,
        remainingBackupCodes: result.remainingBackupCodes,
        message: result.isValid ? 'MFA code verified successfully' : 'Invalid MFA code'
      });
    } catch (error) {
      logger.error('Error verifying MFA', error as Error, {
        userId,
        duration: Date.now() - startTime
      });

      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid verification code', 
          errors: error.errors,
          code: 'VALIDATION_ERROR'
        });
      }

      res.status(500).json({ 
        message: 'Failed to verify MFA code',
        code: 'MFA_VERIFY_ERROR'
      });
    }
  }
}
