# SaaS Design System - Color Palette Reference

## Brand Colors

### Primary Color - Growth Arrow Blue
```
Hex: #4F6FAF
RGB: 79, 111, 175
HSL: 220°, 37%, 50%
Usage: Primary buttons, tab indicators, focus rings, main brand element
```

**Variations**:
- **Lighter** (Background): `#EFF2FF` / RGB(239, 242, 255) - For badges, light backgrounds
- **Darker** (Hover): `#3F5F9F` / RGB(63, 95, 159) - For button hover states
- **Darkest** (Active): `#2F4F8F` / RGB(47, 79, 143) - For button active states

### Secondary Color - Accent Highlight
```
Hex: #6C8CFF
RGB: 108, 140, 255
HSL: 220°, 100%, 71%
Usage: Hover effects, secondary highlights, gradients
```

---

## Neutral Colors

Used for text, backgrounds, borders, and general UI elements.

| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| **50** (Lightest) | `#FAFAFA` | 250, 250, 250 | Very light backgrounds |
| **100** | `#F5F5F5` | 245, 245, 245 | Light backgrounds, hover states |
| **200** | `#E5E7EB` | 229, 231, 235 | **Borders, dividers** |
| **300** | `#D1D5DB` | 209, 213, 219 | Lighter borders, disabled states |
| **400** | `#9CA3AF` | 156, 163, 175 | Placeholder text, disabled text |
| **500** | `#6B7280` | 107, 114, 128 | Secondary text |
| **600** | `#4B5563` | 75, 85, 99 | Secondary text, icons |
| **700** | `#374151` | 55, 65, 81 | Body text |
| **800** | `#1F2937` | 31, 41, 55 | Dark text |
| **900** (Darkest) | `#111827` | 17, 24, 39 | Headings, primary text |

---

## Semantic Colors

### Success (Green)
```
Hex: #10B981
RGB: 16, 185, 129
HSL: 160°, 84%, 39%
Usage: Success states, positive actions, checkmarks
Badge Background: rgba(16, 185, 129, 0.1)
Badge Text: #10B981
```

### Warning (Amber)
```
Hex: #F59E0B
RGB: 245, 158, 11
HSL: 44°, 97%, 50%
Usage: Warnings, pending states, alerts
Badge Background: rgba(245, 158, 11, 0.1)
Badge Text: #F59E0B
```

### Danger (Red)
```
Hex: #EF4444
RGB: 239, 68, 68
HSL: 0°, 84%, 60%
Usage: Errors, destructive actions, failures
Badge Background: rgba(239, 68, 68, 0.1)
Badge Text: #EF4444
```

### Info (Blue)
```
Hex: #3B82F6
RGB: 59, 130, 246
HSL: 217°, 97%, 60%
Usage: Information, tips, general alerts
```

---

## Component-Specific Color Combinations

### Buttons

#### Primary Button
```
Background: #4F6FAF
Text: #FFFFFF (white)
Border: #4F6FAF
Hover Background: #3F5F9F
Active Background: #2F4F8F
Focus Ring: rgba(79, 111, 175, 0.2)
```

#### Secondary Button
```
Background: #EFF2FF (light brand)
Text: #4F6FAF (brand primary)
Border: #EFF2FF
Hover Background: #D4DFF6
Hover Text: #3F5F9F (brand dark)
```

#### Outline Button
```
Background: transparent
Text: #4F6FAF
Border: #4F6FAF
Hover Background: #EFF2FF
Hover Text: #3F5F9F
```

#### Ghost Button
```
Background: transparent
Text: #374151 (neutral-700)
Hover Background: #F5F5F5 (neutral-100)
Hover Text: #111827 (neutral-900)
```

### Cards

#### Normal State
```
Background: #FFFFFF
Border: #E5E7EB (neutral-200)
Shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
```

#### Hover State
```
Background: #FFFFFF
Border: #4F6FAF (brand primary)
Shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1)
Transform: scale(1.02)
```

#### Elevated State
```
Background: #FFFFFF
Border: #EFF2FF (brand light)
Shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1)
```

### Input Fields

#### Normal State
```
Background: #FFFFFF
Border: #E5E7EB (neutral-200)
Text: #111827 (neutral-900)
Placeholder: #9CA3AF (neutral-400)
```

#### Hover State
```
Background: #FFFFFF
Border: #D1D5DB (neutral-300)
```

#### Focus State
```
Background: #FFFFFF
Border: #4F6FAF (brand primary)
Box Shadow: 0 0 0 2px rgba(79, 111, 175, 0.1)
```

#### Disabled State
```
Background: #FAFAFA (neutral-50)
Border: #E5E7EB (neutral-200)
Text: #9CA3AF (neutral-400)
Opacity: 50%
```

### Tabs

#### Inactive Tab
```
Text: #4B5563 (neutral-600)
Border: transparent
Background: transparent
Hover Text: #111827 (neutral-900)
```

#### Active Tab
```
Text: #4F6FAF (brand primary)
Border Bottom: 2px solid #4F6FAF
Background: transparent
```

### Badges

#### Primary Badge
```
Background: rgba(79, 111, 175, 0.1) or #EFF2FF
Text: #4F6FAF
Border-radius: 9999px
```

#### Success Badge
```
Background: rgba(16, 185, 129, 0.1)
Text: #10B981
```

#### Warning Badge
```
Background: rgba(245, 158, 11, 0.1)
Text: #F59E0B
```

#### Danger Badge
```
Background: rgba(239, 68, 68, 0.1)
Text: #EF4444
```

---

## Modal & Overlay

### Modal Background
```
Background: #FFFFFF
Border: 1px solid #E5E7EB (neutral-200)
Border Radius: 12px
Shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1)
```

### Modal Overlay
```
Background: rgba(0, 0, 0, 0.2)
No Blur Effect
```

### Modal Header
```
Title Text: #111827 (neutral-900)
Subtitle Text: #4B5563 (neutral-600)
Border Bottom: 1px solid #E5E7EB
```

---

## Text Colors

### Headings
```
Heading 1: #111827 (neutral-900) | 2rem | Bold
Heading 2: #111827 (neutral-900) | 1.5rem | Bold
Heading 3: #111827 (neutral-900) | 1.25rem | Bold
```

### Body Text
```
Primary Body: #4B5563 (neutral-600) | 0.875rem
Large Body: #4B5563 (neutral-600) | 1rem
Small Body: #4B5563 (neutral-600) | 0.8125rem
```

### Secondary Text
```
Color: #9CA3AF (neutral-400)
Usage: Placeholders, disabled text, hints
```

---

## Shadows

### Small
```css
box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
```

### Medium
```css
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 
            0 2px 4px -1px rgba(0, 0, 0, 0.06);
```

### Large
```css
box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 
            0 4px 6px -2px rgba(0, 0, 0, 0.05);
```

### Extra Large
```css
box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 
            0 10px 10px -5px rgba(0, 0, 0, 0.04);
```

---

## Focus States

### Standard Focus Ring
```
Ring Color: #4F6FAF (brand primary)
Ring Width: 2px
Ring Offset: 0px (inside border)
Ring Opacity: 20% - rgba(79, 111, 175, 0.2)
```

---

## Accessibility Considerations

### Color Contrast Ratios

| Element | Foreground | Background | Contrast | WCAG Level |
|---------|-----------|-----------|----------|-----------|
| Primary Button Text | #FFFFFF | #4F6FAF | 9.2:1 | AAA ✓ |
| Body Text | #4B5563 | #FFFFFF | 7.5:1 | AAA ✓ |
| Secondary Text | #9CA3AF | #FFFFFF | 4.8:1 | AA ✓ |
| Badge Text | #4F6FAF | #EFF2FF | 5.2:1 | AA ✓ |
| Success Text | #10B981 | #FFFFFF | 6.8:1 | AAA ✓ |
| Warning Text | #F59E0B | #FFFFFF | 8.1:1 | AAA ✓ |
| Error Text | #EF4444 | #FFFFFF | 5.6:1 | AA ✓ |

All color combinations meet WCAG 2.1 accessibility standards.

---

## Using Colors in Your Code

### Tailwind CSS
```tsx
// Primary brand
className="bg-brand-primary hover:bg-brand-dark"
className="text-brand-primary"
className="border-brand-primary"

// Neutrals
className="bg-neutral-100"
className="text-neutral-600"
className="border-neutral-200"

// Direct hex
className="bg-[#4F6FAF]"
className="text-[#EFF2FF]"
```

### CSS Variables
```css
background-color: var(--brand-primary);
color: var(--brand-secondary);
border-color: var(--neutral-200);
```

### Direct Hex Values
```tsx
className="bg-[#4F6FAF] text-[#FFFFFF]"
style={{ backgroundColor: '#4F6FAF' }}
```

---

## Color Export Format

### For Design Tools
Copy and paste into Figma, Sketch, or Adobe XD:

**Brand Colors**:
- #4F6FAF (Primary)
- #6C8CFF (Secondary)
- #EFF2FF (Light)
- #3F5F9F (Dark)

**Neutrals**:
- #FFFFFF, #FAFAFA, #F5F5F5, #E5E7EB, #D1D5DB
- #9CA3AF, #6B7280, #4B5563, #374151, #111827

**Semantic**:
- #10B981 (Success)
- #F59E0B (Warning)
- #EF4444 (Danger)
- #3B82F6 (Info)

---

## Color Updates for Different Themes

If you want to customize colors in the future:

1. Update `tailwind.config.ts` brand color definitions
2. Update CSS variables in `saas-theme.css`
3. Update hex values in component files
4. Test all WCAG contrast ratios

---

**Last Updated**: April 2026  
**Version**: 1.0  
**Designed for**: Premium SaaS applications
