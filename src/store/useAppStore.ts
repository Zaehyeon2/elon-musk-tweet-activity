import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';

import { AUTO_REFRESH_INTERVAL, debugLog } from '@/config/constants';
import { API, fetchWithFallback } from '@/services/api';
import { CacheService } from '@/services/cache';
import { AppState, DateRange, HeatmapData, PredictionData, Tweet } from '@/types';
import { calculate4WeekAverage, calculatePredictions } from '@/utils/analytics';
import { generateWeekRanges, getDefaultWeekRange } from '@/utils/dateRanges';
import { parseCSV } from '@/utils/parser';
import { processData } from '@/utils/processor';

const initialState = {
  rawTweets: [] as Tweet[],
  currentData: null as HeatmapData | null,
  avgData: null as HeatmapData | null,
  predictions: null as PredictionData | null,
  selectedRange: null as DateRange | null,
  availableRanges: [] as DateRange[],
  isLoading: false,
  isLoadingData: false,
  error: null as string | null,
  autoRefresh: true,
  isAutoRefreshEnabled: true,
  theme: 'light' as 'light' | 'dark',
  refreshCountdown: 60,
  lastRefreshTime: null as Date | null,
  autoRefreshTimer: null as ReturnType<typeof setTimeout> | null,
  autoRefreshInterval: null as ReturnType<typeof setInterval> | null,
  countdownTimer: null as ReturnType<typeof setTimeout> | null,
  countdownInterval: null as ReturnType<typeof setInterval> | null,
};

export const useAppStore = create<AppState>()(
  subscribeWithSelector(
    devtools(
      persist(
        (set, get) => ({
          ...initialState,

          loadData: async (forceRefresh = false) => {
            const state = get();
            if (state.isLoading || state.isLoadingData) return;

            set({ isLoading: true, isLoadingData: true, error: null });

            try {
              let tweets: Tweet[] = [];
              let fromCache = false;

              // Try cache first if not forcing refresh
              let cachedRefreshTime: Date | null = null;
              if (!forceRefresh) {
                const cached = CacheService.loadTweets();
                if (cached) {
                  tweets = cached.tweets;
                  fromCache = true;
                  // Use the lastRefreshTime from cache if available
                  if (cached.lastRefreshTime) {
                    cachedRefreshTime = new Date(cached.lastRefreshTime);
                  }
                  debugLog('Using cached data');
                }
              }

              // Fetch fresh data if no cache or force refresh
              if (!fromCache || forceRefresh) {
                debugLog('Fetching fresh data from API...');
                let csvText: string;

                try {
                  csvText = await API.fetchTweetData();
                } catch {
                  // Try fallback proxies if primary fails
                  debugLog('Primary API failed, trying fallbacks...');
                  csvText = await fetchWithFallback();
                }

                debugLog('Store: About to parse CSV, length:', csvText.length);
                tweets = parseCSV(csvText, 12);
                debugLog('Store: Parsed tweets count:', tweets.length);

                if (tweets.length === 0) {
                  throw new Error('No valid tweets found');
                }

                // Save to cache
                CacheService.saveTweets(tweets);
              }

              debugLog(`Store: Successfully loaded ${tweets.length} tweets`);
              debugLog(`Successfully loaded ${tweets.length} tweets`);

              // Generate available date ranges
              const ranges = generateDateRanges(tweets);
              const weekRanges = generateWeekRanges(tweets);

              // Select range (use last selected or find the default)
              let selectedRange = state.selectedRange;
              if (!selectedRange && ranges.length > 0) {
                const lastRangeId = CacheService.loadLastRange();
                selectedRange = ranges.find((r) => r.label === lastRangeId) ?? null;

                // If no saved range, use the default (earliest ongoing or most recent)
                if (!selectedRange) {
                  const defaultWeekRange = getDefaultWeekRange(weekRanges);
                  if (defaultWeekRange) {
                    selectedRange =
                      ranges.find((r) => r.label === defaultWeekRange.label) || ranges[0] || null;
                  } else {
                    selectedRange = ranges[0] || null;
                  }
                }
              }

              // Process data if range is selected
              if (selectedRange) {
                const currentData = processData(tweets, selectedRange.start, selectedRange.end);
                const avgData = calculate4WeekAverage(
                  tweets,
                  selectedRange.start,
                  selectedRange.end,
                );
                const predictions = calculatePredictions(currentData, avgData);

                set({
                  rawTweets: tweets,
                  availableRanges: ranges,
                  selectedRange,
                  currentData,
                  avgData,
                  predictions,
                  isLoading: false,
                  isLoadingData: false,
                  // Update lastRefreshTime: from API (new Date), from cache (cached time), or keep existing
                  ...(!fromCache || forceRefresh
                    ? { lastRefreshTime: new Date() }
                    : cachedRefreshTime
                      ? { lastRefreshTime: cachedRefreshTime }
                      : {}),
                });

                // Save selected range
                if (selectedRange.label) {
                  CacheService.saveLastRange(selectedRange.label);
                }
              } else {
                set({
                  rawTweets: tweets,
                  availableRanges: ranges,
                  isLoading: false,
                  isLoadingData: false,
                  // Update lastRefreshTime only when data is from API
                  ...(!fromCache || forceRefresh
                    ? { lastRefreshTime: new Date() }
                    : cachedRefreshTime
                      ? { lastRefreshTime: cachedRefreshTime }
                      : {}),
                });
              }

              // Reset countdown
              set({ refreshCountdown: 60 });
            } catch (error) {
              console.error('Failed to load data:', error);
              set({
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                isLoading: false,
                isLoadingData: false,
              });
            }
          },

          uploadCSV: async (file: File) => {
            set({ isLoading: true, error: null });

            try {
              const text = await file.text();
              const tweets = parseCSV(text, 12);

              if (tweets.length === 0) {
                throw new Error('No valid tweets found in CSV');
              }

              debugLog(`Successfully parsed ${tweets.length} tweets from CSV`);

              // Save to cache (CSV upload is not from API)
              CacheService.saveTweets(tweets, false);

              // Generate available date ranges
              const ranges = generateDateRanges(tweets);

              if (ranges.length === 0) {
                throw new Error('No date ranges available');
              }

              // Select current week range
              const selectedRange = ranges[0];

              // Process data
              const currentData = processData(tweets, selectedRange.start, selectedRange.end);
              const avgData = calculate4WeekAverage(tweets, selectedRange.start, selectedRange.end);
              const predictions = calculatePredictions(currentData, avgData);

              set({
                rawTweets: tweets,
                availableRanges: ranges,
                selectedRange,
                currentData,
                avgData,
                predictions,
                isLoading: false,
                isLoadingData: false,
                // Don't update lastRefreshTime for CSV uploads (not from API)
              });
            } catch (error) {
              console.error('Failed to upload CSV:', error);
              set({
                error: error instanceof Error ? error.message : 'Failed to parse CSV file',
                isLoading: false,
              });
            }
          },

          downloadCSV: () => {
            const { currentData } = get();
            if (!currentData) {
              alert('No data available to download');
              return;
            }

            // Create CSV content from heatmap data (matching vanilla JS format)
            let csvContent = 'Hour,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday\n';

            currentData.hours.forEach((hour, hourIndex) => {
              const gridRow = currentData.grid[hourIndex];
              const row = [hour, ...gridRow];
              csvContent += row.join(',') + '\n';
            });

            // Add totals row
            csvContent += 'TOTALS,' + currentData.totals.join(',') + '\n';

            // Create and download file
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `elon-tweet-heatmap-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          },

          setDateRange: (range: DateRange) => {
            const { rawTweets } = get();
            if (rawTweets.length === 0) {
              set({ selectedRange: range });
              return;
            }

            const currentData = processData(rawTweets, range.start, range.end);
            const avgData = calculate4WeekAverage(rawTweets, range.start, range.end);
            const predictions = calculatePredictions(currentData, avgData);

            set({
              selectedRange: range,
              currentData,
              avgData,
              predictions,
            });

            // Save selected range
            if (range.label) {
              CacheService.saveLastRange(range.label);
            }
          },

          toggleTheme: () => {
            set((state) => {
              const newTheme = state.theme === 'light' ? 'dark' : 'light';
              document.documentElement.classList.remove('light', 'dark');
              document.documentElement.classList.add(newTheme);
              CacheService.saveTheme(newTheme);
              return { theme: newTheme };
            });
          },

          toggleAutoRefresh: () => {
            set((state) => {
              const newAutoRefresh = !state.autoRefresh;
              const newIsAutoRefreshEnabled = !state.isAutoRefreshEnabled;
              CacheService.saveAutoRefresh(newAutoRefresh);

              // Clear timers if disabling
              if (!newAutoRefresh) {
                if (state.autoRefreshTimer) {
                  clearInterval(state.autoRefreshTimer);
                }
                if (state.autoRefreshInterval) {
                  clearInterval(state.autoRefreshInterval);
                }
                if (state.countdownTimer) {
                  clearInterval(state.countdownTimer);
                }
                if (state.countdownInterval) {
                  clearInterval(state.countdownInterval);
                }
                return {
                  autoRefresh: newAutoRefresh,
                  isAutoRefreshEnabled: newIsAutoRefreshEnabled,
                  autoRefreshTimer: null,
                  autoRefreshInterval: null,
                  countdownTimer: null,
                  countdownInterval: null,
                  refreshCountdown: 60,
                };
              }

              return {
                autoRefresh: newAutoRefresh,
                isAutoRefreshEnabled: newIsAutoRefreshEnabled,
              };
            });
          },

          startAutoRefresh: () => {
            const state = get();
            if (!state.autoRefresh) return;

            // Clear existing timers
            if (state.autoRefreshTimer) clearInterval(state.autoRefreshTimer);
            if (state.countdownTimer) clearInterval(state.countdownTimer);

            // Start refresh timer
            const refreshTimer = setInterval(() => {
              const currentState = get();
              if (currentState.autoRefresh && !currentState.isLoading) {
                void currentState.loadData(true);
              }
            }, AUTO_REFRESH_INTERVAL);

            // Start countdown timer
            const countdownTimer = setInterval(() => {
              set((s) => {
                const newCount = s.refreshCountdown - 1;
                if (newCount <= 0) {
                  return { refreshCountdown: 60 };
                }
                return { refreshCountdown: newCount };
              });
            }, 1000);

            set({
              autoRefreshTimer: refreshTimer,
              countdownTimer: countdownTimer,
              refreshCountdown: 60,
            });
          },

          stopAutoRefresh: () => {
            const { autoRefreshTimer, countdownTimer } = get();
            if (autoRefreshTimer) clearInterval(autoRefreshTimer);
            if (countdownTimer) clearInterval(countdownTimer);
            set({
              autoRefreshTimer: null,
              countdownTimer: null,
              refreshCountdown: 60,
            });
          },

          reset: () => {
            const { autoRefreshTimer, autoRefreshInterval, countdownTimer, countdownInterval } =
              get();
            if (autoRefreshTimer) clearInterval(autoRefreshTimer);
            if (autoRefreshInterval) clearInterval(autoRefreshInterval);
            if (countdownTimer) clearInterval(countdownTimer);
            if (countdownInterval) clearInterval(countdownInterval);
            CacheService.clearAll();
            set(initialState);
          },

          updateRefreshCountdown: (countdown) => {
            set({ refreshCountdown: countdown });
          },
        }),
        {
          name: 'elon-tracker-storage',
          partialize: (state) => ({
            theme: state.theme,
            autoRefresh: state.autoRefresh,
          }),
        },
      ),
    ),
  ),
);

/**
 * Generate available date ranges from tweets using enhanced week range logic
 */
function generateDateRanges(tweets: Tweet[]): DateRange[] {
  if (tweets.length === 0) return [];

  // Use the sophisticated week range generation from dateRanges.ts
  const weekRanges = generateWeekRanges(tweets);

  // Convert WeekRange to DateRange format used by the store
  return weekRanges.map((range) => ({
    start: range.startDate,
    end: range.endDate,
    type: range.isOngoing ? 'current' : 'historical',
    label: range.label,
    mobileLabel: range.mobileLabel,
  }));
}

// Initialize theme on app start
const savedTheme = CacheService.loadTheme();
if (savedTheme) {
  document.documentElement.classList.add(savedTheme);
  useAppStore.setState({ theme: savedTheme });
}

// Initialize auto-refresh preference
const savedAutoRefresh = CacheService.loadAutoRefresh();
if (savedAutoRefresh !== null) {
  useAppStore.setState({ autoRefresh: savedAutoRefresh });
}
