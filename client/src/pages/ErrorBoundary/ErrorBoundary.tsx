/**
 * Error boundary. Catches render errors and shows fallback or server-down UI.
 * @module ErrorBoundary
 */
import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Container } from 'react-bootstrap';
import { reportClientError } from '@Utils';
import { ACCOUNT_COPY } from '@CONSTANTS';
import './style.css';

interface ErrorBoundaryProps {
  errorInfo?: ErrorInfo;
  children?: ReactNode;
  fallback?: ReactNode;
  onRetry?: () => void;
  error?: Error;
}

interface ErrorBoundaryState {
  errorInfo?: ErrorInfo;
  hasError: boolean;
  error?: Error;
}

const SERVER_DOWN = ACCOUNT_COPY.SERVER_DOWN;

/**
 * ErrorBoundary Component with Error Boundary functionality
 *
 * Can be used as both a standalone server down page and as an error boundary
 * that catches JavaScript errors and displays a fallback UI.
 *
 * @component
 * @param {ErrorBoundaryProps} props - Component props
 * @param {ReactNode} props.children - Child components to wrap (for error boundary mode)
 * @param {ReactNode} props.fallback - Optional custom fallback UI
 * @param {Error} props.error - Optional error object (for direct error display)
 * @param {ErrorInfo} props.errorInfo - Optional error info (for direct error display)
 * @param {Function} props.onRetry - Optional retry callback
 *
 * @example
 * ```tsx
 * // Standalone server down page
 * <ErrorBoundary />
 *
 * // Error boundary mode
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    this.setState({
      errorInfo,
      error,
    });

    // Send error to backend logging service (production only, via shared helper)
    reportClientError({
      message: error.message,
      context: 'ErrorBoundary',
      extra: {
        componentStack: errorInfo.componentStack,
      },
    });
  }

  handleRetry = () => {
    if (this.props.onRetry) {
      this.props.onRetry();
    } else {
      this.setState({
        errorInfo: undefined,
        error: undefined,
        hasError: false,
      });
    }
  };

  render() {
    // If children are provided, render them (error boundary mode)
    if (this.props.children && !this.state.hasError && !this.props.error) {
      return this.props.children;
    }

    // Always render the same ErrorBoundary content
    return (
      <Container
        id={'server-down'}
        fluid
      >
        <div className='server-down-content pt-lg-5 mt-lg-5'>
          <h1 className='display-1 pt-lg-5 mt-lg-5'>{SERVER_DOWN.heading}</h1>
          <h2 className='display-3'>{SERVER_DOWN.message}</h2>
          <h4 className='display-4 mt-lg-5'>{SERVER_DOWN.caption}</h4>
          <h6 className='display-6 mt-lg-3'>{SERVER_DOWN.action}</h6>
        </div>
      </Container>
    );
  }
}

export default React.memo(ErrorBoundary);
