import React from "react";
import { motion, MotionProps, Variants } from "framer-motion";
import {
  cardEnterVariants,
  cardHoverVariants,
  containerVariants,
  itemVariants,
  buttonHoverVariants,
  buttonTapVariants,
  glassCardVariants,
  mobileCardEnterVariants,
  mobileCardHoverVariants,
  inputFocusVariants,
  getResponsiveAnimation,
} from "@/lib/animations";

/**
 * ===== MOTION WRAPPER COMPONENTS =====
 * Reusable Framer Motion wrappers to add animations without changing HTML
 */

interface MotionCardProps extends MotionProps {
  children: React.ReactNode;
  className?: string;
  isMobile?: boolean;
  delay?: number;
}

/**
 * Animated Card Component - Fade in + Slide up with hover lift
 */
export const MotionCard = React.forwardRef<HTMLDivElement, MotionCardProps>(
  (
    {
      children,
      className = "",
      isMobile = false,
      delay = 0,
      ...motionProps
    },
    ref
  ) => {
    const variants = isMobile ? mobileCardEnterVariants : cardEnterVariants;
    const hoverVariants = isMobile ? mobileCardHoverVariants : cardHoverVariants;

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        whileHover={!isMobile ? hoverVariants : undefined}
        viewport={{ once: true, margin: "0px 0px -100px 0px" }}
        transition={{
          duration: 0.6,
          delay,
          ease: "easeOut",
        }}
        className={`motion-card ${className}`}
        {...motionProps}
      >
        {children}
      </motion.div>
    );
  }
);
MotionCard.displayName = "MotionCard";

/**
 * Glass Card with Shine Effect - Premium luxury feel
 */
export const GlassMotionCard = React.forwardRef<HTMLDivElement, MotionCardProps>(
  (
    {
      children,
      className = "",
      isMobile = false,
      delay = 0,
      ...motionProps
    },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        whileHover={!isMobile ? { scale: 1.02, y: -6 } : undefined}
        viewport={{ once: true, margin: "0px 0px -100px 0px" }}
        transition={{
          duration: 0.6,
          delay,
          type: "spring",
          stiffness: 100,
          damping: 15,
        }}
        className={`glass-motion-card ${className}`}
        {...motionProps}
      >
        {children}
      </motion.div>
    );
  }
);
GlassMotionCard.displayName = "GlassMotionCard";

/**
 * Staggered Container - For animating multiple children
 */
interface MotionContainerProps extends MotionProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export const MotionContainer = React.forwardRef<HTMLDivElement, MotionContainerProps>(
  (
    {
      children,
      className = "",
      staggerDelay = 0.1,
      ...motionProps
    },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "0px 0px -100px 0px" }}
        variants={containerVariants}
        className={`motion-container ${className}`}
        {...motionProps}
      >
        {children}
      </motion.div>
    );
  }
);
MotionContainer.displayName = "MotionContainer";

/**
 * Staggered Item - Child element for MotionContainer
 */
interface MotionItemProps extends MotionProps {
  children: React.ReactNode;
  className?: string;
}

export const MotionItem = React.forwardRef<HTMLDivElement, MotionItemProps>(
  (
    {
      children,
      className = "",
      ...motionProps
    },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        variants={itemVariants}
        className={`motion-item ${className}`}
        {...motionProps}
      >
        {children}
      </motion.div>
    );
  }
);
MotionItem.displayName = "MotionItem";

/**
 * Animated Button - Hover scale + tap scale
 */
interface MotionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  isMobile?: boolean;
}

export const MotionButton = React.forwardRef<HTMLButtonElement, MotionButtonProps>(
  (
    {
      children,
      className = "",
      isMobile = false,
      ...buttonProps
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref as any}
        whileHover={!isMobile ? { scale: 1.03 } : undefined}
        whileTap={{ scale: 0.96 }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 10,
        }}
        className={`motion-button ${className}`}
        {...(buttonProps as any)}
      >
        {children}
      </motion.button>
    );
  }
);
MotionButton.displayName = "MotionButton";

/**
 * Animated Input Field - Focus glow effect
 */
interface MotionInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  isMobile?: boolean;
}

export const MotionInput = React.forwardRef<HTMLInputElement, MotionInputProps>(
  (
    {
      className = "",
      isMobile = false,
      ...inputProps
    },
    ref
  ) => {
    return (
      <motion.input
        ref={ref as any}
        whileFocus={!isMobile ? { scale: 1.01 } : undefined}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        className={`motion-input ${className}`}
        {...(inputProps as any)}
      />
    );
  }
);
MotionInput.displayName = "MotionInput";

/**
 * Animated Textarea - Focus glow effect
 */
interface MotionTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
  isMobile?: boolean;
}

export const MotionTextarea = React.forwardRef<HTMLTextAreaElement, MotionTextareaProps>(
  (
    {
      className = "",
      isMobile = false,
      ...textareaProps
    },
    ref
  ) => {
    return (
      <motion.textarea
        ref={ref as any}
        whileFocus={!isMobile ? { scale: 1.01 } : undefined}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        className={`motion-textarea ${className}`}
        {...(textareaProps as any)}
      />
    );
  }
);
MotionTextarea.displayName = "MotionTextarea";

/**
 * Shake Effect - For error messages
 */
interface MotionShakeProps extends MotionProps {
  children: React.ReactNode;
  className?: string;
  trigger?: boolean;
}

export const MotionShake = React.forwardRef<HTMLDivElement, MotionShakeProps>(
  (
    {
      children,
      className = "",
      trigger = false,
      ...motionProps
    },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        animate={
          trigger
            ? {
                x: [0, -5, 5, -3, 3, 0],
              }
            : { x: 0 }
        }
        transition={{
          duration: 0.4,
          ease: "easeInOut",
        }}
        className={`motion-shake ${className}`}
        {...motionProps}
      >
        {children}
      </motion.div>
    );
  }
);
MotionShake.displayName = "MotionShake";

/**
 * Pulse Effect - For attention-grabbing elements
 */
interface MotionPulseProps extends MotionProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
}

export const MotionPulse = React.forwardRef<HTMLDivElement, MotionPulseProps>(
  (
    {
      children,
      className = "",
      duration = 2,
      ...motionProps
    },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`motion-pulse ${className}`}
        {...motionProps}
      >
        {children}
      </motion.div>
    );
  }
);
MotionPulse.displayName = "MotionPulse";

/**
 * Fade In Effect
 */
interface MotionFadeInProps extends MotionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

export const MotionFadeIn = React.forwardRef<HTMLDivElement, MotionFadeInProps>(
  (
    {
      children,
      className = "",
      delay = 0,
      duration = 0.4,
      ...motionProps
    },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{
          duration,
          delay,
          ease: "easeIn",
        }}
        className={`motion-fade-in ${className}`}
        {...motionProps}
      >
        {children}
      </motion.div>
    );
  }
);
MotionFadeIn.displayName = "MotionFadeIn";

/**
 * Slide In effect
 */
interface MotionSlideInProps extends MotionProps {
  children: React.ReactNode;
  className?: string;
  direction?: "left" | "right" | "up" | "down";
  delay?: number;
}

export const MotionSlideIn = React.forwardRef<HTMLDivElement, MotionSlideInProps>(
  (
    {
      children,
      className = "",
      direction = "up",
      delay = 0,
      ...motionProps
    },
    ref
  ) => {
    const directionMap = {
      up: { x: 0, y: 40 },
      down: { x: 0, y: -40 },
      left: { x: 40, y: 0 },
      right: { x: -40, y: 0 },
    };

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, ...directionMap[direction] }}
        whileInView={{ opacity: 1, x: 0, y: 0 }}
        viewport={{ once: true }}
        transition={{
          duration: 0.5,
          delay,
          ease: "easeOut",
        }}
        className={`motion-slide-in ${className}`}
        {...motionProps}
      >
        {children}
      </motion.div>
    );
  }
);
MotionSlideIn.displayName = "MotionSlideIn";
