import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Hook for using requestAnimationFrame with React
 * Useful for animations and smooth DOM updates
 */
export function useRequestAnimationFrame(
  callback: (deltaTime: number) => void,
  isActive = true,
): void {
  const requestRef = useRef<number | undefined>(undefined);
  const previousTimeRef = useRef<number | undefined>(undefined);
  const callbackRef = useRef(callback);

  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const animate = useCallback((time: number) => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime = time - previousTimeRef.current;
      callbackRef.current(deltaTime);
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (isActive) {
      requestRef.current = requestAnimationFrame(animate);
      return () => {
        if (requestRef.current) {
          cancelAnimationFrame(requestRef.current);
        }
      };
    }
  }, [isActive, animate]);
}

/**
 * Hook for deferring expensive updates using requestAnimationFrame
 * Batches multiple updates into a single frame
 */
export function useRAFUpdate<T>(value: T, updater: (value: T) => void): void {
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Cancel any pending RAF
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    // Schedule update for next frame
    rafRef.current = requestAnimationFrame(() => {
      updater(value);
    });

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value, updater]);
}

/**
 * Hook for smooth value transitions using RAF
 * Animates from current value to target value
 */
export function useAnimatedValue(
  targetValue: number,
  duration = 300,
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' = 'ease-in-out',
): number {
  const [currentValue, setCurrentValue] = useState(targetValue);
  const startValueRef = useRef(targetValue);
  const startTimeRef = useRef<number | undefined>(undefined);

  const easingFunctions = {
    linear: (t: number) => t,
    'ease-in': (t: number) => t * t,
    'ease-out': (t: number) => t * (2 - t),
    'ease-in-out': (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  };

  useRequestAnimationFrame((deltaTime) => {
    if (!startTimeRef.current) {
      startTimeRef.current = performance.now();
      startValueRef.current = currentValue;
    }

    const elapsed = performance.now() - startTimeRef.current;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easingFunctions[easing](progress);

    const newValue = startValueRef.current + (targetValue - startValueRef.current) * easedProgress;
    setCurrentValue(newValue);

    if (progress >= 1) {
      startTimeRef.current = undefined;
    }
  }, targetValue !== currentValue);

  return currentValue;
}

/**
 * Hook for batching DOM updates using RAF
 * Useful for performance-critical updates
 */
export function useBatchedUpdates() {
  const updatesRef = useRef<(() => void)[]>([]);
  const rafRef = useRef<number | undefined>(undefined);

  const scheduleUpdate = useCallback((update: () => void) => {
    updatesRef.current.push(update);

    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        const updates = updatesRef.current;
        updatesRef.current = [];
        rafRef.current = undefined;

        // Batch all updates in a single frame
        updates.forEach((fn) => {
          fn();
        });
      });
    }
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return scheduleUpdate;
}
