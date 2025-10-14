/**
 * Analytics module for predictions and averages
 * Ported from vanilla JS to TypeScript with full feature parity
 */

import {
  debugLog,
  TREND_DOWN_THRESHOLD,
  TREND_UP_THRESHOLD,
  WEEKS_FOR_TREND,
} from '@/config/constants';
import { HeatmapData, PredictionData, Tweet } from '@/types';
import {
  createETNoonDate,
  formatHour,
  getETComponents,
  parseETNoonDate,
  parseTwitterDate,
} from '@/utils/dateTime';
import { memoize } from '@/utils/performance';

// ============================================================================
// Helper Functions for Advanced Predictions
// ============================================================================

/**
 * Calculate the day index (0-7) for a given time relative to range start
 * Returns -1 if outside the range
 */
function getDayIndexFromStart(time: Date, startDate: Date): number {
  const timeET = getETComponents(time);
  const timeDateStr = `${timeET.year}-${String(timeET.month + 1).padStart(
    2,
    '0',
  )}-${String(timeET.day).padStart(2, '0')}`;
  const timeDayNoon = parseETNoonDate(timeDateStr);

  const daysDiff = Math.round(
    (timeDayNoon.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysDiff < 0 || daysDiff > 7) return -1;
  return daysDiff;
}

/**
 * Safely get grid value with boundary checks
 */
function getGridValue(grid: number[][] | null | undefined, hour: number, day: number): number {
  // Early return for invalid grid
  if (!grid) return 0;

  // Check array bounds
  if (hour < 0 || hour >= grid.length) return 0;

  const row = grid[hour];

  if (day < 0 || day >= row.length) return 0;

  // Check value exists
  const value = row[day];
  if (typeof value !== 'number') return 0;

  // Check noon boundaries
  if (day === 0 && hour < 12) return 0; // First day before noon
  if (day === 7 && hour >= 12) return 0; // Last day from noon

  return value;
}

/**
 * Calculate recent momentum (last N hours trend)
 * Compares recent actual activity vs expected activity from 4-week average
 */
function calculateRecentMomentum(
  currentData: HeatmapData | null,
  avgData: HeatmapData | null,
  now: Date,
  startDate: Date,
  hours: number = 6,
): number {
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

  debugLog('Recent Momentum:', {
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
function predictNext24hWithPattern(
  now: Date,
  avgData: HeatmapData | null,
  trendFactor: number,
  momentum: number,
  startDate: Date,
  endDate: Date,
): number {
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
      const combinedFactor = momentum * 0.3 + trendFactor * 0.7;
      hourlyPrediction = avgValue * combinedFactor;
    } else if (futureTime < endDate) {
      // Outside 8-day range but before end: use overall average hourly rate
      const totalHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
      const avgHourlyRate = avgData.current / totalHours;
      hourlyPrediction = avgHourlyRate * trendFactor;
    }
    // else: after range end, don't count

    prediction += hourlyPrediction;
  }

  debugLog('Next 24h Pattern Prediction:', {
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
  function (prediction: number) {
    return calculatePredictionConfidenceInternal(prediction);
  },
  { keyGenerator: (pred: number) => `conf_${Math.round(pred)}` },
);

function calculatePredictionConfidence(avgData: HeatmapData | null, prediction: number) {
  if (!avgData?.grid) {
    return { min: prediction, max: prediction, stdDev: 0 };
  }
  return calculatePredictionConfidenceMemoized(prediction);
}

function calculatePredictionConfidenceInternal(prediction: number) {
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

const calculatePredictionsMemoized = memoize(
  function (currentData: HeatmapData | null, avgData: HeatmapData | null) {
    return calculatePredictionsInternal(currentData, avgData);
  },
  {
    keyGenerator: (curr: HeatmapData | null, avg: HeatmapData | null) =>
      `pred_${curr?.current}_${avg?.current}_${curr?.dateRange.start.getTime()}_${curr?.dateRange.end.getTime()}`,
  },
);

// Prediction functions
export function calculatePredictions(
  currentData: HeatmapData | null,
  avgData: HeatmapData | null,
): PredictionData {
  return calculatePredictionsMemoized(currentData, avgData);
}

function calculatePredictionsInternal(
  currentData: HeatmapData | null,
  avgData: HeatmapData | null,
): PredictionData {
  // Validate input data
  if (!currentData || !avgData)
    return {
      pace: '-',
      next24h: 0,
      next24hMin: 0,
      next24hMax: 0,
      endOfRange: 0,
      endOfRangeMin: 0,
      endOfRangeMax: 0,
      trend: '➡️ Stable',
      trendFactor: 1,
      momentum: 1,
      momentumIndicator: '→',
    };

  // Ensure current values are non-negative
  if (currentData.current < 0) currentData.current = 0;
  if (avgData.current < 0) avgData.current = 0;

  // Calculate current pace and projection
  const now = new Date();
  let elapsedHours = 0;
  let pace = '-';
  let totalHours = 0; // Define at outer scope

  // Handle Date objects
  let startDate = currentData.dateRange.start;
  let endDate = currentData.dateRange.end;

  // Get ET components to properly handle noon boundaries
  const startET = getETComponents(startDate);
  const endET = getETComponents(endDate);
  const nowET = getETComponents(now);

  // Create proper ET noon dates for accurate calculation
  const actualStartNoon = createETNoonDate(startET.year, startET.month + 1, startET.day);
  const actualEndNoon = createETNoonDate(endET.year, endET.month + 1, endET.day);

  // Calculate elapsed hours from actual start (Friday noon ET)
  // If we're before the start, elapsed is 0
  if (now < actualStartNoon) {
    elapsedHours = 0;
  } else if (now > actualEndNoon) {
    // If we're past the end, use total hours
    elapsedHours = (actualEndNoon.getTime() - actualStartNoon.getTime()) / (1000 * 60 * 60);
  } else {
    // Normal case: calculate from start noon to now
    elapsedHours = (now.getTime() - actualStartNoon.getTime()) / (1000 * 60 * 60);
  }

  // Calculate total hours (should be exactly 168 for a full week)
  totalHours = (actualEndNoon.getTime() - actualStartNoon.getTime()) / (1000 * 60 * 60);

  if (elapsedHours > 0 && totalHours > 0) {
    // Ensure we don't exceed total hours
    elapsedHours = Math.min(elapsedHours, totalHours);

    const tweetsPerHour = currentData.current / elapsedHours;
    const remainingHours = Math.max(0, totalHours - elapsedHours);
    const projectedAdditional = tweetsPerHour * remainingHours;
    const projectedTotal = Math.round(currentData.current + projectedAdditional);

    debugLog('Pace calculation:', {
      current: currentData.current,
      elapsedHours: elapsedHours.toFixed(2),
      remainingHours: remainingHours.toFixed(2),
      tweetsPerHour: tweetsPerHour.toFixed(4),
      projectedAdditional: projectedAdditional.toFixed(2),
      beforeRound: (currentData.current + projectedAdditional).toFixed(2),
      projectedTotal: projectedTotal,
      actualStartNoon: actualStartNoon.toISOString(),
      actualEndNoon: actualEndNoon.toISOString(),
      now: now.toISOString(),
      nowET: `${nowET.year}-${nowET.month + 1}-${nowET.day} ${nowET.hour}:${nowET.minute} ET`,
      totalHours: totalHours.toFixed(2),
    });

    pace = projectedTotal.toLocaleString();
  } else if (elapsedHours === 0) {
    // If no time has elapsed yet (before start), show current total as pace
    pace = currentData.current.toLocaleString();
  }

  // Calculate trend factor (current week vs average for same elapsed time)
  // For trend, we need to compare only the same elapsed period
  let comparableAvgTotal = 0;
  if (elapsedHours > 0) {
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
          const avgValue = getGridValue(avgData.grid, h, d);
          comparableAvgTotal += avgValue;
        }
      }
    }
  }

  const trendFactor = comparableAvgTotal > 0 ? currentData.current / comparableAvgTotal : 1;

  // Use the already declared startDate and endDate from above
  startDate = currentData.dateRange.start;
  endDate = currentData.dateRange.end;

  // Calculate recent momentum (last 12 hours trend)
  const momentum = calculateRecentMomentum(currentData, avgData, now, startDate, 12);

  // Next 24 hours prediction using pattern-based approach
  let next24hTotal = 0;
  let next24hConfidence = { min: 0, max: 0, stdDev: 0 };

  // Use new pattern-based prediction
  next24hTotal = predictNext24hWithPattern(now, avgData, trendFactor, momentum, startDate, endDate);

  // Calculate confidence interval
  next24hConfidence = calculatePredictionConfidence(avgData, next24hTotal);

  // End of range prediction - use pattern-based approach for remaining hours
  let weekEndTotal = currentData.current; // Start with current total
  let endOfRangeConfidence = {
    min: currentData.current,
    max: currentData.current,
    stdDev: 0,
  };

  const hoursRemaining = Math.max(0, (endDate.getTime() - now.getTime()) / (1000 * 60 * 60));

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
        const combinedFactor = momentum * 0.3 + trendFactor * 0.7;
        remainingPrediction += avgValue * combinedFactor;
      }
    }

    weekEndTotal = currentData.current + remainingPrediction;

    debugLog('End of Range Prediction:', {
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

  // Determine trend display
  let trend = '➡️ Stable';
  if (trendFactor > TREND_UP_THRESHOLD) {
    trend = '⬆️ Up ' + String(Math.round((trendFactor - 1) * 100)) + '%';
  } else if (trendFactor < TREND_DOWN_THRESHOLD) {
    trend = '⬇️ Down ' + String(Math.round((1 - trendFactor) * 100)) + '%';
  } else {
    // Stable - show percentage too
    const changePercent = Math.round((trendFactor - 1) * 100);
    const sign = changePercent >= 0 ? '+' : '';
    trend = '➡️ Stable ' + sign + String(changePercent) + '%';
  }

  // Momentum indicator (display as multiplier format like 1.01x)
  const momentumIndicator = `${momentum.toFixed(2)}x`;

  // Calculate daily average
  let dailyAvg = '-';
  if (elapsedHours > 0) {
    const elapsedDays = Math.max(1, elapsedHours / 24);
    const avgPerDay = Math.round(currentData.current / elapsedDays);
    dailyAvg = avgPerDay.toString();
  }

  debugLog('Final Predictions Summary:', {
    trend: trend,
    trendFactor: trendFactor.toFixed(3),
    momentum: momentum.toFixed(3),
    momentumIndicator,
    next24h: Math.round(next24hTotal),
    next24hRange: `${next24hConfidence.min}-${next24hConfidence.max}`,
    endOfRange: Math.round(weekEndTotal),
    endOfRangeRange: `${endOfRangeConfidence.min}-${endOfRangeConfidence.max}`,
  });

  // Calculate current hourly rate for pace meter
  let currentHourlyRate = 0;
  let avgHourlyRate = 0;

  if (elapsedHours > 0) {
    currentHourlyRate = currentData.current / elapsedHours;
    // For average, use the comparable period
    if (comparableAvgTotal > 0) {
      avgHourlyRate = comparableAvgTotal / elapsedHours;
    }
  }

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
    dailyAvg: dailyAvg,
    currentHourlyRate: Math.round(currentHourlyRate * 10) / 10, // Round to 1 decimal
    avgHourlyRate: Math.round(avgHourlyRate * 10) / 10,
  };
}

// Memoized version of 4-week average calculation
const calculate4WeekAverageMemoized = memoize(
  function (tweets: Tweet[], currentStartDate: Date, currentEndDate: Date) {
    return calculate4WeekAverageInternal(tweets, currentStartDate, currentEndDate);
  },
  {
    keyGenerator: (tweets: Tweet[], start: Date, end: Date) =>
      `avg_${start.getTime()}_${end.getTime()}_${tweets.length}`,
  },
);

// Calculate 4-week average
export function calculate4WeekAverage(
  tweets: Tweet[],
  currentStartDate: Date,
  currentEndDate: Date,
): HeatmapData | null {
  return calculate4WeekAverageMemoized(tweets, currentStartDate, currentEndDate);
}

function calculate4WeekAverageInternal(
  tweets: Tweet[],
  currentStartDate: Date,
  currentEndDate: Date,
): HeatmapData | null {
  if (tweets.length === 0) return null;

  const hours = Array.from({ length: 24 }, (_, i) => formatHour(i));

  // Use same day pattern as current week (8 days, noon to noon)
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const days: string[] = [];

  // Generate same day labels as current week
  for (let i = 0; i < 8; i++) {
    // Add days and get ET components
    const currentDate = new Date(currentStartDate.getTime() + i * 24 * 60 * 60 * 1000);
    const etComponents = getETComponents(currentDate);
    const dayOfWeek = etComponents.dayOfWeek;
    days.push(dayNames[dayOfWeek]);
  }

  // Initialize grid for totals (8 days)
  const totals: number[][] = Array(24)
    .fill(null)
    .map(() => Array(8).fill(0) as number[]);
  const weekCounts: number[][] = Array(24)
    .fill(null)
    .map(() => Array(8).fill(0) as number[]);

  // Pre-calculate week start noon for optimization
  const weekStartNoonCache = new Map<string, Date>();

  // Process each of the 4 previous weeks
  // Collect FULL week data for pattern analysis
  for (let week = 1; week <= WEEKS_FOR_TREND; week++) {
    const weekStart = new Date(currentStartDate);
    weekStart.setTime(weekStart.getTime() - week * 7 * 24 * 60 * 60 * 1000);

    // Get full 8-day period for complete pattern
    const weekEnd = new Date(weekStart);
    weekEnd.setTime(weekEnd.getTime() + 8 * 24 * 60 * 60 * 1000);

    // Pre-calculate week start noon date once for this week
    const weekStartET = getETComponents(weekStart);
    const weekStartDateStr = `${weekStartET.year}-${String(weekStartET.month + 1).padStart(
      2,
      '0',
    )}-${String(weekStartET.day).padStart(2, '0')}`;
    const weekStartDayNoon = parseETNoonDate(weekStartDateStr);

    tweets.forEach((tweet) => {
      const date = parseTwitterDate(tweet.created_at);
      if (date && date >= weekStart && date < weekEnd) {
        const dateET = getETComponents(date);
        const hour = dateET.hour;

        // Calculate day position in the week pattern using ET components
        const tweetDateStr = `${dateET.year}-${String(dateET.month + 1).padStart(
          2,
          '0',
        )}-${String(dateET.day).padStart(2, '0')}`;

        // Check cache for this date's noon value
        let tweetDayNoon = weekStartNoonCache.get(tweetDateStr);
        if (!tweetDayNoon) {
          tweetDayNoon = parseETNoonDate(tweetDateStr);
          weekStartNoonCache.set(tweetDateStr, tweetDayNoon);
        }

        // Calculate days difference using noon times (more reliable across DST)
        const daysDiff = Math.round(
          (tweetDayNoon.getTime() - weekStartDayNoon.getTime()) / (1000 * 60 * 60 * 24),
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
    }),
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
    dateRange: {
      start: currentStartDate,
      end: currentEndDate,
      type: 'historical',
      label: '4-WEEK AVG',
    },
    peakHour: '',
    mostActiveDay: '',
  };
}
