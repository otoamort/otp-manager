/**
 * Service for encrypting and decrypting sensitive data in the OTP Manager Pro application.
 * Uses the Web Crypto API for secure encryption operations.
 */

/**
 * Options for encryption operations.
 */
export interface EncryptionOptions {
  /** Salt for key derivation (optional, will be generated if not provided) */
  salt?: Uint8Array;
  /** Initialization vector for encryption (optional, will be generated if not provided) */
  iv?: Uint8Array;
  /** Number of iterations for key derivation (default: 100000) */
  iterations?: number;
}

/**
 * Result of an encryption operation.
 */
export interface EncryptionResult {
  /** The encrypted data as a base64 string */
  encryptedData: string;
  /** The salt used for key derivation, as a base64 string */
  salt: string;
  /** The initialization vector used for encryption, as a base64 string */
  iv: string;
}

/**
 * Service class that provides methods for encrypting and decrypting sensitive data.
 * Uses the Web Crypto API for secure cryptographic operations.
 */
export class EncryptionService {
  /** The algorithm used for key derivation */
  private static readonly KEY_ALGORITHM = 'PBKDF2';
  /** The algorithm used for encryption */
  private static readonly ENCRYPTION_ALGORITHM = 'AES-GCM';
  /** The default number of iterations for key derivation */
  private static readonly DEFAULT_ITERATIONS = 100000;
  /** The key length in bits */
  private static readonly KEY_LENGTH = 256;
  /** The salt length in bytes */
  private static readonly SALT_LENGTH = 16;
  /** The initialization vector length in bytes */
  private static readonly IV_LENGTH = 12;

  /**
   * Encrypts data using a password.
   * 
   * @param data - The data to encrypt
   * @param password - The password to use for encryption
   * @param options - Optional parameters for encryption
   * @returns A promise that resolves to the encryption result
   */
  static async encrypt(
    data: string,
    password: string,
    options: EncryptionOptions = {}
  ): Promise<EncryptionResult> {
    try {
      // Generate salt if not provided
      const salt = options.salt || this.generateRandomBytes(this.SALT_LENGTH);
      
      // Generate IV if not provided
      const iv = options.iv || this.generateRandomBytes(this.IV_LENGTH);
      
      // Derive key from password
      const key = await this.deriveKey(
        password,
        salt,
        options.iterations || this.DEFAULT_ITERATIONS
      );
      
      // Encode data to ArrayBuffer
      const encodedData = new TextEncoder().encode(data);
      
      // Encrypt data
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
          name: this.ENCRYPTION_ALGORITHM,
          iv
        },
        key,
        encodedData
      );
      
      // Convert results to base64 for storage
      return {
        encryptedData: this.arrayBufferToBase64(encryptedBuffer),
        salt: this.arrayBufferToBase64(salt),
        iv: this.arrayBufferToBase64(iv)
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }
  
  /**
   * Decrypts data using a password.
   * 
   * @param encryptedData - The encrypted data as a base64 string
   * @param password - The password used for encryption
   * @param salt - The salt used for key derivation, as a base64 string
   * @param iv - The initialization vector used for encryption, as a base64 string
   * @param iterations - The number of iterations used for key derivation (default: 100000)
   * @returns A promise that resolves to the decrypted data
   */
  static async decrypt(
    encryptedData: string,
    password: string,
    salt: string,
    iv: string,
    iterations: number = this.DEFAULT_ITERATIONS
  ): Promise<string> {
    try {
      // Convert base64 strings to ArrayBuffers
      const encryptedBuffer = this.base64ToArrayBuffer(encryptedData);
      const saltBuffer = this.base64ToArrayBuffer(salt);
      const ivBuffer = this.base64ToArrayBuffer(iv);
      
      // Derive key from password
      const key = await this.deriveKey(password, saltBuffer, iterations);
      
      // Decrypt data
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: this.ENCRYPTION_ALGORITHM,
          iv: ivBuffer
        },
        key,
        encryptedBuffer
      );
      
      // Decode data from ArrayBuffer
      return new TextDecoder().decode(decryptedBuffer);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data. The password may be incorrect.');
    }
  }
  
  /**
   * Derives a cryptographic key from a password.
   * 
   * @param password - The password to derive the key from
   * @param salt - The salt to use for key derivation
   * @param iterations - The number of iterations for key derivation
   * @returns A promise that resolves to the derived key
   */
  private static async deriveKey(
    password: string,
    salt: Uint8Array,
    iterations: number
  ): Promise<CryptoKey> {
    // Convert password to key material
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    const passwordKey = await window.crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    // Derive key using PBKDF2
    return window.crypto.subtle.deriveKey(
      {
        name: this.KEY_ALGORITHM,
        salt,
        iterations,
        hash: 'SHA-256'
      },
      passwordKey,
      {
        name: this.ENCRYPTION_ALGORITHM,
        length: this.KEY_LENGTH
      },
      false,
      ['encrypt', 'decrypt']
    );
  }
  
  /**
   * Generates random bytes using the Web Crypto API.
   * 
   * @param length - The number of bytes to generate
   * @returns A Uint8Array containing the random bytes
   */
  private static generateRandomBytes(length: number): Uint8Array {
    return window.crypto.getRandomValues(new Uint8Array(length));
  }
  
  /**
   * Converts an ArrayBuffer to a base64 string.
   * 
   * @param buffer - The ArrayBuffer to convert
   * @returns A base64 string representation of the buffer
   */
  private static arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
  
  /**
   * Converts a base64 string to an ArrayBuffer.
   * 
   * @param base64 - The base64 string to convert
   * @returns An ArrayBuffer containing the decoded data
   */
  private static base64ToArrayBuffer(base64: string): Uint8Array {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
}