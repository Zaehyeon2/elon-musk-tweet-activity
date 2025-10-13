/**
 * Performance utilities: memoization, caching, and optimization helpers
 * Uses React patterns where applicable (useMemo, useCallback, etc.)
 */

import { debugLog, MEMO_CACHE_MAX } from '@/config/constants';

/**
 * LRU Cache implementation for general purpose caching
 */
export class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  constructor(maxSize = MEMO_CACHE_MAX) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    // Remove if exists to update position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict least recently used if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

/**
 * Global memoization cache
 */
const globalMemoCache = new LRUCache<string, unknown>();

/**
 * Generic memoization function with LRU cache eviction
 * For React components, prefer React.memo instead
 * For hooks, prefer useMemo instead
 * This is for pure utility functions
 */
export function memoize<TArgs extends readonly unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  options?: {
    keyGenerator?: (...args: TArgs) => string;
    maxSize?: number;
    cache?: LRUCache<string, TReturn>;
  },
): (...args: TArgs) => TReturn {
  const { keyGenerator = (...args: TArgs) => JSON.stringify(args), cache = globalMemoCache } =
    options || {};

  return (...args: TArgs): TReturn => {
    const key = keyGenerator(...args);

    if (cache.has(key)) {
      debugLog('Memoization cache hit for:', key);
      return cache.get(key) as TReturn;
    }

    const result = fn(...args);
    cache.set(key, result);
    debugLog('Memoization cache miss, computed for:', key);

    return result;
  };
}

/**
 * Clear global memoization cache
 */
export function clearMemoCache(): void {
  globalMemoCache.clear();
  debugLog('Global memoization cache cleared');
}

/**
 * Request queue to prevent duplicate async operations
 * Similar to React Query's deduplication
 */
const requestQueue = new Map<string, Promise<unknown>>();

/**
 * Queue and deduplicate requests
 * Prevents multiple identical requests from being made simultaneously
 */
export function queueRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
  if (requestQueue.has(key)) {
    debugLog('Returning existing request promise for:', key);
    return requestQueue.get(key) as Promise<T>;
  }

  const requestPromise = requestFn().finally(() => {
    requestQueue.delete(key);
  });

  requestQueue.set(key, requestPromise);
  return requestPromise;
}

/**
 * Performance monitoring utilities
 */
export const Performance = {
  /**
   * Measure function execution time
   */
  measureTime<TArgs extends readonly unknown[], TReturn>(
    fn: (...args: TArgs) => TReturn,
    label?: string,
  ): (...args: TArgs) => TReturn {
    return (...args: TArgs): TReturn => {
      const start = performance.now();
      const result = fn(...args);
      const duration = performance.now() - start;

      if (label) {
        debugLog(`${label} took ${duration.toFixed(2)}ms`);
      } else {
        debugLog(`Function execution took ${duration.toFixed(2)}ms`);
      }

      return result;
    };
  },

  /**
   * Measure async function execution time
   */
  measureTimeAsync<TArgs extends readonly unknown[], TReturn>(
    fn: (...args: TArgs) => Promise<TReturn>,
    label?: string,
  ): (...args: TArgs) => Promise<TReturn> {
    return async (...args: TArgs): Promise<TReturn> => {
      const start = performance.now();
      try {
        const result = await fn(...args);
        const duration = performance.now() - start;

        if (label) {
          debugLog(`${label} took ${duration.toFixed(2)}ms`);
        } else {
          debugLog(`Async function execution took ${duration.toFixed(2)}ms`);
        }

        return result;
      } catch (error) {
        const duration = performance.now() - start;
        debugLog(`${label || 'Async function'} failed after ${duration.toFixed(2)}ms`);
        throw error;
      }
    };
  },

  /**
   * Create a performance observer for long tasks
   */
  observeLongTasks(threshold = 50): PerformanceObserver | null {
    // Check for browser environment and PerformanceObserver support
    if (typeof window === 'undefined') {
      return null; // Not in browser environment
    }

    if (!('PerformanceObserver' in window)) {
      return null; // PerformanceObserver not supported
    }

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > threshold) {
            console.warn(`Long task detected: ${entry.duration.toFixed(2)}ms`, entry);
          }
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
      return observer;
    } catch (error) {
      debugLog('Failed to create PerformanceObserver:', error);
      return null;
    }
  },
};

/**
 * Cache statistics for debugging
 */
export const CacheStats = {
  getCacheInfo(): {
    memoCache: { size: number; maxSize: number };
    requestQueue: { size: number };
  } {
    return {
      memoCache: {
        size: globalMemoCache.size,
        maxSize: MEMO_CACHE_MAX,
      },
      requestQueue: {
        size: requestQueue.size,
      },
    };
  },

  printCacheStats(): void {
    const stats = this.getCacheInfo();
    // eslint-disable-next-line no-console
    console.table(stats);
  },
};

/**
 * Batch operations for better performance
 */
export function batchOperations<T>(operations: (() => T)[], chunkSize = 10): Promise<T[]> {
  return new Promise((resolve) => {
    const results: T[] = [];
    let currentIndex = 0;

    function processChunk() {
      const chunk = operations.slice(currentIndex, currentIndex + chunkSize);

      for (const operation of chunk) {
        results.push(operation());
      }

      currentIndex += chunkSize;

      if (currentIndex < operations.length) {
        // Process next chunk in next frame
        requestAnimationFrame(processChunk);
      } else {
        resolve(results);
      }
    }

    requestAnimationFrame(processChunk);
  });
}

/**
 * Create a lazy-initialized value
 * Similar to React.lazy but for values
 */
export function lazy<T>(initializer: () => T): () => T {
  let value: T;
  let initialized = false;

  return () => {
    if (!initialized) {
      value = initializer();
      initialized = true;
    }
    return value;
  };
}

/**
 * Simple object pool for reducing GC pressure
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset?: (obj: T) => void;
  private maxSize: number;

  constructor(factory: () => T, reset?: (obj: T) => void, maxSize = 100) {
    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }

  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      if (this.reset) {
        this.reset(obj);
      }
      this.pool.push(obj);
    }
  }

  clear(): void {
    this.pool.length = 0;
  }

  get size(): number {
    return this.pool.length;
  }
}
