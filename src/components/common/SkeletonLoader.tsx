import React from 'react';

import { cn } from '@/lib/utils';

interface SkeletonLoaderProps {
  type?: 'heatmap' | 'card' | 'text';
  rows?: number;
  cols?: number;
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type = 'heatmap',
  rows = 24,
  cols = 8,
  className,
}) => {
  if (type === 'card') {
    return (
      <div
        className={cn(
          'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg p-6',
          className,
        )}
      >
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'text') {
    return (
      <div className={cn('animate-pulse space-y-2', className)}>
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
      </div>
    );
  }

  // Heatmap skeleton
  return (
    <div
      className={cn(
        'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg p-6',
        className,
      )}
    >
      <div className="animate-pulse">
        {/* Title skeleton */}
        <div className="flex items-center justify-center mb-4">
          <div className="h-2 bg-gray-300 dark:bg-gray-700 rounded w-32 shimmer"></div>
        </div>

        {/* Table skeleton */}
        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-collapse">
            <thead>
              {/* Header row */}
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="h-7 w-12 p-0">
                  <div className="h-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </th>
                {Array.from({ length: cols }).map((_, i) => (
                  <th key={i} className="h-7 p-0">
                    <div
                      className="h-full bg-gray-200 dark:bg-gray-700 rounded mx-1 animate-pulse"
                      style={{ animationDelay: `${String(i * 50)}ms` }}
                    ></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Data rows */}
              {Array.from({ length: rows }).map((_, rowIndex) => (
                <tr key={rowIndex} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="h-7 w-12 p-0">
                    <div
                      className="h-full bg-gray-200 dark:bg-gray-700 rounded my-1 animate-pulse"
                      style={{ animationDelay: `${String(rowIndex * 30)}ms` }}
                    ></div>
                  </td>
                  {Array.from({ length: cols }).map((_, colIndex) => {
                    const delay = (rowIndex * cols + colIndex) * 10;
                    return (
                      <td key={colIndex} className="h-7 p-0">
                        <div
                          className="h-full bg-gray-200 dark:bg-gray-700 rounded m-1 animate-pulse"
                          style={{ animationDelay: `${String(delay % 1000)}ms` }}
                        ></div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Loading message */}
        <div className="text-center mt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
            Loading tweet data...
          </p>
        </div>
      </div>
    </div>
  );
};

// Shimmer effect CSS should be added to animations.css
export const shimmerStyles = `
@keyframes shimmer {
  0% {
    background-position: -468px 0;
  }
  100% {
    background-position: 468px 0;
  }
}

.shimmer {
  animation: shimmer 2s linear infinite;
  background: linear-gradient(to right, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
  background-size: 468px 100%;
}
`;
