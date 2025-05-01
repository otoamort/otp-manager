/**
 * Service for authentication in the OTP Manager Pro application.
 * Provides methods for user authentication and session management.
 */

/**
 * Interface for authentication options.
 */
export interface AuthOptions {
  /** Whether to use biometric authentication if available (default: true) */
  useBiometrics?: boolean;
  /** Session timeout in milliseconds (default: 15 minutes) */
  sessionTimeout?: number;
  /** Whether to remember the user's authentication (default: false) */
  rememberMe?: boolean;
}

/**
 * Interface for authentication state.
 */
export interface AuthState {
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** When the authentication expires (timestamp) */
  expiresAt: number | null;
  /** Whether the user's authentication should be remembered */
  rememberMe: boolean;
}

/**
 * Service class that provides methods for user authentication and session management.
 * Handles password-based authentication and biometric authentication.
 */
export class AuthService {
  /** Key for storing authentication state in localStorage */
  private static readonly AUTH_STATE_KEY = 'auth_state';
  /** Key for storing the password hash in localStorage */
  private static readonly PASSWORD_HASH_KEY = 'password_hash';
  /** Default session timeout in milliseconds (15 minutes) */
  private static readonly DEFAULT_SESSION_TIMEOUT = 15 * 60 * 1000;
  /** Minimum password length */
  private static readonly MIN_PASSWORD_LENGTH = 8;
  
  /**
   * Initializes the authentication service.
   * Sets up the initial authentication state.
   * 
   * @returns A promise that resolves when initialization is complete
   */
  static async initialize(): Promise<void> {
    // Check if there's an existing auth state
    const authState = this.getAuthState();
    
    // If the session has expired, log the user out
    if (authState.isAuthenticated && authState.expiresAt && Date.now() > authState.expiresAt) {
      this.logout();
    }
  }
  
  /**
   * Checks if a password is set.
   * 
   * @returns True if a password is set, false otherwise
   */
  static isPasswordSet(): boolean {
    return localStorage.getItem(this.PASSWORD_HASH_KEY) !== null;
  }
  
  /**
   * Sets the password for the application.
   * 
   * @param password - The password to set
   * @returns A promise that resolves when the password is set
   */
  static async setPassword(password: string): Promise<void> {
    // Validate password
    if (!password || password.length < this.MIN_PASSWORD_LENGTH) {
      throw new Error(`Password must be at least ${this.MIN_PASSWORD_LENGTH} characters long.`);
    }
    
    // Hash the password
    const passwordHash = await this.hashPassword(password);
    
    // Store the password hash
    localStorage.setItem(this.PASSWORD_HASH_KEY, passwordHash);
  }
  
  /**
   * Authenticates the user with a password.
   * 
   * @param password - The password to authenticate with
   * @param options - Authentication options
   * @returns A promise that resolves to true if authentication is successful, false otherwise
   */
  static async authenticate(password: string, options: AuthOptions = {}): Promise<boolean> {
    // If no password is set, authentication fails
    if (!this.isPasswordSet()) {
      return false;
    }
    
    // Get the stored password hash
    const storedHash = localStorage.getItem(this.PASSWORD_HASH_KEY);
    
    // Hash the provided password
    const passwordHash = await this.hashPassword(password);
    
    // Compare the hashes
    if (passwordHash !== storedHash) {
      return false;
    }
    
    // Set the authentication state
    const sessionTimeout = options.sessionTimeout || this.DEFAULT_SESSION_TIMEOUT;
    const expiresAt = options.rememberMe ? null : Date.now() + sessionTimeout;
    
    this.setAuthState({
      isAuthenticated: true,
      expiresAt,
      rememberMe: !!options.rememberMe
    });
    
    return true;
  }
  
  /**
   * Attempts to authenticate the user with biometrics.
   * 
   * @param options - Authentication options
   * @returns A promise that resolves to true if authentication is successful, false otherwise
   */
  static async authenticateWithBiometrics(options: AuthOptions = {}): Promise<boolean> {
    try {
      // Check if the Web Authentication API is available
      if (!window.PublicKeyCredential) {
        console.warn('Web Authentication API is not available in this browser.');
        return false;
      }
      
      // Check if the device supports biometric authentication
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) {
        console.warn('Biometric authentication is not available on this device.');
        return false;
      }
      
      // Create a challenge
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      
      // Create credential options
      const credentialOptions = {
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: 'required' as UserVerificationRequirement,
          rpId: window.location.hostname
        }
      };
      
      // Request biometric authentication
      await navigator.credentials.get(credentialOptions);
      
      // Set the authentication state
      const sessionTimeout = options.sessionTimeout || this.DEFAULT_SESSION_TIMEOUT;
      const expiresAt = options.rememberMe ? null : Date.now() + sessionTimeout;
      
      this.setAuthState({
        isAuthenticated: true,
        expiresAt,
        rememberMe: !!options.rememberMe
      });
      
      return true;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  }
  
  /**
   * Checks if the user is authenticated.
   * 
   * @returns True if the user is authenticated, false otherwise
   */
  static isAuthenticated(): boolean {
    const authState = this.getAuthState();
    
    // If not authenticated, return false
    if (!authState.isAuthenticated) {
      return false;
    }
    
    // If rememberMe is true, the user is always authenticated
    if (authState.rememberMe) {
      return true;
    }
    
    // Check if the session has expired
    if (authState.expiresAt && Date.now() > authState.expiresAt) {
      this.logout();
      return false;
    }
    
    return true;
  }
  
  /**
   * Logs the user out.
   */
  static logout(): void {
    this.setAuthState({
      isAuthenticated: false,
      expiresAt: null,
      rememberMe: false
    });
  }
  
  /**
   * Gets the current authentication state.
   * 
   * @returns The current authentication state
   */
  private static getAuthState(): AuthState {
    const defaultState: AuthState = {
      isAuthenticated: false,
      expiresAt: null,
      rememberMe: false
    };
    
    try {
      const storedState = localStorage.getItem(this.AUTH_STATE_KEY);
      return storedState ? JSON.parse(storedState) : defaultState;
    } catch (error) {
      console.error('Error getting auth state:', error);
      return defaultState;
    }
  }
  
  /**
   * Sets the authentication state.
   * 
   * @param state - The authentication state to set
   */
  private static setAuthState(state: AuthState): void {
    try {
      localStorage.setItem(this.AUTH_STATE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error setting auth state:', error);
    }
  }
  
  /**
   * Hashes a password using SHA-256.
   * 
   * @param password - The password to hash
   * @returns A promise that resolves to the hashed password
   */
  private static async hashPassword(password: string): Promise<string> {
    // Convert password to ArrayBuffer
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    
    // Hash the password
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    
    // Convert ArrayBuffer to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}