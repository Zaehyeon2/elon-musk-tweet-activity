/**
 * Cache service for storing API responses and application data
 */

import { CACHE_EXPIRY, debugLog } from '@/config/constants';
import { Tweet } from '@/types';

interface CachedData {
  tweets: Tweet[];
  timestamp: number;
}

/**
 * Local storage keys
 */
const STORAGE_KEYS = {
  TWEET_DATA: 'elon-tracker-tweets',
  THEME: 'elon-tracker-theme',
  AUTO_REFRESH: 'elon-tracker-auto-refresh',
  LAST_RANGE: 'elon-tracker-last-range',
} as const;

/**
 * Cache service functions
 */
export const CacheService = {
  /**
   * Save tweets to cache
   */
  saveTweets(tweets: Tweet[]): void {
    try {
      const data: CachedData = {
        tweets,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEYS.TWEET_DATA, JSON.stringify(data));
      debugLog(`Cached ${tweets.length} tweets`);
    } catch (error) {
      console.error('Failed to save to cache:', error);
    }
  },

  /**
   * Load tweets from cache
   */
  loadTweets(): CachedData | null {
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.TWEET_DATA);
      if (!cached) return null;

      const data = JSON.parse(cached) as CachedData;

      // Check if cache is expired
      if (Date.now() - data.timestamp > CACHE_EXPIRY) {
        debugLog('Cache expired, clearing...');
        this.clearTweets();
        return null;
      }

      // Reconstruct Date objects
      data.tweets = data.tweets.map((tweet) => ({
        ...tweet,
        date: new Date(tweet.date),
      }));

      debugLog(
        `Loaded ${data.tweets.length} tweets from cache (${Math.round((Date.now() - data.timestamp) / 1000 / 60)} minutes old)`,
      );
      return data;
    } catch (error) {
      console.error('Failed to load from cache:', error);
      return null;
    }
  },

  /**
   * Clear tweet cache
   */
  clearTweets(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.TWEET_DATA);
      debugLog('Tweet cache cleared');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  },

  /**
   * Save theme preference
   */
  saveTheme(theme: 'light' | 'dark'): void {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  },

  /**
   * Load theme preference
   */
  loadTheme(): 'light' | 'dark' | null {
    try {
      const theme = localStorage.getItem(STORAGE_KEYS.THEME);
      return theme === 'dark' || theme === 'light' ? theme : null;
    } catch (error) {
      console.error('Failed to load theme:', error);
      return null;
    }
  },

  /**
   * Save auto-refresh preference
   */
  saveAutoRefresh(enabled: boolean): void {
    try {
      localStorage.setItem(STORAGE_KEYS.AUTO_REFRESH, enabled.toString());
    } catch (error) {
      console.error('Failed to save auto-refresh:', error);
    }
  },

  /**
   * Load auto-refresh preference
   */
  loadAutoRefresh(): boolean | null {
    try {
      const value = localStorage.getItem(STORAGE_KEYS.AUTO_REFRESH);
      return value === 'true' ? true : value === 'false' ? false : null;
    } catch (error) {
      console.error('Failed to load auto-refresh:', error);
      return null;
    }
  },

  /**
   * Save last selected date range
   */
  saveLastRange(rangeId: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_RANGE, rangeId);
    } catch (error) {
      console.error('Failed to save last range:', error);
    }
  },

  /**
   * Load last selected date range
   */
  loadLastRange(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.LAST_RANGE);
    } catch (error) {
      console.error('Failed to load last range:', error);
      return null;
    }
  },

  /**
   * Clear all cache
   */
  clearAll(): void {
    try {
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
      debugLog('All cache cleared');
    } catch (error) {
      console.error('Failed to clear all cache:', error);
    }
  },

  /**
   * Get cache size in bytes
   */
  getCacheSize(): number {
    try {
      let size = 0;
      Object.values(STORAGE_KEYS).forEach((key) => {
        const item = localStorage.getItem(key);
        if (item) {
          size += item.length * 2; // Rough estimate (UTF-16)
        }
      });
      return size;
    } catch (error) {
      console.error('Failed to get cache size:', error);
      return 0;
    }
  },

  /**
   * Check if cache is available
   */
  isAvailable(): boolean {
    try {
      const testKey = '__cache_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  },
};
