'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { totp } from 'otplib';

/**
 * Interface representing an OTP configuration.
 * Contains all the information needed to generate and identify an OTP.
 */
export interface OTPConfig {
  /** Unique identifier for the configuration */
  id: string;
  /** Name of the account associated with this OTP */
  accountName: string;
  /** Secret key used to generate the OTP */
  secretKey: string;
  /** Optional text to add before the OTP */
  prefix: string;
  /** Optional text to add after the OTP */
  postfix: string;
}

/**
 * Interface for the OTP context state and methods.
 */
interface OTPContextType {
  /** Array of all OTP configurations */
  otpConfigs: OTPConfig[];
  /** Remaining time in seconds for each OTP before it expires */
  remainingTimes: { [key: string]: number };
  /** Whether OTP codes are visible or masked */
  isOtpVisible: boolean;
  /** Toggles the visibility of OTP codes */
  toggleOtpVisibility: () => void;
  /** Adds a new OTP configuration */
  addConfig: (config: Omit<OTPConfig, 'id'>) => void;
  /** Updates an existing OTP configuration */
  updateConfig: (config: OTPConfig) => void;
  /** Deletes an OTP configuration */
  deleteConfig: (id: string) => void;
  /** Copies an OTP code to the clipboard */
  copyOTP: (secret: string, prefix: string, postfix: string) => void;
  /** Refreshes and copies an OTP code */
  refreshOTP: (secret: string, prefix: string, postfix: string) => void;
  /** Generates an OTP code */
  generateOTP: (secret: string, prefix?: string, postfix?: string) => string;
  /** Imports OTP configurations from a JSON file */
  importConfigs: (configs: OTPConfig[]) => void;
  /** Exports OTP configurations to a JSON file */
  exportConfigs: () => void;
}

/**
 * Creates the OTP context with default values.
 */
const OTPContext = createContext<OTPContextType | undefined>(undefined);

/**
 * Props for the OTPProvider component.
 */
interface OTPProviderProps {
  /** Child components that will have access to the OTP context */
  children: ReactNode;
}

/**
 * Provider component that makes the OTP context available to its children.
 * Manages the state and provides methods for working with OTP configurations.
 * 
 * @param props - The component props
 * @returns The provider component with the OTP context
 */
export function OTPProvider({ children }: OTPProviderProps) {
  /** State for storing all OTP configurations */
  const [otpConfigs, setOtpConfigs] = useState<OTPConfig[]>([]);
  /** Controls whether OTP codes are visible or masked (for security) */
  const [isOtpVisible, setIsOtpVisible] = useState(false);
  /** State to track the remaining time (in seconds) for each OTP before it expires */
  const [remainingTimes, setRemainingTimes] = useState<{ [key: string]: number }>({});
  /** Hook for displaying toast notifications */
  const { toast } = useToast();

  /**
   * Effect hook to load OTP configurations from local storage when the component mounts.
   * This ensures that user configurations persist between sessions.
   */
  useEffect(() => {
    // Load configurations from local storage on component mount
    const storedConfigs = localStorage.getItem('otpConfigs');
    if (storedConfigs) {
      setOtpConfigs(JSON.parse(storedConfigs));
    }
  }, []);

  /**
   * Effect hook to save OTP configurations to local storage whenever they change.
   * This ensures that user configurations are always up-to-date in storage.
   */
  useEffect(() => {
    // Save configurations to local storage whenever otpConfigs changes
    localStorage.setItem('otpConfigs', JSON.stringify(otpConfigs));
  }, [otpConfigs]);

  /**
   * Calculates the remaining time for each OTP configuration before it expires.
   * TOTP codes typically change every 30 seconds, so this calculates how many
   * seconds are left in the current period.
   */
  const calculateRemainingTime = () => {
    const newRemainingTimes: { [key: string]: number } = {};
    otpConfigs.forEach((config) => {
      newRemainingTimes[config.id] = 30 - (Math.floor(Date.now() / 1000) % 30);
    });
    setRemainingTimes(newRemainingTimes);
  };

  /**
   * Effect hook to update the remaining time for each OTP every second.
   * Sets up an interval that runs every second and cleans it up when the component unmounts.
   */
  useEffect(() => {
    calculateRemainingTime();
    const intervalId = setInterval(calculateRemainingTime, 1000);
    return () => clearInterval(intervalId);
  }, [otpConfigs]);

  /**
   * Toggles the visibility of OTP codes between shown and hidden.
   * This allows users to see the actual OTP code when needed while keeping it
   * hidden from shoulder surfers by default.
   */
  const toggleOtpVisibility = () => {
    setIsOtpVisible(!isOtpVisible);
  };

  /**
   * Generates a One-Time Password (OTP) based on the provided secret key.
   * Optionally adds prefix and postfix text to the generated token.
   * 
   * @param secret - The secret key used to generate the OTP
   * @param prefix - Optional text to add before the OTP (default: '')
   * @param postfix - Optional text to add after the OTP (default: '')
   * @returns The generated OTP with optional prefix and postfix
   */
  const generateOTP = (secret: string, prefix: string = '', postfix: string = '') => {
    const token = totp.generate(secret);
    return `${prefix}${token}${postfix}`;
  };

  /**
   * Adds a new OTP configuration.
   * Generates a unique ID and adds the configuration to the state.
   * 
   * @param config - The OTP configuration to add (without ID)
   */
  const addConfig = (config: Omit<OTPConfig, 'id'>) => {
    const newConfig: OTPConfig = {
      ...config,
      id: Math.random().toString(36).substring(7),
    };

    setOtpConfigs((prevConfigs) => [...prevConfigs, newConfig]);
    toast({
      title: 'Success',
      description: 'Configuration added successfully.',
    });
  };

  /**
   * Updates an existing OTP configuration.
   * Finds the configuration with the matching ID and updates its properties.
   * 
   * @param config - The updated OTP configuration
   */
  const updateConfig = (config: OTPConfig) => {
    setOtpConfigs((prevConfigs) =>
      prevConfigs.map((c) => (c.id === config.id ? config : c))
    );
    toast({
      title: 'Success',
      description: 'Configuration updated successfully.',
    });
  };

  /**
   * Deletes an OTP configuration.
   * Removes the configuration with the specified ID from the state.
   * 
   * @param id - The ID of the configuration to delete
   */
  const deleteConfig = (id: string) => {
    setOtpConfigs((prevConfigs) => prevConfigs.filter((config) => config.id !== id));
    toast({
      title: 'Success',
      description: 'Configuration deleted successfully.',
    });
  };

  /**
   * Copies an OTP code to the clipboard.
   * Generates the OTP using the provided secret, prefix, and postfix,
   * copies it to the clipboard, and displays a success message.
   * 
   * @param secret - The secret key used to generate the OTP
   * @param prefix - Text to add before the OTP
   * @param postfix - Text to add after the OTP
   */
  const copyOTP = (secret: string, prefix: string, postfix: string) => {
    const otp = generateOTP(secret, prefix, postfix);
    navigator.clipboard.writeText(otp);
    toast({
      title: 'OTP Copied',
      description: 'OTP copied to clipboard.',
    });
  };

  /**
   * Refreshes and copies an OTP code.
   * Generates a new OTP, copies it to the clipboard, and displays a success message.
   * 
   * @param secret - The secret key used to generate the OTP
   * @param prefix - Text to add before the OTP
   * @param postfix - Text to add after the OTP
   */
  const refreshOTP = (secret: string, prefix: string, postfix: string) => {
    const otp = generateOTP(secret, prefix, postfix);
    navigator.clipboard.writeText(otp);
    toast({
      title: 'OTP Refreshed and Copied',
      description: 'New OTP copied to clipboard.',
    });
  };

  /**
   * Imports OTP configurations from a JSON file.
   * Updates the state with the imported configurations.
   * 
   * @param configs - Array of OTP configurations to import
   */
  const importConfigs = (configs: OTPConfig[]) => {
    setOtpConfigs(configs);
    toast({
      title: 'Success',
      description: 'Configurations imported successfully.',
    });
  };

  /**
   * Exports OTP configurations to a JSON file.
   * Creates a downloadable file containing all the user's OTP configurations.
   */
  const exportConfigs = () => {
    const jsonString = JSON.stringify(otpConfigs);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'otpConfigs.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Create the context value object with all state and methods
  const contextValue: OTPContextType = {
    otpConfigs,
    remainingTimes,
    isOtpVisible,
    toggleOtpVisibility,
    addConfig,
    updateConfig,
    deleteConfig,
    copyOTP,
    refreshOTP,
    generateOTP,
    importConfigs,
    exportConfigs,
  };

  return <OTPContext.Provider value={contextValue}>{children}</OTPContext.Provider>;
}

/**
 * Custom hook to use the OTP context.
 * Provides access to the OTP context state and methods.
 * 
 * @returns The OTP context
 * @throws Error if used outside of an OTPProvider
 */
export function useOTP() {
  const context = useContext(OTPContext);
  if (context === undefined) {
    throw new Error('useOTP must be used within an OTPProvider');
  }
  return context;
}