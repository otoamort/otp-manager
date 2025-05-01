'use client';

import React, { Component, ErrorInfo, ReactNode, forwardRef, ForwardedRef } from 'react';
import { LoggingService } from '@/services/LoggingService';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

/**
 * Props for the ErrorBoundary component.
 */
interface ErrorBoundaryProps {
  /** The child components that this error boundary wraps */
  children: ReactNode;
  /** Optional custom fallback component to display when an error occurs */
  fallback?: ReactNode;
  /** Optional callback to be called when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * State for the ErrorBoundary component.
 */
interface ErrorBoundaryState {
  /** Whether an error has occurred */
  hasError: boolean;
  /** The error that occurred */
  error: Error | null;
  /** The error information */
  errorInfo: ErrorInfo | null;
}

/**
 * Component that catches JavaScript errors anywhere in its child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the whole application.
 * 
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
class ErrorBoundaryComponent extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  /**
   * Initializes the component state.
   * 
   * @param props - The component props
   */
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  /**
   * Static method that returns the updated state when an error occurs.
   * This is called during the "render" phase, so side effects are not permitted.
   * 
   * @param error - The error that was thrown
   * @returns The updated state
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }

  /**
   * Lifecycle method that is called after an error has been thrown by a descendant component.
   * This is called during the "commit" phase, so side effects are permitted.
   * 
   * @param error - The error that was thrown
   * @param errorInfo - Information about the error
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to the logging service
    LoggingService.error('Error caught by ErrorBoundary:', error);
    LoggingService.error('Component stack:', errorInfo.componentStack);
    
    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Update state with error info
    this.setState({
      errorInfo
    });
  }

  /**
   * Resets the error state, allowing the component to try rendering again.
   */
  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  /**
   * Renders the component.
   * 
   * @returns The rendered component
   */
  render(): ReactNode {
    // If there's an error, show the fallback UI
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Otherwise, show the default fallback UI
      return (
        <div className="p-4">
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>
              An error occurred while rendering this component.
              {this.state.error && (
                <div className="mt-2 text-sm font-mono bg-muted p-2 rounded">
                  {this.state.error.toString()}
                </div>
              )}
            </AlertDescription>
          </Alert>
          <Button onClick={this.resetError} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      );
    }

    // Otherwise, render the children normally
    return this.props.children;
  }
}

/**
 * ErrorBoundary component with forwarded ref.
 * This allows the component to be controlled from outside using a ref.
 */
export const ErrorBoundary = forwardRef((props: ErrorBoundaryProps, ref: ForwardedRef<ErrorBoundaryComponent>) => {
  return <ErrorBoundaryComponent ref={ref} {...props} />;
});

ErrorBoundary.displayName = 'ErrorBoundary';