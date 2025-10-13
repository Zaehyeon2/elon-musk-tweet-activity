/**
 * Performance-related React hooks
 * Provides React-friendly alternatives to vanilla JS performance utilities
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { debugLog } from '@/config/constants';
import { LRUCache } from '@/utils/performance';

/**
 * Hook for memoizing expensive computations with custom cache
 * Similar to useMemo but with LRU cache and custom key generation
 */
export function useMemoWithCache<T>(
  factory: () => T,
  deps: React.DependencyList,
  options?: {
    keyGenerator?: (deps: React.DependencyList) => string;
    maxSize?: number;
  },
): T {
  const cacheRef = useRef(new LRUCache<string, T>(options?.maxSize));
  const keyGenerator = options?.keyGenerator || ((deps) => JSON.stringify(deps));

  return useMemo(() => {
    const key = keyGenerator(deps);
    const cached = cacheRef.current.get(key);

    if (cached !== undefined) {
      debugLog('useMemoWithCache hit:', key);
      return cached;
    }

    const result = factory();
    cacheRef.current.set(key, result);
    debugLog('useMemoWithCache miss:', key);

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Hook for debouncing values
 * Returns a debounced version of the value that only updates after the delay
 */
export function useDebouncedValue<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for debouncing callbacks
 * Returns a stable debounced callback function
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay = 500,
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const callbackRef = useRef(callback);

  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay],
  );
}

/**
 * Hook for throttling callbacks
 * Returns a stable throttled callback function
 */
export function useThrottledCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  limit = 500,
): T {
  const lastRunRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const callbackRef = useRef(callback);

  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastRunRef.current >= limit) {
        callbackRef.current(...args);
        lastRunRef.current = now;
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(
          () => {
            callbackRef.current(...args);
            lastRunRef.current = Date.now();
          },
          limit - (now - lastRunRef.current),
        );
      }
    }) as T,
    [limit],
  );
}

/**
 * Hook for measuring render performance
 * Logs render count and time since last render
 */
export function useRenderMetrics(componentName: string): void {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(performance.now());

  useEffect(() => {
    renderCountRef.current++;
    const now = performance.now();
    const timeSinceLastRender = now - lastRenderTimeRef.current;
    lastRenderTimeRef.current = now;

    if (renderCountRef.current > 1) {
      debugLog(
        `${componentName} render #${String(renderCountRef.current)}, ${timeSinceLastRender.toFixed(2)}ms since last render`,
      );
    }
  });
}

/**
 * Hook for lazy loading values
 * Only computes the value when it's first accessed
 */
export function useLazyValue<T>(initializer: () => T): () => T {
  const valueRef = useRef<T | undefined>(undefined);
  const initializedRef = useRef(false);

  return useCallback(() => {
    if (!initializedRef.current) {
      valueRef.current = initializer();
      initializedRef.current = true;
    }
    return valueRef.current as T;
  }, [initializer]);
}

/**
 * Hook for tracking performance metrics
 * Returns functions to start/stop measurement and get metrics
 */
export function usePerformanceTracker() {
  const metricsRef = useRef<Map<string, number[]>>(new Map());
  const activeTimersRef = useRef<Map<string, number>>(new Map());

  const startMeasure = useCallback((label: string) => {
    activeTimersRef.current.set(label, performance.now());
  }, []);

  const endMeasure = useCallback((label: string) => {
    const startTime = activeTimersRef.current.get(label);
    if (startTime !== undefined) {
      const duration = performance.now() - startTime;

      if (!metricsRef.current.has(label)) {
        metricsRef.current.set(label, []);
      }

      metricsRef.current.get(label)!.push(duration);
      activeTimersRef.current.delete(label);

      debugLog(`${label}: ${duration.toFixed(2)}ms`);
      return duration;
    }
    return null;
  }, []);

  const getMetrics = useCallback((label?: string) => {
    if (label) {
      const measurements = metricsRef.current.get(label) || [];
      if (measurements.length === 0) return null;

      const sum = measurements.reduce((a, b) => a + b, 0);
      const avg = sum / measurements.length;
      const min = Math.min(...measurements);
      const max = Math.max(...measurements);

      return { avg, min, max, count: measurements.length, total: sum };
    }

    // Return all metrics
    const allMetrics: Record<
      string,
      { avg: number; min: number; max: number; count: number; total: number }
    > = {};
    metricsRef.current.forEach((measurements, key) => {
      const sum = measurements.reduce((a, b) => a + b, 0);
      allMetrics[key] = {
        avg: sum / measurements.length,
        min: Math.min(...measurements),
        max: Math.max(...measurements),
        count: measurements.length,
        total: sum,
      };
    });
    return allMetrics;
  }, []);

  const clearMetrics = useCallback((label?: string) => {
    if (label) {
      metricsRef.current.delete(label);
    } else {
      metricsRef.current.clear();
    }
  }, []);

  return {
    startMeasure,
    endMeasure,
    getMetrics,
    clearMetrics,
  };
}

/**
 * Hook for detecting memory leaks
 * Warns if component unmounts with active subscriptions/timers
 */
export function useLeakDetector(componentName: string) {
  const activeResourcesRef = useRef<Set<string>>(new Set());

  const trackResource = useCallback(
    (resourceId: string) => {
      activeResourcesRef.current.add(resourceId);
      debugLog(`${componentName}: Resource tracked - ${resourceId}`);
    },
    [componentName],
  );

  const releaseResource = useCallback(
    (resourceId: string) => {
      activeResourcesRef.current.delete(resourceId);
      debugLog(`${componentName}: Resource released - ${resourceId}`);
    },
    [componentName],
  );

  useEffect(() => {
    const activeResources = activeResourcesRef.current;
    return () => {
      if (activeResources.size > 0) {
        console.warn(
          `${componentName}: Potential memory leak detected! Active resources on unmount:`,
          Array.from(activeResources),
        );
      }
    };
  }, [componentName]);

  return { trackResource, releaseResource };
}

/**
 * Hook for virtualization performance
 * Helps optimize lists by only rendering visible items
 */
export function useVirtualization<T>(
  items: T[],
  options: {
    itemHeight: number;
    containerHeight: number;
    overscan?: number;
    scrollTop?: number;
  },
) {
  const { itemHeight, containerHeight, overscan = 3, scrollTop = 0 } = options;

  return useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan,
    );

    const visibleItems = items.slice(startIndex, endIndex);
    const offsetY = startIndex * itemHeight;
    const totalHeight = items.length * itemHeight;

    return {
      visibleItems,
      startIndex,
      endIndex,
      offsetY,
      totalHeight,
    };
  }, [items, itemHeight, containerHeight, overscan, scrollTop]);
}

/**
 * Hook for intersection observer with performance tracking
 * Useful for lazy loading and infinite scroll
 */
export function useIntersectionObserver(
  options?: IntersectionObserverInit,
): [(element: HTMLElement | null) => void, boolean, IntersectionObserverEntry | null] {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  const setElement = useCallback(
    (element: HTMLElement | null) => {
      if (elementRef.current) {
        observerRef.current?.unobserve(elementRef.current);
      }

      elementRef.current = element;

      if (element) {
        // Create observer if it doesn't exist
        if (!observerRef.current) {
          observerRef.current = new IntersectionObserver((entries) => {
            const entry = entries[0];
            setIsIntersecting(entry.isIntersecting);
            setEntry(entry);
          }, options);
        }
        observerRef.current.observe(element);
      }
    },
    [options],
  );

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return [setElement, isIntersecting, entry];
}
