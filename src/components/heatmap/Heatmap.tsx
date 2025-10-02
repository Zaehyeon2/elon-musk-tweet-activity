import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { HeatmapData } from '@/types';
import { getETComponents } from '@/utils/dateTime';
import { getHeatmapCellClasses } from '@/utils/heatmapStyles';
import { isMobileDevice } from '@/utils/mobile';
import { isCellDisabled, isCurrentHour, isFutureTime } from '@/utils/processor';

import { EmptyState } from './EmptyState';

interface HeatmapProps {
  data: HeatmapData | null;
  title: string;
  description?: string;
  showCurrentHour?: boolean;
  type?: 'current' | 'average';
}

export const Heatmap: React.FC<HeatmapProps> = ({
  data,
  title,
  description,
  showCurrentHour = true,
  type = 'current',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const [hoveredCell, setHoveredCell] = useState<{ day: number; hour: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const { loadData } = useAppStore();

  // Scroll indicators
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  // Check if mobile
  useEffect(() => {
    setIsMobile(isMobileDevice());
    const handleResize = () => {
      setIsMobile(isMobileDevice());
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Animation removed to fix white background issue
  // The animation classes were overriding the background colors

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
    setShowLeftScroll(scrollLeft > 0);
    setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  useEffect(() => {
    handleScroll();
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      window.addEventListener('resize', handleScroll);
      return () => {
        container.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleScroll);
      };
    }
  }, [handleScroll]);

  const getTextColor = useCallback((value: number, isDisabled: boolean, isFuture: boolean) => {
    if (isDisabled) return 'text-gray-400 dark:text-gray-600';
    if (isFuture) return 'text-gray-400 dark:text-gray-600';
    if (value === 0) return 'text-gray-600 dark:text-gray-400';
    if (value <= 2) return 'text-gray-700 dark:text-gray-300';
    if (value <= 4) return 'text-gray-800 dark:text-gray-200';
    if (value <= 6) return 'text-gray-900 dark:text-gray-100';
    return 'text-white'; // High values (7+): always white text for visibility on dark green
  }, []);

  const handleRetry = useCallback(() => {
    void loadData(true);
  }, [loadData]);

  if (!data) {
    return (
      <Card className="bg-transparent border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <EmptyState
            type={type === 'current' ? 'error' : 'no-data'}
            onRetry={type === 'current' ? handleRetry : undefined}
          />
        </CardContent>
      </Card>
    );
  }

  const { grid, hours, days, totals, maxValue, dateRange } = data;
  const now = new Date();

  return (
    <Card className="bg-transparent border border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="px-2 py-3 sm:p-6">
        <div className="relative">
          {/* Scroll indicators */}
          {showLeftScroll && (
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-gray-950 to-transparent z-10 pointer-events-none" />
          )}
          {showRightScroll && (
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-gray-950 to-transparent z-10 pointer-events-none" />
          )}

          {/* Heatmap container */}
          <div ref={containerRef} className="overflow-hidden" onScroll={handleScroll}>
            <table ref={tableRef} className="w-full border-collapse table-fixed">
              <colgroup>
                <col className="w-10 sm:w-14" />
                {days.map((_, i) => (
                  <col key={i} className="w-auto" />
                ))}
              </colgroup>

              {/* Header row with day labels */}
              <thead>
                <tr>
                  <th className="h-5 sm:h-6 md:h-7 p-0 bg-transparent border-b border-r border-gray-200 dark:border-gray-700" />
                  {days.map((day, i) => (
                    <th
                      key={i}
                      className="h-5 sm:h-6 md:h-7 p-0 bg-transparent text-[8px] sm:text-[10px] md:text-xs font-bold text-gray-700 dark:text-gray-300 text-center border-b border-r border-gray-200 dark:border-gray-700 last:border-r-0"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Data rows */}
              <tbody>
                {hours.map((hour, hourIndex) => (
                  <tr key={hourIndex}>
                    {/* Hour label */}
                    <td className="h-5 sm:h-6 md:h-7 p-0 bg-transparent text-[8px] sm:text-[10px] md:text-xs font-bold text-gray-600 dark:text-gray-400 text-center border-r border-gray-200 dark:border-gray-700">
                      {hour}
                    </td>

                    {/* Data cells */}
                    {days.map((day, dayIndex) => {
                      const value = grid[hourIndex]?.[dayIndex] ?? 0;
                      const disabled = isCellDisabled(dayIndex, hourIndex);
                      const future = isFutureTime(dayIndex, hourIndex, dateRange.start);
                      const current =
                        showCurrentHour && isCurrentHour(day, hourIndex, now, dateRange.start);

                      const displayValue = disabled ? '-' : future ? '' : value.toString();
                      const cellColor = getHeatmapCellClasses(value, disabled, future);
                      const textColor = getTextColor(value, disabled, future);

                      // Enhanced current hour styling
                      const currentHourClasses = current
                        ? 'border-2 border-red-500 dark:border-yellow-400 outline outline-2 outline-offset-[-2px] outline-red-500 dark:outline-yellow-400 z-20'
                        : '';

                      // Determine border style based on cell state
                      const borderClasses = disabled
                        ? 'border-l border-r border-gray-200 dark:border-gray-700' // Only vertical borders for disabled cells
                        : 'border border-gray-200 dark:border-gray-700'; // Full border for active and future cells

                      const cellClasses = cn(
                        'heatmap-cell h-5 sm:h-6 md:h-7 p-0 relative',
                        borderClasses,
                        cellColor,
                        currentHourClasses,
                        !disabled && !future && 'cursor-pointer',
                      );

                      // Return cell without tooltip
                      return (
                        <td
                          key={dayIndex}
                          className={cellClasses}
                          data-value={value}
                          onMouseEnter={() =>
                            !isMobile && setHoveredCell({ day: dayIndex, hour: hourIndex })
                          }
                          onMouseLeave={() => !isMobile && setHoveredCell(null)}
                        >
                          <span
                            className={cn(
                              'absolute inset-0 flex items-center justify-center text-[7px] sm:text-[9px] md:text-[11px] font-semibold overflow-hidden pointer-events-none',
                              textColor,
                            )}
                          >
                            {displayValue}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Totals row */}
                <tr>
                  <td className="h-6 sm:h-7 md:h-8 p-0 bg-transparent text-[8px] sm:text-[10px] md:text-xs font-bold text-gray-700 dark:text-gray-300 text-center border-t border-r border-gray-200 dark:border-gray-700">
                    {type === 'average' ? 'AVG' : 'TOTALS'}
                  </td>
                  {totals.map((total, i) => (
                    <td
                      key={i}
                      className="h-6 sm:h-7 md:h-8 p-0 bg-transparent text-[8px] sm:text-[10px] md:text-xs font-bold text-gray-900 dark:text-gray-100 text-center border border-gray-200 dark:border-gray-700"
                    >
                      {type === 'average' && typeof total === 'number' ? total.toFixed(1) : total}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Color scale legend - GitHub-like contribution graph */}
        <div className="mt-4 px-4 sm:px-0">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-4 h-4 bg-muted border border-border rounded-sm" />
              <div className="w-4 h-4 bg-green-300 dark:bg-green-700 border border-border rounded-sm" />
              <div className="w-4 h-4 bg-green-400 dark:bg-green-600 border border-border rounded-sm" />
              <div className="w-4 h-4 bg-green-500 dark:bg-green-500 border border-border rounded-sm" />
              <div className="w-4 h-4 bg-green-600 dark:bg-green-400 border border-border rounded-sm" />
            </div>
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
