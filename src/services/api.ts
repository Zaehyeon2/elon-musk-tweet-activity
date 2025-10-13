/**
 * API service for fetching tweet data from X Tracker
 * Matches vanilla JS api.js functionality
 */

import { API_BASE_URL, CORS_PROXY_URL, debugLog } from '@/config/constants';
import { queueRequest } from '@/utils/performance';

/**
 * API Module - Handles all API interactions
 */
export const API = {
  /**
   * Fetch tweet data from X Tracker API
   * @returns CSV text data
   */
  async fetchTweetData(): Promise<string> {
    return queueRequest('tweet-data', async () => {
      try {
        debugLog('Fetching tweet data from API...');

        const response = await fetch(`${CORS_PROXY_URL}${API_BASE_URL}/download`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ handle: 'elonmusk', platform: 'X' }),
          signal: AbortSignal.timeout(30000), // 30 second timeout
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const csvText = await response.text();

        debugLog('API Response type:', typeof csvText);
        debugLog('API Response length:', csvText.length);
        debugLog('API Response first 500 chars:', csvText.substring(0, 500));

        // Validate response
        if (!csvText || typeof csvText !== 'string') {
          throw new Error('Invalid response format');
        }

        // Validate CSV data format
        this.validateCSVData(csvText);

        debugLog(`Successfully fetched tweet data. Length: ${csvText.length}`);
        return csvText;
      } catch (error) {
        // Handle specific error types
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            throw new Error('Request timed out. Please try again.');
          }
          if (error.message.includes('Failed to fetch')) {
            throw new Error(
              'Network error. Please check your connection or try a different CORS proxy.',
            );
          }
        }
        throw error;
      }
    });
  },

  /**
   * Validate CSV data format
   * @param csvText - CSV text to validate
   * @returns True if valid
   * @throws Error if invalid format
   */
  validateCSVData(csvText: string): boolean {
    if (!csvText.includes('id,text,created_at') && !csvText.includes('created_at')) {
      console.error('CSV validation failed. First line:', csvText.split('\n')[0]);
      throw new Error('Invalid CSV format');
    }
    return true;
  },
};

/**
 * Alternative CORS proxies to try if primary fails
 */
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://cors-anywhere.herokuapp.com/',
  'https://api.allorigins.win/raw?url=',
  'https://proxy.cors.sh/',
];

/**
 * Try fetching with different CORS proxies
 */
export async function fetchWithFallback(): Promise<string> {
  let lastError: Error | null = null;

  for (const proxy of CORS_PROXIES) {
    try {
      debugLog(`Trying CORS proxy: ${proxy}`);

      const response = await fetch(`${proxy}${API_BASE_URL}/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ handle: 'elonmusk', platform: 'X' }),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const csvText = await response.text();

      if (csvText) {
        // Validate CSV data
        API.validateCSVData(csvText);
        debugLog(`Success with proxy: ${proxy}`);
        return csvText;
      }
    } catch (error) {
      debugLog(`Failed with proxy: ${proxy}`, error);
      if (error instanceof Error) {
        lastError = error;
      }
    }
  }

  throw lastError || new Error('All CORS proxies failed');
}

/**
 * Download CSV directly from X Tracker (for manual download link)
 */
export function getDirectDownloadUrl(): string {
  return `${API_BASE_URL}/download?handle=elonmusk&platform=X`;
}

// Export main fetch function for backward compatibility
export const fetchTweetData = API.fetchTweetData.bind(API);
