'use client';

import React from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoggingService } from '@/services/LoggingService';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

/**
 * Props for the RootErrorBoundary component.
 */
interface RootErrorBoundaryProps {
  /** The child components that this error boundary wraps */
  children: React.ReactNode;
}

/**
 * Component that wraps the entire application with an error boundary.
 * This is the last line of defense against unhandled errors.
 * 
 * @param props - The component props
 * @returns The wrapped children with error boundary protection
 * 
 * @example
 * ```tsx
 * <RootErrorBoundary>
 *   <App />
 * </RootErrorBoundary>
 * ```
 */
export function RootErrorBoundary({ children }: RootErrorBoundaryProps) {
  /**
   * Handles errors caught by the error boundary.
   * Logs the error and provides detailed information.
   * 
   * @param error - The error that was thrown
   * @param errorInfo - Information about the error
   */
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log the error
    LoggingService.error('Critical application error:', error);
    LoggingService.error('Component stack:', errorInfo.componentStack);
  };
  
  /**
   * Custom fallback UI for the root error boundary.
   * Provides a way to refresh the application.
   */
  const fallback = (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <Alert variant="destructive" className="mb-6">
          <AlertTitle className="text-xl">Application Error</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-4">
              The application has encountered a critical error and cannot continue.
            </p>
            <p className="text-sm mb-6">
              Please try refreshing the page. If the problem persists, clear your browser cache or contact support.
            </p>
            <div className="flex gap-4">
              <Button 
                onClick={() => window.location.reload()} 
                variant="default"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Page
              </Button>
              <Button 
                onClick={() => {
                  // Clear local storage and reload
                  window.localStorage.clear();
                  window.location.reload();
                }} 
                variant="outline"
              >
                Reset Application
              </Button>
            </div>
          </AlertDescription>
        </Alert>
        <div className="text-xs text-muted-foreground text-center">
          Error information has been logged for troubleshooting.
        </div>
      </div>
    </div>
  );
  
  return (
    <ErrorBoundary fallback={fallback} onError={handleError}>
      {children}
    </ErrorBoundary>
  );
}