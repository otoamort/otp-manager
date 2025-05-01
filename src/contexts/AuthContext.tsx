'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthService, AuthOptions } from '@/services/AuthService';
import { useToast } from '@/hooks/use-toast';

/**
 * Interface for the authentication context state and methods.
 */
interface AuthContextType {
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Whether a password is set */
  isPasswordSet: boolean;
  /** Whether the authentication is loading */
  isLoading: boolean;
  /** Sets the password for the application */
  setPassword: (password: string) => Promise<void>;
  /** Authenticates the user with a password */
  login: (password: string, options?: AuthOptions) => Promise<boolean>;
  /** Attempts to authenticate the user with biometrics */
  loginWithBiometrics: (options?: AuthOptions) => Promise<boolean>;
  /** Logs the user out */
  logout: () => void;
}

/**
 * Creates the authentication context with default values.
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Props for the AuthProvider component.
 */
interface AuthProviderProps {
  /** Child components that will have access to the authentication context */
  children: ReactNode;
}

/**
 * Provider component that makes the authentication context available to its children.
 * Manages the authentication state and provides methods for authentication.
 * 
 * @param props - The component props
 * @returns The provider component with the authentication context
 */
export function AuthProvider({ children }: AuthProviderProps) {
  /** Whether the user is authenticated */
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  /** Whether a password is set */
  const [isPasswordSet, setIsPasswordSet] = useState<boolean>(false);
  /** Whether the authentication is loading */
  const [isLoading, setIsLoading] = useState<boolean>(true);
  /** Hook for displaying toast notifications */
  const { toast } = useToast();

  /**
   * Effect hook to initialize the authentication service.
   * Checks if the user is authenticated and if a password is set.
   */
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        
        // Initialize the authentication service
        await AuthService.initialize();
        
        // Check if the user is authenticated
        setIsAuthenticated(AuthService.isAuthenticated());
        
        // Check if a password is set
        setIsPasswordSet(AuthService.isPasswordSet());
      } catch (error) {
        console.error('Error initializing authentication:', error);
        toast({
          title: 'Authentication Error',
          description: 'Failed to initialize authentication.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    initialize();
  }, [toast]);

  /**
   * Sets the password for the application.
   * 
   * @param password - The password to set
   * @returns A promise that resolves when the password is set
   */
  const setPassword = async (password: string): Promise<void> => {
    try {
      setIsLoading(true);
      await AuthService.setPassword(password);
      setIsPasswordSet(true);
      toast({
        title: 'Success',
        description: 'Password set successfully.',
      });
    } catch (error) {
      console.error('Error setting password:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to set password.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Authenticates the user with a password.
   * 
   * @param password - The password to authenticate with
   * @param options - Authentication options
   * @returns A promise that resolves to true if authentication is successful, false otherwise
   */
  const login = async (password: string, options?: AuthOptions): Promise<boolean> => {
    try {
      setIsLoading(true);
      const success = await AuthService.authenticate(password, options);
      
      if (success) {
        setIsAuthenticated(true);
        toast({
          title: 'Success',
          description: 'Logged in successfully.',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Invalid password.',
          variant: 'destructive',
        });
      }
      
      return success;
    } catch (error) {
      console.error('Error logging in:', error);
      toast({
        title: 'Error',
        description: 'Failed to log in.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Attempts to authenticate the user with biometrics.
   * 
   * @param options - Authentication options
   * @returns A promise that resolves to true if authentication is successful, false otherwise
   */
  const loginWithBiometrics = async (options?: AuthOptions): Promise<boolean> => {
    try {
      setIsLoading(true);
      const success = await AuthService.authenticateWithBiometrics(options);
      
      if (success) {
        setIsAuthenticated(true);
        toast({
          title: 'Success',
          description: 'Logged in with biometrics successfully.',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Biometric authentication failed.',
          variant: 'destructive',
        });
      }
      
      return success;
    } catch (error) {
      console.error('Error logging in with biometrics:', error);
      toast({
        title: 'Error',
        description: 'Failed to log in with biometrics.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logs the user out.
   */
  const logout = (): void => {
    try {
      AuthService.logout();
      setIsAuthenticated(false);
      toast({
        title: 'Success',
        description: 'Logged out successfully.',
      });
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: 'Error',
        description: 'Failed to log out.',
        variant: 'destructive',
      });
    }
  };

  // Create the context value object with all state and methods
  const contextValue: AuthContextType = {
    isAuthenticated,
    isPasswordSet,
    isLoading,
    setPassword,
    login,
    loginWithBiometrics,
    logout,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to use the authentication context.
 * Provides access to the authentication context state and methods.
 * 
 * @returns The authentication context
 * @throws Error if used outside of an AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}