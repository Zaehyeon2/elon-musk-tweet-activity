/**
 * UI Components - Tooltip, buttons, mobile utilities, and heatmap cell helpers
 */

import { getETComponents, parseETNoonDate, formatHour } from '../utils/dateTime.js';
import { debugLog } from '../config/constants.js';

// Global tooltip reference
let tooltip = null;

/**
 * Create tooltip element
 */
export function createTooltip() {
  tooltip = document.createElement("div");
  tooltip.className =
    "absolute bg-gray-900 dark:bg-gray-800 text-white px-3 py-2 rounded-md text-xs pointer-events-none z-50 whitespace-nowrap shadow-xl opacity-0 transition-opacity duration-200";
  document.body.appendChild(tooltip);
}

/**
 * Show tooltip with content at event position
 * @param {Event} event - Mouse or touch event
 * @param {string} content - Tooltip content
 */
export function showTooltip(event, content) {
  if (!tooltip) createTooltip();
  tooltip.textContent = content;

  // Get the target cell's position
  const rect = event.target.getBoundingClientRect();
  const scrollTop =
    window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft =
    window.pageXOffset || document.documentElement.scrollLeft;

  // Calculate initial position (above and centered)
  let left = rect.left + scrollLeft + rect.width / 2;
  let top = rect.top + scrollTop - 10;

  // Temporarily show tooltip to get its dimensions
  tooltip.style.visibility = 'hidden';
  tooltip.style.opacity = '0';
  tooltip.style.left = left + 'px';
  tooltip.style.top = top + 'px';
  tooltip.style.transform = 'translateX(-50%) translateY(-100%)';

  // Get tooltip dimensions
  const tooltipRect = tooltip.getBoundingClientRect();
  const tooltipWidth = tooltipRect.width;
  const tooltipHeight = tooltipRect.height;

  // Check if tooltip goes off viewport edges
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Adjust horizontal position if needed
  if (rect.left + rect.width / 2 - tooltipWidth / 2 < 0) {
    // Too far left
    left = scrollLeft + tooltipWidth / 2 + 10;
  } else if (rect.left + rect.width / 2 + tooltipWidth / 2 > viewportWidth) {
    // Too far right
    left = scrollLeft + viewportWidth - tooltipWidth / 2 - 10;
  }

  // Adjust vertical position if needed (show below if no room above)
  if (rect.top - tooltipHeight - 10 < 0) {
    // Show below instead
    top = rect.bottom + scrollTop + 10;
    tooltip.style.transform = 'translateX(-50%) translateY(0)';
  } else {
    tooltip.style.transform = 'translateX(-50%) translateY(-100%)';
  }

  // Apply final position
  tooltip.style.left = left + 'px';
  tooltip.style.top = top + 'px';
  tooltip.style.visibility = 'visible';

  tooltip.classList.remove("opacity-0");
  tooltip.classList.add("opacity-100");
}

/**
 * Hide tooltip
 */
export function hideTooltip() {
  if (tooltip) {
    tooltip.classList.remove("opacity-100");
    tooltip.classList.add("opacity-0");
  }
}

/**
 * Handle button click with haptic feedback and ripple effect
 * @param {Event} event - Click event
 * @param {Function} callback - Callback function to execute
 */
export function handleButtonClick(event, callback) {
  const button = event.currentTarget;

  // Trigger haptic feedback for button press
  if (isMobileDevice()) {
    triggerHaptic('medium');
  }

  // Add ripple effect
  const ripple = document.createElement('span');
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;

  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';
  ripple.className = 'absolute rounded-full bg-white opacity-30 animate-ping pointer-events-none';

  button.style.position = 'relative';
  button.style.overflow = 'hidden';
  button.appendChild(ripple);

  setTimeout(() => ripple.remove(), 600);

  // Execute callback
  if (callback) callback();
}

/**
 * Trigger haptic feedback on mobile devices
 * @param {string} pattern - Haptic pattern ('light', 'medium', 'heavy', 'double', 'success')
 */
export function triggerHaptic(pattern = 'light') {
  if ('vibrate' in navigator) {
    switch(pattern) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(25);
        break;
      case 'heavy':
        navigator.vibrate(50);
        break;
      case 'double':
        navigator.vibrate([10, 20, 10]);
        break;
      case 'success':
        navigator.vibrate([10, 50, 10, 50, 10]);
        break;
      default:
        navigator.vibrate(10);
    }
  }
}

/**
 * Handle touch events for mobile - DISABLED to prevent scroll issues
 * @param {Event} event - Touch event
 * @param {string} content - Content to show
 */
export function handleCellTouch(event, content) {
  // Disabled - was preventing scroll on mobile
  return;
}

/**
 * Detect if user is on a mobile device
 * @returns {boolean} True if mobile device
 */
export function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         ('ontouchstart' in window) ||
         (navigator.maxTouchPoints > 0);
}

/**
 * Get Tailwind CSS classes for heatmap cells based on value
 * @param {number} value - Cell value (tweet count)
 * @param {number} maxValue - Maximum value in heatmap (unused currently)
 * @param {boolean} isDisabled - Whether cell is disabled
 * @param {boolean} isFuture - Whether cell represents future time
 * @returns {string} Tailwind CSS classes
 */
export function getHeatmapTailwindClasses(
  value,
  maxValue,
  isDisabled,
  isFuture
) {
  if (isDisabled) {
    return "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border-dashed cursor-not-allowed";
  }
  if (isFuture) {
    return "bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-600 border-dashed opacity-60";
  }

  // Light mode: green gradient, Dark mode: green gradient
  if (value === 0) return "bg-green-50 dark:bg-gray-900";
  if (value > 0 && value <= 2) return "bg-green-200 dark:bg-green-950";
  if (value <= 4) return "bg-green-300 dark:bg-green-900";
  if (value <= 7) return "bg-green-500 dark:bg-green-700";
  if (value <= 9) return "bg-green-600 dark:bg-green-600";
  return "bg-green-700 dark:bg-green-500"; // 10+
}

/**
 * Determine if cell is disabled based on date range
 * @param {number} dayIndex - Day index in grid
 * @param {number} hourIndex - Hour index (0-23)
 * @param {Array} days - Array of day labels
 * @param {Object} dateRange - Date range object with start/end
 * @returns {boolean} True if cell should be disabled
 */
export function isCellDisabled(dayIndex, hourIndex, days, dateRange) {
  if (!dateRange || !dateRange.start || !dateRange.end) return false;
  // First day before noon: disabled
  if (dayIndex === 0 && hourIndex < 12) return true;
  // Last day from noon onwards: disabled
  if (dayIndex === days.length - 1 && hourIndex >= 12) return true;
  return false;
}

/**
 * Check if cell represents the current hour in ET
 * @param {string} day - Day label (e.g., "MON", "TUE")
 * @param {number} hourIndex - Hour index (0-23)
 * @returns {boolean} True if cell is current hour
 */
export function isCurrentHour(day, hourIndex) {
  const now = new Date();
  const nowET = getETComponents(now);
  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const currentDayName = dayNames[nowET.dayOfWeek];
  return day === currentDayName && hourIndex === nowET.hour;
}

/**
 * Check if cell represents a future time
 * @param {Object} dateRange - Date range object with start property
 * @param {number} dayIndex - Day index in grid
 * @param {number} hourIndex - Hour index (0-23)
 * @returns {boolean} True if cell is in the future
 */
export function isFutureTime(dateRange, dayIndex, hourIndex) {
  if (!dateRange || !dateRange.start) return false;

  const now = new Date();
  const nowET = getETComponents(now);

  let startDateStr;
  if (typeof dateRange.start === "string") {
    startDateStr = dateRange.start;
  } else {
    const startDate = new Date(dateRange.start);
    const startET = getETComponents(startDate);
    const year = startET.year;
    const month = String(startET.month + 1).padStart(2, "0");
    const day = String(startET.day).padStart(2, "0");
    startDateStr = `${year}-${month}-${day}`;
  }

  const startDateET = parseETNoonDate(startDateStr);
  const cellDateNoonET = new Date(
    startDateET.getTime() + dayIndex * 24 * 60 * 60 * 1000
  );
  const cellET = getETComponents(cellDateNoonET);

  return (
    cellET.year > nowET.year ||
    (cellET.year === nowET.year && cellET.month > nowET.month) ||
    (cellET.year === nowET.year &&
      cellET.month === nowET.month &&
      cellET.day > nowET.day) ||
    (cellET.year === nowET.year &&
      cellET.month === nowET.month &&
      cellET.day === nowET.day &&
      hourIndex > nowET.hour)
  );
}

/**
 * Create colgroup element for consistent column widths
 * @param {number} columnCount - Number of data columns
 * @returns {string} HTML string for colgroup
 */
export function createColgroup(columnCount) {
  let html = '<colgroup>';
  // First column for hour labels (fixed width)
  html += '<col style="width: 60px;">';
  // Data columns (equal width)
  const dataColWidth = `${100 / (columnCount + 1)}%`;
  for (let i = 0; i < columnCount; i++) {
    html += `<col style="width: ${dataColWidth};">`;
  }
  html += '</colgroup>';
  return html;
}

/**
 * Create heatmap table header row
 * @param {Array<string>} days - Array of day labels
 * @returns {string} HTML string for header row
 */
export function createHeatmapHeader(days) {
  let html = '<tr class="border-b border-gray-200 dark:border-gray-700">';
  html +=
    '<th class="text-right pr-2 text-xs text-gray-600 dark:text-gray-400 font-medium"></th>';
  days.forEach((day) => {
    html += `<th class="px-1 py-1 text-xs text-gray-700 dark:text-gray-300 font-semibold text-center border-l border-gray-200 dark:border-gray-700">${day}</th>`;
  });
  html += "</tr>";
  return html;
}

/**
 * Create totals/average row for heatmap
 * @param {Array<number>} totals - Array of total values per column
 * @param {string} label - Row label (e.g., "TOTALS", "AVG")
 * @returns {string} HTML string for totals row
 */
export function createTotalsRow(totals, label = "TOTALS") {
  let html = '<tr class="bg-gray-100 dark:bg-gray-800 font-bold">';
  html += `<td class="h-7 p-0 relative text-center text-gray-700 dark:text-gray-300 font-bold"><span class="absolute inset-0 flex items-center justify-center text-[9px] sm:text-[11px]">${label}</span></td>`;
  totals.forEach((total) => {
    html += `<td class="h-7 p-0 relative text-center text-gray-700 dark:text-gray-300 font-bold border border-gray-200 dark:border-gray-700"><span class="absolute inset-0 flex items-center justify-center text-[9px] sm:text-[11px]">${total}</span></td>`;
  });
  html += "</tr>";
  return html;
}

/**
 * Generate day labels for heatmap based on start date
 * @param {Date} startDate - Starting date
 * @param {number} dayCount - Number of days to generate
 * @returns {Array<string>} Array of day labels (e.g., ["FRI", "SAT", ...])
 */
export function generateDayLabels(startDate, dayCount) {
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
