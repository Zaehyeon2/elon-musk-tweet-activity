/**
 * Main application module
 * Handles application initialization and data loading
 */

// Import services
import { API } from '../services/api.js';

// Import data processors
import { parseCSV } from '../data/parser.js';
import { processData } from '../data/processor.js';
import { calculatePredictions, calculate4WeekAverage } from '../data/analytics.js';

// Import UI components and helpers
import { createTooltip, handleButtonClick, isMobileDevice } from '../ui/components.js';
import { UI, initScrollIndicators, updateScrollIndicators } from '../ui/uiHelpers.js';
import { renderHeatmap, renderAverageHeatmap } from '../ui/heatmap.js';
import {
  populateWeekRanges,
  getSelectedDateRange,
  updateLastTweetTime,
  updateLastRefreshTime,
  startRefreshCountdown,
  handleFileUpload,
  updateDropdownText,
  toggleAutoRefresh,
  updateDateRange,
  downloadCSV
} from '../ui/controls.js';
import { initTheme, toggleDarkMode } from '../ui/theme.js';

// Import state management
import { state, updateState } from '../state/appState.js';

// Import utilities
import { Cache, debounce } from '../utils/performance.js';
import { parseTwitterDate, getETComponents, parseETNoonDate } from '../utils/dateTime.js';

// Import constants
import { AUTO_REFRESH_INTERVAL, debugLog } from '../config/constants.js';

// Note: initScrollIndicators is in uiHelpers.js

/**
 * Debounced load data function
 */
const debouncedLoadData = debounce(async function(forceRefresh = false) {
  await loadDataInternal(forceRefresh);
}, 500); // 500ms debounce

/**
 * Load data from X Tracker API
 * Public API for loading data
 * @param {boolean} forceRefresh - Force refresh from API, bypass cache
 */
export async function loadData(forceRefresh = false) {
  // Use debounced version for manual triggers
  if (!forceRefresh) {
    debouncedLoadData(forceRefresh);
  } else {
    // For force refresh, call directly
    await loadDataInternal(forceRefresh);
  }
}

/**
 * Internal data loading function
 * Handles caching, API calls, and UI updates
 * @param {boolean} forceRefresh - Force refresh from API, bypass cache
 */
async function loadDataInternal(forceRefresh = false) {
  // Skip if already loading
  if (state.isLoadingData) {
    debugLog("Skipping loadData - already loading");
    return;
  }

  updateState({ isLoadingData: true });
  const container = document.getElementById("heatmapContainer");

  // Try to load from cache first if not forcing refresh
  if (!forceRefresh) {
    const cachedData = Cache.load();
    if (cachedData && cachedData.tweets) {
      debugLog(`Using cached data (${Math.round((Date.now() - cachedData.timestamp) / 1000 / 60)} minutes old)`);

      // Process cached data
      updateState({ rawTweets: cachedData.tweets });
      populateWeekRanges(cachedData.tweets);
      updateLastTweetTime(cachedData.tweets);

      const { startDate, endDate, type } = getSelectedDateRange();
      const currentData = processData(cachedData.tweets, startDate, endDate, type);
      updateState({ currentData });
      renderHeatmap(currentData);

      const avgData = calculate4WeekAverage(cachedData.tweets, startDate, endDate);
      renderAverageHeatmap(avgData);

      const predictions = calculatePredictions(currentData, avgData);
      UI.updateIndicator("currentPace", predictions.pace);

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

      UI.updateIndicator("trendIndicator", predictions.trend);

      // Momentum
      const momentumEl = document.getElementById("momentumIndicator");
      if (predictions.momentum !== undefined) {
        momentumEl.textContent = predictions.momentum.toFixed(2) + "x";
      } else {
        momentumEl.textContent = "-";
      }

      // Update last refresh time
      const lastUpdatedElement = document.getElementById("lastUpdated");
      if (lastUpdatedElement) {
        const cacheDate = new Date(cachedData.timestamp);
        const timeString = cacheDate.toLocaleTimeString("en-US", {
          hour12: true,
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
        });
        lastUpdatedElement.innerHTML = `<span class="text-gray-900 dark:text-gray-100">${timeString}</span>`;
      }

      startRefreshCountdown();
      updateState({ isLoadingData: false });

      // Fetch fresh data in background
      setTimeout(() => loadDataInternal(true), 1000);
      return;
    }
  }

  // Disable the update button
  UI.updateButton('#updateBtn', "🔄 Updating...", true);

  // Show loading progress
  const updateIndicator = document.getElementById("lastUpdated");
  if (updateIndicator) {
    const currentText = updateIndicator.textContent;
    updateIndicator.innerHTML = `<span class="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500 dark:border-blue-300 mr-2"></span><span class="text-gray-900 dark:text-gray-100">${currentText}</span>`;
  }

  try {
    debugLog("Fetching tweet data from API...");
    const csvText = await API.fetchTweetData();

    // Validate CSV data
    API.validateCSVData(csvText);

    // Parse last 5 weeks of data
    const tweets = parseCSV(csvText, 5);

    if (tweets.length === 0) {
      throw new Error("No valid tweets found");
    }

    debugLog(`Successfully loaded ${tweets.length} tweets`);

    // Store raw tweets for future use
    updateState({ rawTweets: tweets });

    // Update last tweet time
    updateLastTweetTime(tweets);

    // Cache the successful data
    Cache.save(tweets);

    // Populate week ranges on first successful load
    populateWeekRanges(tweets);

    const { startDate, endDate, type } = getSelectedDateRange();
    debugLog("Selected date range:", { startDate, endDate, type });

    const currentData = processData(tweets, startDate, endDate, type);
    updateState({ currentData });
    debugLog("Current data processed:", currentData);

    renderHeatmap(currentData);
    debugLog("Heatmap rendered");

    // Calculate and render 4-week average
    const avgData = calculate4WeekAverage(tweets, startDate, endDate);
    debugLog("4-week average calculated:", avgData);

    renderAverageHeatmap(avgData);
    debugLog("Average heatmap rendered");

    // Calculate and display predictions (batched)
    const predictions = calculatePredictions(currentData, avgData);
    requestAnimationFrame(() => {
      // Update pace
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
    });

    // Update last refresh time and start countdown
    updateLastRefreshTime();
    startRefreshCountdown();

    // Re-enable the update button
    UI.updateButton('#updateBtn', "🔄 Update", false);

    // Reset loading flag
    updateState({ isLoadingData: false });
  } catch (error) {
    console.error("Failed to load data:", error);
    debugLog("Error details:", error.message, error.stack);

    // Determine error type for better user feedback
    const errorMessage =
      error && error.message ? error.message : "Unknown error";

    let errorType = "Unknown Error";
    let errorDetails = "";
    let errorSolution = "";

    if (errorMessage.includes("fetch") || errorMessage.includes("Failed to fetch") || errorMessage.includes("network")) {
      errorType = "Network Connection Error";
      errorDetails = "Unable to connect to the X Tracker API. This could be due to network issues or CORS restrictions.";
      errorSolution = "Try refreshing the page, check your internet connection, or use a CORS extension.";
    } else if (errorMessage.includes("404")) {
      errorType = "API Not Found";
      errorDetails = "The X Tracker API endpoint could not be found. The service may have moved or changed.";
      errorSolution = "Please check if the API is still available or use the CSV upload option.";
    } else if (errorMessage.includes("500") || errorMessage.includes("502") || errorMessage.includes("503")) {
      errorType = "Server Error";
      errorDetails = "The X Tracker API server is experiencing issues.";
      errorSolution = "Please wait a few minutes and try again. The service may be temporarily down.";
    } else if (errorMessage.includes("Invalid CSV") || errorMessage.includes("No valid tweets")) {
      errorType = "Data Format Error";
      errorDetails = "The data received from the API is not in the expected format.";
      errorSolution = "The API format may have changed. Try uploading a CSV file manually.";
    } else if (errorMessage.includes("timeout")) {
      errorType = "Request Timeout";
      errorDetails = "The request took too long to complete.";
      errorSolution = "Check your internet connection speed and try again.";
    }

    // Reset the update indicator with specific error
    if (updateIndicator) {
      updateIndicator.innerHTML = `<span class="text-red-600 dark:text-red-400">⚠️ ${errorType}</span>`;
    }

    // Re-enable the update button
    UI.updateButton('#updateBtn', "🔄 Update", false);

    // Reset loading flag
    updateState({ isLoadingData: false });

    // Only show error if no previous data exists
    if (!container.querySelector("table")) {
      container.innerHTML = `
         <div class="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg p-6">
           <div class="flex items-start mb-4">
             <div class="flex-shrink-0">
               <svg class="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
             </div>
             <div class="ml-3 flex-1">
               <h3 class="text-lg font-semibold text-red-700 dark:text-red-400">${errorType}</h3>
               <p class="text-sm text-red-600 dark:text-red-500 mt-1">${errorDetails}</p>
               ${errorSolution ? `<p class="text-sm text-gray-600 dark:text-gray-400 mt-2">💡 ${errorSolution}</p>` : ''}
             </div>
           </div>
           <div class="bg-white dark:bg-gray-800 rounded-lg p-4 mt-4">
             <h4 class="font-semibold text-gray-700 dark:text-gray-300 mb-3">Alternative Solutions:</h4>
             <ul class="text-left space-y-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
               <li class="flex items-start">
                 <span class="mr-2">🔄</span>
                 <span>Wait a few minutes and retry (API might be temporarily down)</span>
               </li>
               <li class="flex items-start">
                 <span class="mr-2">📁</span>
                 <span>Upload a CSV file downloaded from <a href="https://www.xtracker.io/api/download" target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline">X Tracker</a></span>
               </li>
               <li class="flex items-start">
                 <span class="mr-2">🔧</span>
                 <span>Install a CORS browser extension like "CORS Unblock" or "CORS Everywhere"</span>
               </li>
               <li class="flex items-start">
                 <span class="mr-2">🔗</span>
                 <span>Open <a href="https://www.xtracker.io/api/download" target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline">this link</a>, save as CSV, then upload</span>
               </li>
             </ul>
             <div class="my-4 border-t border-gray-200 dark:border-gray-700 pt-4">
               <label for="csvFileInput" class="block font-semibold text-gray-700 dark:text-gray-300 mb-2">Upload CSV File:</label>
               <input type="file" id="csvFileInput" accept=".csv" class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-500 dark:hover:border-blue-400 transition-colors" onchange="handleFileUpload(event)">
             </div>
             <div class="mt-4 flex gap-2">
               <button onclick="handleButtonClick(event, () => loadData(true))" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-md font-semibold transition-all duration-200 transform active:scale-95">🔄 Retry API</button>
               <button onclick="handleButtonClick(event, () => { Cache.clear(); location.reload(); })" class="px-4 py-2 bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600 text-white rounded-md font-semibold transition-all duration-200 transform active:scale-95">🗑️ Clear Cache</button>
             </div>
           </div>
         </div>
       `;
    }
  }
}

// Expose functions globally for HTML onclick handlers and debugging
window.loadData = loadData;
window.handleFileUpload = handleFileUpload;
window.toggleAutoRefresh = toggleAutoRefresh;
window.updateDateRange = updateDateRange;
window.downloadCSV = downloadCSV;
window.toggleDarkMode = toggleDarkMode;
window.handleButtonClick = handleButtonClick;

/**
 * Initialize the application
 * Sets up theme, UI components, and loads initial data
 */
export function init() {
  console.log('init() function started');

  try {
    // Initialize theme
    console.log('Calling initTheme...');
    initTheme();

    // Initialize with empty week ranges - will be populated when data loads
    console.log('Calling populateWeekRanges...');
    populateWeekRanges();

  // Enable auto refresh by default
  const btn = document.getElementById("autoRefreshBtn");
  if (state.isAutoRefreshEnabled) {
    updateState({
      autoRefreshInterval: setInterval(() => {
        if (!state.isLoadingData) {
          debugLog("Auto refreshing data...");
          loadData(true); // Force refresh for auto-refresh
        } else {
          debugLog("Skipping auto refresh - already loading");
        }
      }, AUTO_REFRESH_INTERVAL)
    });

    btn.className =
      "px-3 py-2.5 lg:flex-1 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-md font-bold transition-all duration-200 transform active:scale-95 min-h-[44px] whitespace-nowrap";
  }

  // Mobile optimizations
  if (isMobileDevice()) {
    // Add mobile-specific class for styling
    document.body.classList.add('touch-device');

    // Prevent double-tap zoom on buttons
    document.querySelectorAll('button, select').forEach(element => {
      element.style.touchAction = 'manipulation';
    });

    // Add passive listeners for better scroll performance
    document.addEventListener('touchstart', () => {}, { passive: true });
    document.addEventListener('touchmove', () => {}, { passive: true });
  }

    // Initialize scroll indicators
    console.log('Calling initScrollIndicators...');
    initScrollIndicators('heatmapContainer');
    initScrollIndicators('averageHeatmapContainer');

    // Update dropdown text on resize
    console.log('Adding resize listener...');
    window.addEventListener('resize', debounce(updateDropdownText, 250), { passive: true });

    // Add performance monitoring for dropdown
    const select = document.getElementById('weekRange');
    if (select) {
      select.addEventListener('mousedown', () => {
        performance.mark('dropdown-open-start');
      });

      select.addEventListener('click', () => {
        performance.mark('dropdown-open-end');
        try {
          performance.measure('dropdown-open', 'dropdown-open-start', 'dropdown-open-end');
          const measure = performance.getEntriesByName('dropdown-open')[0];
          debugLog(`Dropdown opened in ${measure.duration.toFixed(2)}ms`);
          performance.clearMarks();
          performance.clearMeasures();
        } catch (e) {
          // Ignore timing errors
        }
      });

      // Monitor when dropdown is actually showing options
      let observer = new MutationObserver(() => {
        const optionCount = select.options.length;
        debugLog(`Dropdown has ${optionCount} options`);
      });
      observer.observe(select, { childList: true, subtree: true });
    }

    // Show skeleton loaders initially
    console.log('Showing skeleton loaders...');
    UI.showSkeletonLoader("heatmapContainer");
    UI.showSkeletonLoader("averageHeatmapContainer");

    // Load data - will use cache if available
    console.log('Calling loadData...');
    loadData();

    console.log('init() completed successfully');
  } catch (error) {
    console.error('Error during initialization:', error);
    alert('Failed to initialize app: ' + error.message);
  }
}
