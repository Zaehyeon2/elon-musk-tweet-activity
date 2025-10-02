/**
 * Heatmap styling utilities for shadcn/ui + Tailwind CSS
 */

/**
 * Get Tailwind CSS classes for heatmap cells based on value
 * Using GitHub-like contribution graph colors with fixed thresholds
 * @param value - Cell value (tweet count)
 * @param isDisabled - Whether cell is disabled
 * @param isFuture - Whether cell represents future time
 * @returns Tailwind CSS classes
 */
export function getHeatmapCellClasses(
  value: number,
  isDisabled: boolean,
  isFuture: boolean,
): string {
  if (isDisabled) {
    return 'bg-transparent text-gray-400 dark:text-gray-600 cursor-not-allowed';
  }

  if (isFuture) {
    return 'bg-blue-50 dark:bg-blue-950/30 text-blue-400 dark:text-blue-500 opacity-50';
  }

  // GitHub-like contribution colors
  if (value === 0) {
    return 'bg-gray-100 dark:bg-gray-800';
  }

  // Use absolute value thresholds instead of intensity for consistent colors
  if (value >= 10) {
    return 'bg-green-800 dark:bg-green-500';
  }
  if (value >= 7) {
    return 'bg-green-700 dark:bg-green-600';
  }
  if (value >= 4) {
    return 'bg-green-600 dark:bg-green-700';
  }
  if (value >= 2) {
    return 'bg-green-500 dark:bg-green-800';
  }
  return 'bg-green-400 dark:bg-green-900';
}
