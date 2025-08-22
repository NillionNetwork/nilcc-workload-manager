// Nillion Brand Design System
export const colors = {
  // Nillion brand colors
  nillion: {
    primary: '#0000ff',           // Nillion blue
    primaryHover: '#0000b3',      // Darker blue for hover
    primaryActive: '#000080',     // Even darker for active
    primaryLight: '#3333ff',      // Light blue
    primaryLighter: '#4d4dff',    // Lighter blue
    primaryLightest: '#ccccff',   // Lightest blue
    
    // Dark mode colors
    darkPrimary: '#8a89ff',       // Light purple for dark mode
    darkPrimaryHover: '#a5a4ff',  // Lighter purple hover
    darkPrimaryActive: '#6f6eff', // Darker purple active
    
    // Background colors
    bg: '#ffffff',
    bgSecondary: '#f9f9f9',
    darkBg: '#12125a',            // Deep blue for dark mode
    darkBgSecondary: '#1a1a6e',   // Lighter deep blue
  },
  
  // Grayscale palette with Nillion adjustments
  gray: {
    50: '#f7f7f7',    // Nillion grey-light
    100: '#e0e0e0',   // Nillion grey
    200: '#646464',   // Nillion grey-dark
    300: '#666666',   // Text secondary
    400: '#b0b0b0',   // Dark mode text secondary
    500: '#4746a7',   // Dark mode border
    600: '#3a3a3a',   // Dark mode grey
    700: '#2a2a2a',   // Dark mode grey-light
    800: '#000000',   // Light mode text
    900: '#ffffff',   // Dark mode text
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
      primary: 'nillion-button-primary',
      secondary: 'nillion-button-secondary',
      danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      ghost: 'nillion-button-ghost',
      outline: 'nillion-button-outline',
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