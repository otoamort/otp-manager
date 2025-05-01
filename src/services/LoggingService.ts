/**
 * Service for logging in the OTP Manager Pro application.
 * Provides methods for logging messages with different severity levels.
 * Logs are disabled in production by default.
 */

/**
 * Enum for log levels.
 * Defines the severity levels for logging.
 */
export enum LogLevel {
  /** Debug level for detailed debugging information */
  DEBUG = 0,
  /** Info level for general information */
  INFO = 1,
  /** Warn level for warnings */
  WARN = 2,
  /** Error level for errors */
  ERROR = 3,
  /** None level to disable all logging */
  NONE = 4
}

/**
 * Interface for logger configuration.
 */
export interface LoggerConfig {
  /** Minimum log level to display (default: INFO in development, ERROR in production) */
  minLevel?: LogLevel;
  /** Whether to include timestamps in log messages (default: true) */
  includeTimestamps?: boolean;
  /** Whether to include the log level in log messages (default: true) */
  includeLevel?: boolean;
}

/**
 * Service class that provides methods for logging.
 * Logs are disabled in production by default.
 */
export class LoggingService {
  /** The current logger configuration */
  private static config: LoggerConfig = {
    minLevel: process.env.NODE_ENV === 'production' ? LogLevel.ERROR : LogLevel.INFO,
    includeTimestamps: true,
    includeLevel: true
  };
  
  /**
   * Configures the logger.
   * 
   * @param config - The logger configuration
   */
  static configure(config: LoggerConfig): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Logs a debug message.
   * 
   * @param message - The message to log
   * @param data - Additional data to log
   */
  static debug(message: string, ...data: any[]): void {
    this.log(LogLevel.DEBUG, message, ...data);
  }
  
  /**
   * Logs an info message.
   * 
   * @param message - The message to log
   * @param data - Additional data to log
   */
  static info(message: string, ...data: any[]): void {
    this.log(LogLevel.INFO, message, ...data);
  }
  
  /**
   * Logs a warning message.
   * 
   * @param message - The message to log
   * @param data - Additional data to log
   */
  static warn(message: string, ...data: any[]): void {
    this.log(LogLevel.WARN, message, ...data);
  }
  
  /**
   * Logs an error message.
   * 
   * @param message - The message to log
   * @param data - Additional data to log
   */
  static error(message: string, ...data: any[]): void {
    this.log(LogLevel.ERROR, message, ...data);
  }
  
  /**
   * Logs a message with the specified log level.
   * 
   * @param level - The log level
   * @param message - The message to log
   * @param data - Additional data to log
   */
  private static log(level: LogLevel, message: string, ...data: any[]): void {
    // Check if logging is enabled for this level
    if (level < this.config.minLevel!) {
      return;
    }
    
    // Build the log message
    let logMessage = '';
    
    // Add timestamp if configured
    if (this.config.includeTimestamps) {
      logMessage += `[${new Date().toISOString()}] `;
    }
    
    // Add log level if configured
    if (this.config.includeLevel) {
      logMessage += `[${LogLevel[level]}] `;
    }
    
    // Add the message
    logMessage += message;
    
    // Log the message with the appropriate console method
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(logMessage, ...data);
        break;
      case LogLevel.INFO:
        console.info(logMessage, ...data);
        break;
      case LogLevel.WARN:
        console.warn(logMessage, ...data);
        break;
      case LogLevel.ERROR:
        console.error(logMessage, ...data);
        break;
    }
  }
}