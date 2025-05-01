'use client';

import React from 'react';
import { useErrorBoundary } from '@/hooks/use-error-boundary';
import { useToast } from '@/hooks/use-toast';
import { LoggingService } from '@/services/LoggingService';

/**
 * Props for the AppErrorBoundary component.
 */
interface AppErrorBoundaryProps {
  /** The child components that this error boundary wraps */
  children: React.ReactNode;
  /** Name of the section being wrapped (for error reporting) */
  sectionName: string;
}

/**
 * Component that wraps sections of the application with error boundaries.
 * Provides consistent error handling and reporting across the application.
 * 
 * @param props - The component props
 * @returns The wrapped children with error boundary protection
 * 
 * @example
 * ```tsx
 * <AppErrorBoundary sectionName="OTP List">
 *   <OTPList />
 * </AppErrorBoundary>
 * ```
 */
export function AppErrorBoundary({ children, sectionName }: AppErrorBoundaryProps) {
  const { toast } = useToast();
  
  /**
   * Handles errors caught by the error boundary.
   * Logs the error and shows a toast notification.
   * 
   * @param error - The error that was thrown
   * @param errorInfo - Information about the error
   */
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log the error
    LoggingService.error(`Error in ${sectionName}:`, error);
    LoggingService.error('Component stack:', errorInfo.componentStack);
    
    // Show a toast notification
    toast({
      title: `Error in ${sectionName}`,
      description: 'An error occurred. The affected component has been isolated.',
      variant: 'destructive',
    });
  };
  
  // Create a custom fallback UI for this section
  const fallback = (
    <div className="p-4 border border-destructive rounded-md bg-destructive/10">
      <h3 className="text-lg font-semibold text-destructive mb-2">
        Error in {sectionName}
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        This section encountered an error and has been isolated to prevent the entire application from crashing.
      </p>
      <p className="text-sm">
        Please try refreshing the page. If the problem persists, contact support.
      </p>
    </div>
  );
  
  // Use the error boundary hook with the custom fallback and error handler
  const { ErrorBoundaryWrapper } = useErrorBoundary({
    fallback,
    onError: handleError,
  });
  
  return <ErrorBoundaryWrapper>{children}</ErrorBoundaryWrapper>;
}