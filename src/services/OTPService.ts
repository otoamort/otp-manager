/**
 * Service class for OTP (One-Time Password) operations.
 * Provides methods for generating and validating OTP codes.
 */
import { authenticator, totp } from 'otplib';

type HashAlgorithms = 'sha1' | 'sha256' | 'sha512';

/**
 * Options for OTP generation.
 */
export interface OTPOptions {
  /** Number of digits in the OTP (default: 6) */
  digits?: number;
  /** Time step in seconds (default: 30) */
  step?: number;
  /** Algorithm to use (default: 'sha1') */
  algorithm?: HashAlgorithms;
  /** Text to add before the OTP */
  prefix?: string;
  /** Text to add after the OTP */
  postfix?: string;
}

/**
 * Service class that provides methods for working with One-Time Passwords (OTP).
 * Encapsulates the logic for generating and validating OTP codes.
 */
export class OTPService {
  /**
   * Generates a Time-based One-Time Password (TOTP) using the provided secret key.
   * 
   * @param secret - The secret key used to generate the OTP
   * @param options - Optional configuration for OTP generation
   * @returns The generated OTP with optional prefix and postfix
   */
  static generateTOTP(secret: string, options: OTPOptions = {}): string {
    const { prefix = '', postfix = '', digits = 6, step = 30, algorithm = 'sha1' } = options;
    
    // Configure the TOTP options
    // @ts-ignore
    totp.options = {
      digits,
      step,
      algorithm,
    };
    
    // Generate the token
    const token = totp.generate(secret);
    
    // Return the token with an optional prefix and postfix
    return `${prefix}${token}${postfix}`;
  }
  
  /**
   * Validates a Time-based One-Time Password (TOTP) against the provided secret key.
   * 
   * @param token - The OTP token to validate
   * @param secret - The secret key used to generate the OTP
   * @param options - Optional configuration for OTP validation
   * @returns True if the token is valid, false otherwise
   */
  static validateTOTP(token: string, secret: string, options: Omit<OTPOptions, 'prefix' | 'postfix'> = {}): boolean {
    const { digits = 6, step = 30, algorithm = 'sha1' } = options;
    
    // Configure the TOTP options
    // @ts-ignore
    totp.options = {
      digits,
      step,
      algorithm,
    };
    
    // Validate the token
    return totp.verify({ token, secret });
  }
  
  /**
   * Calculates the remaining time in seconds before the current OTP expires.
   * 
   * @param step - Time step in seconds (default: 30)
   * @returns The number of seconds remaining before the current OTP expires
   */
  static getRemainingTime(step: number = 30): number {
    return step - (Math.floor(Date.now() / 1000) % step);
  }
  
  /**
   * Generates a random secret key for use with OTP.
   * 
   * @param length - The length of the secret key in bytes (default: 20)
   * @returns A base32-encoded secret key
   */
  static generateSecret(length: number = 20): string {
    return authenticator.generateSecret(length);
  }
}