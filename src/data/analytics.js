// Analytics module for predictions and averages
import {
  getETComponents,
  parseTwitterDate,
  parseETNoonDate,
  formatHour,
} from "../utils/dateTime.js";
import { memoize } from "../utils/performance.js";
import {
  TREND_UP_THRESHOLD,
  TREND_DOWN_THRESHOLD,
  WEEKS_FOR_TREND,
  debugLog,
} from "../config/constants.js";

// ============================================================================
// Helper Functions for Advanced Predictions
// ============================================================================

/**
 * Calculate the day index (0-7) for a given time relative to range start
 * Returns -1 if outside the range
 */
function getDayIndexFromStart(time, startDate) {
  const timeET = getETComponents(time);
  const timeDateStr = `${timeET.year}-${String(timeET.month + 1).padStart(2, "0")}-${String(timeET.day).padStart(2, "0")}`;
  const timeDayNoon = parseETNoonDate(timeDateStr);

  const daysDiff = Math.round((timeDayNoon - startDate) / (1000 * 60 * 60 * 24));

  if (daysDiff < 0 || daysDiff > 7) return -1;
  return daysDiff;
}

/**
 * Safely get grid value with boundary checks
 */
function getGridValue(grid, hour, day) {
  if (!grid || !grid[hour] || grid[hour][day] === undefined) return 0;

  // Check noon boundaries
  if (day === 0 && hour < 12) return 0; // First day before noon
  if (day === 7 && hour >= 12) return 0; // Last day from noon

  return grid[hour][day];
}

/**
 * Calculate recent momentum (last N hours trend)
 * Compares recent actual activity vs expected activity from 4-week average
 */
function calculateRecentMomentum(currentData, avgData, now, startDate, hours = 6) {
  if (!currentData?.grid || !avgData?.grid) return 1;

  let recentActual = 0;
  let recentExpected = 0;
  let validHours = 0;

  // Look back N hours from now
  for (let i = 0; i < hours; i++) {
    const pastTime = new Date(now.getTime() - i * 60 * 60 * 1000);
    const pastET = getETComponents(pastTime);
    const hour = pastET.hour;
    const dayIndex = getDayIndexFromStart(pastTime, startDate);

    if (dayIndex >= 0 && dayIndex <= 7) {
      const actual = getGridValue(currentData.grid, hour, dayIndex);
      const expected = getGridValue(avgData.grid, hour, dayIndex);

      recentActual += actual;
      recentExpected += expected;
      validHours++;
    }
  }

  if (validHours === 0 || recentExpected === 0) return 1;

  const momentum = recentActual / recentExpected;

  debugLog("Recent Momentum:", {
    hours,
    validHours,
    recentActual: recentActual.toFixed(2),
    recentExpected: recentExpected.toFixed(2),
    momentum: momentum.toFixed(3),
  });

  return momentum;
}

/**
 * Predict next 24 hours using hourly pattern from 4-week average
 * This is much more accurate than simple average as it considers time-of-day patterns
 */
function predictNext24hWithPattern(now, avgData, trendFactor, momentum, startDate, endDate) {
  if (!avgData?.grid) return 0;

  let prediction = 0;

  // Iterate through next 24 hours
  for (let i = 0; i < 24; i++) {
    const futureTime = new Date(now.getTime() + i * 60 * 60 * 1000);
    const futureET = getETComponents(futureTime);
    const hour = futureET.hour;
    const dayIndex = getDayIndexFromStart(futureTime, startDate);

    let hourlyPrediction = 0;

    if (dayIndex >= 0 && dayIndex <= 7 && futureTime < endDate) {
      // Within range: use specific hour/day pattern
      const avgValue = getGridValue(avgData.grid, hour, dayIndex);

      // Apply combined trend factor and momentum
      // Momentum (30%) + Overall Trend (70%) for balanced prediction
      const combinedFactor = (momentum * 0.3) + (trendFactor * 0.7);
      hourlyPrediction = avgValue * combinedFactor;
    } else if (futureTime < endDate) {
      // Outside 8-day range but before end: use overall average hourly rate
      const totalHours = (endDate - startDate) / (1000 * 60 * 60);
      const avgHourlyRate = avgData.current / totalHours;
      hourlyPrediction = avgHourlyRate * trendFactor;
    }
    // else: after range end, don't count

    prediction += hourlyPrediction;
  }

  debugLog("Next 24h Pattern Prediction:", {
    totalPrediction: prediction.toFixed(2),
    trendFactor: trendFactor.toFixed(3),
    momentum: momentum.toFixed(3),
  });

  return prediction;
}

/**
 * Calculate prediction confidence interval using 15% approximation
 * Returns { min, max, stdDev } for 90% confidence interval
 * Memoized for performance - uses simple statistical approximation instead of full variance
 */
const calculatePredictionConfidenceMemoized = memoize(
  function (prediction) {
    return calculatePredictionConfidenceInternal(prediction);
  },
  (pred) => `conf_${Math.round(pred)}`
);

function calculatePredictionConfidence(avgData, prediction) {
  if (!avgData?.grid) {
    return { min: prediction, max: prediction, stdDev: 0 };
  }
  return calculatePredictionConfidenceMemoized(prediction);
}

function calculatePredictionConfidenceInternal(prediction) {
  // Quick approximation: use 15% of prediction as std dev for 90% confidence
  // This is much faster than calculating full variance and provides reasonable bounds
  const estimatedStdDev = prediction * 0.15; // 15% variation estimate
  const margin = estimatedStdDev * 1.5;

  const min = Math.max(0, Math.round(prediction - margin));
  const max = Math.round(prediction + margin);

  return {
    min,
    max,
    stdDev: estimatedStdDev,
  };
}

/**
 * Calculate full variance-based confidence (unused - replaced by 15% approximation)
 * Kept commented for reference in case we want more accurate confidence intervals in the future
 */
/*
function calculateFullVarianceConfidence(avgData, prediction) {
  if (!avgData?.grid) {
    return { min: prediction, max: prediction, stdDev: 0 };
  }

  // Calculate variance across all cells (representing weekly variation)
  const allValues = [];
  for (let h = 0; h < 24; h++) {
    for (let d = 0; d < 8; d++) {
      const value = getGridValue(avgData.grid, h, d);
      if (value > 0 || (d > 0 && d < 7) || (d === 0 && h >= 12) || (d === 7 && h < 12)) {
        allValues.push(value);
      }
    }
  }

  if (allValues.length === 0) {
    return { min: prediction, max: prediction, stdDev: 0 };
  }

  // Calculate mean
  const mean = allValues.reduce((sum, v) => sum + v, 0) / allValues.length;

  // Calculate variance and standard deviation
  const variance = allValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / allValues.length;
  const stdDev = Math.sqrt(variance);

  // For 24-hour prediction, we accumulate variance
  // Standard error = stdDev * sqrt(n), where n = 24 hours
  const predictionStdDev = stdDev * Math.sqrt(24);

  // 90% confidence interval ≈ ±1.645 * stdDev
  // Using 1.5 for simplicity and slightly tighter bounds
  const margin = predictionStdDev * 1.5;

  const min = Math.max(0, Math.round(prediction - margin));
  const max = Math.round(prediction + margin);

  debugLog("Prediction Confidence:", {
    prediction: prediction.toFixed(2),
    stdDev: predictionStdDev.toFixed(2),
    margin: margin.toFixed(2),
    min,
    max,
    range: `${min}-${max}`,
  });

  return {
    min,
    max,
    stdDev: predictionStdDev,
  };
}
*/

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
    return {
      pace: "-",
      next24h: 0,
      next24hMin: 0,
      next24hMax: 0,
      endOfRange: 0,
      endOfRangeMin: 0,
      endOfRangeMax: 0,
      trend: "➡️ Stable",
      trendFactor: 1,
      momentum: 1,
      momentumIndicator: "→",
    };

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

      pace = projectedTotal.toLocaleString();
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

  // Parse start and end dates for predictions
  let startDate = null;
  let endDate = null;
  let startDateStr = null;

  if (currentData.dateRange && currentData.dateRange.start) {
    if (typeof currentData.dateRange.start === "string") {
      startDateStr = currentData.dateRange.start;
    } else {
      const startET = getETComponents(new Date(currentData.dateRange.start));
      startDateStr = `${startET.year}-${String(startET.month + 1).padStart(2, "0")}-${String(startET.day).padStart(2, "0")}`;
    }
    startDate = parseETNoonDate(startDateStr);
  }

  if (currentData.dateRange && currentData.dateRange.end) {
    let endDateStr;
    if (typeof currentData.dateRange.end === "string") {
      endDateStr = currentData.dateRange.end;
    } else {
      const endET = getETComponents(new Date(currentData.dateRange.end));
      endDateStr = `${endET.year}-${String(endET.month + 1).padStart(2, "0")}-${String(endET.day).padStart(2, "0")}`;
    }
    endDate = parseETNoonDate(endDateStr);
  }

  // Calculate recent momentum (last 6 hours trend)
  const momentum = startDate
    ? calculateRecentMomentum(currentData, avgData, now, startDate, 6)
    : 1;

  // Next 24 hours prediction using pattern-based approach
  let next24hTotal = 0;
  let next24hConfidence = { min: 0, max: 0, stdDev: 0 };

  if (startDate && endDate && avgData) {
    // Use new pattern-based prediction
    next24hTotal = predictNext24hWithPattern(
      now,
      avgData,
      trendFactor,
      momentum,
      startDate,
      endDate
    );

    // Calculate confidence interval
    next24hConfidence = calculatePredictionConfidence(avgData, next24hTotal);
  }

  // End of range prediction - use pattern-based approach for remaining hours
  let weekEndTotal = currentData.current; // Start with current total
  let endOfRangeConfidence = { min: currentData.current, max: currentData.current, stdDev: 0 };

  if (startDate && endDate && avgData) {
    const hoursRemaining = Math.max(0, (endDate - now) / (1000 * 60 * 60));

    if (hoursRemaining > 0) {
      // Pattern-based prediction for remaining hours
      let remainingPrediction = 0;

      for (let i = 0; i < hoursRemaining; i++) {
        const futureTime = new Date(now.getTime() + i * 60 * 60 * 1000);
        const futureET = getETComponents(futureTime);
        const hour = futureET.hour;
        const dayIndex = getDayIndexFromStart(futureTime, startDate);

        if (dayIndex >= 0 && dayIndex <= 7) {
          const avgValue = getGridValue(avgData.grid, hour, dayIndex);
          // Use combined trend and momentum
          const combinedFactor = (momentum * 0.3) + (trendFactor * 0.7);
          remainingPrediction += avgValue * combinedFactor;
        }
      }

      weekEndTotal = currentData.current + remainingPrediction;

      debugLog("End of Range Prediction:", {
        current: currentData.current,
        hoursRemaining: hoursRemaining.toFixed(2),
        remainingPrediction: remainingPrediction.toFixed(2),
        total: weekEndTotal.toFixed(2),
      });

      // Confidence for end of range (wider interval due to longer timeframe)
      const scaledStdDev = next24hConfidence.stdDev * Math.sqrt(hoursRemaining / 24);
      const margin = scaledStdDev * 1.5;
      endOfRangeConfidence = {
        min: Math.max(currentData.current, Math.round(weekEndTotal - margin)),
        max: Math.round(weekEndTotal + margin),
        stdDev: scaledStdDev,
      };
    }
  }

  // Determine trend display
  let trend = "➡️ Stable";
  if (trendFactor > TREND_UP_THRESHOLD) {
    trend = "⬆️ Up " + Math.round((trendFactor - 1) * 100) + "%";
  } else if (trendFactor < TREND_DOWN_THRESHOLD) {
    trend = "⬇️ Down " + Math.round((1 - trendFactor) * 100) + "%";
  } else {
    // Stable - show percentage too
    const changePercent = Math.round((trendFactor - 1) * 100);
    const sign = changePercent >= 0 ? "+" : "";
    trend = "➡️ Stable " + sign + changePercent + "%";
  }

  // Momentum indicator (for debugging/display)
  let momentumIndicator = "→";
  if (momentum > 1.15) momentumIndicator = "⚡ Accelerating";
  else if (momentum < 0.85) momentumIndicator = "🐌 Slowing";

  debugLog("Final Predictions Summary:", {
    trend: trend,
    trendFactor: trendFactor.toFixed(3),
    momentum: momentum.toFixed(3),
    momentumIndicator,
    next24h: Math.round(next24hTotal),
    next24hRange: `${next24hConfidence.min}-${next24hConfidence.max}`,
    endOfRange: Math.round(weekEndTotal),
    endOfRangeRange: `${endOfRangeConfidence.min}-${endOfRangeConfidence.max}`,
  });

  return {
    pace: pace,
    next24h: Math.max(0, Math.round(next24hTotal)),
    next24hMin: next24hConfidence.min,
    next24hMax: next24hConfidence.max,
    endOfRange: Math.max(0, Math.round(weekEndTotal)),
    endOfRangeMin: endOfRangeConfidence.min,
    endOfRangeMax: endOfRangeConfidence.max,
    trend: trend,
    trendFactor: trendFactor,
    momentum: momentum,
    momentumIndicator: momentumIndicator,
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

  // Note: Could calculate progressRatio here to weight recent weeks more heavily in the future
  // const now = new Date();
  // const hoursIntoCurrentWeek = (now - currentWeekStart) / (1000 * 60 * 60);
  // const maxHours = 8 * 24; // Full week is 8 days = 192 hours
  // const progressRatio = Math.min(hoursIntoCurrentWeek / maxHours, 1);

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
  const avgGrid = totals.map((hourRow) =>
    hourRow.map((total) => {
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
