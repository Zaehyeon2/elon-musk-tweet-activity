import React from 'react';

import { AlertCircle, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getDirectDownloadUrl } from '@/services/api';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  showUpload?: boolean;
  onUpload?: (file: File) => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Error',
  message,
  onRetry,
  showUpload = false,
  onUpload,
}) => {
  const directDownloadUrl = getDirectDownloadUrl();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onUpload) {
      onUpload(file);
      event.target.value = '';
    }
  };

  return (
    <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">{title}</h3>
            <p className="mt-2 text-sm text-red-800 dark:text-red-200">{message}</p>

            {/* Alternative solutions */}
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Alternative solutions:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>Check your internet connection</li>
                <li>Try using a different browser</li>
                {showUpload && <li>Upload a JSON file manually</li>}
              </ul>
            </div>

            {/* Actions */}
            <div className="mt-4 flex gap-2">
              {onRetry && (
                <Button onClick={onRetry} size="sm" variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              )}

              {showUpload && onUpload && (
                <div>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="error-csv-upload"
                  />
                  <label htmlFor="error-csv-upload">
                    <Button size="sm" variant="outline" asChild>
                      <span>Upload JSON</span>
                    </Button>
                  </label>
                </div>
              )}

              <a
                href={directDownloadUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="sm" variant="outline">
                  Download from Polymarket
                </Button>
              </a>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
