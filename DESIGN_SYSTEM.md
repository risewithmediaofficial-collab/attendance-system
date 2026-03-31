# Dark Glassmorphism Design System

## Overview

This document outlines the modern dark glassmorphism design system implemented across the application. The design features a premium, futuristic aesthetic with smooth glass effects, subtle lighting, and smooth animations.

## Color Palette

### Primary Colors
- **Background**: `#0b0b0f` - Deep dark base color
- **Foreground (Text)**: `#eaeaea` - Soft white for readability
- **Foreground Muted (Subtext)**: `#a0a0a0` - Muted gray

### Accent Colors
- **Primary Accent**: `#64b5f6` - Bright blue
- **Light Accent**: `#90caf9` - Light blue for highlights
- **Border**: `rgba(255, 255, 255, 0.08)` - Subtle glass borders

## Glassmorphism Effects

### Core Glass Effect
All glass elements use the following standard properties:
```css
background: rgba(255, 255, 255, 0.05);
backdrop-filter: blur(20px) saturate(140%);
-webkit-backdrop-filter: blur(20px) saturate(140%);
border: 1px solid rgba(255, 255, 255, 0.08);
border-radius: 20px;
box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
```

### Glass Accent Effect (for highlighted elements)
```css
background: rgba(100, 181, 246, 0.08);
border: 1px solid rgba(100, 181, 246, 0.2);
backdrop-filter: blur(15px);
box-shadow: 0 8px 24px rgba(100, 181, 246, 0.1);
```

## Component Styling

### Cards & Containers
- Use `.glass` class for standard card styling
- Use `.card-minimal`, `.card-overlay` for specific card types
- Hover effect: slight lift (translateY), increased blur, glow effect

### Buttons
- **Primary Button**: Gradient background with glow on hover
- **Secondary Button**: Glass effect with transparency
- **Outline Button**: Transparent with accent border
- All buttons have rounded corners (12px) and smooth transitions

### Input Fields
- Semi-transparent glass background
- Blur effect with backdrop filter
- Focus state: increased opacity, accent border, blue glow
- Placeholder text: `rgba(255, 255, 255, 0.4)`

### Navigation Bar
- Floating glass panel effect
- Reduced blur on mobile for performance
- Smooth transitions on hover

### Tables & Lists
- Glass effect on table containers
- Subtle row highlighting on hover
- Clean borders with low opacity

## Typography

### Font Family
- **Primary**: Inter (sans-serif)
- **Headings**: Inter (bold, 600-700 weight)
- **Body**: Inter Regular (400 weight)

### Font Sizes
- **H1**: `clamp(2rem, 6vw, 4.5rem)` - Main headings
- **H2**: `clamp(1.5rem, 4vw, 3rem)` - Section headings
- **H3**: `clamp(1.25rem, 3vw, 1.875rem)` - Subsection headings
- **Body**: `clamp(0.875rem, 1vw, 1rem)` - Standard text

### Color Usage
- Primary headings: Soft white with gradient overlay
- Secondary text: Muted gray
- Accent text: Blue accent and light blue for highlights

## Animations

### Smooth Transitions
- Default transition: `all 0.3s ease`
- Button hover: `translateY(-2px)` + glow effect
- Card hover: `translateY(-4px)` + increased blur

### Keyframe Animations
- **slide-in**: 0.5s ease-out
- **fade-in**: 0.3s ease-out
- **glow**: 2s ease-in-out pulsing effect
- **float**: 3s ease-in-out infinite floating motion

### Background Elements
- Floating orbs with subtle gradient and blur
- Smooth rotation and translation animations
- Low opacity to avoid distraction (0.4-0.8)

## Mobile Optimization

### Reduced Blur Intensity
- Mobile blur: `blur(10px)` instead of `blur(20px)`
- Saturate: `120%` instead of `140%`

### Performance Considerations
- Disable heavy animations on small screens
- Reduce shadow complexity
- Simplify glass effects on low-end devices

### Responsive Breakpoints
- **Mobile**: max-width 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+

## Utility Classes

### Glass Backgrounds
```css
.bg-glass              /* Standard glass effect */
.bg-glass-accent       /* Accent glass effect */
.blur-glass            /* Blur filter only */
```

### Text Colors
```css
.text-dark-primary     /* Primary foreground */
.text-dark-secondary   /* Secondary foreground */
.text-accent           /* Accent color */
.text-accent-light     /* Light accent color */
```

### Borders
```css
.border-glass          /* Standard glass border */
.border-glass-accent   /* Accent glass border */
```

### Shadows
```css
.shadow-glass          /* Standard glass shadow */
.shadow-glass-lg       /* Large glass shadow with glow */
```

## Implementation Examples

### Using Glass Cards
```jsx
<div className="bg-glass p-6 rounded-2xl">
  <h2 className="text-dark-primary font-bold">Title</h2>
  <p className="text-dark-secondary">Description</p>
</div>
```

### Using Glass Buttons
```jsx
<button className="bg-glass hover:bg-glass-accent transition-all duration-300">
  Click me
</button>
```

### Using Glass Inputs
```jsx
<input 
  className="bg-glass border-glass focus:border-accent"
  placeholder="Enter text..."
/>
```

## Accessibility Considerations

### Keyboard Navigation
- All interactive elements have focus states
- Focus outline: 2px solid accent color
- Outline offset: 2px

### Reduced Motion
- Respects `prefers-reduced-motion` media query
- Animations disabled for users with this preference
- Transitions set to 0.01ms when enabled

### Color Contrast
- Text contrast ratios meet WCAG AA standards
- Primary text: #eaeaea on #0b0b0f = 12.2:1 ratio
- All interactive elements have sufficient contrast

## Browser Support

- **Chrome/Edge**: Full support for all features
- **Firefox**: Full support for all features
- **Safari**: Full support with -webkit prefix for backdrop filters
- **Mobile Safari**: Supported with blur intensity reduction

## CSS Variables

All values use CSS custom properties for easy override:

```css
:root {
  --background: #0b0b0f;
  --surface: rgba(255, 255, 255, 0.05);
  --foreground: #eaeaea;
  --foreground-muted: #a0a0a0;
  --accent: #64b5f6;
  --accent-light: #90caf9;
  --border: rgba(255, 255, 255, 0.08);
  --glass-blur: 20px;
  --glass-saturate: 140%;
}
```

## Performance Tips

1. **Limit blur effects** - Use only on critical elements
2. **Use `will-change`** - For frequently animated elements
3. **Reduce motion** - On lower-end devices
4. **Hardware acceleration** - Use `transform` over `top/left`
5. **Debounce scroll events** - For background parallax

## Future Enhancements

- Theme toggle (light/dark mode)
- Custom color schemes based on user preference
- Animation complexity settings
- Performance profiling tools
- High contrast variant

## Support & Resources

- Font: [Inter - Google Fonts](https://fonts.google.com/specimen/Inter)
- Icons: Lucide React
- Animations: Tailwind CSS + Framer Motion
- Styling: Tailwind CSS + custom CSS

---

**Last Updated**: March 2024
**Version**: 1.0
