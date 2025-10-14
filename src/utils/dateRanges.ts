/**
 * Date range utilities for week selection
 * Ported and improved from vanilla JS controls.js
 */

import { debugLog } from '@/config/constants';
import { Tweet } from '@/types';
import { getETComponents, parseETNoonDate } from '@/utils/dateTime';

export interface WeekRange {
  value: string;
  label: string;
  mobileLabel: string;
  startDate: Date;
  endDate: Date;
  isOngoing: boolean;
  type: 'friday' | 'tuesday';
}

/**
 * Generate week ranges from tweet data
 * Supports both Friday-to-Friday and Tuesday-to-Tuesday patterns
 */
export function generateWeekRanges(tweets: Tweet[]): WeekRange[] {
  if (tweets.length === 0) return [];

  const startTime = performance.now();
  const ranges: WeekRange[] = [];

  // Get date range from tweets
  const dates = tweets.map((tweet) => tweet.date).sort((a, b) => a.getTime() - b.getTime());

  if (dates.length === 0) return [];

  const minDate = dates[0];
  const maxDate = dates[dates.length - 1];
  const now = new Date();
  const currentET = getETComponents(now);

  debugLog(`[generateWeekRanges] Tweet date range: ${minDate.toISOString()} to ${maxDate.toISOString()}`);
  debugLog(`[generateWeekRanges] Total tweets: ${tweets.length}`);

  // Find the most recent Friday and Tuesday
  const recentFriday = findRecentDayOfWeek(now, 5); // 5 = Friday
  const recentTuesday = findRecentDayOfWeek(now, 2); // 2 = Tuesday

  // Add current/upcoming week ranges
  const fridayRange = getCurrentWeekRange(recentFriday, 5, currentET);
  const tuesdayRange = getCurrentWeekRange(recentTuesday, 2, currentET);

  // Collect all ranges (current + past 12 weeks)
  const allRanges: Array<{ start: Date; end: Date; type: 'friday' | 'tuesday' }> = [];

  // Process friday ranges
  allRanges.push(...generateRangesForDay(fridayRange.start, minDate, maxDate, 'friday'));

  // Process tuesday ranges
  allRanges.push(...generateRangesForDay(tuesdayRange.start, minDate, maxDate, 'tuesday'));

  debugLog(`[generateWeekRanges] Total allRanges before filter: ${allRanges.length}`);

  // Filter and format ranges
  const filteredRanges = allRanges.filter((range) => {
    // Only include ranges that have started (noon ET on start date)
    const startET = getETComponents(range.start);
    const startDateStr = formatDateString(startET);
    const rangeStartNoon = parseETNoonDate(startDateStr);
    const hasStarted = rangeStartNoon <= now;

    if (!hasStarted) {
      debugLog(`[generateWeekRanges] Filtered out future range: ${range.start.toISOString()}`);
    }

    return hasStarted;
  });

  debugLog(`[generateWeekRanges] Ranges after filter: ${filteredRanges.length}`);

  filteredRanges
    .sort((a, b) => b.start.getTime() - a.start.getTime())
    .forEach((range) => {
      const startET = getETComponents(range.start);
      const endET = getETComponents(range.end);

      const startDateStr = formatDateString(startET);
      const endDateStr = formatDateString(endET);
      const endDateNoon = parseETNoonDate(endDateStr);

      const isOngoing = endDateNoon > now;

      ranges.push({
        value: `${startDateStr}|${endDateStr}|${range.type}`,
        label: formatRangeLabel(range.start, range.end, false),
        mobileLabel: formatRangeLabel(range.start, range.end, true),
        startDate: range.start,
        endDate: range.end,
        isOngoing,
        type: range.type,
      });
    });

  debugLog(
    `Generated ${ranges.length} week ranges in ${(performance.now() - startTime).toFixed(2)}ms`,
  );
  return ranges;
}

/**
 * Find the most recent occurrence of a specific day of week
 */
function findRecentDayOfWeek(from: Date, targetDayOfWeek: number): Date {
  const result = new Date(from);
  while (getETComponents(result).dayOfWeek !== targetDayOfWeek) {
    result.setTime(result.getTime() - 24 * 60 * 60 * 1000);
  }
  return result;
}

/**
 * Get current week range, accounting for noon ET cutoff
 */
function getCurrentWeekRange(
  recentDay: Date,
  dayOfWeek: number,
  currentET: ReturnType<typeof getETComponents>,
): { start: Date; end: Date } {
  const start = new Date(recentDay);
  const end = new Date(recentDay);
  end.setTime(end.getTime() + 7 * 24 * 60 * 60 * 1000);

  // If we're on the day and past noon ET, move to next week
  if (currentET.dayOfWeek === dayOfWeek && currentET.hour >= 12) {
    start.setTime(start.getTime() + 7 * 24 * 60 * 60 * 1000);
    end.setTime(end.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  return { start, end };
}

/**
 * Generate ranges for a specific day pattern
 */
function generateRangesForDay(
  startDay: Date,
  minDate: Date,
  maxDate: Date,
  type: 'friday' | 'tuesday',
): Array<{ start: Date; end: Date; type: 'friday' | 'tuesday' }> {
  const ranges: Array<{ start: Date; end: Date; type: 'friday' | 'tuesday' }> = [];

  // Add current/upcoming range
  const endDay = new Date(startDay);
  endDay.setTime(endDay.getTime() + 7 * 24 * 60 * 60 * 1000);
  ranges.push({ start: new Date(startDay), end: new Date(endDay), type });

  // Add past 12 weeks (to show more historical data)
  let pastDay = new Date(startDay);
  debugLog(`[generateRangesForDay] Starting from ${startDay.toISOString()} for type: ${type}`);

  for (let i = 0; i < 12; i++) {
    const end = new Date(pastDay);
    pastDay = new Date(pastDay);
    pastDay.setTime(pastDay.getTime() - 7 * 24 * 60 * 60 * 1000);

    debugLog(`[generateRangesForDay] Week ${i + 1}: ${pastDay.toISOString()} to ${end.toISOString()}`);

    // Remove the date check to show all past weeks regardless of data availability
    // This allows showing empty weeks in the dropdown
    ranges.push({ start: new Date(pastDay), end: new Date(end), type });
  }

  debugLog(`[generateRangesForDay] Generated ${ranges.length} ranges for ${type}`);


  return ranges;
}

/**
 * Format date components to YYYY-MM-DD string
 */
function formatDateString(et: ReturnType<typeof getETComponents>): string {
  const year = et.year;
  const month = String(et.month + 1).padStart(2, '0');
  const day = String(et.day).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format range label for display
 */
function formatRangeLabel(start: Date, end: Date, isMobile: boolean): string {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const startET = getETComponents(start);
  const endET = getETComponents(end);

  const startLabel = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const endLabel = end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const startDay = dayNames[startET.dayOfWeek] ?? '';
  const endDay = dayNames[endET.dayOfWeek] ?? '';

  // If start and end days are the same (e.g., Fri-Fri), show only one day
  const dayLabel = startDay === endDay ? startDay : `${startDay}-${endDay}`;

  if (isMobile) {
    return `${startLabel.replace('.', '')} - ${endLabel.replace('.', '')} (${startDay.slice(0, 3)})`;
  }

  return `${startLabel} - ${endLabel} (${dayLabel})`;
}

/**
 * Find the default range to select (earliest ongoing or most recent)
 */
export function getDefaultWeekRange(ranges: WeekRange[]): WeekRange | null {
  if (ranges.length === 0) return null;

  // Find ongoing ranges
  const ongoingRanges = ranges.filter((r) => r.isOngoing);

  if (ongoingRanges.length > 0) {
    // Return the one that will end soonest
    return ongoingRanges.reduce((earliest, current) =>
      current.endDate < earliest.endDate ? current : earliest,
    );
  }

  // No ongoing ranges, return most recent
  return ranges[0] ?? null;
}
