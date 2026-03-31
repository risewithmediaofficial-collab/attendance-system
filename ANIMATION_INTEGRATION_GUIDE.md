# Animation Integration Guide

## Quick Start

### 1. Import Motion Wrappers
```tsx
import { MotionCard, GlassMotionCard, MotionButton } from '@/components/MotionWrappers'
import { useAnimationConfig } from '@/hooks/use-animations'
```

### 2. Use Animation Hooks
```tsx
const { isMobile, prefersReducedMotion } = useAnimationConfig()
```

## Component Examples

### Dashboard Cards with Stagger
```tsx
import { MotionContainer, MotionItem, GlassMotionCard } from '@/components/MotionWrappers'

export function DashboardStats({ stats }) {
  const { isMobile } = useAnimationConfig()
  
  return (
    <MotionContainer>
      {stats.map((stat, i) => (
        <MotionItem key={stat.id} index={i}>
          <GlassMotionCard delay={i * 0.1} isMobile={isMobile}>
            <div className="stat-card">
              <div className="stat-number">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          </GlassMotionCard>
        </MotionItem>
      ))}
    </MotionContainer>
  )
}
```

### Form with Motion Elements
```tsx
import { MotionCard, MotionInput, MotionButton } from '@/components/MotionWrappers'
import { useAnimationConfig } from '@/hooks/use-animations'

export function LoginForm() {
  const { isMobile } = useAnimationConfig()
  
  return (
    <MotionCard className="login-form">
      <form>
        <div className="form-group">
          <label>Email</label>
          <MotionInput
            type="email"
            placeholder="Enter your email"
            isMobile={isMobile}
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <MotionInput
            type="password"
            placeholder="Enter your password"
            isMobile={isMobile}
          />
        </div>

        <MotionButton className="btn-primary">
          Sign In
        </MotionButton>
      </form>
    </MotionCard>
  )
}
```

## Available Components

### Motion Wrappers
- **MotionCard** - Fade-in + slide-up with hover lift
- **GlassMotionCard** - Premium glass effect with shine animation
- **MotionContainer** - Stagger container for lists
- **MotionItem** - Child item for staggered animation
- **MotionButton** - Hover scale + tap feedback
- **MotionInput** - Focus glow effect
- **MotionTextarea** - Textarea with focus animation
- **MotionShake** - Error shake animation
- **MotionPulse** - Attention-grabbing pulse
- **MotionFadeIn** - Scroll-triggered fade
- **MotionSlideIn** - Directional slide animation

### Custom Hooks
- **useAnimationConfig()** - Combined device + a11y configuration
- **useResponsiveAnimation()** - Mobile detection
- **usePrefersReducedMotion()** - Accessibility preference
- **useScrollAnimation()** - Scroll trigger state
- **useStaggerChildren()** - Generate stagger delays
- **useAnimationDebounce()** - Debounced animation callback
- **useAnimationState()** - Animation lifecycle management
- **useInViewport()** - Element visibility detection

## Best Practices

### DO ✅
- Use `useAnimationConfig()` to check mobile/a11y before heavy animations
- Wrap card grids with `<MotionContainer>` for smooth cascades
- Apply `isMobile` prop to disable hover effects on touch devices
- Test animations with `prefers-reduced-motion` enabled
- Use spring physics for natural motion feel
- Keep animation duration under 0.6s for responsiveness

### DON'T ❌
- Don't apply animations to every element (prioritize key interactions)
- Don't ignore `prefersReducedMotion` setting
- Don't use overly complex animations on mobile
- Don't animate position changes (use transforms instead)
- Don't apply blur effects on low-end devices
- Don't create animations longer than 1 second
- Don't ignore viewport detection for performance
- Don't mix animation libraries in same component

## Performance Tips

1. **Use whileInView** - Animations only trigger when visible
2. **Enable will-change** - Added to motion components via CSS
3. **Reduce motion on mobile** - Disabled shine, shorter duration
4. **Test 60fps** - Use DevTools Performance tab
5. **Debounce callbacks** - Use `useAnimationDebounce()` for heavy operations
6. **Mobile-first** - Design for small screens, enhance on larger
7. **Prefers-reduced-motion** - Always respect system settings

## Troubleshooting

### Blank Page
- Check browser console for TypeScript errors
- Verify CSS imports in `src/main.tsx`
- Ensure animations.css is loaded

### Animations Not Playing
- Check `whileInView` threshold (default 0.1)
- Verify element is in viewport
- Check if `prefersReducedMotion` is enabled
- Test with DevTools throttling disabled

### Performance Issues
- Disable animations on mobile (`isMobile` flag)
- Reduce stagger count in lists
- Use simpler variants for complex components
- Profile with DevTools Timeline

## Files

- **src/lib/animations.ts** - Core animation library
- **src/components/MotionWrappers.tsx** - Motion wrapper components
- **src/hooks/use-animations.ts** - Animation React hooks
- **src/animations.css** - Animation styles and keyframes
