import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import * as argon2 from 'argon2';

export interface EncryptionResult {
  encryptedData: string;
  iv: string;
  authTag: string;
  keyVersion: string;
}

export interface DecryptionInput {
  encryptedData: string;
  iv: string;
  authTag: string;
  keyVersion: string;
}

export interface HashResult {
  hash: string;
  salt: string;
  algorithm: string;
}

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyDerivationIterations = 100000;

  // Encryption keys - in production, use AWS KMS, HashiCorp Vault, or similar
  private readonly encryptionKeys: Map<string, Buffer> = new Map();
  private readonly currentKeyVersion: string;

  constructor(private readonly configService: ConfigService) {
    this.currentKeyVersion = this.configService.get('ENCRYPTION_KEY_VERSION', 'v1');
    this.initializeKeys();
  }

  private initializeKeys(): void {
    try {
      // Get encryption key from environment
      const keyString = this.configService.get('ENCRYPTION_KEY');
      if (!keyString) {
        this.logger.warn('No encryption key provided. Using default key for development only!');
        // Generate a development key - NEVER use this in production
        const devKey = crypto.scryptSync('dev-key-restaurant-hub', 'salt', 32);
        this.encryptionKeys.set('v1', devKey);
      } else {
        // Derive key from provided string
        const key = crypto.scryptSync(keyString, this.configService.get('ENCRYPTION_SALT', 'restaurant-hub-salt'), 32);
        this.encryptionKeys.set(this.currentKeyVersion, key);
      }

      // Support for key rotation - load additional keys
      const additionalKeys = this.configService.get('ENCRYPTION_KEYS_JSON');
      if (additionalKeys) {
        try {
          const keyMap = JSON.parse(additionalKeys);
          Object.entries(keyMap).forEach(([version, keyString]) => {
            const key = crypto.scryptSync(keyString as string, this.configService.get('ENCRYPTION_SALT', 'restaurant-hub-salt'), 32);
            this.encryptionKeys.set(version, key);
          });
        } catch (error) {
          this.logger.error('Failed to parse additional encryption keys', error);
        }
      }

      this.logger.log(`Encryption service initialized with ${this.encryptionKeys.size} key(s)`);
    } catch (error) {
      this.logger.error('Failed to initialize encryption keys', error);
      throw new Error('Encryption service initialization failed');
    }
  }

  /**
   * Encrypt sensitive data with AES-256-GCM
   */
  async encryptField(data: string): Promise<EncryptionResult> {
    try {
      if (!data) {
        throw new Error('Data is required for encryption');
      }

      const key = this.encryptionKeys.get(this.currentKeyVersion);
      if (!key) {
        throw new Error(`Encryption key not found for version: ${this.currentKeyVersion}`);
      }

      // Generate random IV
      const iv = crypto.randomBytes(16);

      // Create cipher
      const cipher = crypto.createCipher(this.algorithm, key);

      // Encrypt data
      let encryptedData = cipher.update(data, 'utf8', 'hex');
      encryptedData += cipher.final('hex');

      // Get authentication tag
      const authTag = (cipher as any).getAuthTag().toString('hex');

      return {
        encryptedData,
        iv: iv.toString('hex'),
        authTag,
        keyVersion: this.currentKeyVersion,
      };
    } catch (error) {
      this.logger.error('Encryption failed', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt sensitive data
   */
  async decryptField(input: DecryptionInput): Promise<string> {
    try {
      if (!input.encryptedData || !input.iv || !input.authTag || !input.keyVersion) {
        throw new Error('All decryption parameters are required');
      }

      const key = this.encryptionKeys.get(input.keyVersion);
      if (!key) {
        throw new Error(`Decryption key not found for version: ${input.keyVersion}`);
      }

      // Create decipher
      const decipher = crypto.createDecipher(this.algorithm, key);

      // Set auth tag
      (decipher as any).setAuthTag(Buffer.from(input.authTag, 'hex'));

      // Decrypt data
      let decryptedData = decipher.update(input.encryptedData, 'hex', 'utf8');
      decryptedData += decipher.final('utf8');

      return decryptedData;
    } catch (error) {
      this.logger.error('Decryption failed', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Hash passwords using Argon2id (recommended for passwords)
   */
  async hashPassword(password: string): Promise<string> {
    try {
      return await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16, // 64 MB
        timeCost: 3,
        parallelism: 1,
        hashLength: 32,
      });
    } catch (error) {
      this.logger.error('Password hashing failed', error);
      throw new Error('Password hashing failed');
    }
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch (error) {
      this.logger.error('Password verification failed', error);
      return false;
    }
  }

  /**
   * Hash sensitive data (one-way, for search/indexing)
   */
  async hashSensitiveData(data: string, salt?: string): Promise<HashResult> {
    try {
      const generatedSalt = salt || crypto.randomBytes(32).toString('hex');
      const hash = crypto.pbkdf2Sync(data, generatedSalt, this.keyDerivationIterations, 64, 'sha512').toString('hex');

      return {
        hash,
        salt: generatedSalt,
        algorithm: 'pbkdf2-sha512',
      };
    } catch (error) {
      this.logger.error('Data hashing failed', error);
      throw new Error('Data hashing failed');
    }
  }

  /**
   * Encrypt personally identifiable information (PII)
   */
  async encryptPII(data: {
    email?: string;
    phone?: string;
    aadharNumber?: string;
    panNumber?: string;
    bankAccountNumber?: string;
    [key: string]: any;
  }): Promise<{ [key: string]: EncryptionResult }> {
    const encrypted: { [key: string]: EncryptionResult } = {};

    try {
      for (const [field, value] of Object.entries(data)) {
        if (value && typeof value === 'string') {
          // Only encrypt sensitive fields
          if (this.isSensitiveField(field)) {
            encrypted[field] = await this.encryptField(value);
          }
        }
      }

      return encrypted;
    } catch (error) {
      this.logger.error('PII encryption failed', error);
      throw new Error('PII encryption failed');
    }
  }

  /**
   * Decrypt PII data
   */
  async decryptPII(encryptedData: { [key: string]: DecryptionInput }): Promise<{ [key: string]: string }> {
    const decrypted: { [key: string]: string } = {};

    try {
      for (const [field, encryptionResult] of Object.entries(encryptedData)) {
        decrypted[field] = await this.decryptField(encryptionResult);
      }

      return decrypted;
    } catch (error) {
      this.logger.error('PII decryption failed', error);
      throw new Error('PII decryption failed');
    }
  }

  /**
   * Generate secure tokens for various purposes
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate API keys
   */
  generateApiKey(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = crypto.randomBytes(16).toString('hex');
    return `rh_${timestamp}_${randomPart}`;
  }

  /**
   * Hash API keys for storage
   */
  async hashApiKey(apiKey: string): Promise<string> {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(apiKey, salt, this.keyDerivationIterations, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  /**
   * Verify API key against stored hash
   */
  async verifyApiKey(apiKey: string, storedHash: string): Promise<boolean> {
    try {
      const [salt, hash] = storedHash.split(':');
      const computedHash = crypto.pbkdf2Sync(apiKey, salt, this.keyDerivationIterations, 64, 'sha512').toString('hex');
      return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computedHash, 'hex'));
    } catch (error) {
      this.logger.error('API key verification failed', error);
      return false;
    }
  }

  /**
   * Encrypt file content
   */
  async encryptFile(fileBuffer: Buffer): Promise<EncryptionResult & { encryptedBuffer: Buffer }> {
    try {
      const key = this.encryptionKeys.get(this.currentKeyVersion);
      if (!key) {
        throw new Error(`Encryption key not found for version: ${this.currentKeyVersion}`);
      }

      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipherGCM(this.algorithm, key, iv);

      const encryptedBuffer = Buffer.concat([
        cipher.update(fileBuffer),
        cipher.final()
      ]);

      const authTag = cipher.getAuthTag();

      return {
        encryptedData: encryptedBuffer.toString('hex'),
        encryptedBuffer,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        keyVersion: this.currentKeyVersion,
      };
    } catch (error) {
      this.logger.error('File encryption failed', error);
      throw new Error('File encryption failed');
    }
  }

  /**
   * Decrypt file content
   */
  async decryptFile(input: DecryptionInput): Promise<Buffer> {
    try {
      const key = this.encryptionKeys.get(input.keyVersion);
      if (!key) {
        throw new Error(`Decryption key not found for version: ${input.keyVersion}`);
      }

      const iv = Buffer.from(input.iv, 'hex');
      const authTag = Buffer.from(input.authTag, 'hex');
      const encryptedData = Buffer.from(input.encryptedData, 'hex');

      const decipher = crypto.createDecipherGCM(this.algorithm, key, iv);
      decipher.setAuthTag(authTag);

      const decryptedBuffer = Buffer.concat([
        decipher.update(encryptedData),
        decipher.final()
      ]);

      return decryptedBuffer;
    } catch (error) {
      this.logger.error('File decryption failed', error);
      throw new Error('File decryption failed');
    }
  }

  /**
   * Mask sensitive data for logs
   */
  maskSensitiveData(data: string, maskChar: string = '*', visibleChars: number = 4): string {
    if (!data || data.length <= visibleChars * 2) {
      return maskChar.repeat(8);
    }

    const start = data.substring(0, visibleChars);
    const end = data.substring(data.length - visibleChars);
    const masked = maskChar.repeat(Math.max(4, data.length - visibleChars * 2));

    return `${start}${masked}${end}`;
  }

  /**
   * Check if field contains sensitive data
   */
  private isSensitiveField(fieldName: string): boolean {
    const sensitiveFields = [
      'password', 'passwordHash', 'email', 'phone', 'aadharNumber', 'aadhaarNumber',
      'panNumber', 'bankAccountNumber', 'accountNumber', 'ifscCode', 'routingNumber',
      'ssn', 'sin', 'nationalId', 'drivingLicense', 'passport', 'creditCard',
      'debitCard', 'cvv', 'pin', 'secret', 'token', 'key', 'apiKey',
      'twoFactorSecret', 'backupCodes', 'recoveryKey'
    ];

    return sensitiveFields.some(field =>
      fieldName.toLowerCase().includes(field.toLowerCase())
    );
  }

  /**
   * Key rotation utility
   */
  async rotateEncryptionKey(newKeyString: string): Promise<string> {
    try {
      const newVersion = `v${Date.now()}`;
      const newKey = crypto.scryptSync(newKeyString, this.configService.get('ENCRYPTION_SALT', 'restaurant-hub-salt'), 32);

      this.encryptionKeys.set(newVersion, newKey);

      this.logger.log(`New encryption key added: ${newVersion}`);
      return newVersion;
    } catch (error) {
      this.logger.error('Key rotation failed', error);
      throw new Error('Key rotation failed');
    }
  }

  /**
   * Get encryption statistics
   */
  getEncryptionInfo(): {
    algorithm: string;
    keyVersions: string[];
    currentVersion: string;
  } {
    return {
      algorithm: this.algorithm,
      keyVersions: Array.from(this.encryptionKeys.keys()),
      currentVersion: this.currentKeyVersion,
    };
  }
}