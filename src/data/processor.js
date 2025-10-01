// Data processing module for tweet heatmap
import {
  parseTwitterDate,
  getETComponents,
  parseETNoonDate,
  formatHour,
} from "../utils/dateTime.js";
import { HOURS_IN_DAY, debugLog } from "../config/constants.js";

// Helper function to generate day labels
function generateDayLabels(startDate, dayCount) {
  const days = [];
  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  for (let i = 0; i < dayCount; i++) {
    const currentDate = new Date(
      startDate.getTime() + i * 24 * 60 * 60 * 1000
    );
    const etComponents = getETComponents(currentDate);
    const dayOfWeek = etComponents.dayOfWeek;
    days.push(dayNames[dayOfWeek]);
  }

  return days;
}

function processData(tweets, startDate, endDate, rangeType = "friday") {
  const hours = Array.from({ length: 24 }, (_, i) => formatHour(i));

  let validTweets = 0;

  // Parse dates as ET noon (12:00 PM ET)
  let actualStart = null;
  let actualEnd = null;

  if (startDate && endDate) {
    // Use common function to create ET noon dates
    actualStart = parseETNoonDate(startDate);
    actualEnd = parseETNoonDate(endDate);
  }

  // Determine the actual date range and days to show
  let days, grid;

  if (actualStart && actualEnd) {
    // Always 8 days for noon-to-noon ranges
    const dayCount = 8;

    // Generate day labels based on actual dates
    days = generateDayLabels(actualStart, dayCount);

    debugLog("=== DATE RANGE DEBUG ===");
    debugLog("Input startDate:", startDate);
    debugLog("Input endDate:", endDate);
    debugLog("Parsed start:", actualStart);
    debugLog("Parsed end:", actualEnd);
    debugLog("Day count:", dayCount);
    debugLog("Generated days for range:", days);
    const startET = getETComponents(actualStart);
    const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    debugLog(
      "Start date day of week:",
      startET.dayOfWeek,
      "(" + dayNames[startET.dayOfWeek] + ")"
    );

    // Initialize grid based on actual day count
    grid = Array(24)
      .fill()
      .map(() => Array(days.length).fill(0));
  } else {
    // Default to full week starting Monday
    days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
    grid = Array(24)
      .fill()
      .map(() => Array(7).fill(0));
  }

  let totalProcessed = 0;
  let validDates = 0;
  let filteredOut = 0;
  let noonFiltered = 0;

  tweets.forEach((tweet) => {
    totalProcessed++;
    const date = parseTwitterDate(tweet.created_at);
    if (date) {
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
      if (actualStart && actualEnd) {
        // Create date strings for comparison (YYYY-MM-DD format)
        const tweetET = getETComponents(date);
        const tweetYear = tweetET.year;
        const tweetMonth = String(tweetET.month + 1).padStart(2, "0");
        const tweetDay = String(tweetET.day).padStart(2, "0");
        const tweetDateStr = `${tweetYear}-${tweetMonth}-${tweetDay}`;
        const tweetHour = tweetET.hour;

        // For start date: include only from noon onwards
        if (tweetDateStr === startDate) {
          if (tweetHour < 12) {
            noonFiltered++;
            return;
          }
        }
        // For dates before start date: exclude all
        else if (tweetDateStr < startDate) {
          filteredOut++;
          return;
        }

        // For end date (Friday): include only before noon
        if (tweetDateStr === endDate) {
          if (tweetHour >= 12) {
            noonFiltered++;
            return;
          }
        }
        // For dates after end date: exclude all
        else if (tweetDateStr > endDate) {
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
        const tweetDateStr = `${tweetET.year}-${String(
          tweetET.month + 1
        ).padStart(2, "0")}-${String(tweetET.day).padStart(2, "0")}`;
        const startDateStr = `${startET.year}-${String(
          startET.month + 1
        ).padStart(2, "0")}-${String(startET.day).padStart(2, "0")}`;

        // Create dates at ET midnight (start of day) for accurate day difference
        // Use common function that handles EDT/EST properly
        const tweetDayStart = parseETNoonDate(tweetDateStr);
        const startDayStart = parseETNoonDate(startDateStr);

        // Adjust to midnight by subtracting 12 hours from noon
        tweetDayStart.setTime(
          tweetDayStart.getTime() - 12 * 60 * 60 * 1000
        );
        startDayStart.setTime(
          startDayStart.getTime() - 12 * 60 * 60 * 1000
        );

        const daysDiff = Math.floor(
          (tweetDayStart - startDayStart) / (1000 * 60 * 60 * 24)
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
  debugLog("=== PROCESSING SUMMARY ===");
  debugLog("Total tweets processed:", totalProcessed);
  debugLog("Valid dates parsed:", validDates);
  debugLog("Filtered out by date range:", filteredOut);
  debugLog("Filtered out by noon rule:", noonFiltered);
  debugLog("Final valid tweets:", validTweets);
  if (actualStart && actualEnd) {
    const startET = getETComponents(actualStart);
    const endET = getETComponents(actualEnd);
    debugLog("Date range:", {
      start: `${startET.year}-${startET.month + 1}-${startET.day}`,
      end: `${endET.year}-${endET.month + 1}-${endET.day}`,
      startDate: startDate,
      endDate: endDate,
    });
  }

  return {
    grid,
    hours,
    days,
    totals,
    current: validTweets,
    maxValue,
    peakHour,
    mostActiveDay,
    dateRange: { start: actualStart, end: actualEnd },
  };
}

export { processData, generateDayLabels };
