/**
 * CSV parsing module
 */

import { parseTwitterDate, getETComponents } from '../utils/dateTime.js';
import { debugLog } from '../config/constants.js';

/**
 * Parse CSV data with optimization for large files
 * @param {string} csvText - CSV text content
 * @param {number} weeksToLoad - Number of weeks to load (default: 5)
 * @returns {Array} Array of tweet objects
 */
export function parseCSV(csvText, weeksToLoad = 5) {
  const data = [];

  debugLog(`Processing CSV for last ${weeksToLoad} weeks...`);

  // Find all lines ending with EDT or EST to avoid multiline parsing issues
  const lines = csvText.split("\n");
  const tweetLines = [];

  lines.forEach((line) => {
    if (line.endsWith('EDT"') || line.endsWith('EST"')) {
      tweetLines.push(line);
    }
  });

  debugLog(`Found ${tweetLines.length} tweets by EDT/EST pattern`);

  // Calculate cutoff date
  const now = new Date();
  const cutoffDate = new Date(now);
  cutoffDate.setTime(
    cutoffDate.getTime() - weeksToLoad * 7 * 24 * 60 * 60 * 1000
  );

  // Use ET components to get the current year
  const nowET = getETComponents(now);
  let currentYear = nowET.year;
  let lastMonth = 13; // Start with invalid month to detect year change

  // Process tweets in reverse order (newest first)
  for (let i = tweetLines.length - 1; i >= 0; i--) {
    const line = tweetLines[i];

    // Extract the date/time part
    const edtIndex = line.lastIndexOf('EDT"');
    const estIndex = line.lastIndexOf('EST"');
    const timeEndIndex = edtIndex > 0 ? edtIndex : estIndex;

    if (timeEndIndex > 0) {
      const beforeTime = line.substring(0, timeEndIndex);
      const lastQuoteBeforeTime = beforeTime.lastIndexOf('"');

      if (lastQuoteBeforeTime > 0) {
        const dateTimeStr =
          beforeTime.substring(lastQuoteBeforeTime + 1) +
          (edtIndex > 0 ? "EDT" : "EST");

        // Smart year detection
        const monthMatch = dateTimeStr.match(/^(\w+) (\d+)/);
        if (monthMatch) {
          const monthNames = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
          ];
          const monthIndex = monthNames.indexOf(monthMatch[1]);

          // Detect year change when going backwards
          if (monthIndex > lastMonth && lastMonth !== 13) {
            currentYear--;
          }
          lastMonth = monthIndex;
        }

        // Create date string with estimated year
        const dateWithYear = dateTimeStr.replace(
          /^(\w+ \d+)/,
          `$1, ${currentYear}`
        );

        // Parse and check if within range
        const tweetDate = parseTwitterDate(dateWithYear);
        if (tweetDate && tweetDate >= cutoffDate) {
          // Add to beginning since we're processing in reverse
          data.unshift({
            id: null,
            text: null,
            created_at: dateWithYear,
          });
        } else if (tweetDate && tweetDate < cutoffDate) {
          // Stop processing if we've gone too far back
          break;
        }
      }
    }
  }

  debugLog(`Parsed ${data.length} tweets`);
  debugLog("Sample parsed tweets:", data.slice(0, 5));
  debugLog("Last few parsed tweets:", data.slice(-5));

  // Debug: Check for today's tweets
  const today = new Date();
  const todayET = getETComponents(today);
  const todayStr = `${todayET.year}-${String(todayET.month + 1).padStart(
    2,
    "0"
  )}-${String(todayET.day).padStart(2, "0")}`;

  const todayTweets = data.filter((tweet) => {
    const tweetDate = parseTwitterDate(tweet.created_at);
    if (tweetDate) {
      const tweetET = getETComponents(tweetDate);
      const tweetStr = `${tweetET.year}-${String(
        tweetET.month + 1
      ).padStart(2, "0")}-${String(tweetET.day).padStart(2, "0")}`;
      return tweetStr === todayStr;
    }
    return false;
  });

  debugLog(
    `Today's tweets (${todayStr}):`,
    todayTweets.length,
    todayTweets.slice(0, 3)
  );

  // Debug: Show date range
  if (data.length > 0) {
    const sampleDate = data[0].created_at
      ? data[0].created_at.split(",")[0]
      : "";
    const sampleCount = data.filter(
      (tweet) => tweet.created_at && tweet.created_at.includes(sampleDate)
    ).length;
    debugLog(`Sample date (${sampleDate}) tweets:`, sampleCount);

    const firstTweet = data[0];
    const lastTweet = data[data.length - 1];
    if (firstTweet && lastTweet) {
      const firstDate = parseTwitterDate(firstTweet.created_at);
      const lastDate = parseTwitterDate(lastTweet.created_at);
      if (firstDate && lastDate) {
        const firstET = getETComponents(firstDate);
        const lastET = getETComponents(lastDate);
        debugLog("Tweet date range:", {
          first: `${firstET.year}-${firstET.month + 1}-${firstET.day} ${
            firstET.hour
          }:${firstET.minute}`,
          last: `${lastET.year}-${lastET.month + 1}-${lastET.day} ${
            lastET.hour
          }:${lastET.minute}`,
          totalTweets: data.length,
        });
      }
    }
  }

  return data;
}
