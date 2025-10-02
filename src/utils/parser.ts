/**
 * CSV Parser for tweet data
 * Handles parsing of X Tracker CSV format
 */

import { debugLog } from '@/config/constants';
import { Tweet } from '@/types';
import { getETComponents, parseTwitterDate } from '@/utils/dateTime';

/**
 * Parse CSV text into tweet objects
 * @param csvText - Raw CSV text from X Tracker API or file
 * @param weeksToKeep - Number of weeks of data to keep (default: 5)
 * @returns Array of parsed tweet objects
 */
export function parseCSV(csvText: string, weeksToKeep: number = 5): Tweet[] {
  try {
    console.log('parseCSV: Input length:', csvText.length);
    console.log('parseCSV: First 200 chars:', csvText.substring(0, 200));

    const tweets: Tweet[] = [];

    // Find all lines ending with EDT or EST to avoid multiline parsing issues
    const lines = csvText.split('\n');
    const tweetLines: string[] = [];

    lines.forEach((line) => {
      if (line.endsWith('EDT"') || line.endsWith('EST"')) {
        tweetLines.push(line);
      }
    });

    console.log(`parseCSV: Found ${tweetLines.length} tweets by EDT/EST pattern`);

    // Calculate cutoff date
    const now = new Date();
    const cutoffDate = new Date(now);
    cutoffDate.setTime(cutoffDate.getTime() - weeksToKeep * 7 * 24 * 60 * 60 * 1000);

    console.log('parseCSV: Cutoff date:', cutoffDate.toISOString());

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
            beforeTime.substring(lastQuoteBeforeTime + 1) + (edtIndex > 0 ? 'EDT' : 'EST');

          // Smart year detection
          const monthMatch = dateTimeStr.match(/^(\w+) (\d+)/);
          if (monthMatch) {
            const monthNames = [
              'Jan',
              'Feb',
              'Mar',
              'Apr',
              'May',
              'Jun',
              'Jul',
              'Aug',
              'Sep',
              'Oct',
              'Nov',
              'Dec',
            ];
            const monthIndex = monthNames.indexOf(monthMatch[1]);

            // Detect year change when going backwards
            if (monthIndex > lastMonth && lastMonth !== 13) {
              currentYear--;
            }
            lastMonth = monthIndex;
          }

          // Create date string with estimated year
          const dateWithYear = dateTimeStr.replace(/^(\w+ \d+)/, `$1, ${currentYear}`);

          // Parse and check if within range
          const tweetDate = parseTwitterDate(dateWithYear);

          // Debug logging for first few tweets
          if (tweets.length < 5) {
            console.log('Parsing tweet:', {
              original: dateTimeStr,
              withYear: dateWithYear,
              parsed: tweetDate,
              isoString: tweetDate ? tweetDate.toISOString() : 'null',
            });
          }

          if (tweetDate && tweetDate >= cutoffDate) {
            // Extract id and text from the line
            const parts = line.split('","');
            const id = parts[0]?.replace(/^"|"$/g, '') || `tweet_${tweets.length}`;
            const text = parts[1] || '';

            // Add to beginning since we're processing in reverse
            tweets.unshift({
              id,
              text,
              created_at: dateWithYear,
              date: tweetDate,
            });
          } else if (tweetDate && tweetDate < cutoffDate) {
            // Stop processing if we've gone too far back
            break;
          }
        }
      }
    }

    console.log(`parseCSV: Parsed ${tweets.length} tweets within date range`);

    // Debug: Check for today's tweets
    const today = new Date();
    const todayET = getETComponents(today);
    const todayStr = `${todayET.year}-${String(todayET.month + 1).padStart(2, '0')}-${String(todayET.day).padStart(2, '0')}`;

    const todayTweets = tweets.filter((tweet) => {
      const tweetDate = tweet.date;
      if (tweetDate) {
        const tweetET = getETComponents(tweetDate);
        const tweetStr = `${tweetET.year}-${String(tweetET.month + 1).padStart(2, '0')}-${String(tweetET.day).padStart(2, '0')}`;
        return tweetStr === todayStr;
      }
      return false;
    });

    console.log(`Today's tweets (${todayStr}):`, todayTweets.length, todayTweets.slice(0, 3));

    // Debug: Show date range
    if (tweets.length > 0) {
      const firstTweet = tweets[0];
      const lastTweet = tweets[tweets.length - 1];
      if (firstTweet && lastTweet) {
        const firstDate = firstTweet.date;
        const lastDate = lastTweet.date;
        if (firstDate && lastDate) {
          const firstET = getETComponents(firstDate);
          const lastET = getETComponents(lastDate);
          console.log('Tweet date range:', {
            first: `${firstET.year}-${firstET.month + 1}-${firstET.day} ${firstET.hour}:${firstET.minute}`,
            last: `${lastET.year}-${lastET.month + 1}-${lastET.day} ${lastET.hour}:${lastET.minute}`,
            totalTweets: tweets.length,
          });
        }
      }
    }

    // Don't sort - keep the order as parsed (newest first already)
    return tweets;
  } catch (error) {
    console.error('Failed to parse CSV:', error);
    debugLog('CSV parsing error:', error);
    return [];
  }
}

/**
 * Export tweets to CSV format
 * @param tweets - Array of tweets to export
 * @returns CSV string
 */
export function exportToCSV(tweets: Tweet[]): string {
  // Create CSV header
  let csv = 'id,text,created_at\n';

  // Add each tweet as a row
  tweets.forEach((tweet) => {
    const id = tweet.id || '';
    const text = (tweet.text || '').replace(/"/g, '""'); // Escape quotes
    const created_at = tweet.created_at || '';

    csv += `"${id}","${text}","${created_at}"\n`;
  });

  return csv;
}
