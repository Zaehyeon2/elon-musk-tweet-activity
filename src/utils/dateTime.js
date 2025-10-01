/**
 * Date and time utilities with ET (Eastern Time) timezone handling
 */

import { MAX_CACHE_SIZE, debugLog } from '../config/constants.js';

// ET timezone formatter
const etFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  weekday: "short",
  hour12: false,
});

// Caches
const dateCache = new Map();
const etComponentsCache = new Map();

/**
 * Get ET date components efficiently with caching
 * @param {Date} date - Date object to convert
 * @returns {Object} ET components { year, month, day, hour, minute, second, dayOfWeek }
 */
export function getETComponents(date) {
  const cacheKey = date.getTime();
  if (etComponentsCache.has(cacheKey)) {
    return etComponentsCache.get(cacheKey);
  }

  // LRU cache eviction
  if (etComponentsCache.size >= MAX_CACHE_SIZE) {
    const firstKey = etComponentsCache.keys().next().value;
    etComponentsCache.delete(firstKey);
  }

  const parts = etFormatter.formatToParts(date);
  const result = {};
  parts.forEach((part) => {
    if (part.type !== "literal") {
      result[part.type] = part.value;
    }
  });

  // Convert weekday name to number
  const weekdayMap = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  const components = {
    year: parseInt(result.year),
    month: parseInt(result.month) - 1, // JS months are 0-indexed
    day: parseInt(result.day),
    hour: parseInt(result.hour),
    minute: parseInt(result.minute),
    second: parseInt(result.second),
    dayOfWeek: weekdayMap[result.weekday] || 0,
  };

  etComponentsCache.set(cacheKey, components);
  return components;
}

/**
 * Create a date at ET noon from date components
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @param {number} day - Day of month
 * @returns {Date} Date object at ET noon
 */
export function createETNoonDate(year, month, day) {
  // Check if date is in EDT or EST
  // EDT: Second Sunday in March to first Sunday in November (roughly)
  // Simplified check: March 14 - November 7 is usually EDT
  const isEDT =
    (month > 3 && month < 11) ||
    (month === 3 && day >= 14) ||
    (month === 11 && day <= 7);

  // ET noon in UTC:
  // EDT (UTC-4): 12:00 PM ET = 16:00 UTC
  // EST (UTC-5): 12:00 PM ET = 17:00 UTC
  const utcHour = isEDT ? 16 : 17;

  return new Date(Date.UTC(year, month - 1, day, utcHour, 0, 0));
}

/**
 * Parse YYYY-MM-DD string and create ET noon date
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {Date} Date object at ET noon
 */
export function parseETNoonDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return createETNoonDate(year, month, day);
}

/**
 * Parse Twitter date format and convert to Date object
 * @param {string} dateStr - Twitter date string (e.g., "MMM DD, YYYY, HH:MM:SS AM/PM EDT/EST")
 * @returns {Date|null} Parsed date or null if invalid
 */
export function parseTwitterDate(dateStr) {
  // Check cache first
  if (dateCache.has(dateStr)) {
    return dateCache.get(dateStr);
  }

  // LRU cache eviction
  if (dateCache.size >= MAX_CACHE_SIZE) {
    const firstKey = dateCache.keys().next().value;
    dateCache.delete(firstKey);
  }

  try {
    let cleanDate = dateStr.trim();
    let isEDT = cleanDate.includes(" EDT");
    let isEST = cleanDate.includes(" EST");

    // Remove timezone suffix
    cleanDate = cleanDate.replace(" EDT", "").replace(" EST", "");

    // Add current year if missing
    if (!cleanDate.match(/\b20\d{2}\b/)) {
      const parts = cleanDate.split(", ");
      if (parts.length >= 2) {
        const nowET = getETComponents(new Date());
        const currentYear = nowET.year;
        cleanDate =
          parts[0] +
          ", " +
          currentYear +
          ", " +
          parts.slice(1).join(", ");
      }
    }

    // Parse the date components
    const dateMatch = cleanDate.match(
      /^(\w+)\s+(\d+),\s+(\d{4}),\s+(\d{1,2}):(\d{2}):(\d{2})\s+(AM|PM)$/
    );

    if (!dateMatch) {
      debugLog("Failed to match date pattern:", cleanDate);
      return null;
    }

    const [
      _,
      monthStr,
      dayStr,
      yearStr,
      hourStr,
      minuteStr,
      secondStr,
      ampm,
    ] = dateMatch;

    // Convert month name to number
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const month = monthNames.indexOf(monthStr.substring(0, 3)) + 1; // 1-based month
    if (month === 0) {
      debugLog("Invalid month:", monthStr);
      return null;
    }

    const day = parseInt(dayStr);
    const year = parseInt(yearStr);
    let hour = parseInt(hourStr);
    const minute = parseInt(minuteStr);
    const second = parseInt(secondStr);

    // Convert 12-hour to 24-hour format
    if (ampm === "PM" && hour !== 12) {
      hour += 12;
    } else if (ampm === "AM" && hour === 12) {
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
        second
      )
    );

    // Debug log for random sample
    if (Math.random() < 0.01) {
      debugLog("parseTwitterDate:", {
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
    debugLog("Date parsing error:", error, "for:", dateStr);
    dateCache.set(dateStr, null);
    return null;
  }
}

/**
 * Format hour in 12-hour AM/PM format
 * @param {number} hour - Hour (0-23)
 * @returns {string} Formatted hour (e.g., "12 AM", "1 PM")
 */
export function formatHour(hour) {
  const h = hour % 12 || 12;
  const period = hour < 12 ? "AM" : "PM";
  return `${h} ${period}`;
}

/**
 * Clear all date caches (useful for testing)
 */
export function clearDateCaches() {
  dateCache.clear();
  etComponentsCache.clear();
}
