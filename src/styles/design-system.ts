// Simplified Grayscale Design System
export const colors = {
  // Grayscale palette for everything
  gray: {
    50: 'rgb(249 250 251)',   // Lightest backgrounds
    100: 'rgb(243 244 246)',  // Light backgrounds
    200: 'rgb(229 231 235)',  // Borders
    300: 'rgb(209 213 219)',  // Disabled states
    400: 'rgb(156 163 175)',  // Placeholder text
    500: 'rgb(107 114 128)',  // Secondary text
    600: 'rgb(75 85 99)',     // Body text
    700: 'rgb(55 65 81)',     // Headings
    800: 'rgb(31 41 55)',     // Strong text
    900: 'rgb(17 24 39)',     // Darkest text
  },
  
  // Utility colors
  white: 'rgb(255 255 255)',
  black: 'rgb(0 0 0)',
  transparent: 'transparent',
} as const;

// Component classes that can be easily customized
export const components = {
  // Cards and containers
  card: 'bg-white rounded-lg border border-gray-200 shadow-sm',
  cardPadding: 'p-6',
  
  // Buttons
  button: {
    base: 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
    sizes: {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    },
    variants: {
      primary: 'bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-500',
      secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500',
      danger: 'bg-gray-700 text-white hover:bg-gray-800 focus:ring-gray-500',
      ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
    }
  },
  
  // Form inputs
  input: {
    base: 'block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-gray-500 focus:ring-gray-500 sm:text-sm',
    error: 'border-gray-400 focus:border-gray-600 focus:ring-gray-600',
  },
  
  // Labels and text
  label: 'block text-sm font-medium text-gray-700 mb-2',
  helperText: 'text-sm text-gray-500',
  errorText: 'text-sm text-gray-700',
  
  // Status badges
  badge: {
    base: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
    variants: {
      success: 'bg-gray-800 text-white',
      warning: 'bg-gray-600 text-white',
      danger: 'bg-gray-700 text-white',
      neutral: 'bg-gray-100 text-gray-800',
      info: 'bg-gray-500 text-white',
    }
  },
  
  // Layout
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  section: 'space-y-6',
  
  // Navigation
  nav: {
    base: 'bg-white shadow-sm border-b',
    link: 'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors',
    linkActive: 'border-gray-900 text-gray-900',
    linkInactive: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
  },
  
  // Alerts/notifications
  alert: {
    base: 'rounded-lg p-4 border',
    variants: {
      success: 'bg-gray-50 border-gray-300 text-gray-800',
      warning: 'bg-gray-100 border-gray-400 text-gray-800',
      danger: 'bg-gray-100 border-gray-400 text-gray-800',
      info: 'bg-gray-50 border-gray-300 text-gray-800',
    }
  }
} as const;

// Utility function to combine classes
export const cn = (...classes: (string | undefined | false | null)[]): string => {
  return classes.filter(Boolean).join(' ');
};