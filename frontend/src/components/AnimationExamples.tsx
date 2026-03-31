/**
 * ===== ANIMATION USAGE EXAMPLES =====
 * 
 * This file demonstrates how to use the Motion wrapper components
 * and animation utilities with existing components.
 * 
 * Key Principles:
 * - Wrap existing components with Motion wrappers
 * - No HTML structure changes required
 * - Use hooks for responsive behavior
 * - Respect user motion preferences
 */

import {
  MotionCard,
  GlassMotionCard,
  MotionContainer,
  MotionItem,
  MotionButton,
  MotionInput,
  MotionTextarea,
  MotionShake,
  MotionFadeIn,
  MotionSlideIn,
} from "@/components/MotionWrappers";
import {
  useAnimationConfig,
  useStaggerVariants,
  useResponsiveAnimation,
} from "@/hooks/use-animations";

/**
 * Example 1: Simple Card Animation
 * Wrap a card with MotionCard to add entrance + hover animations
 */
export function ExampleCard() {
  return (
    <MotionCard>
      <div className="card-content">
        <h3>Premium Card</h3>
        <p>This card has fade-in + slide-up entrance animation with hover lift</p>
      </div>
    </MotionCard>
  );
}

/**
 * Example 2: Glass Card with Premium Feel
 * Use GlassMotionCard for luxury glassmorphic effects
 */
export function ExampleGlassCard() {
  return (
    <GlassMotionCard>
      <div className="glass-card-content">
        <h3>Luxury Glass Effect</h3>
        <p>Enhanced glass morphism with shine effect and spring physics</p>
      </div>
    </GlassMotionCard>
  );
}

/**
 * Example 3: Staggered Card Grid
 * Multiple cards animate in sequence
 */
export function ExampleCardGrid() {
  const isMobile = useResponsiveAnimation();
  const cards = [
    { id: 1, title: "Card 1" },
    { id: 2, title: "Card 2" },
    { id: 3, title: "Card 3" },
  ];

  return (
    <MotionContainer className="grid-responsive">
      {cards.map((card, index) => (
        <MotionItem key={card.id}>
          <MotionCard delay={index * 0.1} isMobile={isMobile}>
            <div>
              <h3>{card.title}</h3>
              <p>Each card staggered with 0.1s delay</p>
            </div>
          </MotionCard>
        </MotionItem>
      ))}
    </MotionContainer>
  );
}

/**
 * Example 4: Animated Form
 * Inputs and buttons with focus animations
 */
export function ExampleForm() {
  const { isMobile } = useAnimationConfig();

  return (
    <MotionCard>
      <form>
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <MotionInput
            id="name"
            type="text"
            placeholder="Enter your name"
            isMobile={isMobile}
          />
        </div>

        <div className="form-group">
          <label htmlFor="message">Message</label>
          <MotionTextarea
            id="message"
            placeholder="Enter your message"
            isMobile={isMobile}
          />
        </div>

        <MotionButton className="btn-primary" isMobile={isMobile}>
          Submit
        </MotionButton>
      </form>
    </MotionCard>
  );
}

/**
 * Example 5: Error State with Shake Animation
 */
export function ExampleErrorState() {
  const [hasError, setHasError] = React.useState(false);

  return (
    <MotionShake trigger={hasError}>
      <input type="email" className="motion-input" />
      {hasError && (
        <p className="error-message">Please enter a valid email</p>
      )}
    </MotionShake>
  );
}

/**
 * Example 6: Fade In on Scroll
 */
export function ExampleFadeInScroll() {
  return (
    <MotionFadeIn>
      <div className="content">
        <h2>This content fades in when scrolled into view</h2>
        <p>Respects prefers-reduced-motion setting</p>
      </div>
    </MotionFadeIn>
  );
}

/**
 * Example 7: Slide In Animation
 */
export function ExampleSlideIn() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <MotionSlideIn direction="left">
        <div className="card">From Left</div>
      </MotionSlideIn>

      <MotionSlideIn direction="up" delay={0.2}>
        <div className="card">From Up</div>
      </MotionSlideIn>

      <MotionSlideIn direction="right" delay={0.4}>
        <div className="card">From Right</div>
      </MotionSlideIn>
    </div>
  );
}

/**
 * Example 8: How to Wrap Existing Components
 * 
 * BEFORE (no animation):
 * <div className="card">
 *   <h3>Title</h3>
 *   <p>Content</p>
 * </div>
 * 
 * AFTER (with animation - HTML unchanged):
 * <MotionCard>
 *   <div className="card">
 *     <h3>Title</h3>
 *     <p>Content</p>
 *   </div>
 * </MotionCard>
 */

/**
 * Integration Tips:
 * 
 * 1. USE MOTION WRAPPERS FOR COMMON ELEMENTS:
 *    - Cards → MotionCard or GlassMotionCard
 *    - Buttons → MotionButton
 *    - Inputs → MotionInput
 *    - Lists → MotionContainer + MotionItem
 * 
 * 2. USE HOOKS FOR RESPONSIVE BEHAVIOR:
 *    - useAnimationConfig() - Get device and motion preferences
 *    - useResponsiveAnimation() - Just check if mobile
 *    - usePrefersReducedMotion() - Respect a11y settings
 * 
 * 3. USE ANIMATION VARIANTS FOR CUSTOM EFFECTS:
 *    - cardEnterVariants, fadeInVariants, slideInFromLeftVariants etc
 *    - Pass to motion.div as initial/animate props
 * 
 * 4. CSS CLASSES FOR ADDITIONAL EFFECTS:
 *    - depth-shadow-md/lg - Layered shadows
 *    - glow-soft/intense - Glow effects
 *    - float-gentle/slow - Floating animations
 *    - interactive-hover - Hover interactions
 * 
 * 5. MOBILE OPTIMIZATION:
 *    - Shine effects disabled on mobile
 *    - Shorter animations on smaller screens
 *    - Reduced blur effects for performance
 *    - Simple hover states
 * 
 * 6. ACCESSIBILITY:
 *    - All animations respect prefers-reduced-motion
 *    - Focus visible rings on inputs
 *    - Proper ARIA labels (inherited from wrapped elements)
 * 
 * Example usage in your Dashboard:
 * 
 * // Wrap stat cards
 * <MotionContainer className="grid-responsive">
 *   {stats.map((stat, i) => (
 *     <MotionItem key={stat.id}>
 *       <GlassMotionCard delay={i * 0.1}>
 *         <div className="stat-card">
 *           <div className="stat-number">{stat.value}</div>
 *           <div className="stat-label">{stat.label}</div>
 *         </div>
 *       </GlassMotionCard>
 *     </MotionItem>
 *   ))}
 * </MotionContainer>
 * 
 * // Wrap chart cards
 * <GlassMotionCard>
 *   <BarChartComponent />
 * </GlassMotionCard>
 * 
 * // Wrap buttons
 * <MotionButton className="btn-primary">
 *   Generate Report
 * </MotionButton>
 */

import React from "react";
