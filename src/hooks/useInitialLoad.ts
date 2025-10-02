import { useEffect } from 'react';

import { useAppStore } from '@/store/useAppStore';

/**
 * Hook to load initial data on app mount
 */
export function useInitialLoad() {
  const loadData = useAppStore((state) => state.loadData);

  useEffect(() => {
    // Load data on mount
    void loadData(false);
  }, [loadData]);
}
