import { RefObject, useCallback, useEffect, useState } from 'react';

interface ScrollIndicators {
  canScrollLeft: boolean;
  canScrollRight: boolean;
  canScrollUp: boolean;
  canScrollDown: boolean;
  scrollPercentageX: number;
  scrollPercentageY: number;
}

/**
 * Hook for detecting scroll position and showing scroll indicators
 * Useful for tables, lists, and scrollable containers
 */
export function useScrollIndicators(
  containerRef: RefObject<HTMLElement>,
  options?: {
    horizontal?: boolean;
    vertical?: boolean;
    threshold?: number;
  },
): ScrollIndicators {
  const { horizontal = true, vertical = false, threshold = 1 } = options || {};

  const [indicators, setIndicators] = useState<ScrollIndicators>({
    canScrollLeft: false,
    canScrollRight: false,
    canScrollUp: false,
    canScrollDown: false,
    scrollPercentageX: 0,
    scrollPercentageY: 0,
  });

  const updateIndicators = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollLeft, scrollTop, scrollWidth, scrollHeight, clientWidth, clientHeight } =
      container;

    const newIndicators: ScrollIndicators = {
      canScrollLeft: horizontal && scrollLeft > threshold,
      canScrollRight: horizontal && scrollLeft < scrollWidth - clientWidth - threshold,
      canScrollUp: vertical && scrollTop > threshold,
      canScrollDown: vertical && scrollTop < scrollHeight - clientHeight - threshold,
      scrollPercentageX: horizontal
        ? scrollWidth > clientWidth
          ? (scrollLeft / (scrollWidth - clientWidth)) * 100
          : 0
        : 0,
      scrollPercentageY: vertical
        ? scrollHeight > clientHeight
          ? (scrollTop / (scrollHeight - clientHeight)) * 100
          : 0
        : 0,
    };

    setIndicators(newIndicators);
  }, [containerRef, horizontal, vertical, threshold]);

  // Update on mount and when content changes
  useEffect(() => {
    updateIndicators();
  }, [updateIndicators]);

  // Update on scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      updateIndicators();
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [containerRef, updateIndicators]);

  // Update on resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      updateIndicators();
    });

    resizeObserver.observe(container);
    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef, updateIndicators]);

  // Update on window resize
  useEffect(() => {
    const handleResize = () => {
      updateIndicators();
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [updateIndicators]);

  return indicators;
}

/**
 * Hook for smooth scrolling to elements
 */
export function useSmoothScroll() {
  const scrollToElement = useCallback(
    (
      element: HTMLElement,
      options?: {
        behavior?: ScrollBehavior;
        block?: ScrollLogicalPosition;
        inline?: ScrollLogicalPosition;
        offset?: { x?: number; y?: number };
      },
    ) => {
      const {
        behavior = 'smooth',
        block = 'center',
        inline = 'center',
        offset = {},
      } = options || {};

      element.scrollIntoView({ behavior, block, inline });

      // Apply offset if provided
      if (offset.x || offset.y) {
        window.scrollBy({
          left: offset.x || 0,
          top: offset.y || 0,
          behavior,
        });
      }
    },
    [],
  );

  const scrollToTop = useCallback((behavior: ScrollBehavior = 'smooth') => {
    window.scrollTo({ top: 0, behavior });
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    window.scrollTo({ top: document.body.scrollHeight, behavior });
  }, []);

  return {
    scrollToElement,
    scrollToTop,
    scrollToBottom,
  };
}

/**
 * Hook for creating scroll-synced elements (e.g., floating headers)
 */
export function useScrollSync(
  sourceRef: RefObject<HTMLElement>,
  targetRef: RefObject<HTMLElement>,
  axis: 'horizontal' | 'vertical' | 'both' = 'horizontal',
) {
  useEffect(() => {
    const source = sourceRef.current;
    const target = targetRef.current;

    if (!source || !target) return;

    const handleScroll = () => {
      if (axis === 'horizontal' || axis === 'both') {
        target.scrollLeft = source.scrollLeft;
      }
      if (axis === 'vertical' || axis === 'both') {
        target.scrollTop = source.scrollTop;
      }
    };

    source.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      source.removeEventListener('scroll', handleScroll);
    };
  }, [sourceRef, targetRef, axis]);
}
