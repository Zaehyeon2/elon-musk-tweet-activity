/**
 * Parser for Polymarket JSON payload
 */

import { debugLog } from '@/config/constants';
import { PolymarketPost, Tweet } from '@/types';
import { getETComponents } from '@/utils/dateTime';

const MILLISECONDS_IN_WEEK = 7 * 24 * 60 * 60 * 1000;

/**
 * Convert Polymarket posts into Tweet objects used by the app
 * @param posts - Polymarket JSON payload
 * @param weeksToKeep - Number of weeks of data to keep (default: 12)
 * @returns Array of parsed tweet objects
 */
export function parsePolymarketPosts(
  posts: PolymarketPost[],
  weeksToKeep: number = 12,
): Tweet[] {
  try {
    debugLog('parsePolymarketPosts: Input count:', posts.length);
    debugLog(`parsePolymarketPosts: weeksToKeep parameter = ${weeksToKeep}`);

    const now = new Date();
    const cutoffDate = new Date(now);
    cutoffDate.setTime(cutoffDate.getTime() - weeksToKeep * MILLISECONDS_IN_WEEK);

    const tweets = posts
      .map((post, index) => {
        if (!post?.createdAt || !post?.content) {
          return null;
        }

        const createdDate = new Date(post.createdAt);
        if (Number.isNaN(createdDate.getTime())) {
          debugLog('parsePolymarketPosts: Skipping post with invalid date:', post.createdAt);
          return null;
        }

        if (createdDate < cutoffDate) {
          return null;
        }

        const tweet: Tweet = {
          id: post.id || post.platformId || `tweet_${index}`,
          text: post.content,
          created_at: post.createdAt,
          date: createdDate,
          platformId: post.platformId,
          importedAt: post.importedAt,
          metrics: post.metrics,
        };

        return tweet;
      })
      .filter(Boolean) as Tweet[];

    tweets.sort((a, b) => a.date.getTime() - b.date.getTime());

    debugLog(`parsePolymarketPosts: Parsed ${tweets.length} tweets within date range`);

    if (tweets.length > 0) {
      const firstTweet = tweets[0];
      const lastTweet = tweets[tweets.length - 1];

      const firstET = getETComponents(firstTweet.date);
      const lastET = getETComponents(lastTweet.date);

      debugLog('Tweet date range:', {
        first: `${firstET.year}-${firstET.month + 1}-${firstET.day} ${firstET.hour}:${firstET.minute}`,
        last: `${lastET.year}-${lastET.month + 1}-${lastET.day} ${lastET.hour}:${lastET.minute}`,
        totalTweets: tweets.length,
      });
    }

    return tweets;
  } catch (error) {
    console.error('Failed to parse Polymarket posts:', error);
    debugLog('Polymarket parsing error:', error);
    return [];
  }
}

/**
 * Helper to parse a JSON string into tweets (supports raw array or { data: [] })
 */
export function parsePolymarketJson(jsonText: string, weeksToKeep: number = 12): Tweet[] {
  try {
    const parsed = JSON.parse(jsonText) as unknown;
    const posts = Array.isArray(parsed)
      ? (parsed as PolymarketPost[])
      : typeof parsed === 'object' && parsed !== null && Array.isArray((parsed as { data?: unknown }).data)
        ? ((parsed as { data: PolymarketPost[] }).data)
        : [];

    if (!Array.isArray(posts) || posts.length === 0) {
      debugLog('parsePolymarketJson: No posts found in JSON payload');
      return [];
    }

    return parsePolymarketPosts(posts, weeksToKeep);
  } catch (error) {
    console.error('Failed to parse Polymarket JSON text:', error);
    debugLog('Polymarket JSON parsing error:', error);
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

/**
 * Generate CSV from tweets (alias for exportToCSV for backward compatibility)
 * @param tweets - Array of tweets to export
 * @returns CSV string
 */
export function generateCSV(tweets: Tweet[]): string {
  return exportToCSV(tweets);
}
