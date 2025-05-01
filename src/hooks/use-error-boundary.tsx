'use client';

import React, { ReactNode, useState } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

/**
 * Options for the useErrorBoundary hook.
 */
interface UseErrorBoundaryOptions {
  /** Optional custom fallback component to display when an error occurs */
  fallback?: ReactNode;
  /** Optional callback to be called when an error is caught */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Result of the useErrorBoundary hook.
 */
interface UseErrorBoundaryResult {
  /** Component that wraps children with an error boundary */
  ErrorBoundaryWrapper: React.FC<{ children: ReactNode }>;
  /** Function to reset the error state */
  resetError: () => void;
}

/**
 * Hook that provides an error boundary wrapper for functional components.
 * Makes it easier to use error boundaries in functional components.
 * 
 * @param options - Options for the error boundary
 * @returns An object containing the error boundary wrapper and a function to reset the error state
 * 
 * @example
 * ```tsx
 * const { ErrorBoundaryWrapper } = useErrorBoundary();
 * 
 * return (
 *   <ErrorBoundaryWrapper>
 *     <MyComponent />
 *   </ErrorBoundaryWrapper>
 * );
 * ```
 */
export function useErrorBoundary(options: UseErrorBoundaryOptions = {}): UseErrorBoundaryResult {
  // Create a ref to the error boundary component
  const errorBoundaryRef = React.useRef<React.ElementRef<typeof ErrorBoundary>>(null);
  
  /**
   * Resets the error state in the error boundary.
   */
  const resetError = () => {
    if (errorBoundaryRef.current) {
      errorBoundaryRef.current.resetError();
    }
  };
  
  /**
   * Component that wraps children with an error boundary.
   */
  const ErrorBoundaryWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
    /**
     * Handles errors caught by the error boundary.
     * 
     * @param error - The error that was thrown
     * @param errorInfo - Information about the error
     */
    const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
      // Call the onError callback if provided
      if (options.onError) {
        options.onError(error, errorInfo);
      }
    };
    
    return (
      <ErrorBoundary ref={errorBoundaryRef} fallback={options.fallback}>
        {children}
      </ErrorBoundary>
    );
  };
  
  return {
    ErrorBoundaryWrapper,
    resetError
  };
}