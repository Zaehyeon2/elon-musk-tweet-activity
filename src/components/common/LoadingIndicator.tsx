import React from 'react';

import { Clock, Loader2, RefreshCw } from 'lucide-react';

import { cn } from '@/lib/utils';

interface LoadingIndicatorProps {
  variant?: 'spinner' | 'dots' | 'pulse' | 'clock';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  subMessage?: string;
  className?: string;
  showProgress?: boolean;
  progress?: number;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  variant = 'spinner',
  size = 'md',
  message,
  subMessage,
  className,
  showProgress = false,
  progress = 0,
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  const renderIndicator = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  'rounded-full bg-blue-600 dark:bg-blue-400',
                  size === 'sm'
                    ? 'h-2 w-2'
                    : size === 'md'
                      ? 'h-3 w-3'
                      : size === 'lg'
                        ? 'h-4 w-4'
                        : 'h-5 w-5',
                  'animate-pulse',
                )}
                style={{ animationDelay: `${String(i * 150)}ms` }}
              />
            ))}
          </div>
        );

      case 'pulse':
        return (
          <div className={cn('relative', sizeClasses[size])}>
            <div className="absolute inset-0 rounded-full bg-blue-600 dark:bg-blue-400 opacity-75 animate-ping" />
            <div className="relative rounded-full bg-blue-600 dark:bg-blue-400" />
          </div>
        );

      case 'clock':
        return (
          <Clock
            className={cn(sizeClasses[size], 'text-blue-600 dark:text-blue-400 animate-pulse')}
          />
        );

      case 'spinner':
      default:
        return (
          <Loader2
            className={cn(sizeClasses[size], 'text-blue-600 dark:text-blue-400 animate-spin')}
          />
        );
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-gray-600 dark:text-gray-400',
        className,
      )}
    >
      <div className="text-center">
        {/* Loading indicator */}
        <div className="inline-block mb-4">{renderIndicator()}</div>

        {/* Progress bar */}
        {showProgress && (
          <div className="w-48 mb-4">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 dark:bg-blue-400 transition-all duration-300 ease-out"
                style={{ width: `${String(Math.min(100, Math.max(0, progress)))}%` }}
              />
            </div>
            <div className="text-xs mt-1">{Math.round(progress)}%</div>
          </div>
        )}

        {/* Messages */}
        {message && <div className={cn(textSizeClasses[size], 'font-medium')}>{message}</div>}
        {subMessage && (
          <div className={cn(textSizeClasses[size], 'text-gray-500 dark:text-gray-500 mt-1')}>
            {subMessage}
          </div>
        )}
      </div>
    </div>
  );
};

// Composite loading states for specific use cases
export const TweetLoadingIndicator: React.FC<{ className?: string }> = ({ className }) => (
  <LoadingIndicator
    variant="spinner"
    size="lg"
    message="Loading tweet data..."
    subMessage="This may take a few seconds"
    className={className}
  />
);

export const ProcessingIndicator: React.FC<{ className?: string }> = ({ className }) => (
  <LoadingIndicator variant="dots" size="md" message="Processing..." className={className} />
);

export const RefreshingIndicator: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('inline-flex items-center gap-2', className)}>
    <RefreshCw className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
    <span className="text-sm text-gray-600 dark:text-gray-400">Refreshing...</span>
  </div>
);
