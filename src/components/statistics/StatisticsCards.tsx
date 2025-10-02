import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/store/useAppStore';
import { getETComponents } from '@/utils/dateTime';

export const StatisticsCards: React.FC = () => {
  const { currentData, avgData, rawTweets, lastRefreshTime } = useAppStore();

  // Get last tweet time and format
  const lastTweetInfo = React.useMemo(() => {
    if (rawTweets.length === 0) return null;
    const sortedTweets = [...rawTweets].sort((a, b) => b.date.getTime() - a.date.getTime());
    const lastTweet = sortedTweets[0]?.date;

    if (!lastTweet) return null;

    const now = new Date();
    const diffMs = now.getTime() - lastTweet.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    let timeAgo: string;
    if (diffMinutes < 1) {
      timeAgo = 'Just now';
    } else if (diffMinutes < 60) {
      timeAgo = `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      timeAgo = `${diffHours}h ago`;
    } else if (diffDays < 7) {
      timeAgo = `${diffDays}d ago`;
    } else {
      // Show actual date for older tweets
      const etComponents = getETComponents(lastTweet);
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      timeAgo = `${monthNames[etComponents.month]} ${etComponents.day}`;
    }

    // Format date with time (month day, hour:minute AM/PM)
    const dateString = lastTweet.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return { timeAgo, dateString };
  }, [rawTweets]);

  return (
    <Card className="bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700">
      <CardHeader className="py-2 sm:py-3 px-3 sm:px-6">
        <CardTitle className="text-lg">📊 Statistics</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-3 sm:px-6 pb-3 sm:pb-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {/* Current Week */}
          <div className="bg-white dark:bg-gray-700 p-2 sm:p-3 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="text-gray-500 dark:text-gray-300 text-xs sm:text-sm font-semibold whitespace-nowrap">
              <span className="mr-1 text-xs sm:text-sm">📈</span> Current Week
            </div>
            <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
              {currentData ? currentData.current.toLocaleString() : '--'}
            </div>
          </div>

          {/* 4-Week Average */}
          <div className="bg-white dark:bg-gray-700 p-2 sm:p-3 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="text-gray-500 dark:text-gray-300 text-xs sm:text-sm font-semibold whitespace-nowrap">
              <span className="mr-1 text-xs sm:text-sm">📊</span> 4-Week Avg
            </div>
            <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
              {avgData ? avgData.current.toLocaleString() : '--'}
            </div>
          </div>

          {/* Last Tweet */}
          <div className="bg-white dark:bg-gray-700 p-2 sm:p-3 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="text-gray-500 dark:text-gray-300 text-xs sm:text-sm font-semibold whitespace-nowrap">
              <span className="mr-1 text-xs sm:text-sm">🐦</span> Last Tweet
            </div>
            <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
              {lastTweetInfo ? lastTweetInfo.timeAgo : '--'}
            </div>
          </div>

          {/* Last Updated */}
          <div className="bg-white dark:bg-gray-700 p-2 sm:p-3 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="text-gray-500 dark:text-gray-300 text-xs sm:text-sm font-semibold whitespace-nowrap">
              <span className="mr-1 text-xs sm:text-sm">🔄</span> Last Updated
            </div>
            <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap overflow-hidden text-ellipsis">
              {lastRefreshTime
                ? lastRefreshTime.toLocaleTimeString('en-US', {
                    timeZone: 'America/New_York',
                    hour: 'numeric',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true,
                  })
                : '--'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
