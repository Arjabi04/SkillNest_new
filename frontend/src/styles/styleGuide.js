x/**
 * SkillNest Design System & Style Guide
 * 
 * Comprehensive style guide for consistent UI/UX across all components
 * Follow this guide for all new components and refactoring existing ones
 */

// =============================================
// 1. COLOR PALETTE
// =============================================

export const colors = {
  // Primary Colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe', 
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Main brand color
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a'
  },
  
  // Secondary Colors  
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0', 
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a'
  },
  
  // Accent Colors
  accent: {
    yellow: { light: '#fef3c7', main: '#f59e0b', dark: '#d97706' },
    green: { light: '#d1fae5', main: '#10b981', dark: '#059669' },
    red: { light: '#fee2e2', main: '#ef4444', dark: '#dc2626' },
    indigo: { light: '#e0e7ff', main: '#6366f1', dark: '#4f46e5' }
  },
  
  // Status Colors
  status: {
    success: '#10b981',
    warning: '#f59e0b', 
    error: '#ef4444',
    info: '#3b82f6'
  }
};

// =============================================
// 2. TYPOGRAPHY SCALE
// =============================================

export const typography = {
  // Font Families
  fontFamily: {
    sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
    mono: ['SF Mono', 'Monaco', 'Inconsolata', 'monospace']
  },
  
  // Font Sizes (rem values)
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px  
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem'     // 48px
  },
  
  // Font Weights
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 900
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75
  }
};

// =============================================
// 3. SPACING SYSTEM
// =============================================

export const spacing = {
  xs: '0.25rem',  // 4px
  sm: '0.5rem',   // 8px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '3rem',  // 48px
  '3xl': '4rem',  // 64px
  '4xl': '6rem'   // 96px
};

// =============================================
// 4. COMPONENT STYLES
// =============================================

export const components = {
  // Button Variants
  button: {
    primary: `
      inline-flex items-center justify-center px-4 py-2 
      bg-blue-600 hover:bg-blue-700 
      text-white font-medium text-sm
      rounded-lg border border-transparent
      transition-all duration-200 ease-in-out
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    secondary: `
      inline-flex items-center justify-center px-4 py-2
      bg-white hover:bg-slate-50 
      text-slate-700 font-medium text-sm
      rounded-lg border border-slate-300
      transition-all duration-200 ease-in-out
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    ghost: `
      inline-flex items-center justify-center px-4 py-2
      bg-transparent hover:bg-slate-100 
      text-slate-700 font-medium text-sm
      rounded-lg border border-transparent
      transition-all duration-200 ease-in-out
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
    `
  },
  
  // Card Variants
  card: {
    base: `
      bg-white rounded-2xl border border-slate-200
      shadow-sm hover:shadow-lg
      transition-all duration-300 ease-in-out
    `,
    elevated: `
      bg-white rounded-2xl border border-slate-200
      shadow-lg hover:shadow-xl
      transition-all duration-300 ease-in-out
    `
  },
  
  // Input Variants
  input: {
    base: `
      w-full px-3 py-2
      bg-white border border-slate-300 rounded-lg
      text-slate-900 placeholder-slate-500
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
      disabled:bg-slate-50 disabled:cursor-not-allowed
      transition-all duration-200 ease-in-out
    `
  },
  
  // Badge Variants
  badge: {
    primary: `
      inline-flex items-center px-2.5 py-1
      bg-blue-100 text-blue-800
      text-xs font-medium rounded-full
    `,
    secondary: `
      inline-flex items-center px-2.5 py-1
      bg-slate-100 text-slate-800
      text-xs font-medium rounded-full
    `,
    success: `
      inline-flex items-center px-2.5 py-1
      bg-green-100 text-green-800
      text-xs font-medium rounded-full
    `,
    warning: `
      inline-flex items-center px-2.5 py-1
      bg-yellow-100 text-yellow-800
      text-xs font-medium rounded-full
    `
  }
};

// =============================================
// 5. LAYOUT PATTERNS
// =============================================

export const layouts = {
  // Page Container
  pageContainer: `
    min-h-screen bg-slate-50
    flex
  `,
  
  // Content Area (with sidebar)
  contentArea: `
    flex-1 ml-64
    max-w-[1600px] mx-auto w-full 
    px-6 py-8 lg:py-12
  `,
  
  // Content Area (mobile)
  contentAreaMobile: `
    flex-1 px-4 py-6
  `,
  
  // Section Headers
  sectionHeader: `
    flex flex-col lg:flex-row justify-between items-start lg:items-end 
    mb-16 gap-8
  `,
  
  // Grid Layouts
  grid: {
    auto: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6`,
    two: `grid grid-cols-1 lg:grid-cols-2 gap-6`,
    three: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
  }
};

// =============================================
// 6. ANIMATION & TRANSITIONS
// =============================================

export const animations = {
  // Standard Transitions
  transition: {
    fast: 'transition-all duration-150 ease-in-out',
    normal: 'transition-all duration-200 ease-in-out', 
    slow: 'transition-all duration-300 ease-in-out'
  },
  
  // Hover Effects
  hover: {
    lift: 'hover:-translate-y-1 hover:shadow-lg',
    scale: 'hover:scale-105',
    glow: 'hover:shadow-xl'
  },
  
  // Focus States
  focus: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
};

// =============================================
// 7. DESIGN PRINCIPLES
// =============================================

export const principles = {
  /*
  1. NO GRADIENTS ON TITLES OR TEXT PATHS
     - Use solid colors for all text elements
     - Gradients only for decorative backgrounds or accents
  
  2. CONSISTENT SPACING
     - Use the spacing system defined above
     - Maintain consistent margins and padding
  
  3. UNIFIED COLOR PALETTE  
     - Stick to the defined color system
     - Use semantic colors (success, warning, error)
  
  4. ACCESSIBLE INTERACTIONS
     - Always include focus states
     - Sufficient color contrast
     - Clear visual hierarchy
  
  5. RESPONSIVE DESIGN
     - Mobile-first approach
     - Consistent breakpoints
     - Flexible layouts
  
  6. PERFORMANCE
     - Efficient animations
     - Optimized assets
     - Minimal re-renders
  */
};

export default {
  colors,
  typography,
  spacing,
  components,
  layouts,
  animations,
  principles
};