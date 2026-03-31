import { Variants, TargetAndTransition } from "framer-motion";

/**
 * ===== PREMIUM ANIMATION VARIANTS =====
 * Reusable Framer Motion animation variants for consistent luxury feel
 */

// ─── CARD ANIMATIONS ─────────────────────────────────────────────
export const cardEnterVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 40,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

export const cardHoverVariants: TargetAndTransition = {
  scale: 1.02,
  y: -6,
  transition: {
    type: "spring",
    stiffness: 120,
    damping: 15,
  },
};

// ─── STAGGER ANIMATIONS ──────────────────────────────────────────
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

// ─── BUTTON ANIMATIONS ───────────────────────────────────────────
export const buttonHoverVariants: TargetAndTransition = {
  scale: 1.03,
  transition: {
    type: "spring",
    stiffness: 200,
    damping: 10,
  },
};

export const buttonTapVariants: TargetAndTransition = {
  scale: 0.96,
  transition: {
    duration: 0.1,
  },
};

// ─── INPUT ANIMATIONS ───────────────────────────────────────────
export const inputFocusVariants: TargetAndTransition = {
  scale: 1.01,
  transition: {
    type: "spring",
    stiffness: 300,
    damping: 30,
  },
};

// ─── FADE IN ANIMATIONS ─────────────────────────────────────────
export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: "easeIn",
    },
  },
};

export const fadeInSlideUpVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

// ─── SLIDE IN ANIMATIONS ────────────────────────────────────────
export const slideInFromLeftVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -40,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

export const slideInFromRightVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 40,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

// ─── SCALE & ROTATE ANIMATIONS ──────────────────────────────────
export const scaleInVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

// ─── ERROR SHAKE ANIMATION ──────────────────────────────────────
export const shakeVariants: Variants = {
  shake: {
    x: [0, -5, 5, -3, 3, 0],
    transition: {
      duration: 0.4,
      ease: "easeInOut",
    },
  },
};

// ─── PULSE ANIMATIONS ───────────────────────────────────────────
export const pulseVariants: Variants = {
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
    },
  },
};

// ─── ROTATE & ZOOM ──────────────────────────────────────────────
export const rotateInVariants: Variants = {
  hidden: {
    opacity: 0,
    rotate: -10,
  },
  visible: {
    opacity: 1,
    rotate: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

// ─── COMBINED ANIMATIONS ────────────────────────────────────────
export const glassCardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 40,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut",
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

// ─── MOBILE-OPTIMIZED VARIANTS ──────────────────────────────────
export const mobileCardEnterVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

export const mobileCardHoverVariants: TargetAndTransition = {
  scale: 1.01,
  transition: {
    duration: 0.2,
  },
};

/**
 * ===== ANIMATION CONFIGURATION =====
 */

export const defaultSpringConfig = {
  type: "spring" as const,
  stiffness: 100,
  damping: 15,
  mass: 1,
};

export const snappySpringConfig = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
};

export const gentleSpringConfig = {
  type: "spring" as const,
  stiffness: 80,
  damping: 20,
};

/**
 * ===== ANIMATION TIMING =====
 */

export enum AnimationDuration {
  INSTANT = 0.1,
  FAST = 0.2,
  NORMAL = 0.4,
  SLOW = 0.6,
  SLOWER = 0.8,
  SLOWEST = 1,
}

/**
 * ===== EASING FUNCTIONS =====
 */

export const easings = {
  easeInOut: [0.4, 0, 0.2, 1],
  easeOut: [0, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
  easeInCubic: [0.32, 0, 0.67, 0],
  easeOutCubic: [0.33, 1, 0.68, 1],
};

/**
 * ===== UTILITY FUNCTIONS FOR CUSTOM ANIMATIONS =====
 */

/**
 * Create a staggered list animation
 */
export function createStaggerVariants(
  itemDelay: number = 0.1,
  containerDuration: number = 0.3
): Variants {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: itemDelay,
        delayChildren: containerDuration,
      },
    },
  };
}

/**
 * Create a custom card animation with delay
 */
export function createCardAnimation(
  delay: number = 0
): Variants {
  return {
    hidden: {
      opacity: 0,
      y: 40,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        delay,
      },
    },
  };
}

/**
 * Create a responsive animation based on device
 */
export function getResponsiveAnimation(isMobile: boolean) {
  return {
    enter: isMobile ? mobileCardEnterVariants : cardEnterVariants,
    hover: isMobile ? mobileCardHoverVariants : cardHoverVariants,
  };
}
