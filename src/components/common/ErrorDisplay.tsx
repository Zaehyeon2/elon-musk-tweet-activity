import React, { useState } from 'react';

import {
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  XCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorDisplayProps {
  severity?: 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  details?: string | Error;
  showDetails?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  severity = 'error',
  title,
  message,
  details,
  showDetails = true,
  onRetry,
  onDismiss,
  className,
}) => {
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  const getIcon = () => {
    switch (severity) {
      case 'warning':
        return <AlertTriangle className="h-6 w-6" />;
      case 'info':
        return <AlertCircle className="h-6 w-6" />;
      case 'error':
      default:
        return <XCircle className="h-6 w-6" />;
    }
  };

  const getColorClasses = () => {
    switch (severity) {
      case 'warning':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-300 dark:border-yellow-700',
          icon: 'text-yellow-400',
          title: 'text-yellow-800 dark:text-yellow-400',
          message: 'text-yellow-700 dark:text-yellow-500',
          details: 'text-yellow-600 dark:text-yellow-600',
        };
      case 'info':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-300 dark:border-blue-700',
          icon: 'text-blue-400',
          title: 'text-blue-800 dark:text-blue-400',
          message: 'text-blue-700 dark:text-blue-500',
          details: 'text-blue-600 dark:text-blue-600',
        };
      case 'error':
      default:
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-300 dark:border-red-700',
          icon: 'text-red-400',
          title: 'text-red-800 dark:text-red-400',
          message: 'text-red-700 dark:text-red-500',
          details: 'text-red-600 dark:text-red-600',
        };
    }
  };

  const colors = getColorClasses();
  const errorDetails = details instanceof Error ? details.stack || details.message : details;

  return (
    <div className={cn(colors.bg, 'border', colors.border, 'rounded-lg p-6', className)}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <div className={colors.icon}>{getIcon()}</div>
        </div>
        <div className="ml-3 flex-1">
          <h3 className={cn('text-sm font-medium', colors.title)}>{title}</h3>

          {message && <div className={cn('mt-2 text-sm', colors.message)}>{message}</div>}

          {/* Details section */}
          {showDetails && errorDetails && (
            <div className="mt-3">
              <button
                onClick={() => {
                  setIsDetailsExpanded(!isDetailsExpanded);
                }}
                className={cn(
                  'inline-flex items-center gap-1 text-xs font-medium',
                  colors.message,
                  'hover:underline focus:outline-none',
                )}
              >
                {isDetailsExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3" />
                    Hide details
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    Show details
                  </>
                )}
              </button>

              {isDetailsExpanded && (
                <div
                  className={cn(
                    'mt-2 p-3 bg-gray-900/5 dark:bg-gray-900/20 rounded text-xs',
                    colors.details,
                    'font-mono overflow-x-auto',
                  )}
                >
                  <pre className="whitespace-pre-wrap break-words">{errorDetails}</pre>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          {(onRetry || onDismiss) && (
            <div className="mt-4 flex gap-2">
              {onRetry && (
                <Button
                  size="sm"
                  variant={severity === 'error' ? 'destructive' : 'default'}
                  onClick={onRetry}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}
              {onDismiss && (
                <Button size="sm" variant="outline" onClick={onDismiss}>
                  Dismiss
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Specialized error components
export const NetworkError: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <ErrorDisplay
    severity="error"
    title="Network Error"
    message="Unable to connect to the server. Please check your internet connection and try again."
    onRetry={onRetry}
  />
);

export const DataError: React.FC<{ error?: Error; onRetry?: () => void }> = ({
  error,
  onRetry,
}) => (
  <ErrorDisplay
    severity="error"
    title="Failed to Load Data"
    message="There was a problem loading the tweet data. This might be a temporary issue."
    details={error}
    onRetry={onRetry}
  />
);

export const ValidationError: React.FC<{ message: string; details?: string }> = ({
  message,
  details,
}) => (
  <ErrorDisplay severity="warning" title="Validation Error" message={message} details={details} />
);
