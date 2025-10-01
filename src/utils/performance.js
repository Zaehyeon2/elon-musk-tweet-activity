/**
 * Performance utilities: debounce, memoize, cache management
 */

import { MEMO_CACHE_MAX, CACHE_EXPIRY, debugLog } from '../config/constants.js';

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Memoization cache for expensive calculations
 */
const memoCache = new Map();

/**
 * Generic memoization function with LRU cache eviction
 * @param {Function} fn - Function to memoize
 * @param {Function} keyGenerator - Optional custom key generator
 * @returns {Function} Memoized function
 */
export function memoize(fn, keyGenerator) {
  return function(...args) {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    if (memoCache.has(key)) {
      debugLog('Returning memoized result for:', key);
      return memoCache.get(key);
    }

    // LRU cache eviction
    if (memoCache.size >= MEMO_CACHE_MAX) {
      const firstKey = memoCache.keys().next().value;
      memoCache.delete(firstKey);
    }

    const result = fn.apply(this, args);
    memoCache.set(key, result);
    return result;
  };
}

/**
 * Clear memoization cache (useful for testing)
 */
export function clearMemoCache() {
  memoCache.clear();
}

/**
 * Request queue to prevent duplicate API calls
 */
const requestQueue = new Map();

/**
 * Get or create a queued request
 * @param {string} key - Request identifier
 * @param {Function} requestFn - Function that returns a Promise
 * @returns {Promise} Request promise
 */
export function queueRequest(key, requestFn) {
  if (requestQueue.has(key)) {
    debugLog('Returning existing request promise for:', key);
    return requestQueue.get(key);
  }

  const requestPromise = requestFn().finally(() => {
    requestQueue.delete(key);
  });

  requestQueue.set(key, requestPromise);
  return requestPromise;
}

/**
 * Cache Module - Handles localStorage caching
 */
export const Cache = {
  CACHE_KEY: 'elonTrackerCache',

  /**
   * Save tweets to localStorage
   * @param {Array} tweets - Array of tweet objects
   */
  save(tweets) {
    try {
      const cacheData = {
        tweets: tweets,
        timestamp: Date.now(),
        lastUpdate: new Date().toISOString()
      };
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
      debugLog("Data cached successfully");
    } catch (error) {
      debugLog("Failed to cache data:", error);
    }
  },

  /**
   * Load tweets from localStorage
   * @returns {Object|null} Cached data or null if expired/invalid
   */
  load() {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      const age = Date.now() - cacheData.timestamp;

      // Return cache if less than 24 hours old
      if (age < CACHE_EXPIRY) {
        debugLog(`Loading cached data (${Math.round(age / 1000 / 60)} minutes old)`);
        return cacheData;
      }

      debugLog("Cache expired, will fetch new data");
      return null;
    } catch (error) {
      debugLog("Failed to load cache:", error);
      return null;
    }
  },

  /**
   * Clear localStorage cache
   */
  clear() {
    localStorage.removeItem(this.CACHE_KEY);
  }
};
