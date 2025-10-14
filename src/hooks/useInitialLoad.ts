import { useEffect } from 'react';

import { useAppStore } from '@/store/useAppStore';

/**
 * Hook to load initial data on app mount
 */
export function useInitialLoad() {
  const loadData = useAppStore((state) => state.loadData);

  useEffect(() => {
    // First load cached data immediately (if available)
    void loadData(false).then(() => {
      // Then refresh from API in background
      void loadData(true);
    });
  }, [loadData]);
}
