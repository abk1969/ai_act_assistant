import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { storage } from '../storage';
import { EncryptionService } from './encryptionService';
import type { UserMfaSettings, InsertUserMfaSettings } from '@shared/schema';

/**
 * MFAService - Handles Multi-Factor Authentication (TOTP and backup codes)
 */
export class MFAService {
  private static readonly APP_NAME = 'IA-ACT-NAVIGATOR';
  private static readonly ISSUER = 'IA-ACT-NAVIGATOR';

  /**
   * Generate TOTP secret and QR code for user
   * @param userId - User ID
   * @param userEmail - User email for QR code label
   * @returns Secret and QR code data URL
   */
  static async generateTotpSecret(userId: string, userEmail: string): Promise<{
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
  }> {
    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `${this.APP_NAME} (${userEmail})`,
      issuer: this.ISSUER,
      length: 32,
    });

    if (!secret.base32) {
      throw new Error('Failed to generate TOTP secret');
    }

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

    // Generate backup codes
    const backupCodes = EncryptionService.generateBackupCodes(10);

    return {
      secret: secret.base32,
      qrCodeUrl,
      backupCodes,
    };
  }

  /**
   * Enable MFA for user
   * @param userId - User ID
   * @param secret - TOTP secret
   * @param verificationCode - 6-digit verification code
   * @param backupCodes - Array of backup codes
   * @param recoveryEmail - Optional recovery email
   * @returns Success status
   */
  static async enableMfa(
    userId: string,
    secret: string,
    verificationCode: string,
    backupCodes: string[],
    recoveryEmail?: string
  ): Promise<boolean> {
    // Verify the TOTP code first
    const isValid = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: verificationCode,
      window: 2, // Allow 2 time steps (60 seconds) tolerance
    });

    if (!isValid) {
      throw new Error('Invalid verification code');
    }

    // Encrypt secret and backup codes
    const encryptedSecret = EncryptionService.encrypt(secret);
    const encryptedBackupCodes = backupCodes.map(code => EncryptionService.encrypt(code));

    // Save MFA settings
    const mfaSettings: InsertUserMfaSettings = {
      userId,
      totpEnabled: true,
      totpSecret: encryptedSecret,
      totpBackupCodes: encryptedBackupCodes,
      totpVerifiedAt: new Date(),
      recoveryEmail,
      backupCodesUsedCount: 0,
    };

    await storage.upsertUserMfaSettings(mfaSettings);
    return true;
  }

  /**
   * Verify TOTP or backup code
   * @param userId - User ID
   * @param code - 6-digit TOTP code or backup code
   * @returns Verification result
   */
  static async verifyMfa(userId: string, code: string): Promise<{
    isValid: boolean;
    isBackupCode: boolean;
    remainingBackupCodes?: number;
  }> {
    const mfaSettings = await storage.getUserMfaSettings(userId);
    
    if (!mfaSettings || !mfaSettings.totpEnabled || !mfaSettings.totpSecret) {
      throw new Error('MFA not enabled for user');
    }

    // First try TOTP verification
    try {
      const decryptedSecret = EncryptionService.decrypt(mfaSettings.totpSecret);
      const isTotpValid = speakeasy.totp.verify({
        secret: decryptedSecret,
        encoding: 'base32',
        token: code,
        window: 2,
      });

      if (isTotpValid) {
        return { isValid: true, isBackupCode: false };
      }
    } catch (error) {
      console.error('TOTP verification error:', error);
    }

    // If TOTP fails, try backup codes
    if (mfaSettings.totpBackupCodes && Array.isArray(mfaSettings.totpBackupCodes)) {
      const encryptedBackupCodes = mfaSettings.totpBackupCodes as string[];
      
      for (let i = 0; i < encryptedBackupCodes.length; i++) {
        try {
          const decryptedCode = EncryptionService.decrypt(encryptedBackupCodes[i]);
          
          if (decryptedCode === code.toUpperCase()) {
            // Remove used backup code
            encryptedBackupCodes.splice(i, 1);
            
            // Update MFA settings
            await storage.updateUserMfaSettings(userId, {
              totpBackupCodes: encryptedBackupCodes,
              backupCodesUsedCount: (mfaSettings.backupCodesUsedCount || 0) + 1,
              lastUsedBackupCode: code.toUpperCase(),
            });

            return {
              isValid: true,
              isBackupCode: true,
              remainingBackupCodes: encryptedBackupCodes.length,
            };
          }
        } catch (error) {
          console.error('Backup code decryption error:', error);
        }
      }
    }

    return { isValid: false, isBackupCode: false };
  }

  /**
   * Disable MFA for user
   * @param userId - User ID
   * @param verificationCode - Current TOTP code for verification
   * @returns Success status
   */
  static async disableMfa(userId: string, verificationCode: string): Promise<boolean> {
    const mfaSettings = await storage.getUserMfaSettings(userId);
    
    if (!mfaSettings || !mfaSettings.totpEnabled) {
      throw new Error('MFA not enabled for user');
    }

    // Verify current TOTP code before disabling
    const verification = await this.verifyMfa(userId, verificationCode);
    
    if (!verification.isValid) {
      throw new Error('Invalid verification code');
    }

    // Disable MFA
    await storage.updateUserMfaSettings(userId, {
      totpEnabled: false,
      totpSecret: null,
      totpBackupCodes: null,
      totpVerifiedAt: null,
      lastUsedBackupCode: null,
      backupCodesUsedCount: 0,
    });

    return true;
  }

  /**
   * Generate new backup codes
   * @param userId - User ID
   * @param verificationCode - Current TOTP code for verification
   * @returns New backup codes
   */
  static async regenerateBackupCodes(userId: string, verificationCode: string): Promise<string[]> {
    const mfaSettings = await storage.getUserMfaSettings(userId);
    
    if (!mfaSettings || !mfaSettings.totpEnabled) {
      throw new Error('MFA not enabled for user');
    }

    // Verify current TOTP code
    const verification = await this.verifyMfa(userId, verificationCode);
    
    if (!verification.isValid && !verification.isBackupCode) {
      throw new Error('Invalid verification code');
    }

    // Generate new backup codes
    const newBackupCodes = EncryptionService.generateBackupCodes(10);
    const encryptedBackupCodes = newBackupCodes.map(code => EncryptionService.encrypt(code));

    // Update MFA settings
    await storage.updateUserMfaSettings(userId, {
      totpBackupCodes: encryptedBackupCodes,
      backupCodesUsedCount: 0,
      lastUsedBackupCode: null,
    });

    return newBackupCodes;
  }

  /**
   * Get MFA status for user
   * @param userId - User ID
   * @returns MFA status information
   */
  static async getMfaStatus(userId: string): Promise<{
    enabled: boolean;
    verifiedAt?: Date;
    backupCodesCount: number;
    recoveryEmail?: string;
  }> {
    const mfaSettings = await storage.getUserMfaSettings(userId);
    
    if (!mfaSettings) {
      return {
        enabled: false,
        backupCodesCount: 0,
      };
    }

    const backupCodesCount = mfaSettings.totpBackupCodes 
      ? (mfaSettings.totpBackupCodes as string[]).length 
      : 0;

    return {
      enabled: mfaSettings.totpEnabled || false,
      verifiedAt: mfaSettings.totpVerifiedAt || undefined,
      backupCodesCount,
      recoveryEmail: mfaSettings.recoveryEmail || undefined,
    };
  }
}

// Export singleton instance
export const mfaService = {
  generateTotpSecret: MFAService.generateTotpSecret.bind(MFAService),
  enableMfa: MFAService.enableMfa.bind(MFAService),
  verifyMfa: MFAService.verifyMfa.bind(MFAService),
  disableMfa: MFAService.disableMfa.bind(MFAService),
  regenerateBackupCodes: MFAService.regenerateBackupCodes.bind(MFAService),
  getMfaStatus: MFAService.getMfaStatus.bind(MFAService),
};
