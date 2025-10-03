/**
 * Security Service - Robust Architecture
 * Main coordinator for all security-related operations
 * Implements proper error handling, logging, and dependency injection
 */

import { storage } from '../storage';
import { passwordService } from './passwordService';
import { mfaService } from './mfaService';
import { auditService } from './auditService';
import { sessionService } from './sessionService';
import { securityConfig } from '../config/security';
import { logger, createServiceLogger } from '../utils/logger';
import type {
  SecuritySettings,
  InsertSecuritySettings,
  UpdateSecuritySettings,
  InsertFailedLoginAttempt,
  SafeUser
} from '@shared/schema';
import type {
  ISecurityService,
  AuthenticationCredentials,
  AuthenticationResult,
  AccountLockStatus,
  FailedLoginAttemptData
} from '../types/security';

// Import des classes d'erreur
import { SecurityError, AuthenticationError } from '../errors/SecurityErrors';

export class SecurityService implements ISecurityService {
  private static instance: SecurityService;
  private serviceLogger = createServiceLogger('SecurityService');
  private constructor() {
    // Services are imported as singletons or static classes
    // No need to store them as instance variables
  }

  public static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  /**
   * Initialize default security settings if they don't exist
   */
  async initializeSecuritySettings(): Promise<void> {
    const startTime = Date.now();

    try {
      this.serviceLogger.info('Initializing security settings...');

      const existingSettings = await storage.getSecuritySettings();

      if (!existingSettings) {
        const defaultSettings = securityConfig.getDefaultSecuritySettings();
        await storage.createSecuritySettings(defaultSettings);

        this.serviceLogger.info('Default security settings initialized', {
          settings: Object.keys(defaultSettings)
        });
      } else {
        this.serviceLogger.debug('Security settings already exist, skipping initialization');
      }

      this.serviceLogger.operation('initializeSecuritySettings', true, Date.now() - startTime);
    } catch (error) {
      this.serviceLogger.operation('initializeSecuritySettings', false, Date.now() - startTime);
      this.serviceLogger.error('Failed to initialize security settings', error as Error);
      // Don't throw in Docker environment, just log the error
      console.warn('Security settings initialization failed, continuing without it:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Get current security settings
   */
  async getSecuritySettings(): Promise<SecuritySettings | null> {
    const startTime = Date.now();

    try {
      const settings = await storage.getSecuritySettings();
      this.serviceLogger.operation('getSecuritySettings', true, Date.now() - startTime);
      return settings;
    } catch (error) {
      this.serviceLogger.operation('getSecuritySettings', false, Date.now() - startTime);
      this.serviceLogger.error('Failed to get security settings', error as Error);
      throw new SecurityError('Failed to retrieve security settings', 'GET_SETTINGS_FAILED');
    }
  }

  /**
   * Update security settings with validation and audit logging
   */
  async updateSecuritySettings(updates: UpdateSecuritySettings): Promise<SecuritySettings> {
    const startTime = Date.now();

    try {
      // Validate updates
      this.validateSecuritySettingsUpdates(updates);

      const updated = await storage.updateSecuritySettings(updates);

      // Log the security settings change
      await auditService.logSecurityEvent({
        userId: undefined, // System event
        eventType: 'suspicious_activity', // Using this as a general admin action
        eventDescription: `Security settings updated: ${Object.keys(updates).join(', ')}`,
        isSuccessful: true,
        additionalData: { updatedFields: Object.keys(updates) }
      });

      this.serviceLogger.info('Security settings updated', {
        updatedFields: Object.keys(updates)
      });

      this.serviceLogger.operation('updateSecuritySettings', true, Date.now() - startTime);
      return updated;
    } catch (error) {
      this.serviceLogger.operation('updateSecuritySettings', false, Date.now() - startTime);
      this.serviceLogger.error('Failed to update security settings', error as Error);
      throw error instanceof SecurityError ? error : new SecurityError('Failed to update security settings', 'UPDATE_SETTINGS_FAILED');
    }
  }

  /**
   * Validate security settings updates
   */
  private validateSecuritySettingsUpdates(updates: UpdateSecuritySettings): void {
    const errors: string[] = [];

    if (updates.passwordMinLength !== undefined) {
      if (updates.passwordMinLength < 8 || updates.passwordMinLength > 128) {
        errors.push('Password minimum length must be between 8 and 128 characters');
      }
    }

    if (updates.maxLoginAttempts !== undefined) {
      if (updates.maxLoginAttempts < 1 || updates.maxLoginAttempts > 20) {
        errors.push('Max login attempts must be between 1 and 20');
      }
    }

    if (updates.lockoutDurationMinutes !== undefined) {
      if (updates.lockoutDurationMinutes < 1 || updates.lockoutDurationMinutes > 1440) {
        errors.push('Lockout duration must be between 1 and 1440 minutes');
      }
    }

    if (errors.length > 0) {
      throw new SecurityError(`Invalid security settings: ${errors.join(', ')}`, 'VALIDATION_FAILED', 400);
    }
  }

  /**
   * Check if user account is locked due to failed login attempts
   */
  async checkAccountLockStatus(userId: string, ipAddress: string): Promise<AccountLockStatus> {
    const startTime = Date.now();

    try {
      const securitySettings = await this.getSecuritySettings();
      if (!securitySettings) {
        this.serviceLogger.warn('No security settings found, allowing access');
        return { isLocked: false };
      }

      const now = new Date();
      const lockoutWindow = new Date(now.getTime() - securitySettings.lockoutDurationMinutes * 60 * 1000);

      // Check failed attempts by user
      const userFailedAttempts = await storage.getFailedLoginAttempts({
        userId,
        since: lockoutWindow,
      });

      // Check failed attempts by IP
      const ipFailedAttempts = await storage.getFailedLoginAttempts({
        ipAddress,
        since: lockoutWindow,
      });

      const userAttempts = userFailedAttempts.length;
      const ipAttempts = ipFailedAttempts.length;

      // Check if locked by user attempts
      if (userAttempts >= securitySettings.maxLoginAttempts) {
        const latestAttempt = userFailedAttempts[0];
        const unlockTime = new Date(latestAttempt.createdAt.getTime() + securitySettings.lockoutDurationMinutes * 60 * 1000);

        if (now < unlockTime) {
          const remainingMinutes = Math.ceil((unlockTime.getTime() - now.getTime()) / (60 * 1000));

          this.serviceLogger.warn('Account locked due to failed attempts', {
            userId,
            userAttempts,
            remainingMinutes
          });

          return {
            isLocked: true,
            remainingMinutes,
            reason: 'Too many failed login attempts',
          };
        }
      }

      // Check if locked by IP attempts (more aggressive threshold)
      if (ipAttempts >= securitySettings.maxLoginAttempts * 2) {
        const latestAttempt = ipFailedAttempts[0];
        const unlockTime = new Date(latestAttempt.createdAt.getTime() + securitySettings.lockoutDurationMinutes * 60 * 1000);

        if (now < unlockTime) {
          const remainingMinutes = Math.ceil((unlockTime.getTime() - now.getTime()) / (60 * 1000));

          this.serviceLogger.warn('IP address locked due to failed attempts', {
            ipAddress,
            ipAttempts,
            remainingMinutes
          });

          return {
            isLocked: true,
            remainingMinutes,
            reason: 'Too many failed attempts from this IP address',
          };
        }
      }

      this.serviceLogger.operation('checkAccountLockStatus', true, Date.now() - startTime);
      return { isLocked: false };
    } catch (error) {
      this.serviceLogger.operation('checkAccountLockStatus', false, Date.now() - startTime);
      this.serviceLogger.error('Error checking account lock status', error as Error);
      // Return unlocked on error to avoid blocking legitimate users
      return { isLocked: false };
    }
  }

  /**
   * Record a failed login attempt with proper error handling and logging
   */
  async recordFailedLoginAttempt(attempt: FailedLoginAttemptData): Promise<void> {
    const startTime = Date.now();

    try {
      const failedAttempt: Omit<InsertFailedLoginAttempt, 'createdAt'> = {
        userId: attempt.userId,
        email: attempt.email,
        ipAddress: attempt.ipAddress,
        userAgent: attempt.userAgent,
        failureReason: attempt.failureReason,
      };

      await storage.createFailedLoginAttempt(failedAttempt);

      // Log security event
      await auditService.logSecurityEvent({
        userId: attempt.userId,
        eventType: 'login_failed',
        eventDescription: `Failed login attempt: ${attempt.failureReason}`,
        ipAddress: attempt.ipAddress,
        userAgent: attempt.userAgent,
        isSuccessful: false,
        failureReason: attempt.failureReason,
      });

      this.serviceLogger.info('Failed login attempt recorded', {
        userId: attempt.userId,
        email: attempt.email,
        ipAddress: attempt.ipAddress,
        failureReason: attempt.failureReason
      });

      this.serviceLogger.operation('recordFailedLoginAttempt', true, Date.now() - startTime);
    } catch (error) {
      this.serviceLogger.operation('recordFailedLoginAttempt', false, Date.now() - startTime);
      this.serviceLogger.error('Failed to record failed login attempt', error as Error);
      throw new SecurityError('Failed to record failed login attempt', 'RECORD_FAILED_ATTEMPT_ERROR');
    }
  }


  /**
   * Check if CAPTCHA should be required based on failed attempts
   */
  async shouldRequireCaptcha(ipAddress: string, userId?: string): Promise<boolean> {
    const startTime = Date.now();

    try {
      const securitySettings = await this.getSecuritySettings();
      if (!securitySettings?.enableCaptcha) {
        this.serviceLogger.operation('shouldRequireCaptcha', true, Date.now() - startTime);
        return false;
      }

      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Check failed attempts from IP in last hour
      const ipFailedAttempts = await storage.getFailedLoginAttempts({
        ipAddress,
        since: oneHourAgo,
      });

      const requiresCaptcha = ipFailedAttempts.length >= securitySettings.captchaAfterAttempts;

      if (requiresCaptcha) {
        this.serviceLogger.info('CAPTCHA required due to failed attempts', {
          ipAddress,
          failedAttempts: ipFailedAttempts.length,
          threshold: securitySettings.captchaAfterAttempts
        });
      }

      this.serviceLogger.operation('shouldRequireCaptcha', true, Date.now() - startTime);
      return requiresCaptcha;
    } catch (error) {
      this.serviceLogger.operation('shouldRequireCaptcha', false, Date.now() - startTime);
      this.serviceLogger.error('Error checking CAPTCHA requirement', error as Error);
      // Return false on error to avoid blocking legitimate users
      return false;
    }
  }

  /**
   * Comprehensive user authentication with all security checks
   */
  async authenticateUser(credentials: AuthenticationCredentials): Promise<AuthenticationResult> {
    const startTime = Date.now();
    const { email, password, mfaCode, ipAddress, userAgent } = credentials;

    try {
      this.serviceLogger.info('Authentication attempt started', {
        email,
        ipAddress,
        userAgent
      });

      // Get user by email
      const user = await storage.getUserByEmail(email.toLowerCase().trim());

      // Check account lock status
      const lockStatus = await this.checkAccountLockStatus(
        user?.id || '',
        ipAddress
      );

      if (lockStatus.isLocked) {
        this.serviceLogger.warn('Authentication blocked - account locked', {
          email,
          ipAddress,
          remainingMinutes: lockStatus.remainingMinutes
        });

        return {
          success: false,
          error: `Account temporarily locked. Try again in ${lockStatus.remainingMinutes} minutes.`,
        };
      }

      // Check if CAPTCHA is required
      const requiresCaptcha = await this.shouldRequireCaptcha(ipAddress, user?.id);

      if (!user) {
        await this.recordFailedLoginAttempt({
          email,
          ipAddress,
          userAgent,
          failureReason: 'invalid_email',
        });

        this.serviceLogger.warn('Authentication failed - invalid email', {
          email,
          ipAddress
        });

        return {
          success: false,
          error: 'Invalid email or password',
          requiresCaptcha,
        };
      }

      // Verify password
      const isPasswordValid = await passwordService.verifyPassword(password, user.passwordHash);

      if (!isPasswordValid) {
        await this.recordFailedLoginAttempt({
          email,
          userId: user.id,
          ipAddress,
          userAgent,
          failureReason: 'invalid_password',
        });

        this.serviceLogger.warn('Authentication failed - invalid password', {
          userId: user.id,
          email,
          ipAddress
        });

        return {
          success: false,
          error: 'Invalid email or password',
          requiresCaptcha,
        };
      }

      // Check if password is expired
      const isPasswordExpired = await passwordService.isPasswordExpired(user.id);
      if (isPasswordExpired) {
        this.serviceLogger.warn('Authentication failed - password expired', {
          userId: user.id,
          email
        });

        return {
          success: false,
          error: 'Password has expired. Please reset your password.',
        };
      }

      // Check MFA requirements
      const securitySettings = await this.getSecuritySettings();
      const mfaStatus = await mfaService.getMfaStatus(user.id);

      if (mfaStatus.enabled || securitySettings?.mfaRequired) {
        if (!mfaCode) {
          this.serviceLogger.info('MFA code required for authentication', {
            userId: user.id,
            email
          });

          return {
            success: false,
            requiresMfa: true,
            error: 'MFA code required',
          };
        }

        // Verify MFA code
        const mfaVerification = await mfaService.verifyMfa(user.id, mfaCode);
        if (!mfaVerification.isValid) {
          await this.recordFailedLoginAttempt({
            email,
            userId: user.id,
            ipAddress,
            userAgent,
            failureReason: 'invalid_mfa',
          });

          this.serviceLogger.warn('Authentication failed - invalid MFA code', {
            userId: user.id,
            email,
            ipAddress
          });

          return {
            success: false,
            error: 'Invalid MFA code',
            requiresMfa: true,
          };
        }
      }

      // Create session
      const sessionToken = await sessionService.createSession(user.id, {
        ipAddress,
        userAgent,
      });

      // Log successful authentication
      await auditService.logSecurityEvent({
        userId: user.id,
        eventType: 'login_successful',
        eventDescription: 'User successfully authenticated',
        ipAddress,
        userAgent,
        isSuccessful: true,
        sessionId: sessionToken,
      });

      // Return safe user data (without password hash)
      const { passwordHash, ...safeUser } = user as SafeUser & { passwordHash: string };

      this.serviceLogger.info('Authentication successful', {
        userId: user.id,
        email,
        ipAddress
      });

      this.serviceLogger.operation('authenticateUser', true, Date.now() - startTime);

      return {
        success: true,
        user: safeUser,
        sessionToken,
      };
    } catch (error) {
      this.serviceLogger.operation('authenticateUser', false, Date.now() - startTime);
      this.serviceLogger.error('Authentication error', error as Error, {
        email,
        ipAddress
      });

      throw new AuthenticationError('Authentication failed', 'AUTH_ERROR');
    }
  }

  /**
   * Run security maintenance tasks
   */
  async runMaintenanceTasks(): Promise<void> {
    const startTime = Date.now();

    try {
      this.serviceLogger.info('Starting security maintenance tasks');

      // Clean up expired sessions
      await sessionService.cleanupExpiredSessions();

      // Clean up old audit logs

      // Clean up old failed login attempts (older than 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      await storage.deleteFailedLoginAttemptsOlderThan(thirtyDaysAgo);

      // Clean up expired password reset tokens
      await storage.deleteExpiredPasswordResetTokens();

      this.serviceLogger.info('Security maintenance tasks completed', {
        duration: Date.now() - startTime
      });

      this.serviceLogger.operation('runMaintenanceTasks', true, Date.now() - startTime);
    } catch (error) {
      this.serviceLogger.operation('runMaintenanceTasks', false, Date.now() - startTime);
      this.serviceLogger.error('Error running security maintenance tasks', error as Error);
      throw new SecurityError('Security maintenance tasks failed', 'MAINTENANCE_FAILED');
    }
  }
}

// Export singleton instance
export const securityService = SecurityService.getInstance();
