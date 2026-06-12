import { Platform } from 'react-native';

/**
 * TunguMarket Design System Tokens
 */
export const Colors = {
  brand: {
    primary: '#fbbf24',    // Amber/Yellow (MercadoLibre-inspired)
    secondary: '#1e3a8a',  // Deep Blue (Trust)
    accent: '#ea580c',     // Orange
    success: '#10b981',    // Green
    error: '#ef4444',      // Red
    dark: '#0f172a',       // Text Dark
    light: '#f8fafc',      // Background Light
    muted: '#64748b',      // Gray/Muted Text
    border: '#e2e8f0',     // Default Border
    surface: '#ffffff',    // Card Background
  },
  light: {
    text: '#0f172a',
    background: '#f8fafc',
    backgroundElement: '#ffffff',
    backgroundSelected: '#f1f5f9',
    textSecondary: '#64748b',
  },
  dark: {
    text: '#f8fafc',
    background: '#0f172a',
    backgroundElement: '#1e293b',
    backgroundSelected: '#334155',
    textSecondary: '#94a3b8',
  },
} as const;

export const Rounding = {
  small: 8,
  medium: 12,
  large: 16,
  xl: 24,       // Consistent with Web Card
  full: 9999,   // Circle
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 64,
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'Inter_400Regular',
    display: 'Outfit_700Bold',
  },
  android: {
    sans: 'Inter_400Regular',
    display: 'Outfit_700Bold',
  },
  default: {
    sans: 'sans-serif',
    display: 'sans-serif',
  },
});

export const Shadow = {
  light: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  medium: {
    shadowColor: Colors.brand.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
  },
};

export const MaxContentWidth = 800;
