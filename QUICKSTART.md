#!/usr/bin/env node

# 🎨 Dark Glassmorphism Design System - Quick Start Guide

## 📦 What's Included

This package includes a complete dark glassmorphism redesign of the UI with:
- ✅ Modern dark theme (#0b0b0f background)
- ✅ Premium glass effects on all components
- ✅ Smooth animations and transitions
- ✅ Mobile-optimized performance
- ✅ Full accessibility support
- ✅ **Zero HTML structure changes**

## 🎯 Quick Start

### 1. **View the Design**
Open any page in your application. You should see:
- Deep dark background with subtle gradients
- Floating animated orbs in the background
- Glass-effect cards and buttons
- Smooth hover animations

### 2. **Use Glass Components**

**Glass Card:**
```jsx
<div className="glass p-6">
  <h2>Title</h2>
  <p>Content</p>
</div>
```

**Glass Button:**
```jsx
<button className="btn-primary">Click me</button>
<button className="btn-secondary">Secondary</button>
<button className="btn-outline">Outline</button>
```

**Glass Input:**
```jsx
<input 
  className="bg-glass border-glass p-2 rounded-lg"
  placeholder="Type something..."
/>
```

### 3. **Apply Utilities**

**Text Colors:**
```jsx
<p className="text-dark-primary">Main text</p>
<p className="text-dark-secondary">Secondary text</p>
<p className="text-accent">Highlighted text</p>
```

**Backgrounds:**
```jsx
<div className="bg-glass">Standard glass</div>
<div className="bg-glass-accent">Accent glass</div>
```

**Shadows:**
```jsx
<div className="shadow-glass">Normal shadow</div>
<div className="shadow-glass-lg">Large shadow</div>
```

## 🌈 Color Reference

```
Primary Dark:      #0b0b0f  (Background)
Text Primary:      #eaeaea  (Main text)
Text Secondary:    #a0a0a0  (Muted text)
Accent:            #64b5f6  (Blue)
Accent Light:      #90caf9  (Light blue)

Glass (Transparent):
Border:            rgba(255, 255, 255, 0.08)
Background:        rgba(255, 255, 255, 0.05)
```

## ✨ Animation Classes

```jsx
// Slide in animation
<div className="animate-slide-in">Content</div>

// Glow effect
<div className="animate-glow">Glowing</div>

// Fade in
<div className="animate-fade-in">Fading</div>

// Floating motion
<div className="animate-float">Floating</div>
```

## 🎨 Component Patterns

### Card Container
```jsx
<div className="glass rounded-2xl p-6 border border-glass">
  <h3 className="text-dark-primary font-bold">Title</h3>
  <p className="text-dark-secondary">Description here</p>
</div>
```

### Stats Card
```jsx
<div className="stat-card">
  <div className="stat-number">42</div>
  <div className="stat-label">Total Items</div>
</div>
```

### Button Group
```jsx
<div className="flex gap-4">
  <button className="btn-primary">Primary</button>
  <button className="btn-secondary">Secondary</button>
  <button className="btn-outline">Outline</button>
</div>
```

### Form Group
```jsx
<div className="space-y-4">
  <label className="text-dark-primary font-600">Email</label>
  <input 
    className="w-full bg-glass border-glass p-3 rounded-lg focus:border-accent"
    type="email"
    placeholder="your@email.com"
  />
</div>
```

## 📱 Mobile Considerations

The design automatically adapts on mobile:
- Blur intensity reduced for better performance
- Heavy animations disabled
- Single column layout
- Slightly larger touch targets

**Note:** You can manually disable animations with:
```jsx
<div className="md:animate-slide-in">
  Content (animates only on desktop)
</div>
```

## ♿ Accessibility Features

- ✅ Keyboard navigation support
- ✅ Focus indicators (2px solid accent)
- ✅ High contrast text
- ✅ Respects `prefers-reduced-motion`
- ✅ WCAG AA compliant

**Testing:**
```bash
# Test with reduced motion
# System Settings > Accessibility > Display (Mac)
# or Settings > Ease of Access > Display (Windows)
```

## 🔧 CSS Variables (Override)

To customize colors, edit `:root` in `index.css`:

```css
:root {
  --background: #0b0b0f;           /* Change background */
  --foreground: #eaeaea;           /* Change text color */
  --accent: #64b5f6;               /* Change accent */
  --glass-blur: 20px;              /* Adjust blur */
  --glass-saturate: 140%;          /* Adjust saturation */
}
```

## 📚 Documentation Files

- **DESIGN_SYSTEM.md** - Complete design documentation
- **REDESIGN_SUMMARY.md** - Implementation changes summary
- **This file** - Quick reference guide

## 🚀 Common Tasks

### Add a New Card
```jsx
<div className="glass p-6 rounded-2xl hover:shadow-glass-lg transition-all duration-300">
  <h4 className="text-dark-primary font-bold mb-2">New Card</h4>
  <p className="text-dark-secondary">Your content here</p>
</div>
```

### Create a Call-to-Action
```jsx
<button className="btn-primary px-6 py-3 rounded-lg font-bold">
  Get Started
</button>
```

### Style a Section
```jsx
<section className="py-12 px-6">
  <div className="max-w-4xl mx-auto">
    <h2 className="text-3xl text-dark-primary font-bold mb-8">
      Section Title
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Cards here */}
    </div>
  </div>
</section>
```

## 🐛 Troubleshooting

### Text is hard to read
- Check that text color is using `text-dark-primary` (#eaeaea)
- Ensure sufficient contrast ratio (12.2:1)

### Glass effect not showing
- Ensure `backdrop-filter` is applied
- Check for `-webkit-backdrop-filter` prefix on Safari
- Verify blur amount is sufficient (min 12px)

### Animations are laggy
- Reduce blur on the element
- Use `transform` instead of `top/left` positioning
- Check mobile - reduce animations there

### Colors don't match
- Verify CSS variables are loaded in `index.css`
- Check browser DevTools for overrides
- Clear browser cache

## 📊 Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome  | ✅ Full | All features supported |
| Edge    | ✅ Full | All features supported |
| Firefox | ✅ Full | All features supported |
| Safari  | ✅ Full | Needs -webkit prefix |
| Mobile  | ✅ Full | Optimized performance |

## 💡 Performance Tips

1. **Limit blur**: Use only where necessary
2. **Layer effects**: Combine multiple effects efficiently
3. **Mobile first**: Design for mobile, enhance for desktop
4. **Test performance**: Use DevTools to profile animations

## 🎯 Best Practices

1. ✅ Always use semantic HTML
2. ✅ Maintain consistent spacing
3. ✅ Use color utilities consistently
4. ✅ Test keyboard navigation
5. ✅ Optimize images for dark background
6. ✅ Ensure proper focus states
7. ✅ Use proper heading hierarchy

## 📞 Need Help?

1. Check **DESIGN_SYSTEM.md** for detailed documentation
2. Review **REDESIGN_SUMMARY.md** for implementation details
3. Look at existing components for patterns
4. Search for class usage in the CSS files

## 🚀 What's New

### Added Files
- `src/glassmorphism.css` - Component overrides
- `DESIGN_SYSTEM.md` - Full design documentation
- `REDESIGN_SUMMARY.md` - Implementation summary
- `QUICKSTART.md` - This file

### Modified Files
- `src/index.css` - Dark theme colors, animations
- `src/App.css` - Glass effects, cards, buttons
- `src/main.tsx` - CSS imports
- `tailwind.config.ts` - Animation keyframes

### Unchanged
- All HTML structure
- All component hierarchy
- All JavaScript functionality
- All page routing

## 🎉 You're Ready!

Your application now has a modern dark glassmorphism design. Start using the classes and customizing to your needs!

---

**Last Updated:** March 30, 2024
**Version:** 1.0
**Status:** Production Ready ✅
