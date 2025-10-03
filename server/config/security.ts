/**
 * Security Configuration Management
 * Centralized configuration for all security-related settings
 */

import { z } from 'zod';

// Environment validation schema
const securityConfigSchema = z.object({
  // Encryption
  ENCRYPTION_KEY: z.string().min(64, 'Encryption key must be at least 64 characters').optional(),
  
  // Session
  SESSION_SECRET: z.string().min(32, 'Session secret must be at least 32 characters'),
  SESSION_TIMEOUT_MINUTES: z.coerce.number().min(5).max(1440).default(480), // 8 hours
  
  // Database
  DATABASE_URL: z.string().url('Invalid database URL'),
  
  // Security defaults
  DEFAULT_MFA_REQUIRED: z.coerce.boolean().default(false),
  DEFAULT_PASSWORD_MIN_LENGTH: z.coerce.number().min(8).max(128).default(8),
  DEFAULT_MAX_LOGIN_ATTEMPTS: z.coerce.number().min(1).max(20).default(5),
  DEFAULT_LOCKOUT_DURATION_MINUTES: z.coerce.number().min(1).max(1440).default(15),
  DEFAULT_MAX_CONCURRENT_SESSIONS: z.coerce.number().min(1).max(10).default(3),
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  
  // Audit
  AUDIT_LOG_RETENTION_DAYS: z.coerce.number().min(1).max(365).default(90),
  
  // Email (for password reset)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),
  
  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type SecurityConfig = z.infer<typeof securityConfigSchema>;

class SecurityConfigManager {
  private static instance: SecurityConfigManager;
  private config: SecurityConfig;

  private constructor() {
    this.config = this.validateAndLoadConfig();
  }

  public static getInstance(): SecurityConfigManager {
    if (!SecurityConfigManager.instance) {
      SecurityConfigManager.instance = new SecurityConfigManager();
    }
    return SecurityConfigManager.instance;
  }

  private validateAndLoadConfig(): SecurityConfig {
    try {
      const config = securityConfigSchema.parse(process.env);
      
      // Additional validation for production
      if (config.NODE_ENV === 'production') {
        if (!config.ENCRYPTION_KEY) {
          throw new Error('ENCRYPTION_KEY is required in production');
        }
        
        if (config.SESSION_SECRET.length < 64) {
          console.warn('WARNING: SESSION_SECRET should be at least 64 characters in production');
        }
      }
      
      return config;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        throw new Error(`Security configuration validation failed:\n${errorMessages.join('\n')}`);
      }
      throw error;
    }
  }

  public getConfig(): SecurityConfig {
    return { ...this.config }; // Return a copy to prevent mutations
  }

  public get(key: keyof SecurityConfig): any {
    return this.config[key];
  }

  public isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  public isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development';
  }

  public isTest(): boolean {
    return this.config.NODE_ENV === 'test';
  }

  // Security-specific getters
  public getEncryptionKey(): string {
    if (!this.config.ENCRYPTION_KEY) {
      if (this.isProduction()) {
        throw new Error('ENCRYPTION_KEY is required in production');
      }
      // Generate a temporary key for development (not secure!)
      console.warn('WARNING: Using temporary encryption key for development');
      return 'dev-key-' + '0'.repeat(56); // 64 chars total
    }
    return this.config.ENCRYPTION_KEY;
  }

  public getSessionConfig() {
    return {
      secret: this.config.SESSION_SECRET,
      timeoutMinutes: this.config.SESSION_TIMEOUT_MINUTES,
      secure: this.isProduction(),
      httpOnly: true,
      sameSite: 'lax' as const,
    };
  }

  public getDefaultSecuritySettings() {
    return {
      mfaRequired: this.config.DEFAULT_MFA_REQUIRED,
      passwordMinLength: this.config.DEFAULT_PASSWORD_MIN_LENGTH,
      passwordMaxLength: 128,
      passwordRequireUppercase: true,
      passwordRequireLowercase: true,
      passwordRequireNumbers: true,
      passwordRequireSpecialChars: true,
      passwordExpirationDays: 90,
      passwordHistoryCount: 5,
      maxLoginAttempts: this.config.DEFAULT_MAX_LOGIN_ATTEMPTS,
      lockoutDurationMinutes: this.config.DEFAULT_LOCKOUT_DURATION_MINUTES,
      sessionTimeoutMinutes: this.config.SESSION_TIMEOUT_MINUTES,
      maxConcurrentSessions: this.config.DEFAULT_MAX_CONCURRENT_SESSIONS,
      enableCaptcha: true,
      captchaAfterAttempts: 3,
      enableAuditLogging: true,
      auditLogRetentionDays: this.config.AUDIT_LOG_RETENTION_DAYS,
      encryptionEnabled: true,
      encryptionAlgorithm: 'AES-256-GCM',
      enableSecurityAlerts: true,
    };
  }

  public getRateLimitConfig() {
    return {
      windowMs: this.config.RATE_LIMIT_WINDOW_MS,
      max: this.config.RATE_LIMIT_MAX_REQUESTS,
      standardHeaders: true,
      legacyHeaders: false,
    };
  }

  public getEmailConfig() {
    if (!this.config.SMTP_HOST || !this.config.FROM_EMAIL) {
      return null; // Email not configured
    }

    return {
      host: this.config.SMTP_HOST,
      port: this.config.SMTP_PORT || 587,
      secure: this.config.SMTP_PORT === 465,
      auth: this.config.SMTP_USER && this.config.SMTP_PASS ? {
        user: this.config.SMTP_USER,
        pass: this.config.SMTP_PASS,
      } : undefined,
      from: this.config.FROM_EMAIL,
    };
  }

  // Validation helpers
  public validateEncryptionKey(key: string): boolean {
    return key.length >= 64 && /^[a-fA-F0-9]+$/.test(key);
  }

  public generateSecureSessionSecret(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(64).toString('hex');
  }

  public generateSecureEncryptionKey(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex'); // 256 bits
  }
}

// Export singleton instance
export const securityConfig = SecurityConfigManager.getInstance();

// Export types and utilities
export { SecurityConfigManager };

// Helper function to check if all required security configs are present
export function validateSecurityConfiguration(): void {
  try {
    const config = securityConfig.getConfig();
    
    const requiredInProduction = [
      'ENCRYPTION_KEY',
      'SESSION_SECRET',
      'DATABASE_URL'
    ];

    if (config.NODE_ENV === 'production') {
      const missing = requiredInProduction.filter(key => !config[key as keyof SecurityConfig]);
      if (missing.length > 0) {
        throw new Error(`Missing required production configuration: ${missing.join(', ')}`);
      }
    }

    console.log('✅ Security configuration validated successfully');
  } catch (error) {
    console.error('❌ Security configuration validation failed:', error);
    throw error;
  }
}
