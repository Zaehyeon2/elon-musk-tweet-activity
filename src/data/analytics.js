// Analytics module for predictions and averages
import { processData } from "./processor.js";
import {
  getETComponents,
  parseTwitterDate,
  parseETNoonDate,
  formatHour,
} from "../utils/dateTime.js";
import { memoize } from "../utils/performance.js";
import {
  PREDICTION_WEIGHT_CURRENT,
  PREDICTION_WEIGHT_AVERAGE,
  TREND_UP_THRESHOLD,
  TREND_DOWN_THRESHOLD,
  WEEKS_FOR_TREND,
  debugLog,
} from "../config/constants.js";

const calculatePredictionsMemoized = memoize(
  function (currentData, avgData) {
    return calculatePredictionsInternal(currentData, avgData);
  },
  (curr, avg) =>
    `pred_${curr?.current}_${avg?.current}_${curr?.dateRange?.start}_${curr?.dateRange?.end}`
);

// Prediction functions
function calculatePredictions(currentData, avgData) {
  return calculatePredictionsMemoized(currentData, avgData);
}

function calculatePredictionsInternal(currentData, avgData) {
  // Validate input data
  if (!currentData || !avgData)
    return { next24h: 0, endOfRange: 0, trend: "stable", pace: "-" };

  // Ensure current values are non-negative
  if (currentData.current < 0) currentData.current = 0;
  if (avgData.current < 0) avgData.current = 0;

  // Calculate current pace and projection
  const now = new Date();
  let elapsedHours = 0;
  let pace = "-";
  let totalHours = 0; // Define at outer scope

  if (
    currentData.dateRange &&
    currentData.dateRange.start &&
    currentData.dateRange.end
  ) {
    // Handle both string and Date object formats
    let startYYYYMMDD, endYYYYMMDD;

    if (typeof currentData.dateRange.start === "string") {
      startYYYYMMDD = currentData.dateRange.start;
    } else {
      const startET = getETComponents(
        new Date(currentData.dateRange.start)
      );
      startYYYYMMDD = `${startET.year}-${String(
        startET.month + 1
      ).padStart(2, "0")}-${String(startET.day).padStart(2, "0")}`;
    }

    if (typeof currentData.dateRange.end === "string") {
      endYYYYMMDD = currentData.dateRange.end;
    } else {
      const endET = getETComponents(new Date(currentData.dateRange.end));
      endYYYYMMDD = `${endET.year}-${String(endET.month + 1).padStart(
        2,
        "0"
      )}-${String(endET.day).padStart(2, "0")}`;
    }

    // Parse dates and set to ET noon using common function
    const startDate = parseETNoonDate(startYYYYMMDD);
    const endDate = parseETNoonDate(endYYYYMMDD);

    // Timezone verification
    debugLog("Timezone check:", {
      startYYYYMMDD,
      endYYYYMMDD,
      startDate_KST: startDate.toLocaleString("ko-KR", {
        timeZone: "Asia/Seoul",
      }),
      endDate_KST: endDate.toLocaleString("ko-KR", {
        timeZone: "Asia/Seoul",
      }),
      startDate_ET: startDate.toLocaleString("en-US", {
        timeZone: "America/New_York",
      }),
      endDate_ET: endDate.toLocaleString("en-US", {
        timeZone: "America/New_York",
      }),
    });

    // Calculate elapsed hours
    elapsedHours = Math.max(0, (now - startDate) / (1000 * 60 * 60));

    // Calculate total hours in the week (Friday noon to Friday noon = 7*24 = 168 hours)
    totalHours = (endDate - startDate) / (1000 * 60 * 60);

    if (elapsedHours > 0 && totalHours > 0) {
      const tweetsPerHour = currentData.current / elapsedHours;
      const remainingHours = Math.max(0, totalHours - elapsedHours);
      const projectedAdditional = Math.max(
        0,
        tweetsPerHour * remainingHours
      );
      const projectedTotal = Math.max(
        currentData.current,
        Math.round(currentData.current + projectedAdditional)
      );

      debugLog("Pace calculation:", {
        current: currentData.current,
        elapsedHours: elapsedHours.toFixed(2),
        remainingHours: remainingHours.toFixed(2),
        tweetsPerHour: tweetsPerHour.toFixed(4),
        projectedAdditional: projectedAdditional.toFixed(2),
        beforeRound: (currentData.current + projectedAdditional).toFixed(
          2
        ),
        projectedTotal: projectedTotal,
        startDate: startDate.toString(),
        endDate: endDate.toString(),
        now: now.toString(),
        totalHours: totalHours.toFixed(2),
      });

      pace = projectedTotal.toLocaleString() + " tweets";
    }
  }

  // Calculate trend factor (current week vs average for same elapsed time)
  // For trend, we need to compare only the same elapsed period
  let comparableAvgTotal = 0;
  if (elapsedHours > 0 && avgData) {
    // Sum avgData.grid for the same elapsed period
    // Week starts at day 0, hour 12 (noon of first day)
    for (let d = 0; d < 8; d++) {
      for (let h = 0; h < 24; h++) {
        // Calculate absolute hours from start (first day noon = hour 0)
        let absoluteHourFromStart;

        if (d === 0) {
          // First day: starts at noon (12PM)
          if (h < 12) continue; // Before noon, not in range
          absoluteHourFromStart = h - 12; // 12PM = 0, 1PM = 1, etc.
        } else if (d === 7) {
          // Last day: ends at noon (12PM)
          if (h >= 12) continue; // After noon, not in range
          absoluteHourFromStart = d * 24 - 12 + h; // Continue counting
        } else {
          // Middle days: full 24 hours
          absoluteHourFromStart = d * 24 - 12 + h;
        }

        // Only include if this time has elapsed
        if (absoluteHourFromStart < elapsedHours) {
          if (avgData.grid[h] && avgData.grid[h][d] !== undefined) {
            comparableAvgTotal += avgData.grid[h][d];
          }
        }
      }
    }
  }

  const trendFactor =
    comparableAvgTotal > 0 ? currentData.current / comparableAvgTotal : 1;

  // Next 24 hours prediction
  const nowETComponents = getETComponents(now);
  let next24hTotal = 0;

  // Calculate for next 24 hours based on average and trend
  if (currentData.dateRange && currentData.dateRange.start) {
    // Parse start date properly
    let startDateStr;
    if (typeof currentData.dateRange.start === "string") {
      startDateStr = currentData.dateRange.start;
    } else {
      const startET = getETComponents(
        new Date(currentData.dateRange.start)
      );
      startDateStr = `${startET.year}-${String(
        startET.month + 1
      ).padStart(2, "0")}-${String(startET.day).padStart(2, "0")}`;
    }
    const startDate = parseETNoonDate(startDateStr);

    const daysSinceStart = Math.floor(
      (now - startDate) / (1000 * 60 * 60 * 24)
    );

    // Calculate current week's hourly rate
    const currentHourlyRate =
      elapsedHours > 0 ? currentData.current / elapsedHours : 0;

    // Calculate 4-week average hourly rate based on comparable period
    const avgHourlyRate =
      elapsedHours > 0 ? comparableAvgTotal / elapsedHours : 0;

    // Weighted average using configuration constants
    // This balances recent performance with historical patterns
    const weightedHourlyRate =
      currentHourlyRate * PREDICTION_WEIGHT_CURRENT +
      avgHourlyRate * PREDICTION_WEIGHT_AVERAGE;

    // For next 24 hours, use the weighted rate
    next24hTotal = weightedHourlyRate * 24;
  }

  // End of range prediction - calculate remaining hours until range ends
  let weekEndTotal = currentData.current; // Start with current total

  if (
    currentData.dateRange &&
    currentData.dateRange.end &&
    currentData.dateRange.start
  ) {
    // Parse end date properly
    let endYYYYMMDD;
    if (typeof currentData.dateRange.end === "string") {
      endYYYYMMDD = currentData.dateRange.end;
    } else {
      const endET = getETComponents(new Date(currentData.dateRange.end));
      endYYYYMMDD = `${endET.year}-${String(endET.month + 1).padStart(
        2,
        "0"
      )}-${String(endET.day).padStart(2, "0")}`;
    }
    // Use common function to get ET noon
    const endDate = parseETNoonDate(endYYYYMMDD);

    const hoursRemaining = Math.max(
      0,
      (endDate - now) / (1000 * 60 * 60)
    );

    if (hoursRemaining > 0 && elapsedHours > 0) {
      // Calculate both current and average hourly rates
      const currentHourlyRate = currentData.current / elapsedHours;
      const avgHourlyRate = comparableAvgTotal / elapsedHours;

      // Weighted average using configuration constants
      // This provides a more balanced prediction
      const weightedHourlyRate =
        currentHourlyRate * PREDICTION_WEIGHT_CURRENT +
        avgHourlyRate * PREDICTION_WEIGHT_AVERAGE;
      const predictedRemaining = weightedHourlyRate * hoursRemaining;
      weekEndTotal += predictedRemaining;
    }
  }

  // Determine trend
  let trend = "stable";
  if (trendFactor > TREND_UP_THRESHOLD)
    trend = "⬆️ Up " + Math.round((trendFactor - 1) * 100) + "%";
  else if (trendFactor < TREND_DOWN_THRESHOLD)
    trend = "⬇️ Down " + Math.round((1 - trendFactor) * 100) + "%";
  else trend = "➡️ Stable";

  return {
    pace: pace,
    next24h: Math.max(0, Math.round(next24hTotal)),
    endOfRange: Math.max(0, Math.round(weekEndTotal)),
    trend: trend,
  };
}

// Memoized version of 4-week average calculation
const calculate4WeekAverageMemoized = memoize(
  function (tweets, currentStartDate, currentEndDate) {
    return calculate4WeekAverageInternal(
      tweets,
      currentStartDate,
      currentEndDate
    );
  },
  (tweets, start, end) => `avg_${start}_${end}_${tweets.length}`
);

// Calculate 4-week average
function calculate4WeekAverage(tweets, currentStartDate, currentEndDate) {
  return calculate4WeekAverageMemoized(
    tweets,
    currentStartDate,
    currentEndDate
  );
}

function calculate4WeekAverageInternal(
  tweets,
  currentStartDate,
  currentEndDate
) {
  if (!tweets || tweets.length === 0) return null;

  const hours = Array.from({ length: 24 }, (_, i) => formatHour(i));

  // Use same day pattern as current week (8 days, noon to noon)
  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  let days = [];
  let start = null;

  if (currentStartDate) {
    // Use common function to create ET noon date
    start = parseETNoonDate(currentStartDate);

    // Generate same day labels as current week
    for (let i = 0; i < 8; i++) {
      // Add days and get ET components
      const currentDate = new Date(
        start.getTime() + i * 24 * 60 * 60 * 1000
      );
      const etComponents = getETComponents(currentDate);
      const dayOfWeek = etComponents.dayOfWeek;
      days.push(dayNames[dayOfWeek]);
    }
  } else {
    days = ["FRI", "SAT", "SUN", "MON", "TUE", "WED", "THU", "FRI"];
  }

  // Initialize grid for totals (8 days)
  const totals = Array(24)
    .fill()
    .map(() => Array(8).fill(0));
  const weekCounts = Array(24)
    .fill()
    .map(() => Array(8).fill(0));

  // Get tweets from last 4 weeks based on the current selected range
  // Use the actual start date from the selected range
  let currentWeekStart;
  if (currentStartDate) {
    // Use common function to create ET noon date
    currentWeekStart = parseETNoonDate(currentStartDate);
  } else {
    // Fallback to Friday if no date selected
    const now = new Date();
    currentWeekStart = new Date(now);
    while (getETComponents(currentWeekStart).dayOfWeek !== 5) {
      // Find last Friday
      currentWeekStart.setTime(
        currentWeekStart.getTime() - 24 * 60 * 60 * 1000
      );
    }
    // Set to noon ET using common function
    const weekET = getETComponents(currentWeekStart);
    const weekDateStr = `${weekET.year}-${String(
      weekET.month + 1
    ).padStart(2, "0")}-${String(weekET.day).padStart(2, "0")}`;
    currentWeekStart = parseETNoonDate(weekDateStr);
  }

  // Calculate how far we are into the current week
  const now = new Date();
  const hoursIntoCurrentWeek =
    (now - currentWeekStart) / (1000 * 60 * 60);
  const maxHours = 8 * 24; // Full week is 8 days = 192 hours
  const progressRatio = Math.min(hoursIntoCurrentWeek / maxHours, 1);

  // Pre-calculate week start noon for optimization
  const weekStartNoonCache = new Map();

  // Process each of the 4 previous weeks
  // Collect FULL week data for pattern analysis
  for (let week = 1; week <= WEEKS_FOR_TREND; week++) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setTime(
      weekStart.getTime() - week * 7 * 24 * 60 * 60 * 1000
    );

    // Get full 8-day period for complete pattern
    const weekEnd = new Date(weekStart);
    weekEnd.setTime(weekEnd.getTime() + 8 * 24 * 60 * 60 * 1000);

    // Pre-calculate week start noon date once for this week
    const weekStartET = getETComponents(weekStart);
    const weekStartDateStr = `${weekStartET.year}-${String(
      weekStartET.month + 1
    ).padStart(2, "0")}-${String(weekStartET.day).padStart(2, "0")}`;
    const weekStartDayNoon = parseETNoonDate(weekStartDateStr);

    tweets.forEach((tweet) => {
      const date = parseTwitterDate(tweet.created_at);
      if (date && date >= weekStart && date < weekEnd) {
        const dateET = getETComponents(date);
        const hour = dateET.hour;

        // Calculate day position in the week pattern using ET components
        const tweetDateStr = `${dateET.year}-${String(
          dateET.month + 1
        ).padStart(2, "0")}-${String(dateET.day).padStart(2, "0")}`;

        // Check cache for this date's noon value
        let tweetDayNoon = weekStartNoonCache.get(tweetDateStr);
        if (!tweetDayNoon) {
          tweetDayNoon = parseETNoonDate(tweetDateStr);
          weekStartNoonCache.set(tweetDateStr, tweetDayNoon);
        }

        // Calculate days difference using noon times (more reliable across DST)
        const daysDiff = Math.round(
          (tweetDayNoon - weekStartDayNoon) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff >= 0 && daysDiff <= 7) {
          // Include day 7 (8th day)
          // Apply noon filtering for first and last day
          if (daysDiff === 0 && hour < 12) return; // Skip first day before noon
          if (daysDiff === 7 && hour >= 12) return; // Skip last day from noon

          totals[hour][daysDiff]++;
          weekCounts[hour][daysDiff]++;
        }
      }
    });
  }

  // Calculate averages - still show full week pattern
  // but the data is based on comparable time periods
  const avgGrid = totals.map((hourRow, hourIndex) =>
    hourRow.map((total, dayIndex) => {
      // Divide by 4 to get weekly average
      return Math.round((total / 4) * 10) / 10; // Round to 1 decimal
    })
  );

  // Calculate totals excluding disabled cells
  const avgTotals = days.map((_, dayIndex) => {
    let total = 0;
    for (let hourIndex = 0; hourIndex < 24; hourIndex++) {
      // Skip disabled cells based on noon rules
      if (dayIndex === 0 && hourIndex < 12) continue; // First day before noon
      if (dayIndex === days.length - 1 && hourIndex >= 12) continue; // Last day from noon
      total += avgGrid[hourIndex][dayIndex];
    }
    return Math.round(total);
  });

  const maxValue = Math.max(...avgGrid.flat());

  return {
    grid: avgGrid,
    hours,
    days,
    totals: avgTotals,
    current: avgTotals.reduce((sum, val) => sum + val, 0),
    maxValue,
    peakHour: formatHour(
      avgGrid.findIndex((row) => row.includes(maxValue))
    ),
    mostActiveDay: days[avgTotals.indexOf(Math.max(...avgTotals))],
    dateRange: {
      start: currentStartDate, // Keep as string
      end: currentEndDate, // Keep as string
    },
  };
}

export { calculatePredictions, calculate4WeekAverage };
