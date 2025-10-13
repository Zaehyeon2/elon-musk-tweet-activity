import React, { useEffect, useState } from 'react';

import { Download, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/store/useAppStore';

export const Header: React.FC = () => {
  const {
    autoRefresh,
    toggleAutoRefresh,
    refreshCountdown,
    loadData,
    isLoading,
    availableRanges,
    selectedRange,
    setDateRange,
    downloadCSV,
    currentData,
  } = useAppStore();

  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const handleRefresh = () => {
    void loadData(true);
  };

  const handleRangeChange = (value: string) => {
    const range = availableRanges.find((r) => r.label === value);
    if (range) {
      setDateRange(range);
    }
  };

  return (
    <header className="sticky top-0 z-50">
      <div className="flex items-center gap-2 w-full">
        {/* Date Range Selector - Flexible Width */}
        {availableRanges.length > 0 && (
          <div className="flex-1 min-w-0">
            <Select value={selectedRange?.label} onValueChange={handleRangeChange}>
              <SelectTrigger className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                <SelectValue placeholder="Select week range" />
              </SelectTrigger>
              <SelectContent>
                {availableRanges.map((range) => (
                  <SelectItem key={range.label} value={range.label}>
                    {isMobile && range.mobileLabel ? range.mobileLabel : range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Control Buttons - Right Side */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Auto Refresh Toggle */}
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="default"
            onClick={toggleAutoRefresh}
            className={`min-w-[100px] h-9 px-3 text-xs ${
              autoRefresh
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {autoRefresh ? (
              <>
                <span className="sm:hidden">
                  ⏰ {Math.floor(refreshCountdown / 60)}:
                  {(refreshCountdown % 60).toString().padStart(2, '0')}
                </span>
                <span className="hidden sm:inline">
                  ⏰ Refresh in {Math.floor(refreshCountdown / 60)}:
                  {(refreshCountdown % 60).toString().padStart(2, '0')}
                </span>
              </>
            ) : (
              <>
                <span className="sm:hidden">⏰ Auto</span>
                <span className="hidden sm:inline">⏰ Auto Refresh</span>
              </>
            )}
          </Button>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
            title="Refresh data"
            className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          {/* Download CSV */}
          {currentData && (
            <Button
              variant="outline"
              size="icon"
              onClick={downloadCSV}
              title="Download heatmap as CSV"
              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
