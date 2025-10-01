/**
 * Heatmap rendering module
 */

import {
  createColgroup,
  createHeatmapHeader,
  createTotalsRow,
  getHeatmapTailwindClasses,
  isCellDisabled,
  isCurrentHour,
  isFutureTime,
} from './components.js';
import { getETComponents, parseETNoonDate } from '../utils/dateTime.js';
import { debugLog } from '../config/constants.js';
import { updateScrollIndicators } from './uiHelpers.js';

/**
 * Render average heatmap with requestAnimationFrame
 * @param {Object} data - Average heatmap data
 * @param {Object} currentRange - Current date range
 */
export function renderAverageHeatmap(data) {
  requestAnimationFrame(() => {
    renderAverageHeatmapInternal(data);
  });
}

function renderAverageHeatmapInternal(data) {
  const container = document.getElementById("averageHeatmapContainer");

  if (!data) {
    container.innerHTML = `
      <div class="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900/20 dark:to-blue-900/20 border border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-900/50 rounded-full mb-4">
          <svg class="w-8 h-8 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-400 mb-2">No Historical Data</h3>
        <p class="text-sm text-gray-600 dark:text-gray-500">4-week average data is not available yet.</p>
        <p class="text-xs text-gray-500 dark:text-gray-600 mt-2">Data will appear once sufficient history is collected.</p>
      </div>
    `;
    document.getElementById("avgValue").textContent = "-";
    return;
  }

  const { grid, hours, days, totals, current, maxValue, dateRange } =
    data;

  // Batch update 4-week average indicator
  requestAnimationFrame(() => {
    const element = document.getElementById("avgValue");
    if (element) {
      element.textContent = Math.round(current).toLocaleString();
    }
  });

  let html = '<table class="w-full table-fixed border-collapse">';
  html += createColgroup(days.length);
  html += createHeatmapHeader(days);

  // Data rows
  hours.forEach((hour, hourIndex) => {
    html += '<tr class="border-b border-gray-100 dark:border-gray-800">';
    html += `<td class="h-7 p-0 relative bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-bold text-center whitespace-nowrap border-r border-gray-200 dark:border-gray-700"><span class="absolute inset-0 flex items-center justify-center text-[9px] sm:text-[11px]">${hour}</span></td>`;

    days.forEach((day, dayIndex) => {
      let value = grid[hourIndex][dayIndex];
      let displayValue = value > 0 ? value.toFixed(1) : "0.0";

      // Check if this cell should be disabled (noon rule applied)
      let isDisabled = isCellDisabled(
        dayIndex,
        hourIndex,
        days,
        dateRange
      );
      if (isDisabled) {
        displayValue = "-";
        value = 0;
      }

      // Check if this is the current time
      let isCurrentTime = isCurrentHour(day, hourIndex) && !isDisabled;

      let isFuture = false;

      // Get Tailwind classes for the cell - override if current time
      let cellClasses;
      let borderClasses = "border border-gray-200 dark:border-gray-700";

      if (isCurrentTime && !isDisabled) {
        // Special styling for current hour - red border
        cellClasses = getHeatmapTailwindClasses(
          value,
          maxValue,
          isDisabled,
          isFuture
        );
        borderClasses =
          "border border-red-500 dark:border-yellow-400 outline outline-2 outline-offset-[-2px] outline-red-500 dark:outline-yellow-400";
      } else {
        cellClasses = getHeatmapTailwindClasses(
          value,
          maxValue,
          isDisabled,
          isFuture
        );
      }

      let tooltipText = `${day} ${hour}: ${value.toFixed(1)} avg tweets`;
      if (isCurrentTime) {
        tooltipText += " 🔴 CURRENT HOUR";
      }

      // Determine text color based on value and state
      let textColor = "";

      // Text color based on value and state
      if (isDisabled) {
        textColor = "text-gray-400 dark:text-gray-600";
      } else if (isFuture) {
        textColor = "text-gray-400 dark:text-gray-600";
      } else if (value === 0) {
        textColor = "text-gray-600 dark:text-gray-400";
      } else if (value <= 2) {
        textColor = "text-gray-700 dark:text-gray-300";
      } else if (value <= 4) {
        textColor = "text-gray-800 dark:text-gray-200";
      } else if (value <= 7) {
        textColor = "text-gray-900 dark:text-gray-100";
      } else {
        textColor = "text-white"; // High values always white
      }

      // Remove tooltips on mobile to prevent scroll issues
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        html += `<td class="h-7 p-0 relative transition-all duration-150 heatmap-cell ${cellClasses} ${borderClasses}"
                    data-value="${value}">`;
      } else {
        html += `<td class="h-7 p-0 relative cursor-pointer transition-all duration-150 hover:z-10 heatmap-cell ${cellClasses} ${borderClasses}"
                    onmouseover="showTooltip(event, '${tooltipText}')"
                    onmouseout="hideTooltip()"
                    data-value="${value}">`;
      }
      html += `<span class="absolute inset-0 flex items-center justify-center text-[9px] sm:text-[11px] font-semibold ${textColor} overflow-hidden pointer-events-none transition-all duration-300">${displayValue}</span>`;
      html += "</td>";
    });

    html += "</tr>";
  });

  // Totals row
  html += createTotalsRow(totals, "AVG");

  html += "</table>";

  // Use DocumentFragment for better performance
  const fragment = document.createDocumentFragment();
  const temp = document.createElement('div');
  temp.innerHTML = html;
  while (temp.firstChild) {
    fragment.appendChild(temp.firstChild);
  }
  // Smooth transition with animations
  container.style.transition = 'opacity 0.3s ease';
  container.style.opacity = '0';

  setTimeout(() => {
    container.innerHTML = '';
    container.appendChild(fragment);
    container.style.opacity = '1';

    // Animate cells
    const cells = container.querySelectorAll('.heatmap-cell');
    cells.forEach((cell, index) => {
      const value = parseInt(cell.dataset.value || 0);
      setTimeout(() => {
        cell.classList.add('fade-enter-active');
        // Add glow effect for high values
        if (value >= 10) {
          cell.classList.add('high-value-glow');
        }
      }, Math.min(index * 2, 100)); // Cap delay to prevent too long animation
    });

    // Update scroll indicators after render
    updateScrollIndicators(container);
  }, 200);
}

// Render heatmap with requestAnimationFrame
export function renderHeatmap(data) {
  requestAnimationFrame(() => {
    renderHeatmapInternal(data);
  });
}

function renderHeatmapInternal(data) {
  const container = document.getElementById("heatmapContainer");

  if (!data) {
    // Improved empty state design
    container.style.opacity = '0';
    setTimeout(() => {
      container.innerHTML = `
        <div class="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-300 dark:border-red-700 rounded-lg p-8 text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full mb-4">
            <svg class="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">Unable to Process Data</h3>
          <p class="text-sm text-red-600 dark:text-red-500 mb-4">The tweet data could not be processed at this time.</p>
          <button onclick="handleButtonClick(event, () => loadData(true))" class="px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white rounded-md font-semibold transition-all duration-200 transform active:scale-95">
            Try Again
          </button>
        </div>
      `;
      container.style.opacity = '1';
    }, 200);
    return;
  }

  const {
    grid,
    hours,
    days,
    totals,
    current,
    maxValue,
    peakHour,
    mostActiveDay,
    dateRange,
  } = data;

  // Batch DOM updates to minimize reflows
  requestAnimationFrame(() => {
    const updates = [
      { id: "currentValue", value: current.toLocaleString() },
      { id: "peakHour", value: peakHour },
      { id: "mostActiveDay", value: mostActiveDay }
    ];

    // Batch all reads first, then writes
    const elements = new Map();
    updates.forEach(({ id }) => {
      elements.set(id, document.getElementById(id));
    });

    // Then batch all writes
    updates.forEach(({ id, value }) => {
      const element = elements.get(id);
      if (element) element.textContent = value;
    });
  });

  let html = '<table class="w-full table-fixed border-collapse">';
  html += createColgroup(days.length);
  html += createHeatmapHeader(days);

  // Data rows
  hours.forEach((hour, hourIndex) => {
    html += '<tr class="border-b border-gray-100 dark:border-gray-800">';
    html += `<td class="h-7 p-0 relative bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-bold text-center whitespace-nowrap border-r border-gray-200 dark:border-gray-700"><span class="absolute inset-0 flex items-center justify-center text-[9px] sm:text-[11px]">${hour}</span></td>`;

    days.forEach((day, dayIndex) => {
      let value = grid[hourIndex][dayIndex];
      let displayValue = value >= 0 ? value : ""; // Show 0 instead of empty

      // Check if this cell should be disabled (noon rule applied)
      let isDisabled = isCellDisabled(
        dayIndex,
        hourIndex,
        days,
        dateRange
      );
      if (isDisabled) {
        displayValue = "-";
        value = 0; // Set value to 0 for disabled cells
      }

      // Check if this is the current time or future time
      let isCurrentTime = isCurrentHour(day, hourIndex) && !isDisabled;
      let isFuture = false;

      isFuture = isFutureTime(dateRange, dayIndex, hourIndex);

      // Apply future style if needed
      if (isFuture && !isDisabled) {
        displayValue = ""; // Empty for future
      }

      // Get Tailwind classes for the cell
      let cellClasses = getHeatmapTailwindClasses(
        value,
        maxValue,
        isDisabled,
        isFuture
      );
      let borderClasses = "border border-gray-200 dark:border-gray-700";

      // Special styling for current hour
      if (isCurrentTime && !isDisabled) {
        borderClasses =
          "border border-red-500 dark:border-yellow-400 outline outline-2 outline-offset-[-2px] outline-red-500 dark:outline-yellow-400";
      }

      // Create tooltip with actual date if available
      let tooltipText = `${day} ${hour}: ${value} tweets`;
      if (dateRange && dateRange.start) {
        // Use parseETNoonDate to properly handle the date
        let startDateStr;
        if (typeof dateRange.start === "string") {
          startDateStr = dateRange.start;
        } else {
          const startET = getETComponents(new Date(dateRange.start));
          startDateStr = `${startET.year}-${String(
            startET.month + 1
          ).padStart(2, "0")}-${String(startET.day).padStart(2, "0")}`;
        }

        const startDate = parseETNoonDate(startDateStr);
        const cellDate = new Date(
          startDate.getTime() + dayIndex * 24 * 60 * 60 * 1000
        );
        const cellET = getETComponents(cellDate);

        // Format date in ET
        const monthNames = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        const dateStr = `${monthNames[cellET.month]} ${cellET.day}`;

        if (isFuture && !isDisabled) {
          tooltipText = `${dateStr} (${day}) ${hour}: Future`;
        } else {
          tooltipText = `${dateStr} (${day}) ${hour}: ${value} tweets`;
        }

        if (isCurrentTime) {
          tooltipText += " 🔴 CURRENT HOUR";
        }
      }

      // Determine text color based on value and state
      let textColor = "";

      // Text color based on value and state
      if (isDisabled) {
        textColor = "text-gray-400 dark:text-gray-600";
      } else if (isFuture) {
        textColor = "text-gray-400 dark:text-gray-600";
      } else if (value === 0) {
        textColor = "text-gray-600 dark:text-gray-400";
      } else if (value <= 2) {
        textColor = "text-gray-700 dark:text-gray-300";
      } else if (value <= 4) {
        textColor = "text-gray-800 dark:text-gray-200";
      } else if (value <= 7) {
        textColor = "text-gray-900 dark:text-gray-100";
      } else {
        textColor = "text-white"; // High values always white
      }

      // Remove tooltips on mobile to prevent scroll issues
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        html += `<td class="h-7 p-0 relative transition-all duration-150 heatmap-cell ${cellClasses} ${borderClasses}"
                    data-value="${value}">`;
      } else {
        html += `<td class="h-7 p-0 relative cursor-pointer transition-all duration-150 hover:z-10 heatmap-cell ${cellClasses} ${borderClasses}"
                    onmouseover="showTooltip(event, '${tooltipText}')"
                    onmouseout="hideTooltip()"
                    data-value="${value}">`;
      }
      html += `<span class="absolute inset-0 flex items-center justify-center text-[9px] sm:text-[11px] font-semibold ${textColor} overflow-hidden pointer-events-none transition-all duration-300">${displayValue}</span>`;
      html += "</td>";
    });

    html += "</tr>";
  });

  // Totals row
  html += createTotalsRow(totals, "TOTALS");

  html += "</table>";

  // Use DocumentFragment for better performance
  const fragment = document.createDocumentFragment();
  const temp = document.createElement('div');
  temp.innerHTML = html;
  while (temp.firstChild) {
    fragment.appendChild(temp.firstChild);
  }
  // Smooth transition with animations
  container.style.transition = 'opacity 0.3s ease';
  container.style.opacity = '0';

  setTimeout(() => {
    container.innerHTML = '';
    container.appendChild(fragment);
    container.style.opacity = '1';

    // Animate cells
    const cells = container.querySelectorAll('.heatmap-cell');
    cells.forEach((cell, index) => {
      const value = parseInt(cell.dataset.value || 0);
      setTimeout(() => {
        cell.classList.add('fade-enter-active');
        // Add glow effect for high values
        if (value >= 10) {
          cell.classList.add('high-value-glow');
        }
      }, Math.min(index * 2, 100)); // Cap delay to prevent too long animation
    });

    // Update scroll indicators after render
    updateScrollIndicators(container);
  }, 200);
}
