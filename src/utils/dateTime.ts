/**
 * Date and Time utilities for ET (Eastern Time) timezone handling
 * CRITICAL: All date/time operations MUST use ET timezone
 */

import { debugLog, MAX_CACHE_SIZE } from '@/config/constants';
import { ETComponents } from '@/types';

// Cache for parsed dates and ET components
const dateCache = new Map<string, Date | null>();
const etComponentsCache = new Map<number, ETComponents>();

// ET timezone formatter
const etFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  weekday: 'short',
  hour12: false,
});

/**
 * Parse Twitter date string to Date object
 * Format: "MMM DD, HH:MM:SS AM/PM EDT/EST" or "MMM DD, YYYY, HH:MM:SS AM/PM EDT/EST"
 * Handles EDT (UTC-4) and EST (UTC-5) timezones
 */
export function parseTwitterDate(dateStr: string): Date | null {
  // Check cache first
  if (dateCache.has(dateStr)) {
    return dateCache.get(dateStr)!;
  }

  // LRU cache eviction
  if (dateCache.size >= MAX_CACHE_SIZE) {
    const firstKey = dateCache.keys().next().value;
    if (firstKey) dateCache.delete(firstKey);
  }

  try {
    let cleanDate = dateStr.trim();
    const isEDT = cleanDate.includes(' EDT');
    const isEST = cleanDate.includes(' EST');

    // Remove timezone suffix
    cleanDate = cleanDate.replace(' EDT', '').replace(' EST', '');

    // Add current year if missing
    if (!cleanDate.match(/\b20\d{2}\b/)) {
      const parts = cleanDate.split(', ');
      if (parts.length >= 2) {
        const nowET = getETComponents(new Date());
        const currentYear = nowET.year;
        cleanDate = parts[0] + ', ' + currentYear + ', ' + parts.slice(1).join(', ');
      }
    }

    // Parse the date components
    const dateMatch = cleanDate.match(
      /^(\w+)\s+(\d+),\s+(\d{4}),\s+(\d{1,2}):(\d{2}):(\d{2})\s+(AM|PM)$/,
    );

    if (!dateMatch) {
      debugLog('Failed to match date pattern:', cleanDate);
      dateCache.set(dateStr, null);
      return null;
    }

    const [_, monthStr, dayStr, yearStr, hourStr, minuteStr, secondStr, ampm] = dateMatch;

    // Convert month name to number
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
    const month = monthNames.indexOf(monthStr.substring(0, 3)) + 1; // 1-based month
    if (month === 0) {
      debugLog('Invalid month:', monthStr);
      dateCache.set(dateStr, null);
      return null;
    }

    const day = parseInt(dayStr);
    const year = parseInt(yearStr);
    let hour = parseInt(hourStr);
    const minute = parseInt(minuteStr);
    const second = parseInt(secondStr);

    // Convert 12-hour to 24-hour format
    if (ampm === 'PM' && hour !== 12) {
      hour += 12;
    } else if (ampm === 'AM' && hour === 12) {
      hour = 0;
    }

    // Create UTC date from ET components
    // EDT is UTC-4, EST is UTC-5
    const utcOffsetHours = isEDT ? 4 : 5;

    const utcDate = new Date(
      Date.UTC(
        year,
        month - 1, // JavaScript months are 0-based
        day,
        hour + utcOffsetHours, // Convert ET hour to UTC
        minute,
        second,
      ),
    );

    // Debug log for random sample
    if (Math.random() < 0.01) {
      debugLog('parseTwitterDate:', {
        input: dateStr,
        parsed: cleanDate,
        isEDT,
        components: { year, month, day, hour, minute, second, ampm },
        utcDate: utcDate.toISOString(),
        etCheck: getETComponents(utcDate),
      });
    }

    dateCache.set(dateStr, utcDate);
    return utcDate;
  } catch (error) {
    debugLog('Date parsing error:', error, 'for:', dateStr);
    dateCache.set(dateStr, null);
    return null;
  }
}

/**
 * Get ET (Eastern Time) components from a Date object
 * This is the ONLY function that should be used for timezone-aware operations
 * @param date - Date object to extract ET components from
 * @returns Object with year, month, day, hour, minute, second, dayOfWeek in ET
 */
export function getETComponents(date: Date): ETComponents {
  const cacheKey = date.getTime();
  if (etComponentsCache.has(cacheKey)) {
    return etComponentsCache.get(cacheKey)!;
  }

  // LRU cache eviction
  if (etComponentsCache.size >= MAX_CACHE_SIZE) {
    const firstKey = etComponentsCache.keys().next().value;
    if (firstKey !== undefined) etComponentsCache.delete(firstKey);
  }

  const parts = etFormatter.formatToParts(date);
  const result: Record<string, string> = {};
  parts.forEach((part) => {
    if (part.type !== 'literal') {
      result[part.type] = part.value;
    }
  });

  // Convert weekday name to number
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  const components: ETComponents = {
    year: parseInt(result.year || '0'),
    month: parseInt(result.month || '1') - 1, // JS months are 0-indexed
    day: parseInt(result.day || '1'),
    hour: parseInt(result.hour || '0'),
    minute: parseInt(result.minute || '0'),
    second: parseInt(result.second || '0'),
    dayOfWeek: weekdayMap[result.weekday || 'Sun'] || 0,
  };

  etComponentsCache.set(cacheKey, components);
  return components;
}

/**
 * Create a date at ET noon from date components
 * @param year - Year
 * @param month - Month (1-12)
 * @param day - Day of month
 * @returns Date object at ET noon
 */
export function createETNoonDate(year: number, month: number, day: number): Date {
  // Check if date is in EDT or EST
  // EDT: Second Sunday in March to first Sunday in November (roughly)
  // Simplified check: March 14 - November 7 is usually EDT
  const isEDT =
    (month > 3 && month < 11) || (month === 3 && day >= 14) || (month === 11 && day <= 7);

  // ET noon in UTC:
  // EDT (UTC-4): 12:00 PM ET = 16:00 UTC
  // EST (UTC-5): 12:00 PM ET = 17:00 UTC
  const utcHour = isEDT ? 16 : 17;

  return new Date(Date.UTC(year, month - 1, day, utcHour, 0, 0));
}

/**
 * Parse YYYY-MM-DD string and create ET noon date
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Date object at ET noon
 */
export function parseETNoonDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return createETNoonDate(year, month, day);
}

/**
 * Format hour in 12-hour AM/PM format
 * @param hour - Hour (0-23)
 * @returns Formatted hour (e.g., "12 AM", "1 PM")
 */
export function formatHour(hour: number): string {
  const h = hour % 12 || 12;
  const period = hour < 12 ? 'AM' : 'PM';
  return `${h} ${period}`;
}

/**
 * Get day name from day of week number
 * @param dayOfWeek - Day of week (0=Sunday, 6=Saturday)
 * @returns Three-letter day name
 */
export function getDayName(dayOfWeek: number): string {
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  return days[dayOfWeek] ?? 'UNK';
}

/**
 * Check if a date is in the future
 * @param date - Date to check
 * @returns True if the date is in the future
 */
export function isFuture(date: Date): boolean {
  return date.getTime() > Date.now();
}

/**
 * Check if two dates are the same day in ET
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if both dates are the same day in ET
 */
export function isSameETDay(date1: Date, date2: Date): boolean {
  const et1 = getETComponents(date1);
  const et2 = getETComponents(date2);
  return et1.year === et2.year && et1.month === et2.month && et1.day === et2.day;
}

/**
 * Get the start of the current week (Friday noon) in ET
 * @param now - Current date/time
 * @returns Date object at the start of the current week (Friday noon ET)
 */
export function getCurrentWeekStart(now: Date = new Date()): Date {
  const et = getETComponents(now);

  // Find the most recent Friday
  let daysToSubtract = et.dayOfWeek >= 5 ? et.dayOfWeek - 5 : et.dayOfWeek + 2;

  // If it's Friday but before noon, go to previous Friday
  if (et.dayOfWeek === 5 && et.hour < 12) {
    daysToSubtract = 7;
  }

  const fridayDate = new Date(now.getTime() - daysToSubtract * 24 * 60 * 60 * 1000);
  const fridayET = getETComponents(fridayDate);

  return createETNoonDate(fridayET.year, fridayET.month, fridayET.day);
}

/**
 * Get week range label for display
 * @param startDate - Start date of the range
 * @param endDate - End date of the range
 * @returns Formatted range label (e.g., "DEC 6-13")
 */
export function getWeekRangeLabel(startDate: Date, endDate: Date): string {
  const startET = getETComponents(startDate);
  const endET = getETComponents(endDate);

  const months = [
    'JAN',
    'FEB',
    'MAR',
    'APR',
    'MAY',
    'JUN',
    'JUL',
    'AUG',
    'SEP',
    'OCT',
    'NOV',
    'DEC',
  ];
  const startMonth = months[startET.month] ?? 'UNK';
  const endMonth = months[endET.month] ?? 'UNK';

  if (startET.month === endET.month) {
    return `${startMonth} ${startET.day}-${endET.day}`;
  } else {
    return `${startMonth} ${startET.day} - ${endMonth} ${endET.day}`;
  }
}

/**
 * Clear all date caches
 */
export function clearDateCaches(): void {
  dateCache.clear();
  etComponentsCache.clear();
}
