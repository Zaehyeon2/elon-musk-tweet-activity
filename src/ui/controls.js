/**
 * UI Controls - Dropdown, file upload, auto-refresh, scroll indicators
 */

import { getETComponents, parseTwitterDate, parseETNoonDate } from '../utils/dateTime.js';
import { debugLog, AUTO_REFRESH_INTERVAL } from '../config/constants.js';
import { isMobileDevice, triggerHaptic } from './components.js';
import { state, updateState } from '../state/appState.js';
import { processData } from '../data/processor.js';
import { calculate4WeekAverage, calculatePredictions } from '../data/analytics.js';
import { renderHeatmap, renderAverageHeatmap } from './heatmap.js';
import { UI } from './uiHelpers.js';
import { parseCSV } from '../data/parser.js';

/**
 * Download current heatmap data as CSV
 */
export function downloadCSV() {
  if (!state.currentData) {
    alert("No data available to download");
    return;
  }

  // Create CSV content
  let csvContent =
    "Hour,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday\n";

  state.currentData.hours.forEach((hour, hourIndex) => {
    const row = [hour, ...state.currentData.grid[hourIndex]];
    csvContent += row.join(",") + "\n";
  });

  // Add totals row
  csvContent += "TOTALS," + state.currentData.totals.join(",") + "\n";

  // Create and download file
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "elon-tweet-heatmap.csv";
  a.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Populate week range dropdown based on tweet data
 * @param {Array} tweets - Array of tweet objects
 */
export function populateWeekRanges(tweets = null) {
  const select = document.getElementById("weekRange");
  const populateStart = performance.now();

  // Save current selection before clearing
  const currentSelection = select.value;

  // Clear existing options
  select.innerHTML = '<option value="">Select a week range...</option>';

  if (!tweets || tweets.length === 0) {
    return;
  }

  // Find date range from actual tweet data
  const dates = [];
  tweets.forEach((tweet) => {
    const date = parseTwitterDate(tweet.created_at);
    if (date) {
      dates.push(date);
    }
  });

  if (dates.length === 0) return;

  // Sort dates
  dates.sort((a, b) => a - b);

  // Get min and max dates
  const minDate = dates[0];
  const maxDate = dates[dates.length - 1];

  // Generate weekly ranges based on actual data
  const ranges = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Generate both Friday-to-Friday and Tuesday-to-Tuesday ranges
  const specificRanges = [];
  const currentDate = new Date();

  // Get current time in ET for comparison
  const currentET = getETComponents(currentDate);

  // Find the most recent Friday in ET
  let recentFriday = new Date(currentDate);
  while (getETComponents(recentFriday).dayOfWeek !== 5) {
    // 5 = Friday
    recentFriday.setTime(recentFriday.getTime() - 24 * 60 * 60 * 1000);
  }

  // Find the most recent Tuesday in ET
  let recentTuesday = new Date(currentDate);
  while (getETComponents(recentTuesday).dayOfWeek !== 2) {
    // 2 = Tuesday
    recentTuesday.setTime(recentTuesday.getTime() - 24 * 60 * 60 * 1000);
  }

  // Add current ongoing week ranges
  // Friday range - check if we're past Friday noon ET
  let startFriday = new Date(recentFriday);
  let endFriday = new Date(recentFriday);
  endFriday.setTime(endFriday.getTime() + 7 * 24 * 60 * 60 * 1000);

  // If we're on Friday and past noon ET, move to next week's range
  if (currentET.dayOfWeek === 5 && currentET.hour >= 12) {
    startFriday.setTime(startFriday.getTime() + 7 * 24 * 60 * 60 * 1000);
    endFriday.setTime(endFriday.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  specificRanges.push({
    start: new Date(startFriday),
    end: new Date(endFriday),
    type: "friday",
  });

  // Tuesday range - check if we're past Tuesday noon ET
  let startTuesday = new Date(recentTuesday);
  let endTuesday = new Date(recentTuesday);
  endTuesday.setTime(endTuesday.getTime() + 7 * 24 * 60 * 60 * 1000);

  // If we're on Tuesday and past noon ET, move to next week's range
  if (currentET.dayOfWeek === 2 && currentET.hour >= 12) {
    startTuesday.setTime(
      startTuesday.getTime() + 7 * 24 * 60 * 60 * 1000
    );
    endTuesday.setTime(endTuesday.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  specificRanges.push({
    start: new Date(startTuesday),
    end: new Date(endTuesday),
    type: "tuesday",
  });

  // Generate past ranges for both Friday and Tuesday
  let pastFriday = new Date(recentFriday);
  let pastTuesday = new Date(recentTuesday);

  // Go back 8 weeks for each pattern
  for (let i = 0; i < 8; i++) {
    // Friday ranges
    const endFridayPast = new Date(pastFriday);
    pastFriday = new Date(pastFriday);
    pastFriday.setTime(pastFriday.getTime() - 7 * 24 * 60 * 60 * 1000);

    if (pastFriday >= minDate && pastFriday <= maxDate) {
      specificRanges.push({
        start: new Date(pastFriday),
        end: new Date(endFridayPast),
        type: "friday",
      });
    }

    // Tuesday ranges
    const endTuesdayPast = new Date(pastTuesday);
    pastTuesday = new Date(pastTuesday);
    pastTuesday.setTime(pastTuesday.getTime() - 7 * 24 * 60 * 60 * 1000);

    if (pastTuesday >= minDate && pastTuesday <= maxDate) {
      specificRanges.push({
        start: new Date(pastTuesday),
        end: new Date(endTuesdayPast),
        type: "tuesday",
      });
    }
  }

  // Sort ranges by start date (most recent first)
  specificRanges.sort((a, b) => b.start - a.start);

  // Process each range - only include ranges that have started (noon ET on start date)
  specificRanges.forEach((range) => {
    // Check if the range has started (noon ET on start date)
    // Get ET components and create YYYY-MM-DD string
    const startET = getETComponents(range.start);
    const startYear = startET.year;
    const startMonth = String(startET.month + 1).padStart(2, "0");
    const startDayNum = String(startET.day).padStart(2, "0");
    const startDateStr = `${startYear}-${startMonth}-${startDayNum}`;

    // Use common function to create ET noon date
    const rangeStartNoon = parseETNoonDate(startDateStr);

    // Current time
    const now = new Date();

    // Only include ranges where start date noon has passed
    if (rangeStartNoon <= now) {
      // Get day of week in ET timezone
      const endET = getETComponents(range.end);
      const startDay = dayNames[startET.dayOfWeek];
      const endDay = dayNames[endET.dayOfWeek];

      // Use ET date components to avoid timezone issues
      // startDateStr already created above
      const endYear = endET.year;
      const endMonth = String(endET.month + 1).padStart(2, "0");
      const endDayNum = String(endET.day).padStart(2, "0");
      const endStr = `${endYear}-${endMonth}-${endDayNum}`;

      const startLabel = range.start.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const endLabel = range.end.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      // Shorter format for mobile
      const mobileDisplay = `${startLabel.replace('.', '')} - ${endLabel.replace('.', '')} (${startDay.slice(0,3)})`;
      const desktopDisplay = `${startLabel} - ${endLabel} (${startDay}-${endDay})`;

      ranges.push({
        value: `${startDateStr}|${endStr}|${startDay.toLowerCase()}`,
        display: desktopDisplay,
        mobileDisplay: mobileDisplay,
        startDate: startDateStr,
        endDate: endStr,
        endDateTime: range.end,
      });
    }
  });

  // Sort ranges by start date in descending order (most recent first)
  ranges.sort((a, b) => {
    const dateA = new Date(a.startDate);
    const dateB = new Date(b.startDate);
    return dateB - dateA;
  });

  // Add all ranges to dropdown using DocumentFragment for better performance
  const fragment = document.createDocumentFragment();
  const isMobile = window.innerWidth < 640;

  ranges.forEach((range) => {
    const option = document.createElement("option");
    option.value = range.value;
    option.textContent = isMobile ? (range.mobileDisplay || range.display) : range.display;
    option.dataset.display = range.display;
    option.dataset.mobileDisplay = range.mobileDisplay || range.display;
    fragment.appendChild(option);
  });

  select.appendChild(fragment);

  debugLog(`populateWeekRanges: created ${ranges.length} options in ${(performance.now() - populateStart).toFixed(2)}ms`);

  // Find the ongoing range with the earliest end date (will end soonest)
  const now = new Date();
  let earliestEndingOngoingIndex = -1;
  let earliestEndDate = null;

  ranges.forEach((range, index) => {
    // Check if this range is ongoing (end date ET noon hasn't passed)
    // Use common function to create ET noon date
    const endDateNoon = parseETNoonDate(range.endDate);

    if (endDateNoon > now) {
      // This range is ongoing
      if (!earliestEndDate || endDateNoon < earliestEndDate) {
        // This is the earliest ending ongoing range so far
        earliestEndDate = endDateNoon;
        earliestEndingOngoingIndex = index + 1; // +1 for the "Select a week range..." option
      }
    }
  });

  // Restore previous selection if it exists, otherwise use default
  let selectionRestored = false;

  if (currentSelection) {
    // Try to restore the previous selection
    for (let i = 0; i < select.options.length; i++) {
      if (select.options[i].value === currentSelection) {
        select.options[i].selected = true;
        selectionRestored = true;
        break;
      }
    }
  }

  // If no previous selection or it doesn't exist anymore, use default
  if (!selectionRestored) {
    if (earliestEndingOngoingIndex > 0) {
      select.options[earliestEndingOngoingIndex].selected = true;
    } else if (ranges.length > 0) {
      // If all ranges are completed, select the most recent
      select.options[1].selected = true;
    }
  }
}

/**
 * Update date range when dropdown changes
 * Disables dropdown until all calculations complete
 * Uses requestIdleCallback for non-blocking updates
 */
export function updateDateRange() {
  const select = document.getElementById("weekRange");
  const selectedValue = select.value;

  // Haptic feedback for dropdown change
  if (isMobileDevice()) {
    triggerHaptic('light');
  }

  if (selectedValue && state.rawTweets) {
    const overallStartTime = performance.now();
    debugLog("=== Reprocessing data for new date range ===");

    const { startDate, endDate, type } = getSelectedDateRange();

    // Execute all work in single requestAnimationFrame - total ~17ms is acceptable
    requestAnimationFrame(() => {
      const t1 = performance.now();
      updateState({ currentData: processData(state.rawTweets, startDate, endDate, type) });
      renderHeatmap(state.currentData);
      debugLog(`Phase 1 (current heatmap): ${(performance.now() - t1).toFixed(2)}ms`);

      const t2 = performance.now();
      const avgData = calculate4WeekAverage(state.rawTweets, startDate, endDate);
      renderAverageHeatmap(avgData);
      debugLog(`Phase 2 (4-week avg): ${(performance.now() - t2).toFixed(2)}ms`);

      const t3 = performance.now();
      const predictions = calculatePredictions(state.currentData, avgData);
      debugLog(`Phase 3 (predictions calc): ${(performance.now() - t3).toFixed(2)}ms`);

      // Update all prediction indicators
      document.getElementById("currentPace").textContent = predictions.pace;

      const next24hEl = document.getElementById("next24hPrediction");
      if (predictions.next24hMin !== undefined && predictions.next24hMax !== undefined) {
        next24hEl.textContent = `${predictions.next24h.toLocaleString()} (${predictions.next24hMin}-${predictions.next24hMax})`;
      } else {
        next24hEl.textContent = predictions.next24h.toLocaleString();
      }

      const endOfRangeEl = document.getElementById("weekEndPrediction");
      if (predictions.endOfRangeMin !== undefined && predictions.endOfRangeMax !== undefined) {
        endOfRangeEl.textContent = `${predictions.endOfRange.toLocaleString()} (${predictions.endOfRangeMin.toLocaleString()}-${predictions.endOfRangeMax.toLocaleString()})`;
      } else {
        endOfRangeEl.textContent = predictions.endOfRange.toLocaleString();
      }

      document.getElementById("trendIndicator").textContent = predictions.trend;

      const momentumEl = document.getElementById("momentumIndicator");
      if (predictions.momentum !== undefined) {
        momentumEl.textContent = predictions.momentum.toFixed(2) + "x";
      } else {
        momentumEl.textContent = "-";
      }

      const totalTime = (performance.now() - overallStartTime).toFixed(2);
      debugLog(`=== TOTAL TIME: ${totalTime}ms ===`);
    });
  } else if (selectedValue) {
    // If no raw data available, load from API
    loadData();
  }
}

/**
 * Get selected date range from dropdown
 * @returns {Object} Object with startDate, endDate, and type
 */
export function getSelectedDateRange() {
  const select = document.getElementById("weekRange");
  const selectedValue = select.value;

  if (selectedValue) {
    const parts = selectedValue.split("|");
    const [startDate, endDate] = parts;
    const type = parts[2] || "friday"; // Default to friday if not specified
    return { startDate, endDate, type };
  }

  return { startDate: null, endDate: null, type: null };
}

/**
 * Handle file upload
 * @param {Event} event - File input change event
 */
export function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const csvText = e.target.result;
      // Parse last 5 weeks of data
      const tweets = parseCSV(csvText, 5);

      if (tweets.length === 0) {
        alert("No valid tweets found in the uploaded file");
        return;
      }

      debugLog(`Loaded ${tweets.length} tweets from uploaded file`);

      // Store raw tweets for future use
      updateState({ rawTweets: tweets });

      // Populate week ranges when file is uploaded
      populateWeekRanges(tweets);
      updateLastTweetTime(tweets);

      const { startDate, endDate, type } = getSelectedDateRange();
      updateState({ currentData: processData(tweets, startDate, endDate, type) });
      renderHeatmap(state.currentData);

      // Calculate and render 4-week average
      const avgData = calculate4WeekAverage(tweets, startDate, endDate);
      renderAverageHeatmap(avgData);

      // Calculate and display predictions
      const predictions = calculatePredictions(state.currentData, avgData);
      document.getElementById("currentPace").textContent = predictions.pace;

      // Next 24h with confidence interval
      const next24hEl = document.getElementById("next24hPrediction");
      if (predictions.next24hMin !== undefined && predictions.next24hMax !== undefined) {
        next24hEl.textContent = `${predictions.next24h.toLocaleString()} (${predictions.next24hMin}-${predictions.next24hMax})`;
      } else {
        next24hEl.textContent = predictions.next24h.toLocaleString();
      }

      // End of range with confidence interval
      const endOfRangeEl = document.getElementById("weekEndPrediction");
      if (predictions.endOfRangeMin !== undefined && predictions.endOfRangeMax !== undefined) {
        endOfRangeEl.textContent = `${predictions.endOfRange.toLocaleString()} (${predictions.endOfRangeMin.toLocaleString()}-${predictions.endOfRangeMax.toLocaleString()})`;
      } else {
        endOfRangeEl.textContent = predictions.endOfRange.toLocaleString();
      }

      // Trend
      document.getElementById("trendIndicator").textContent = predictions.trend;

      // Momentum
      const momentumEl = document.getElementById("momentumIndicator");
      if (predictions.momentum !== undefined) {
        momentumEl.textContent = predictions.momentum.toFixed(2) + "x";
      } else {
        momentumEl.textContent = "-";
      }
    } catch (error) {
      alert("Error parsing CSV file: " + error.message);
    }
  };

  reader.readAsText(file);
}

/**
 * Toggle auto refresh on/off
 */
export function toggleAutoRefresh() {
  const btn = document.getElementById("autoRefreshBtn");

  if (state.isAutoRefreshEnabled) {
    // Disable auto refresh
    updateState({ isAutoRefreshEnabled: false });
    if (state.autoRefreshInterval) {
      clearInterval(state.autoRefreshInterval);
      updateState({ autoRefreshInterval: null });
    }
    if (state.countdownInterval) {
      clearInterval(state.countdownInterval);
      updateState({ countdownInterval: null });
    }
    btn.innerHTML = '<span class="lg:hidden">⏰ Auto</span><span class="hidden lg:inline">⏰ Auto Refresh</span>';
    btn.className =
      "px-3 py-2.5 lg:flex-1 text-xs sm:text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md font-bold transition-all duration-200 transform active:scale-95 min-h-[44px] whitespace-nowrap";
  } else {
    // Enable auto refresh
    updateState({ isAutoRefreshEnabled: true });
    const interval = setInterval(() => {
      if (!state.isLoadingData) {
        debugLog("Auto refreshing data...");
        window.loadData();
      } else {
        debugLog("Skipping auto refresh - already loading");
      }
    }, AUTO_REFRESH_INTERVAL);
    updateState({ autoRefreshInterval: interval });

    btn.className =
      "px-3 py-2.5 lg:flex-1 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-md font-bold transition-all duration-200 transform active:scale-95 min-h-[44px] whitespace-nowrap";
    startRefreshCountdown();
  }
}

/**
 * Start refresh countdown timer
 */
export function startRefreshCountdown() {
  if (!state.isAutoRefreshEnabled) return;

  updateState({ refreshCountdown: 60 }); // 60 seconds

  if (state.countdownInterval) {
    clearInterval(state.countdownInterval);
  }

  const interval = setInterval(() => {
    updateState({ refreshCountdown: state.refreshCountdown - 1 });
    updateCountdownDisplay();

    if (state.refreshCountdown <= 0) {
      updateState({ refreshCountdown: 60 }); // Reset for next cycle
    }
  }, 1000);
  updateState({ countdownInterval: interval });

  updateCountdownDisplay();
}

/**
 * Update countdown display in button
 */
export function updateCountdownDisplay() {
  const btn = document.getElementById("autoRefreshBtn");
  if (btn && state.isAutoRefreshEnabled) {
    const minutes = Math.floor(state.refreshCountdown / 60);
    const seconds = state.refreshCountdown % 60;
    const timeStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    btn.innerHTML = `<span class="lg:hidden">⏰ ${timeStr}</span><span class="hidden lg:inline">⏰ Refresh in ${timeStr}</span>`;
  }
}

/**
 * Find and display the most recent tweet time
 * @param {Array} tweets - Array of tweet objects
 */
export function updateLastTweetTime(tweets) {
  const lastTweetElement = document.getElementById("lastTweetTime");
  if (!lastTweetElement || !tweets || tweets.length === 0) {
    if (lastTweetElement) lastTweetElement.textContent = "-";
    return;
  }

  // Find the most recent tweet
  let mostRecentDate = null;
  tweets.forEach(tweet => {
    const date = parseTwitterDate(tweet.created_at);
    if (date && (!mostRecentDate || date > mostRecentDate)) {
      mostRecentDate = date;
    }
  });

  if (!mostRecentDate) {
    lastTweetElement.textContent = "-";
    return;
  }

  // Calculate time difference
  const now = new Date();
  const diffMs = now - mostRecentDate;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let displayText;
  if (diffMinutes < 1) {
    displayText = "Just now";
  } else if (diffMinutes < 60) {
    displayText = `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    displayText = `${diffHours}h ago`;
  } else if (diffDays < 7) {
    displayText = `${diffDays}d ago`;
  } else {
    // Show actual date for older tweets
    const etComponents = getETComponents(mostRecentDate);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    displayText = `${monthNames[etComponents.month]} ${etComponents.day}`;
  }

  lastTweetElement.textContent = displayText;
}

/**
 * Update last refresh time display
 */
export function updateLastRefreshTime() {
  const lastUpdatedElement = document.getElementById("lastUpdated");
  if (lastUpdatedElement) {
    const now = new Date();
    const timeString = now.toLocaleTimeString("en-US", {
      hour12: true,
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    });
    lastUpdatedElement.innerHTML = `<span class="text-gray-900 dark:text-gray-100">${timeString}</span>`;
  }
}

/**
 * Swipe gesture detection class
 */
export class SwipeDetector {
  constructor(element, callbacks) {
    this.element = element;
    this.callbacks = callbacks;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchEndX = 0;
    this.touchEndY = 0;
    this.minSwipeDistance = 50;
    this.maxVerticalDistance = 100;

    this.init();
  }

  init() {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
  }

  handleTouchStart(e) {
    this.touchStartX = e.changedTouches[0].clientX;
    this.touchStartY = e.changedTouches[0].clientY;
  }

  handleTouchEnd(e) {
    this.touchEndX = e.changedTouches[0].clientX;
    this.touchEndY = e.changedTouches[0].clientY;
    this.handleSwipe();
  }

  handleSwipe() {
    const horizontalDistance = this.touchEndX - this.touchStartX;
    const verticalDistance = Math.abs(this.touchEndY - this.touchStartY);

    // Check if it's a horizontal swipe
    if (Math.abs(horizontalDistance) > this.minSwipeDistance && verticalDistance < this.maxVerticalDistance) {
      if (horizontalDistance > 0) {
        if (this.callbacks.onSwipeRight) this.callbacks.onSwipeRight();
      } else {
        if (this.callbacks.onSwipeLeft) this.callbacks.onSwipeLeft();
      }
    }
  }
}

/**
 * Update dropdown text based on screen size
 */
export function updateDropdownText() {
  const select = document.getElementById('weekRange');
  if (!select) return;

  const isMobile = window.innerWidth < 640;
  for (let option of select.options) {
    if (option.dataset.mobileDisplay && option.dataset.display) {
      option.textContent = isMobile ? option.dataset.mobileDisplay : option.dataset.display;
    }
  }
}

