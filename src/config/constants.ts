/**
 * Configuration constants for the Elon Musk Tweet Activity Tracker
 */

// Debug mode - can be controlled via environment variable VITE_DEBUG_MODE
// Set VITE_DEBUG_MODE=true in .env or pass it when running the dev server
export const DEBUG_MODE: boolean = import.meta.env.VITE_DEBUG_MODE === 'true';

// Prediction weights
export const PREDICTION_WEIGHT_CURRENT = 0.7; // Weight for current week in predictions
export const PREDICTION_WEIGHT_AVERAGE = 0.3; // Weight for 4-week average

// Time-related constants
export const WEEKS_FOR_TREND = 4; // Number of weeks to analyze for trend
export const HOURS_IN_DAY = 24;
export const DAYS_IN_WEEK = 8; // Friday noon to Friday noon (7 full days + 2 half days)

// Auto-refresh
export const AUTO_REFRESH_INTERVAL = 60000; // 1 minute in milliseconds

// Trend thresholds
export const TREND_UP_THRESHOLD = 1.15; // 15% increase for upward trend
export const TREND_DOWN_THRESHOLD = 0.85; // 15% decrease for downward trend

// Cache settings
export const MAX_CACHE_SIZE = 1000; // Limit cache size to prevent memory issues
export const MEMO_CACHE_MAX = 50; // Maximum memoization cache size
export const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// API Configuration
export const API_BASE_URL = 'https://xtracker.polymarket.com/api';
export const CORS_PROXY_URL = 'https://corsproxy.io/?';

// Debug logging wrapper
export const debugLog = (...args: unknown[]) => {
  // eslint-disable-next-line no-console
  if (DEBUG_MODE) console.log(...args);
};
