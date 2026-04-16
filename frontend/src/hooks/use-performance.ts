/* OPTIMIZED MOBILE DETECTION & PERFORMANCE HOOKS */
import { useEffect, useState, useCallback, useMemo } from 'react';

/* ========================================
   useIsMobile - Already exists, keep as-is
   ======================================== */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    const timer = setTimeout(checkMobile, 0);
    window.addEventListener('resize', checkMobile);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return isMobile;
}

/* ========================================
   useReducedMotion - NEW
   Detects if user has prefers-reduced-motion set
   Impact: Disable animations for accessibility
   ======================================== */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check initial preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

/* ========================================
   useHighPerformanceMode - NEW
   Detects if device is low-end (based on connection, memory, etc.)
   Impact: Disable heavy features on low-end devices
   ======================================== */
export function useHighPerformanceMode(): {
  isLowEnd: boolean;
  shouldAnimateRoute: boolean;
  shouldAnimateDashboard: boolean;
  shouldUseStagger: boolean;
  animationDuration: number;
} {
  const [isLowEnd, setIsLowEnd] = useState(false);
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    // Detect low-end device by checking:
    // 1. Connection speed
    // 2. Device memory
    // 3. Mobile device
    let lowEnd = false;

    // Check Network Information API
    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      if (conn?.effectiveType === '4g' || conn?.effectiveType === '3g') {
        lowEnd = true;
      }
      if (conn?.saveData) {
        lowEnd = true; // User enabled data saver
      }
    }

    // Check device memory (Chrome only)
    if ('deviceMemory' in navigator) {
      const memory = (navigator as any).deviceMemory;
      if (memory < 4) {
        // Less than 4GB RAM = low-end
        lowEnd = true;
      }
    }

    // Mobile devices are generally lower performance
    if (isMobile) {
      lowEnd = true;
    }

    setIsLowEnd(lowEnd);
  }, [isMobile]);

  return useMemo(
    () => ({
      isLowEnd,
      shouldAnimateRoute: !isLowEnd && !prefersReducedMotion,
      shouldAnimateDashboard: !isLowEnd && !prefersReducedMotion,
      shouldUseStagger: !isLowEnd && !prefersReducedMotion && !isMobile,
      animationDuration: isLowEnd || prefersReducedMotion ? 0 : isMobile ? 150 : 200,
    }),
    [isLowEnd, prefersReducedMotion, isMobile]
  );
}

/* ========================================
   useDeferredValue - For heavy computations
   Data updates are deferred during interactions
   Impact: Smoother scrolling/typing
   ======================================== */
export function useDeferredValue<T>(value: T): T {
  const [deferredValue, setDeferredValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDeferredValue(value);
    }, 0);

    return () => clearTimeout(timeout);
  }, [value]);

  return deferredValue;
}

/* ========================================
   useThrottle - Throttle function calls
   Used for: scroll, resize, mousemove
   Impact: Reduce event handler calls
   ======================================== */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const [lastRun, setLastRun] = useState(Date.now());

  return useCallback(
    ((...args) => {
      const now = Date.now();
      if (now - lastRun >= delay) {
        callback(...args);
        setLastRun(now);
      }
    }) as T,
    [callback, delay, lastRun]
  );
}

/* ========================================
   useDebounce - Debounce function calls
   Used for: search, filter, API calls
   Impact: Reduce API calls
   ======================================== */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    ((...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
}

/* ========================================
   useAnimationFrame - Throttle to requestAnimationFrame
   Used for: scroll listeners, animations
   Impact: Sync with browser paint, max 60fps
   ======================================== */
export function useAnimationFrame(callback: () => void): void {
  const requestRef = React.useRef<number>();

  useEffect(() => {
    const animate = () => {
      callback();
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [callback]);
}

/* ========================================
   useIntersectionObserver - Lazy load elements
   Used for: images, ads, heavy components
   Impact: Only render visible elements
   ======================================== */
export function useIntersectionObserver<T extends HTMLElement>(
  options?: IntersectionObserverInit
): [React.RefObject<T>, boolean] {
  const ref = React.useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [options]);

  return [ref, isVisible];
}

/* ========================================
   useMemoryPressure - Detect if device is under memory pressure
   Impact: Disable heavy features when memory is low
   ======================================== */
export function useMemoryPressure(): boolean {
  const [isUnderPressure, setIsUnderPressure] = useState(false);

  useEffect(() => {
    if (!('memory' in performance)) {
      return; // Not supported
    }

    const checkMemory = () => {
      const memory = (performance as any).memory;
      const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

      // If using > 80% of heap, disable heavy features
      setIsUnderPressure(usagePercent > 80);
    };

    checkMemory();
    const timer = setInterval(checkMemory, 5000); // Check every 5s

    return () => clearInterval(timer);
  }, []);

  return isUnderPressure;
}

import React from 'react';

/* ========================================
   Export summary
   ======================================== */
export const MobilePerformanceHooks = {
  useIsMobile,
  useReducedMotion,
  useHighPerformanceMode,
  useDeferredValue,
  useThrottle,
  useDebounce,
  useAnimationFrame,
  useIntersectionObserver,
  useMemoryPressure,
};
