import React from 'react';

import { ErrorMessage } from '@/components/common/ErrorMessage';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { Heatmap } from '@/components/heatmap/Heatmap';
import { Header } from '@/components/layout/Header';
import { PredictionsCard } from '@/components/statistics/PredictionsCard';
import { StatisticsCards } from '@/components/statistics/StatisticsCards';
import { Card } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { useInitialLoad } from '@/hooks/useInitialLoad';
import { useAppStore } from '@/store/useAppStore';

function App() {
  const { isLoading, error, currentData, avgData, rawTweets, loadData, uploadCSV } = useAppStore();

  // Initialize data loading and auto-refresh
  useInitialLoad();
  useAutoRefresh();

  const handleRetry = () => {
    void loadData(true);
  };

  const handleUpload = (file: File) => {
    void uploadCSV(file);
  };

  return (
    <div className="min-h-screen bg-gray-200 dark:bg-gray-950 py-0 sm:p-4 md:p-6">
      <div className="w-full sm:container sm:mx-auto sm:max-w-7xl">
        <Card className="bg-white dark:bg-gray-900 shadow-xl rounded-none sm:rounded-lg">
          {/* Title with Dark Mode Toggle */}
          <div className="px-3 sm:px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100 flex-1">
                🚀 Elon Musk Tweet Activity Tracker
              </h1>
              <div className="flex-shrink-0">
                <ThemeToggle />
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="px-3 sm:px-4 py-3">
            <Header />
          </div>

          {/* Main Content */}
          <main className="px-3 sm:px-4 pb-4">
            <div className="space-y-3 sm:space-y-6">
              {/* Loading State - Show skeleton loaders */}
              {isLoading && rawTweets.length === 0 && (
                <div className="space-y-3 sm:space-y-6">
                  {/* Statistics Skeleton */}
                  <SkeletonLoader type="card" className="h-32" />

                  {/* Predictions Skeleton */}
                  <SkeletonLoader type="card" className="h-40" />

                  {/* Heatmaps Skeleton - Side by side on desktop */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SkeletonLoader type="heatmap" rows={24} cols={8} />
                    <SkeletonLoader type="heatmap" rows={24} cols={8} />
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && !isLoading && rawTweets.length === 0 && (
                <ErrorMessage
                  title="Failed to Load Data"
                  message={error}
                  onRetry={handleRetry}
                  showUpload={true}
                  onUpload={handleUpload}
                />
              )}

              {/* Content */}
              {(rawTweets.length > 0 || (!isLoading && !error)) && (
                <>
                  {/* Statistics Cards */}
                  <StatisticsCards />

                  {/* Predictions Card */}
                  <PredictionsCard />

                  {/* Heatmaps - Side by side on desktop */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Current Week Heatmap */}
                    <Heatmap
                      data={currentData}
                      title="Current Week Activity"
                      description="Tweet activity heatmap for the selected week"
                      showCurrentHour={true}
                      type="current"
                    />

                    {/* 4-Week Average Heatmap */}
                    <Heatmap
                      data={avgData}
                      title="4-Week Average"
                      description="Average tweet activity over the past 4 weeks"
                      showCurrentHour={true}
                      type="average"
                    />
                  </div>

                  {/* Empty State */}
                  {!currentData && !isLoading && (
                    <div className="text-center py-10">
                      <p className="text-gray-600 dark:text-gray-400">
                        No data available. Try uploading a CSV file or refreshing the data.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </main>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-3 sm:px-4 py-4">
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              <p>
                Data source:{' '}
                <a
                  href="https://www.xtracker.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  X Tracker
                </a>
              </p>
              <p className="mt-2">All times displayed in ET (Eastern Time)</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default App;
