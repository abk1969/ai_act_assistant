/**
 * Security-related interfaces and types
 */

// Security Service Interfaces
export interface ISecurityService {
  initializeSecuritySettings(): Promise<void>;
  getSecuritySettings(): Promise<SecuritySettings | null>;
  updateSecuritySettings(updates: UpdateSecuritySettings): Promise<SecuritySettings>;
  checkAccountLockStatus(userId: string, ipAddress: string): Promise<AccountLockStatus>;
  recordFailedLoginAttempt(attempt: FailedLoginAttemptData): Promise<void>;
  shouldRequireCaptcha(ipAddress: string, userId?: string): Promise<boolean>;
  authenticateUser(credentials: AuthenticationCredentials): Promise<AuthenticationResult>;
  runMaintenanceTasks(): Promise<void>;
}

export interface IMFAService {
  generateTotpSecret(userId: string, userEmail: string): Promise<MFASetupData>;
  enableMfa(userId: string, setupData: MFAEnableData): Promise<boolean>;
  verifyMfa(userId: string, code: string): Promise<MFAVerificationResult>;
  disableMfa(userId: string, verificationCode: string): Promise<boolean>;
  regenerateBackupCodes(userId: string, verificationCode: string): Promise<string[]>;
  getMfaStatus(userId: string): Promise<MFAStatus>;
}

export interface IPasswordService {
  validatePassword(password: string, securitySettings?: SecuritySettings): Promise<PasswordValidationResult>;
  hashPassword(password: string): Promise<string>;
  verifyPassword(password: string, hash: string): Promise<boolean>;
  generateResetToken(userId: string, requestContext: RequestContext): Promise<string>;
  resetPassword(token: string, newPassword: string): Promise<PasswordResetResult>;
  changePassword(userId: string, currentPassword: string, newPassword: string): Promise<PasswordChangeResult>;
  isPasswordExpired(userId: string): Promise<boolean>;
}

export interface IAuditService {
  logSecurityEvent(event: SecurityEventData): Promise<void>;
  getUserSecurityEvents(userId: string, options?: SecurityEventQueryOptions): Promise<UserSecurityEvent[]>;
  getSecurityDashboard(timeframe: SecurityTimeframe): Promise<SecurityDashboard>;
  exportSecurityEvents(options?: SecurityEventExportOptions): Promise<string>;
  cleanupOldLogs(): Promise<void>;
}

export interface ISessionService {
  createSession(userId: string, sessionData: SessionCreationData): Promise<string>;
  validateSession(sessionToken: string, ipAddress: string): Promise<UserSession | null>;
  revokeSession(sessionToken: string, reason?: string): Promise<void>;
  revokeAllUserSessions(userId: string, excludeSessionToken?: string, reason?: string): Promise<void>;
  getUserSessions(userId: string): Promise<UserSession[]>;
  cleanupExpiredSessions(): Promise<void>;
}

export interface IEncryptionService {
  encrypt(plaintext: string): string;
  decrypt(encryptedData: string): string;
  generateEncryptionKey(): string;
  hash(data: string, salt?: string): HashResult;
  verifyHash(data: string, hash: string, salt: string): boolean;
  generateSecureRandom(length: number, charset?: string): string;
  generateBackupCodes(count?: number): string[];
}

// Data Types
export interface AuthenticationCredentials {
  email: string;
  password: string;
  mfaCode?: string;
  ipAddress: string;
  userAgent?: string;
}

export interface AuthenticationResult {
  success: boolean;
  user?: SafeUser;
  sessionToken?: string;
  error?: string;
  requiresMfa?: boolean;
  requiresCaptcha?: boolean;
}

export interface AccountLockStatus {
  isLocked: boolean;
  remainingMinutes?: number;
  reason?: string;
}

export interface FailedLoginAttemptData {
  email?: string;
  userId?: string;
  ipAddress: string;
  userAgent?: string;
  failureReason: string;
}

export interface MFASetupData {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface MFAEnableData {
  secret: string;
  verificationCode: string;
  backupCodes: string[];
  recoveryEmail?: string;
}

export interface MFAVerificationResult {
  isValid: boolean;
  isBackupCode: boolean;
  remainingBackupCodes?: number;
}

export interface MFAStatus {
  enabled: boolean;
  verifiedAt?: Date;
  backupCodesCount: number;
  recoveryEmail?: string;
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  score: number;
}

export interface PasswordResetResult {
  success: boolean;
  error?: string;
}

export interface PasswordChangeResult {
  success: boolean;
  error?: string;
}

export interface RequestContext {
  ipAddress: string;
  userAgent?: string;
}

export interface SecurityEventData {
  userId?: string;
  eventType: string;
  eventDescription?: string;
  ipAddress?: string;
  userAgent?: string;
  location?: any;
  isSuccessful?: boolean;
  failureReason?: string;
  sessionId?: string;
  additionalData?: any;
}

export interface SecurityEventQueryOptions {
  eventType?: string;
  since?: Date;
  until?: Date;
  limit?: number;
  offset?: number;
}

export interface SecurityDashboard {
  totalEvents: number;
  failedLogins: number;
  suspiciousActivity: number;
  uniqueUsers: number;
  uniqueIps: number;
  riskDistribution: { low: number; medium: number; high: number };
  eventsByType: Record<string, number>;
  topRiskyIps: Array<{ ip: string; events: number; riskScore: number }>;
}

export interface SecurityEventExportOptions {
  since?: Date;
  until?: Date;
  userId?: string;
  eventType?: string;
}

export interface SessionCreationData {
  ipAddress: string;
  userAgent?: string;
  deviceName?: string;
  location?: any;
}

export interface HashResult {
  hash: string;
  salt: string;
}

export type SecurityTimeframe = '24h' | '7d' | '30d';

// Import types from schema
import type {
  SecuritySettings,
  UpdateSecuritySettings,
  UserSecurityEvent,
  UserSession,
  SafeUser
} from '@shared/schema';

// Custom Error Classes
export class SecurityError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'SecurityError';
  }
}

export class AuthenticationError extends SecurityError {
  constructor(message: string, code: string = 'AUTH_FAILED') {
    super(message, code, 401);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends SecurityError {
  constructor(message: string, public errors: string[] = []) {
    super(message, 'VALIDATION_FAILED', 400);
    this.name = 'ValidationError';
  }
}

export class MFAError extends SecurityError {
  constructor(message: string, code: string = 'MFA_FAILED') {
    super(message, code, 400);
    this.name = 'MFAError';
  }
}

export class SessionError extends SecurityError {
  constructor(message: string, code: string = 'SESSION_FAILED') {
    super(message, code, 401);
    this.name = 'SessionError';
  }
}
