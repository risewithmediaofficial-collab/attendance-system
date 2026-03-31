import { useEffect, useState, useRef } from "react";

/**
 * ===== ANIMATION HOOKS =====
 */

/**
 * Hook to detect if device is mobile and adjust animations accordingly
 */
export function useResponsiveAnimation() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  return isMobile;
}

/**
 * Hook to detect if user prefers reduced motion
 */
export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook to get animation configuration based on device and preferences
 */
export function useAnimationConfig() {
  const isMobile = useResponsiveAnimation();
  const prefersReducedMotion = usePrefersReducedMotion();

  return {
    isMobile,
    prefersReducedMotion,
    cardDuration: prefersReducedMotion ? 0.1 : isMobile ? 0.3 : 0.6,
    hoverDuration: prefersReducedMotion ? 0 : isMobile ? 0.2 : 0.35,
    disableHoverEffects: isMobile || prefersReducedMotion,
    disableAnimations: prefersReducedMotion,
  };
}

/**
 * Hook to handle scroll-triggered animations
 */
export function useScrollAnimation(threshold = 0.1) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  return isVisible;
}

/**
 * Hook to create staggered animation delays
 */
export function useStaggerChildren(
  childCount: number,
  delayPerChild: number = 0.1,
  initialDelay: number = 0
) {
  return Array.from({ length: childCount }, (_, i) => initialDelay + i * delayPerChild);
}

/**
 * Hook for debounced animation state
 */
export function useAnimationDebounce(
  callback: () => void,
  delay?: number
): (() => void) {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const finalDelay = delay ?? 300;

  return () => {
    if (timeoutId) clearTimeout(timeoutId);

    const newTimeoutId = setTimeout(callback, finalDelay);
    setTimeoutId(newTimeoutId);
  };
}

/**
 * Hook to handle animation state transitions
 */
export function useAnimationState(initialState: "idle" | "animating" | "done" = "idle") {
  const [state, setState] = useState<"idle" | "animating" | "done">(initialState);

  const startAnimation = () => setState("animating");
  const completeAnimation = () => setState("done");
  const reset = () => setState("idle");

  return {
    state,
    isAnimating: state === "animating",
    isDone: state === "done",
    isIdle: state === "idle",
    startAnimation,
    completeAnimation,
    reset,
  };
}

/**
 * Hook to detect intersection with viewport
 */
export function useInViewport(options?: IntersectionObserverInit) {
  const [isInView, setIsInView] = useState(false);
  const [ref, setRef] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsInView(entry.isIntersecting);
    }, options);

    observer.observe(ref);

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return { ref: setRef as React.Ref<HTMLDivElement>, isInView };
}

/**
 * Hook to get stagger animation variants for lists
 */
export function useStaggerVariants(
  childCount: number,
  containerDelay: number = 0.1,
  itemDelay: number = 0.05
) {
  return {
    container: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: itemDelay,
          delayChildren: containerDelay,
        },
      },
    },
    item: {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.4,
          ease: "easeOut",
        },
      },
    },
  };
}
