/**
 * API service for fetching tweet data
 */

import { queueRequest } from '../utils/performance.js';
import { debugLog } from '../config/constants.js';

/**
 * API Module - Handles all API interactions
 */
export const API = {
  /**
   * Fetch tweet data from X Tracker API
   * @returns {Promise<string>} CSV text data
   */
  async fetchTweetData() {
    return queueRequest('tweet-data', () =>
      fetch(
        "https://corsproxy.io/?https://www.xtracker.io/api/download",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ handle: "elonmusk", platform: "X" }),
          signal: AbortSignal.timeout(30000) // 30 second timeout
        }
      ).then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
    );
  },

  /**
   * Validate CSV data format
   * @param {string} csvText - CSV text to validate
   * @returns {boolean} True if valid
   * @throws {Error} If invalid format
   */
  validateCSVData(csvText) {
    if (
      !csvText.includes("id,text,created_at") &&
      !csvText.includes("created_at")
    ) {
      throw new Error("Invalid CSV format");
    }
    return true;
  },
};
