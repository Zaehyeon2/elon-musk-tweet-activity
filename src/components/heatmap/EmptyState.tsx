import React from 'react';

import { AlertCircle, BarChart3, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  type: 'error' | 'no-data';
  onRetry?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ type, onRetry }) => {
  if (type === 'error') {
    return (
      <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-300 dark:border-red-700 rounded-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full mb-4">
          <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
          Unable to Process Data
        </h3>
        <p className="text-sm text-red-600 dark:text-red-500 mb-4">
          The tweet data could not be processed at this time.
        </p>
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="destructive"
            className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900/20 dark:to-blue-900/20 border border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-900/50 rounded-full mb-4">
        <BarChart3 className="w-8 h-8 text-gray-600 dark:text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-400 mb-2">
        No Historical Data
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-500">
        4-week average data is not available yet.
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-600 mt-2">
        Data will appear once sufficient history is collected.
      </p>
    </div>
  );
};
