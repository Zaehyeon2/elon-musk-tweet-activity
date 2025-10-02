import { useEffect } from 'react';

import { useAppStore } from '@/store/useAppStore';

/**
 * Hook to manage auto-refresh functionality
 */
export function useAutoRefresh() {
  const { autoRefresh, startAutoRefresh, stopAutoRefresh } = useAppStore();

  useEffect(() => {
    if (autoRefresh) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }

    // Cleanup on unmount
    return () => {
      stopAutoRefresh();
    };
  }, [autoRefresh, startAutoRefresh, stopAutoRefresh]);
}
