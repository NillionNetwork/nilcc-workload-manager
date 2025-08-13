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
  card: 'bg-card rounded-lg border border-border shadow-sm',
  cardPadding: 'p-6',
  
  // Buttons
  button: {
    base: 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring cursor-pointer',
    sizes: {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    },
    variants: {
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border',
      danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      ghost: 'text-foreground hover:bg-accent hover:text-accent-foreground',
    }
  },
  
  // Form inputs
  input: {
    base: 'block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring sm:text-sm',
    error: 'border-destructive focus:border-destructive focus:ring-destructive',
  },
  
  // Labels and text
  label: 'block text-sm font-medium text-foreground mb-2',
  helperText: 'text-sm text-muted-foreground',
  errorText: 'text-sm text-destructive',
  
  // Status badges
  badge: {
    base: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
    variants: {
      success: 'bg-primary text-primary-foreground',
      warning: 'bg-muted text-muted-foreground',
      danger: 'bg-destructive text-destructive-foreground',
      neutral: 'bg-secondary text-secondary-foreground',
      info: 'bg-accent text-accent-foreground',
    }
  },
  
  // Layout
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  section: 'space-y-6',
  
  // Navigation
  nav: {
    base: 'bg-card shadow-sm border-b border-border',
    link: 'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors',
    linkActive: 'border-primary text-primary',
    linkInactive: 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground',
  },
  
  // Alerts/notifications
  alert: {
    base: 'rounded-lg p-4 border',
    variants: {
      success: 'bg-accent border-border text-accent-foreground',
      warning: 'bg-muted border-border text-muted-foreground',
      danger: 'bg-destructive/10 border-destructive text-destructive',
      info: 'bg-accent border-border text-accent-foreground',
    }
  }
} as const;

// Utility function to combine classes
export const cn = (...classes: (string | undefined | false | null)[]): string => {
  return classes.filter(Boolean).join(' ');
};