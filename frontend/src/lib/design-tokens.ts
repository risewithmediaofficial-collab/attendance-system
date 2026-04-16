/**
 * DESIGN SYSTEM & TOKENS
 * Centralized design decisions for consistency across the app
 */

// Spacing System (8px base unit)
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
} as const;

// Border Radius
export const borderRadius = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
} as const;

// Shadows
export const shadows = {
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  elevation: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
} as const;

// Typography
export const typography = {
  sizes: {
    xs: { fontSize: '12px', lineHeight: '16px' },
    sm: { fontSize: '14px', lineHeight: '20px' },
    base: { fontSize: '16px', lineHeight: '24px' },
    lg: { fontSize: '18px', lineHeight: '28px' },
    xl: { fontSize: '20px', lineHeight: '28px' },
    '2xl': { fontSize: '24px', lineHeight: '32px' },
    '3xl': { fontSize: '30px', lineHeight: '36px' },
  },
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

// Colors - Semantic
export const colors = {
  // Neutral
  background: '#FAFAFA',
  surface: '#FFFFFF',
  border: '#E5E5E5',
  
  // Text
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
    muted: '#9CA3AF',
    inverse: '#FFFFFF',
  },
  
  // Interactive
  primary: '#000000',
  primaryHover: '#1F2937',
  secondary: '#F3F4F6',
  secondaryHover: '#E5E7EB',
  
  // Status
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Semantic
  statusPending: '#FBBF24',
  statusApproved: '#10B981',
  statusRejected: '#EF4444',
  statusInProgress: '#3B82F6',
  statusCompleted: '#8B5CF6',
} as const;

// States
export const states = {
  hover: 'hover:bg-black/5 transition-colors duration-150',
  active: 'bg-black/10 border border-black/15',
  disabled: 'opacity-50 cursor-not-allowed',
  focus: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
} as const;

// Animation
export const animation = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  easing: {
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// Breakpoints
export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Z-Index Scale
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  backdrop: 1040,
  offcanvas: 1050,
  modal: 1060,
  popover: 1070,
  tooltip: 1080,
  notification: 1090,
} as const;

// Component Variants (pre-configured)
export const componentVariants = {
  // Button variants
  button: {
    primary: 'bg-black text-white hover:bg-black/90',
    secondary: 'bg-black/10 text-black hover:bg-black/15',
    ghost: 'hover:bg-black/5 text-black',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
  },
  
  // Input variants
  input: {
    default: 'border border-black/15 rounded-md focus:ring-2 focus:ring-black/20',
    error: 'border-red-500 focus:ring-red-500/20',
    success: 'border-green-500 focus:ring-green-500/20',
  },
  
  // Card variants
  card: {
    base: 'bg-white border border-black/10 rounded-lg shadow-sm',
    hover: 'bg-white border border-black/10 rounded-lg shadow-sm hover:shadow-md transition-shadow',
    elevated: 'bg-white rounded-lg shadow-lg',
  },
  
  // Badge variants
  badge: {
    default: 'bg-black/10 text-black/80 border border-black/15',
    success: 'bg-green-100 text-green-800 border border-green-300',
    warning: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    error: 'bg-red-100 text-red-800 border border-red-300',
    info: 'bg-blue-100 text-blue-800 border border-blue-300',
  },
} as const;

export type SpacingKey = keyof typeof spacing;
export type ColorKey = keyof typeof colors;
export type TypographySizeKey = keyof typeof typography.sizes;
export type ShadowKey = keyof typeof shadows;
