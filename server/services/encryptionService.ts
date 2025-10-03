import crypto from 'crypto';

/**
 * EncryptionService - Handles AES-256-GCM encryption/decryption for sensitive data
 * Used for encrypting MFA secrets, backup codes, and other sensitive information
 */
export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 16; // 128 bits
  private static readonly TAG_LENGTH = 16; // 128 bits

  /**
   * Get encryption key from environment or generate one
   */
  private static getEncryptionKey(): Buffer {
    const keyHex = process.env.ENCRYPTION_KEY;
    if (!keyHex) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('ENCRYPTION_KEY environment variable is required in production');
      }
      // Generate a key for development (not secure for production)
      console.warn('WARNING: Using generated encryption key. Set ENCRYPTION_KEY in production!');
      return crypto.randomBytes(this.KEY_LENGTH);
    }
    
    const key = Buffer.from(keyHex, 'hex');
    if (key.length !== this.KEY_LENGTH) {
      throw new Error(`Encryption key must be ${this.KEY_LENGTH} bytes (${this.KEY_LENGTH * 2} hex characters)`);
    }
    
    return key;
  }

  /**
   * Encrypt sensitive data
   * @param plaintext - Data to encrypt
   * @returns Encrypted data with IV and auth tag (base64 encoded)
   */
  static encrypt(plaintext: string): string {
    if (!plaintext) {
      throw new Error('Cannot encrypt empty data');
    }

    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(this.IV_LENGTH);
    
    const cipher = crypto.createCipher(this.ALGORITHM, key);
    cipher.setAAD(Buffer.from('additional-auth-data')); // Additional authenticated data
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Combine IV + authTag + encrypted data
    const combined = Buffer.concat([
      iv,
      authTag,
      Buffer.from(encrypted, 'hex')
    ]);
    
    return combined.toString('base64');
  }

  /**
   * Decrypt sensitive data
   * @param encryptedData - Base64 encoded encrypted data
   * @returns Decrypted plaintext
   */
  static decrypt(encryptedData: string): string {
    if (!encryptedData) {
      throw new Error('Cannot decrypt empty data');
    }

    try {
      const key = this.getEncryptionKey();
      const combined = Buffer.from(encryptedData, 'base64');
      
      // Extract components
      const iv = combined.subarray(0, this.IV_LENGTH);
      const authTag = combined.subarray(this.IV_LENGTH, this.IV_LENGTH + this.TAG_LENGTH);
      const encrypted = combined.subarray(this.IV_LENGTH + this.TAG_LENGTH);
      
      const decipher = crypto.createDecipher(this.ALGORITHM, key);
      decipher.setAuthTag(authTag);
      decipher.setAAD(Buffer.from('additional-auth-data'));
      
      let decrypted = decipher.update(encrypted, undefined, 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error('Failed to decrypt data: Invalid or corrupted data');
    }
  }

  /**
   * Generate a secure random key for encryption
   * @returns Hex-encoded encryption key
   */
  static generateEncryptionKey(): string {
    return crypto.randomBytes(this.KEY_LENGTH).toString('hex');
  }

  /**
   * Hash sensitive data (one-way)
   * @param data - Data to hash
   * @param salt - Optional salt (will generate if not provided)
   * @returns Object with hash and salt
   */
  static hash(data: string, salt?: string): { hash: string; salt: string } {
    const saltBuffer = salt ? Buffer.from(salt, 'hex') : crypto.randomBytes(16);
    const hash = crypto.pbkdf2Sync(data, saltBuffer, 100000, 64, 'sha512');
    
    return {
      hash: hash.toString('hex'),
      salt: saltBuffer.toString('hex')
    };
  }

  /**
   * Verify hashed data
   * @param data - Original data
   * @param hash - Stored hash
   * @param salt - Stored salt
   * @returns True if data matches hash
   */
  static verifyHash(data: string, hash: string, salt: string): boolean {
    const computed = this.hash(data, salt);
    return computed.hash === hash;
  }

  /**
   * Generate cryptographically secure random string
   * @param length - Length of the string
   * @param charset - Character set to use
   * @returns Random string
   */
  static generateSecureRandom(
    length: number, 
    charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  ): string {
    const bytes = crypto.randomBytes(length);
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += charset[bytes[i] % charset.length];
    }
    
    return result;
  }

  /**
   * Generate backup codes for MFA
   * @param count - Number of codes to generate
   * @returns Array of backup codes
   */
  static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric codes
      const code = this.generateSecureRandom(8, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
      codes.push(code);
    }
    
    return codes;
  }
}

// Export singleton instance
export const encryptionService = {
  encrypt: EncryptionService.encrypt.bind(EncryptionService),
  decrypt: EncryptionService.decrypt.bind(EncryptionService),
  generateEncryptionKey: EncryptionService.generateEncryptionKey.bind(EncryptionService),
  hash: EncryptionService.hash.bind(EncryptionService),
  verifyHash: EncryptionService.verifyHash.bind(EncryptionService),
  generateSecureRandom: EncryptionService.generateSecureRandom.bind(EncryptionService),
  generateBackupCodes: EncryptionService.generateBackupCodes.bind(EncryptionService),
};
