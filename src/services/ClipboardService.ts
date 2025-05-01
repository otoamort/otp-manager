/**
 * Service for secure clipboard handling in the OTP Manager Pro application.
 * Provides methods for copying to clipboard with security features.
 */

/**
 * Options for clipboard operations.
 */
export interface ClipboardOptions {
  /** Time in milliseconds after which the clipboard will be cleared (default: 60000 - 1 minute) */
  clearTimeout?: number;
  /** Whether to show a visual indicator when content is copied (default: true) */
  showIndicator?: boolean;
  /** Custom message to show in the indicator (default: "Copied to clipboard") */
  indicatorMessage?: string;
}

/**
 * Service class that provides methods for secure clipboard handling.
 * Includes features like automatic clipboard clearing and visual indicators.
 */
export class ClipboardService {
  /** Default timeout for clearing the clipboard (1 minute) */
  private static readonly DEFAULT_CLEAR_TIMEOUT = 60000;
  /** Key for storing the clipboard clear timeout ID */
  private static readonly CLIPBOARD_TIMEOUT_KEY = 'clipboard_timeout';
  /** The current timeout ID for clipboard clearing */
  private static timeoutId: number | null = null;
  /** Whether the service has been initialized */
  private static isInitialized = false;
  /** The element used for visual indicators */
  private static indicatorElement: HTMLDivElement | null = null;
  /** The timeout ID for hiding the indicator */
  private static indicatorTimeoutId: number | null = null;
  
  /**
   * Initializes the clipboard service.
   * Sets up event listeners and creates the indicator element.
   */
  static initialize(): void {
    if (this.isInitialized) {
      return;
    }
    
    // Create indicator element
    this.createIndicatorElement();
    
    // Set up event listeners
    window.addEventListener('beforeunload', () => {
      this.clearClipboard();
    });
    
    this.isInitialized = true;
  }
  
  /**
   * Copies content to the clipboard with security features.
   * 
   * @param content - The content to copy to the clipboard
   * @param options - Options for the clipboard operation
   * @returns A promise that resolves to true if the copy was successful, false otherwise
   */
  static async copyToClipboard(
    content: string,
    options: ClipboardOptions = {}
  ): Promise<boolean> {
    try {
      // Initialize if not already initialized
      if (!this.isInitialized) {
        this.initialize();
      }
      
      // Copy to clipboard
      await navigator.clipboard.writeText(content);
      
      // Clear any existing timeout
      this.clearTimeout();
      
      // Set up new timeout for clearing the clipboard
      const clearTimeout = options.clearTimeout ?? this.DEFAULT_CLEAR_TIMEOUT;
      if (clearTimeout > 0) {
        this.timeoutId = window.setTimeout(() => {
          this.clearClipboard();
        }, clearTimeout);
        
        // Store the timeout ID
        window.localStorage.setItem(
          this.CLIPBOARD_TIMEOUT_KEY,
          Date.now() + clearTimeout + ''
        );
      }
      
      // Show indicator if requested
      if (options.showIndicator !== false) {
        this.showIndicator(options.indicatorMessage);
      }
      
      return true;
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      return false;
    }
  }
  
  /**
   * Clears the clipboard by copying an empty string.
   * 
   * @returns A promise that resolves to true if the clipboard was cleared successfully, false otherwise
   */
  static async clearClipboard(): Promise<boolean> {
    try {
      await navigator.clipboard.writeText('');
      this.clearTimeout();
      return true;
    } catch (error) {
      console.error('Error clearing clipboard:', error);
      return false;
    }
  }
  
  /**
   * Checks if the clipboard contains content copied by this service.
   * 
   * @returns True if the clipboard contains content copied by this service, false otherwise
   */
  static hasClipboardContent(): boolean {
    const expiryTime = window.localStorage.getItem(this.CLIPBOARD_TIMEOUT_KEY);
    if (!expiryTime) {
      return false;
    }
    
    const expiry = parseInt(expiryTime, 10);
    return Date.now() < expiry;
  }
  
  /**
   * Gets the time remaining until the clipboard is cleared.
   * 
   * @returns The time remaining in milliseconds, or 0 if no timeout is set
   */
  static getTimeRemaining(): number {
    const expiryTime = window.localStorage.getItem(this.CLIPBOARD_TIMEOUT_KEY);
    if (!expiryTime) {
      return 0;
    }
    
    const expiry = parseInt(expiryTime, 10);
    const remaining = expiry - Date.now();
    return remaining > 0 ? remaining : 0;
  }
  
  /**
   * Clears the timeout for clipboard clearing.
   */
  private static clearTimeout(): void {
    if (this.timeoutId !== null) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    
    window.localStorage.removeItem(this.CLIPBOARD_TIMEOUT_KEY);
  }
  
  /**
   * Creates the indicator element for visual feedback.
   */
  private static createIndicatorElement(): void {
    // Check if the element already exists
    if (this.indicatorElement) {
      return;
    }
    
    // Create the element
    const element = document.createElement('div');
    element.style.position = 'fixed';
    element.style.bottom = '20px';
    element.style.left = '50%';
    element.style.transform = 'translateX(-50%)';
    element.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    element.style.color = 'white';
    element.style.padding = '10px 20px';
    element.style.borderRadius = '4px';
    element.style.zIndex = '9999';
    element.style.opacity = '0';
    element.style.transition = 'opacity 0.3s ease-in-out';
    element.style.pointerEvents = 'none';
    
    // Add to the document
    document.body.appendChild(element);
    
    // Store the element
    this.indicatorElement = element;
  }
  
  /**
   * Shows the indicator with a message.
   * 
   * @param message - The message to show in the indicator
   */
  private static showIndicator(message: string = 'Copied to clipboard'): void {
    if (!this.indicatorElement) {
      this.createIndicatorElement();
    }
    
    if (this.indicatorElement) {
      // Set the message
      this.indicatorElement.textContent = message;
      
      // Show the indicator
      this.indicatorElement.style.opacity = '1';
      
      // Clear any existing timeout
      if (this.indicatorTimeoutId !== null) {
        window.clearTimeout(this.indicatorTimeoutId);
      }
      
      // Hide the indicator after 2 seconds
      this.indicatorTimeoutId = window.setTimeout(() => {
        if (this.indicatorElement) {
          this.indicatorElement.style.opacity = '0';
        }
        this.indicatorTimeoutId = null;
      }, 2000);
    }
  }
}