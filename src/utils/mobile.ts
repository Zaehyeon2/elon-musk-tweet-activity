/**
 * Mobile utility functions
 * Ported from vanilla JS components.js
 */

/**
 * Detect if user is on a mobile device
 * @returns True if mobile device
 */
export function isMobileDevice(): boolean {
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0
  );
}

/**
 * Trigger haptic feedback on mobile devices
 * @param pattern - Haptic pattern ('light', 'medium', 'heavy', 'double', 'success')
 */
export function triggerHaptic(
  pattern: 'light' | 'medium' | 'heavy' | 'double' | 'success' = 'light',
): void {
  if ('vibrate' in navigator) {
    switch (pattern) {
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
 * Handle button click with haptic feedback
 * @param callback - Callback function to execute
 */
export function handleButtonClickWithHaptic(callback?: () => void): void {
  if (isMobileDevice()) {
    triggerHaptic('medium');
  }
  if (callback) {
    callback();
  }
}
