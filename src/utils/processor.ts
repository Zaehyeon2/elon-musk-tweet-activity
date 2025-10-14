/**
 * Data processor for transforming tweet data into heatmap format
 * Matches vanilla JS processor.js functionality
 */

import { DAYS_IN_WEEK, debugLog, HOURS_IN_DAY } from '@/config/constants';
import { HeatmapData, Tweet } from '@/types';
import { formatHour, getETComponents, getWeekRangeLabel, parseETNoonDate } from '@/utils/dateTime';

/**
 * Generate day labels for the heatmap
 * @param startDate - Start date (Friday noon)
 * @param dayCount - Number of days to generate
 * @returns Array of day labels
 */
export function generateDayLabels(startDate: Date, dayCount: number): string[] {
  const days: string[] = [];
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  for (let i = 0; i < dayCount; i++) {
    const currentDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const etComponents = getETComponents(currentDate);
    const dayOfWeek = etComponents.dayOfWeek;
    days.push(dayNames[dayOfWeek]);
  }

  return days;
}

/**
 * Process tweet data into heatmap grid format
 * @param tweets - Array of tweet objects
 * @param startDate - Start date string (YYYY-MM-DD) or Date object
 * @param endDate - End date string (YYYY-MM-DD) or Date object
 * @returns Processed heatmap data
 */
export function processData(
  tweets: Tweet[],
  startDate: Date | string,
  endDate: Date | string,
): HeatmapData {
  const hours = Array.from({ length: 24 }, (_, i) => formatHour(i));

  let validTweets = 0;

  // Parse dates as ET noon (12:00 PM ET)
  let actualStart: Date | null = null;
  let actualEnd: Date | null = null;

  if (startDate && endDate) {
    // Handle both string and Date inputs
    if (typeof startDate === 'string') {
      actualStart = parseETNoonDate(startDate);
    } else {
      actualStart = startDate;
    }

    if (typeof endDate === 'string') {
      actualEnd = parseETNoonDate(endDate);
    } else {
      actualEnd = endDate;
    }
  }

  // Determine the actual date range and days to show
  let days: string[];
  let grid: number[][];

  if (actualStart && actualEnd) {
    // Always 8 days for noon-to-noon ranges
    const dayCount = 8;

    // Generate day labels based on actual dates
    days = generateDayLabels(actualStart, dayCount);

    debugLog('=== DATE RANGE DEBUG ===');
    debugLog('Input startDate:', startDate);
    debugLog('Input endDate:', endDate);
    debugLog('Parsed start:', actualStart);
    debugLog('Parsed end:', actualEnd);
    debugLog('Day count:', dayCount);
    debugLog('Generated days for range:', days);
    const startET = getETComponents(actualStart);
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    debugLog('Start date day of week:', startET.dayOfWeek, '(' + dayNames[startET.dayOfWeek] + ')');

    // Initialize grid based on actual day count
    grid = Array(24)
      .fill(null)
      .map(() => Array(days.length).fill(0) as number[]);
  } else {
    // Default to full week starting Monday
    days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    grid = Array(24)
      .fill(null)
      .map(() => Array(7).fill(0) as number[]);
  }

  let totalProcessed = 0;
  let validDates = 0;
  let filteredOut = 0;
  let noonFiltered = 0;

  // Convert dates to YYYY-MM-DD strings for comparison if needed
  const startDateStr =
    typeof startDate === 'string'
      ? startDate
      : actualStart
        ? `${getETComponents(actualStart).year}-${String(getETComponents(actualStart).month + 1).padStart(2, '0')}-${String(getETComponents(actualStart).day).padStart(2, '0')}`
        : '';
  const endDateStr =
    typeof endDate === 'string'
      ? endDate
      : actualEnd
        ? `${getETComponents(actualEnd).year}-${String(getETComponents(actualEnd).month + 1).padStart(2, '0')}-${String(getETComponents(actualEnd).day).padStart(2, '0')}`
        : '';

  tweets.forEach((tweet) => {
    totalProcessed++;
    const date = tweet.date; // Already parsed as Date object
    validDates++;

    // Filter out dates that are more than 1 day in the future
    // This allows for timezone differences while still filtering obvious errors
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setTime(tomorrow.getTime() + 24 * 60 * 60 * 1000);
    if (date > tomorrow) {
      filteredOut++;
      return;
    }

    // Apply date range and noon filtering
    if (actualStart && actualEnd && startDateStr && endDateStr) {
      // Create date strings for comparison (YYYY-MM-DD format)
      const tweetET = getETComponents(date);
      const tweetYear = tweetET.year;
      const tweetMonth = String(tweetET.month + 1).padStart(2, '0');
      const tweetDay = String(tweetET.day).padStart(2, '0');
      const tweetDateStr = `${tweetYear}-${tweetMonth}-${tweetDay}`;
      const tweetHour = tweetET.hour;

      // For start date: include only from noon onwards
      if (tweetDateStr === startDateStr) {
        if (tweetHour < 12) {
          noonFiltered++;
          return;
        }
      }
      // For dates before start date: exclude all
      else if (tweetDateStr < startDateStr) {
        filteredOut++;
        return;
      }

      // For end date (Friday): include only before noon
      if (tweetDateStr === endDateStr) {
        if (tweetHour >= 12) {
          noonFiltered++;
          return;
        }
      }
      // For dates after end date: exclude all
      else if (tweetDateStr > endDateStr) {
        filteredOut++;
        return;
      }
    }

    const dateET = getETComponents(date);
    const hour = dateET.hour;

    if (actualStart && actualEnd) {
      // Calculate which day column this date falls into
      // Use ET components for accurate day calculation
      const tweetET = getETComponents(date);
      const startET = getETComponents(actualStart);

      // Create YYYY-MM-DD strings for both dates
      const tweetDateStr = `${tweetET.year}-${String(tweetET.month + 1).padStart(
        2,
        '0',
      )}-${String(tweetET.day).padStart(2, '0')}`;
      const startDateStr = `${startET.year}-${String(startET.month + 1).padStart(
        2,
        '0',
      )}-${String(startET.day).padStart(2, '0')}`;

      // Create dates at ET noon for accurate day difference
      const tweetDayNoon = parseETNoonDate(tweetDateStr);
      const startDayNoon = parseETNoonDate(startDateStr);

      // Adjust to midnight by subtracting 12 hours from noon
      const tweetDayStart = new Date(tweetDayNoon.getTime() - 12 * 60 * 60 * 1000);
      const startDayStart = new Date(startDayNoon.getTime() - 12 * 60 * 60 * 1000);

      const daysDiff = Math.floor(
        (tweetDayStart.getTime() - startDayStart.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Allow daysDiff from 0 to 7 (8 days total)
      if (daysDiff >= 0 && daysDiff < days.length) {
        grid[hour][daysDiff]++;
        validTweets++;
      }
    } else {
      // Default behavior - map to day of week
      const dateET = getETComponents(date);
      const dayOfWeek = dateET.dayOfWeek; // 0 = Sunday, 1 = Monday, etc.
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to Monday = 0

      if (adjustedDay >= 0 && adjustedDay < days.length) {
        grid[hour][adjustedDay]++;
        validTweets++;
      }
    }
  });

  // Calculate totals excluding disabled cells (noon rules)
  const totals = days.map((_, dayIndex) => {
    let total = 0;
    for (let hourIndex = 0; hourIndex < 24; hourIndex++) {
      // Skip disabled cells based on noon rules
      if (dayIndex === 0 && hourIndex < 12) continue; // First Friday before noon
      if (dayIndex === days.length - 1 && hourIndex >= 12) continue; // Last Friday from noon
      total += grid[hourIndex][dayIndex];
    }
    return total;
  });

  const maxValue = Math.max(...grid.flat());
  const peakHourIndex = grid.findIndex((row) => row.includes(maxValue));
  const peakHour = formatHour(peakHourIndex);
  const mostActiveDayIndex = totals.indexOf(Math.max(...totals));
  const mostActiveDay = days[mostActiveDayIndex];

  // Debug logging
  debugLog('=== PROCESSING SUMMARY ===');
  debugLog('Total tweets processed:', totalProcessed);
  debugLog('Valid dates parsed:', validDates);
  debugLog('Filtered out by date range:', filteredOut);
  debugLog('Filtered out by noon rule:', noonFiltered);
  debugLog('Final valid tweets:', validTweets);
  if (actualStart && actualEnd) {
    const startET = getETComponents(actualStart);
    const endET = getETComponents(actualEnd);
    debugLog('Date range:', {
      start: `${startET.year}-${startET.month + 1}-${startET.day}`,
      end: `${endET.year}-${endET.month + 1}-${endET.day}`,
      startDate: startDateStr,
      endDate: endDateStr,
    });
  }

  const dateRange = {
    start: actualStart!,
    end: actualEnd!,
    type: 'current' as const,
    label: actualStart && actualEnd ? getWeekRangeLabel(actualStart, actualEnd) : '',
  };

  return {
    grid,
    hours,
    days,
    totals,
    current: validTweets,
    maxValue,
    peakHour,
    mostActiveDay,
    dateRange,
  };
}

/**
 * Check if a cell should be disabled based on noon boundaries
 * @param dayIndex - Day index (0-7)
 * @param hourIndex - Hour index (0-23)
 * @returns True if cell should be disabled
 */
export function isCellDisabled(dayIndex: number, hourIndex: number): boolean {
  // First day (Friday): disable before noon
  if (dayIndex === 0 && hourIndex < 12) {
    return true;
  }

  // Last day (Friday): disable from noon onwards
  if (dayIndex === 7 && hourIndex >= 12) {
    return true;
  }

  return false;
}

/**
 * Check if a cell represents the current hour
 * @param day - Day label
 * @param hour - Hour index
 * @param currentDate - Current date/time
 * @param startDate - Start date of the range
 * @returns True if this is the current hour
 */
export function isCurrentHour(
  day: string,
  hour: number,
  currentDate: Date = new Date(),
  startDate?: Date,
): boolean {
  const currentET = getETComponents(currentDate);
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const currentDayName = dayNames[currentET.dayOfWeek];

  // Check if same day and hour - regardless of date range
  // This shows current time indicator on all date ranges
  return currentDayName === day && currentET.hour === hour;
}

/**
 * Check if a cell represents future time
 * @param dayIndex - Day index in the grid
 * @param hourIndex - Hour index in the grid
 * @param startDate - Start date of the range
 * @returns True if the cell represents future time
 */
export function isFutureTime(dayIndex: number, hourIndex: number, startDate: Date): boolean {
  const now = new Date();
  const nowET = getETComponents(now);

  // Calculate the date for this cell
  const cellDate = new Date(startDate.getTime() + dayIndex * 24 * 60 * 60 * 1000);
  const cellET = getETComponents(cellDate);

  // Create comparable date strings
  const nowDateStr = `${nowET.year}-${String(nowET.month + 1).padStart(2, '0')}-${String(nowET.day).padStart(2, '0')}`;
  const cellDateStr = `${cellET.year}-${String(cellET.month + 1).padStart(2, '0')}-${String(cellET.day).padStart(2, '0')}`;

  // If cell is on a future day, it's future
  if (cellDateStr > nowDateStr) {
    return true;
  }

  // If cell is on the same day but future hour, it's future
  if (cellDateStr === nowDateStr && hourIndex > nowET.hour) {
    return true;
  }

  return false;
}

/**
 * Calculate statistics from heatmap data
 * @param data - Heatmap data
 * @returns Statistics object
 */
export function calculateStatistics(data: HeatmapData) {
  const { grid, totals } = data;

  // Calculate hourly average
  const hourlyTotals: number[] = Array(HOURS_IN_DAY).fill(0) as number[];
  for (let hour = 0; hour < HOURS_IN_DAY; hour++) {
    for (let day = 0; day < DAYS_IN_WEEK; day++) {
      if (!isCellDisabled(day, hour)) {
        hourlyTotals[hour] += grid[hour]?.[day] ?? 0;
      }
    }
  }

  const validDays = totals.filter((_, i) => i > 0 && i < 7).length || 1;
  const hourlyAverage = hourlyTotals.map((total) => total / validDays);

  // Calculate daily average
  const dailyAverage = data.current / validDays;

  // Find quiet hours (least active)
  const quietHours: number[] = [];
  const minHourly = Math.min(...hourlyTotals.filter((h) => h > 0));
  hourlyTotals.forEach((total, hour) => {
    if (total === minHourly) {
      quietHours.push(hour);
    }
  });

  return {
    hourlyAverage,
    dailyAverage,
    quietHours,
    totalDays: validDays,
  };
}
