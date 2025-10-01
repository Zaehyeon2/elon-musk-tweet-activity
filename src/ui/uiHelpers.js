/**
 * UI Helpers - Loading states, error handling, and UI updates
 */

/**
 * UI object with helper methods for common UI operations
 */
export const UI = {
  /**
   * Show skeleton loader in container
   * @param {string} containerId - Container element ID
   */
  showSkeletonLoader(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      let html = `
        <div class="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg p-6">
          <div class="animate-pulse">
            <div class="flex items-center justify-center mb-4">
              <div class="h-2 bg-gray-300 dark:bg-gray-700 rounded w-32 shimmer"></div>
            </div>
            <table class="w-full table-fixed border-collapse">
      `;

      // Skeleton header
      html += '<tr class="border-b border-gray-200 dark:border-gray-700">';
      html += '<th class="h-7 bg-gray-200 dark:bg-gray-700 rounded shimmer"></th>';
      for (let i = 0; i < 8; i++) {
        html += '<th class="h-7 bg-gray-200 dark:bg-gray-700 rounded mx-1 shimmer"></th>';
      }
      html += '</tr>';

      // Skeleton rows
      for (let h = 0; h < 24; h++) {
        html += '<tr class="border-b border-gray-100 dark:border-gray-800">';
        html += '<td class="h-7 bg-gray-200 dark:bg-gray-700 rounded my-1 shimmer"></td>';
        for (let d = 0; d < 8; d++) {
          const delay = (h * 8 + d) * 50;
          html += `<td class="h-7 bg-gray-200 dark:bg-gray-700 rounded m-1 shimmer" style="animation-delay: ${delay}ms"></td>`;
        }
        html += '</tr>';
      }

      html += `
            </table>
          </div>
          <div class="text-center mt-4">
            <p class="text-sm text-gray-500 dark:text-gray-400 animate-pulse">Loading tweet data...</p>
          </div>
        </div>
      `;
      container.innerHTML = html;
    }
  },

  /**
   * Show loading indicator with message
   * @param {string} containerId - Container element ID
   * @param {string} message - Loading message
   */
  showLoadingIndicator(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div class="flex items-center justify-center p-8 text-gray-600 dark:text-gray-400">
          <div class="text-center">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mb-4"></div>
            <div>${message}</div>
          </div>
        </div>
      `;
    }
  },

  /**
   * Show error message in container
   * @param {string} containerId - Container element ID
   * @param {string} message - Error message
   * @param {string|null} details - Optional error details
   */
  showError(containerId, message, details = null) {
    const container = document.getElementById(containerId);
    if (container) {
      let html = `
        <div class="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg p-6">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800 dark:text-red-400">
                ${message}
              </h3>
              ${details ? `
                <div class="mt-2 text-sm text-red-700 dark:text-red-500">
                  ${details}
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
      container.innerHTML = html;
    }
  },

  /**
   * Update button text and disabled state
   * @param {string} selector - CSS selector for button
   * @param {string} text - Button text
   * @param {boolean} disabled - Whether button should be disabled
   */
  updateButton(selector, text, disabled = false) {
    const btn = document.querySelector(selector);
    if (btn) {
      btn.disabled = disabled;
      btn.textContent = text;
      if (disabled) {
        btn.classList.add("opacity-60", "cursor-not-allowed");
      } else {
        btn.classList.remove("opacity-60", "cursor-not-allowed");
      }
    }
  },

  /**
   * Update indicator element text using requestAnimationFrame for performance
   * @param {string} id - Element ID
   * @param {string} value - New value to display
   */
  updateIndicator(id, value) {
    requestAnimationFrame(() => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value;
      }
    });
  },
};

/**
 * Update scroll indicators
 * @param {HTMLElement} container - Container element
 */
export function updateScrollIndicators(container) {
  if (!container) return;

  const canScrollLeft = container.scrollLeft > 0;
  const canScrollRight = container.scrollLeft < (container.scrollWidth - container.clientWidth - 1);

  container.classList.toggle('can-scroll-left', canScrollLeft);
  container.classList.toggle('can-scroll-right', canScrollRight);
}

/**
 * Initialize scroll indicators for a container
 * @param {string} containerId - Container element ID
 */
export function initScrollIndicators(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    // Initial check
    setTimeout(() => updateScrollIndicators(container), 100);

    // Update on scroll
    container.addEventListener('scroll', () => {
      updateScrollIndicators(container);
    }, { passive: true });

    // Update on resize
    window.addEventListener('resize', () => {
      updateScrollIndicators(container);
    }, { passive: true });

  }
}
