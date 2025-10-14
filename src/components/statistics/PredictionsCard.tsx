import React, { useEffect, useState } from 'react';

import { Info } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppStore } from '@/store/useAppStore';

export const PredictionsCard: React.FC = () => {
  const { predictions } = useAppStore();
  const [openTooltip, setOpenTooltip] = useState<string | null>(null);

  const handleTooltipClick = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenTooltip(openTooltip === key ? null : key);
  };

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openTooltip) {
        setOpenTooltip(null);
      }
    };

    if (openTooltip) {
      // Add slight delay to prevent immediate closing on touch devices
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
      }, 100);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [openTooltip]);

  return (
    <TooltipProvider delayDuration={0} skipDelayDuration={0}>
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700">
        <CardHeader className="py-2 sm:py-3 px-3 sm:px-6">
          <CardTitle className="text-lg">🔮 Predictions</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 px-3 sm:px-6 pb-3 sm:pb-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            {/* Current Pace */}
            <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-2 sm:p-3 rounded-lg">
              <div className="flex items-center text-gray-500 dark:text-gray-300 text-xs sm:text-sm font-semibold whitespace-nowrap">
                <span className="mr-1 text-xs sm:text-sm">⏱️</span> Current Pace
                <Tooltip open={openTooltip === 'pace'}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={(e) => {
                        handleTooltipClick('pace', e);
                      }}
                      className="inline-flex items-center justify-center w-4 h-4 ml-1 rounded-full border border-gray-400 dark:border-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Info className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-sm">(Current tweets ÷ Elapsed time) × Total period</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                {predictions?.pace || '-'}
              </div>
            </div>

            {/* Next 24h */}
            <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-2 sm:p-3 rounded-lg">
              <div className="flex items-center text-gray-500 dark:text-gray-300 text-xs sm:text-sm font-semibold whitespace-nowrap">
                <span className="mr-1 text-xs sm:text-sm">🔮</span> Next 24h
                <Tooltip open={openTooltip === 'next24h'}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={(e) => {
                        handleTooltipClick('next24h', e);
                      }}
                      className="inline-flex items-center justify-center w-4 h-4 ml-1 rounded-full border border-gray-400 dark:border-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Info className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-sm">Hourly 4-week avg × (Trend 70% + Momentum 30%)</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                {predictions ? (
                  <>
                    {predictions.next24h}
                    {predictions.next24hMin !== undefined &&
                      predictions.next24hMax !== undefined && (
                        <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-1">
                          ({predictions.next24hMin}-{predictions.next24hMax})
                        </span>
                      )}
                  </>
                ) : (
                  '-'
                )}
              </div>
            </div>

            {/* End of Range */}
            <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-2 sm:p-3 rounded-lg">
              <div className="flex items-center text-gray-500 dark:text-gray-300 text-xs sm:text-sm font-semibold whitespace-nowrap">
                <span className="mr-1 text-xs sm:text-sm">🎯</span> End of Range
                <Tooltip open={openTooltip === 'endOfRange'}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={(e) => {
                        handleTooltipClick('endOfRange', e);
                      }}
                      className="inline-flex items-center justify-center w-4 h-4 ml-1 rounded-full border border-gray-400 dark:border-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Info className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-sm">
                      Current + (Remaining hours × 4-week avg × (Trend 70% + Momentum 30%))
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                {predictions ? (
                  <>
                    {predictions.endOfRange}
                    {predictions.endOfRangeMin !== undefined &&
                      predictions.endOfRangeMax !== undefined && (
                        <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-1">
                          ({predictions.endOfRangeMin}-{predictions.endOfRangeMax})
                        </span>
                      )}
                  </>
                ) : (
                  '-'
                )}
              </div>
            </div>

            {/* Trend */}
            <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-2 sm:p-3 rounded-lg">
              <div className="flex items-center text-gray-500 dark:text-gray-300 text-xs sm:text-sm font-semibold whitespace-nowrap">
                <span className="mr-1 text-xs sm:text-sm">📊</span> Trend
                <Tooltip open={openTooltip === 'trend'}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={(e) => {
                        handleTooltipClick('trend', e);
                      }}
                      className="inline-flex items-center justify-center w-4 h-4 ml-1 rounded-full border border-gray-400 dark:border-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Info className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-sm">Current total ÷ Same elapsed time 4-week average</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                {predictions?.trend || '-'}
              </div>
            </div>

            {/* Momentum */}
            <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-2 sm:p-3 rounded-lg">
              <div className="flex items-center text-gray-500 dark:text-gray-300 text-xs sm:text-sm font-semibold whitespace-nowrap">
                <span className="mr-1 text-xs sm:text-sm">⚡</span> Momentum
                <Tooltip open={openTooltip === 'momentum'}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={(e) => {
                        handleTooltipClick('momentum', e);
                      }}
                      className="inline-flex items-center justify-center w-4 h-4 ml-1 rounded-full border border-gray-400 dark:border-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Info className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-sm">Recent 12h actual ÷ Recent 12h 4-week average</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                {predictions?.momentumIndicator || '-'}
              </div>
            </div>

            {/* Daily Average */}
            <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-2 sm:p-3 rounded-lg">
              <div className="flex items-center text-gray-500 dark:text-gray-300 text-xs sm:text-sm font-semibold whitespace-nowrap">
                <span className="mr-1 text-xs sm:text-sm">📅</span> Daily Avg
                <Tooltip open={openTooltip === 'daily'}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={(e) => {
                        handleTooltipClick('daily', e);
                      }}
                      className="inline-flex items-center justify-center w-4 h-4 ml-1 rounded-full border border-gray-400 dark:border-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Info className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-sm">Current total ÷ Days elapsed</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                {predictions?.dailyAvg || '-'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
