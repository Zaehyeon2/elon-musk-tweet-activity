/**
 * Theme initialization script to prevent FOUC (Flash of Unstyled Content)
 * This should be injected into the HTML head as an inline script
 */

export const themeInitScript = `
  (function() {
    try {
      // Get saved theme preference
      const savedPreference = localStorage.getItem('theme-preference');
      const savedTheme = localStorage.getItem('theme');

      let theme = 'light';

      if (savedPreference === 'system' || !savedPreference) {
        // Use system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        theme = prefersDark ? 'dark' : 'light';
      } else if (savedPreference === 'dark' || savedPreference === 'light') {
        theme = savedPreference;
      } else if (savedTheme) {
        // Fallback to old theme storage
        theme = savedTheme;
      }

      // Apply theme immediately
      document.documentElement.classList.add(theme);

      // Add transition class after initial load to prevent flash
      document.addEventListener('DOMContentLoaded', function() {
        setTimeout(function() {
          document.documentElement.classList.add('theme-transition');
        }, 100);
      });
    } catch (e) {
      // Fallback to light theme if anything goes wrong
      document.documentElement.classList.add('light');
    }
  })();
`;

/**
 * Initialize theme on app start (for client-side only)
 */
export function initializeTheme(): void {
  const savedPreference = localStorage.getItem('theme-preference') as
    | 'light'
    | 'dark'
    | 'system'
    | null;
  const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;

  let theme: 'light' | 'dark' = 'light';

  if (savedPreference === 'system' || !savedPreference) {
    // Use system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    theme = prefersDark ? 'dark' : 'light';
  } else if (savedPreference === 'dark') {
    theme = 'dark';
  } else if (savedTheme) {
    // Fallback to old theme storage
    theme = savedTheme;
  }

  // Apply theme
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(theme);
}
