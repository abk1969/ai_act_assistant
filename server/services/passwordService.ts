import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { storage } from '../storage';
import { EncryptionService } from './encryptionService';
import type { SecuritySettings, PasswordResetToken, InsertPasswordResetToken } from '@shared/schema';

/**
 * PasswordService - Handles password validation, hashing, reset, and policy enforcement
 */
export class PasswordService {
  private static readonly SALT_ROUNDS = 12;
  private static readonly RESET_TOKEN_EXPIRY_HOURS = 1; // 1 hour
  private static readonly MAX_PASSWORD_HISTORY = 24;

  /**
   * Validate password against security policy
   * @param password - Password to validate
   * @param securitySettings - Current security settings
   * @returns Validation result
   */
  static validatePassword(password: string, securitySettings?: SecuritySettings): {
    isValid: boolean;
    errors: string[];
    score: number; // 0-100
  } {
    const errors: string[] = [];
    let score = 0;

    // Default settings if not provided
    const settings = securitySettings || {
      passwordMinLength: 8,
      passwordMaxLength: 128,
      passwordRequireUppercase: true,
      passwordRequireLowercase: true,
      passwordRequireNumbers: true,
      passwordRequireSpecialChars: true,
    };

    // Length validation
    if (password.length < settings.passwordMinLength) {
      errors.push(`Le mot de passe doit contenir au moins ${settings.passwordMinLength} caractères`);
    } else if (password.length >= settings.passwordMinLength) {
      score += 20;
    }

    if (password.length > settings.passwordMaxLength) {
      errors.push(`Le mot de passe ne peut pas dépasser ${settings.passwordMaxLength} caractères`);
    }

    // Character requirements
    if (settings.passwordRequireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une lettre majuscule');
    } else if (settings.passwordRequireUppercase && /[A-Z]/.test(password)) {
      score += 15;
    }

    if (settings.passwordRequireLowercase && !/[a-z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une lettre minuscule');
    } else if (settings.passwordRequireLowercase && /[a-z]/.test(password)) {
      score += 15;
    }

    if (settings.passwordRequireNumbers && !/\d/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins un chiffre');
    } else if (settings.passwordRequireNumbers && /\d/.test(password)) {
      score += 15;
    }

    if (settings.passwordRequireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins un caractère spécial');
    } else if (settings.passwordRequireSpecialChars && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 15;
    }

    // Additional scoring for complexity
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= password.length * 0.7) {
      score += 10; // High character diversity
    }

    // Check for common patterns
    if (/(.)\1{2,}/.test(password)) {
      score -= 10; // Repeated characters
      errors.push('Évitez les caractères répétés consécutifs');
    }

    if (/123|abc|qwe|password|admin/i.test(password)) {
      score -= 20; // Common patterns
      errors.push('Évitez les séquences communes et mots évidents');
    }

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));

    return {
      isValid: errors.length === 0,
      errors,
      score,
    };
  }

  /**
   * Hash password with bcrypt
   * @param password - Plain text password
   * @returns Hashed password
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Verify password against hash
   * @param password - Plain text password
   * @param hash - Stored hash
   * @returns True if password matches
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Check if password was used recently (password history)
   * @param userId - User ID
   * @param newPassword - New password to check
   * @param historyCount - Number of previous passwords to check
   * @returns True if password was used recently
   */
  static async isPasswordRecentlyUsed(
    userId: string, 
    newPassword: string, 
    historyCount: number = 5
  ): Promise<boolean> {
    // This would require a password history table
    // For now, we'll implement a basic check against current password
    try {
      const user = await storage.getUser(userId);
      if (user && user.passwordHash) {
        return await this.verifyPassword(newPassword, user.passwordHash);
      }
    } catch (error) {
      console.error('Error checking password history:', error);
    }
    
    return false;
  }

  /**
   * Generate password reset token
   * @param userId - User ID
   * @param requestIp - IP address of the request
   * @param userAgent - User agent of the request
   * @returns Reset token
   */
  static async generateResetToken(
    userId: string, 
    requestIp: string, 
    userAgent?: string
  ): Promise<string> {
    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.RESET_TOKEN_EXPIRY_HOURS);

    const resetToken: InsertPasswordResetToken = {
      userId,
      token: tokenHash, // Store hashed version
      tokenHash: EncryptionService.hash(token).hash, // Additional security layer
      expiresAt,
      requestedFromIp: requestIp,
      requestedFromUserAgent: userAgent,
    };

    await storage.createPasswordResetToken(resetToken);
    
    // Return the plain token (only time it's available)
    return token;
  }

  /**
   * Verify and consume reset token
   * @param token - Reset token
   * @param newPassword - New password
   * @returns Success status
   */
  static async resetPassword(token: string, newPassword: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Hash the provided token to match stored version
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      
      // Find valid token
      const resetToken = await storage.getPasswordResetToken(tokenHash);
      
      if (!resetToken) {
        return { success: false, error: 'Token invalide ou expiré' };
      }

      if (resetToken.usedAt) {
        return { success: false, error: 'Token déjà utilisé' };
      }

      if (new Date() > resetToken.expiresAt) {
        return { success: false, error: 'Token expiré' };
      }

      // Verify additional security layer
      if (!EncryptionService.verifyHash(token, resetToken.tokenHash, '')) {
        return { success: false, error: 'Token invalide' };
      }

      // Get security settings for password validation
      const securitySettings = await storage.getSecuritySettings();
      
      // Validate new password
      const validation = this.validatePassword(newPassword, securitySettings);
      if (!validation.isValid) {
        return { 
          success: false, 
          error: `Mot de passe invalide: ${validation.errors.join(', ')}` 
        };
      }

      // Check password history
      const isRecentlyUsed = await this.isPasswordRecentlyUsed(
        resetToken.userId, 
        newPassword, 
        securitySettings?.passwordHistoryCount || 5
      );
      
      if (isRecentlyUsed) {
        return { 
          success: false, 
          error: 'Ce mot de passe a été utilisé récemment. Choisissez un mot de passe différent.' 
        };
      }

      // Hash new password
      const passwordHash = await this.hashPassword(newPassword);

      // Update user password
      await storage.updateUserPassword(resetToken.userId, passwordHash);

      // Mark token as used
      await storage.markPasswordResetTokenUsed(resetToken.id);

      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: 'Erreur lors de la réinitialisation du mot de passe' };
    }
  }

  /**
   * Change user password (authenticated user)
   * @param userId - User ID
   * @param currentPassword - Current password
   * @param newPassword - New password
   * @returns Success status
   */
  static async changePassword(
    userId: string, 
    currentPassword: string, 
    newPassword: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Verify current password
      const user = await storage.getUser(userId);
      if (!user) {
        return { success: false, error: 'Utilisateur non trouvé' };
      }

      const isCurrentPasswordValid = await this.verifyPassword(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        return { success: false, error: 'Mot de passe actuel incorrect' };
      }

      // Get security settings
      const securitySettings = await storage.getSecuritySettings();
      
      // Validate new password
      const validation = this.validatePassword(newPassword, securitySettings);
      if (!validation.isValid) {
        return { 
          success: false, 
          error: `Nouveau mot de passe invalide: ${validation.errors.join(', ')}` 
        };
      }

      // Check password history
      const isRecentlyUsed = await this.isPasswordRecentlyUsed(
        userId, 
        newPassword, 
        securitySettings?.passwordHistoryCount || 5
      );
      
      if (isRecentlyUsed) {
        return { 
          success: false, 
          error: 'Ce mot de passe a été utilisé récemment. Choisissez un mot de passe différent.' 
        };
      }

      // Hash new password
      const passwordHash = await this.hashPassword(newPassword);

      // Update password
      await storage.updateUserPassword(userId, passwordHash);

      return { success: true };
    } catch (error) {
      console.error('Password change error:', error);
      return { success: false, error: 'Erreur lors du changement de mot de passe' };
    }
  }

  /**
   * Check if password is expired
   * @param userId - User ID
   * @returns True if password is expired
   */
  static async isPasswordExpired(userId: string): Promise<boolean> {
    try {
      const user = await storage.getUser(userId);
      const securitySettings = await storage.getSecuritySettings();
      
      if (!user || !securitySettings?.passwordExpirationDays || securitySettings.passwordExpirationDays === 0) {
        return false; // No expiration policy
      }

      const passwordAge = Date.now() - user.updatedAt.getTime();
      const maxAge = securitySettings.passwordExpirationDays * 24 * 60 * 60 * 1000;
      
      return passwordAge > maxAge;
    } catch (error) {
      console.error('Error checking password expiration:', error);
      return false;
    }
  }
}

// Export singleton instance
export const passwordService = {
  validatePassword: PasswordService.validatePassword.bind(PasswordService),
  hashPassword: PasswordService.hashPassword.bind(PasswordService),
  verifyPassword: PasswordService.verifyPassword.bind(PasswordService),
  generateResetToken: PasswordService.generateResetToken.bind(PasswordService),
  resetPassword: PasswordService.resetPassword.bind(PasswordService),
  changePassword: PasswordService.changePassword.bind(PasswordService),
  isPasswordRecentlyUsed: PasswordService.isPasswordRecentlyUsed.bind(PasswordService),
  isPasswordExpired: PasswordService.isPasswordExpired.bind(PasswordService),
};
