import { useCallback, useEffect, useState } from 'react';

import { useAppStore } from '@/store/useAppStore';

export type Theme = 'light' | 'dark' | 'system';

interface UseThemeReturn {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  systemTheme: 'light' | 'dark';
}

/**
 * Hook for advanced theme management with system preference detection
 */
export function useTheme(): UseThemeReturn {
  const { theme: storeTheme } = useAppStore();
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');
  const [theme, setLocalTheme] = useState<Theme>('light');

  // Detect system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    // Initial check
    handleChange(mediaQuery);

    // Listen for changes (use addEventListener - supported in all modern browsers)
    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme-preference') as Theme | null;

    if (savedTheme) {
      setLocalTheme(savedTheme);
    } else {
      // If no saved preference, use system theme
      setLocalTheme('system');
    }
  }, []);

  // Resolve the actual theme to use
  const resolvedTheme = theme === 'system' ? systemTheme : theme === 'dark' ? 'dark' : 'light';

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;

    // Remove both classes first to ensure clean transition
    root.classList.remove('light', 'dark');

    // Add the resolved theme
    root.classList.add(resolvedTheme);

    // Update store if different
    if (storeTheme !== resolvedTheme) {
      useAppStore.setState({ theme: resolvedTheme });
    }

    // Save preference
    localStorage.setItem('theme-preference', theme);

    // Also save resolved theme for faster initial load
    localStorage.setItem('theme', resolvedTheme);
  }, [resolvedTheme, theme, storeTheme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setLocalTheme(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    if (theme === 'system') {
      // If system, switch to opposite of current resolved theme
      setLocalTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    } else {
      // Otherwise just toggle
      setLocalTheme(theme === 'dark' ? 'light' : 'dark');
    }
  }, [theme, resolvedTheme]);

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    systemTheme,
  };
}
