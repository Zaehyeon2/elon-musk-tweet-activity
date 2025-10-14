import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';

export const PaceMeter: React.FC = () => {
  const { predictions } = useAppStore();

  if (!predictions || !predictions.currentHourlyRate) {
    return null;
  }

  const currentRate = predictions.currentHourlyRate;
  const avgRate = predictions.avgHourlyRate || 1;

  // Calculate percentage (0-200%, capped at 200 for display)
  const percentage = Math.min(200, (currentRate / avgRate) * 100);

  // Determine speed level and color
  const getSpeedLevel = () => {
    if (percentage >= 150)
      return { label: '🔥 Very Fast', color: 'bg-red-500', textColor: 'text-red-600' };
    if (percentage >= 120)
      return { label: '⚡ Fast', color: 'bg-orange-500', textColor: 'text-orange-600' };
    if (percentage >= 80)
      return { label: '✅ Normal', color: 'bg-green-500', textColor: 'text-green-600' };
    if (percentage >= 50)
      return { label: '🐢 Slow', color: 'bg-blue-500', textColor: 'text-blue-600' };
    return { label: '😴 Very Slow', color: 'bg-gray-500', textColor: 'text-gray-600' };
  };

  const speedLevel = getSpeedLevel();

  // Calculate meter segments (5 segments)
  const segments = 5;
  const filledSegments = Math.ceil((percentage / 200) * segments);

  return (
    <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700">
      <CardHeader className="py-2 sm:py-3 px-3 sm:px-6">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>🚀 Real-time Pace</span>
          <span className={cn('text-sm font-normal', speedLevel.textColor)}>
            {speedLevel.label} ({percentage.toFixed(0)}%)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-3 sm:px-6 pb-3 sm:pb-6">
        <div className="space-y-4">
          {/* Current Rate Display */}
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
              {currentRate.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">tweets per hour</div>
          </div>

          {/* Visual Meter */}
          <div className="space-y-2">
            {/* Background segments */}
            <div className="flex gap-1 h-8">
              {Array.from({ length: segments }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex-1 rounded-sm transition-all duration-500',
                    i < filledSegments ? speedLevel.color : 'bg-gray-200 dark:bg-gray-700',
                  )}
                />
              ))}
            </div>

            {/* Speed scale labels */}
            <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-gray-300">
              <span>0</span>
              <span>{avgRate.toFixed(1)}</span>
              <span className="font-bold">{(avgRate * 2).toFixed(1)}</span>
            </div>
          </div>

          {/* Comparison Stats */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-white dark:bg-gray-700 p-2 rounded-lg">
              <div className="text-xs text-gray-500 dark:text-gray-400">Current</div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">
                {currentRate.toFixed(1)}/hr
              </div>
            </div>
            <div className="bg-white dark:bg-gray-700 p-2 rounded-lg">
              <div className="text-xs text-gray-500 dark:text-gray-400">4-Week Avg</div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">
                {avgRate.toFixed(1)}/hr
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
