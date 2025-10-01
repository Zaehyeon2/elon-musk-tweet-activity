/**
 * Application State Management
 * Centralizes all global state variables for the application
 */

/**
 * Application state object
 */
const appState = {
  // UI state
  tooltip: null,

  // Data state
  currentData: null,
  rawTweets: null,

  // Timer state
  autoRefreshInterval: null,
  countdownInterval: null,
  refreshCountdown: 0,

  // Feature flags
  isAutoRefreshEnabled: true,
  isLoadingData: false,
};

/**
 * Get current state
 * @returns {Object} Current application state
 */
export function getState() {
  return appState;
}

/**
 * Update state properties
 * @param {Object} updates - Object with state properties to update
 */
export function updateState(updates) {
  Object.assign(appState, updates);
}

/**
 * Reset state to initial values
 */
export function resetState() {
  appState.tooltip = null;
  appState.currentData = null;
  appState.rawTweets = null;
  appState.autoRefreshInterval = null;
  appState.countdownInterval = null;
  appState.refreshCountdown = 0;
  appState.isAutoRefreshEnabled = true;
  appState.isLoadingData = false;
}

// Export individual state getters/setters for convenience
export const state = appState;
