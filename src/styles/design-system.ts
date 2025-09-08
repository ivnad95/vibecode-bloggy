/**
 * Enhanced Design System for SEO Blog Generator
 * Improved contrast, accessibility, and iOS optimization
 */

import { Platform } from 'react-native';

export const colors = {
  // Primary Colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
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
    900: '#0f172a',
  },
  
  // Accent Colors
  accent: {
    blue: '#3b82f6',
    purple: '#8b5cf6',
    green: '#10b981',
    yellow: '#f59e0b',
    red: '#ef4444',
    pink: '#ec4899',
  },
  
  // Status Colors
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  
  // Glass Effect Colors
  glass: {
    light: 'rgba(255, 255, 255, 0.25)',
    medium: 'rgba(255, 255, 255, 0.15)',
    dark: 'rgba(255, 255, 255, 0.05)',
    border: 'rgba(255, 255, 255, 0.2)',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  
  // Text Colors with High Contrast
  text: {
    primary: '#1f2937',      // High contrast dark
    secondary: '#4b5563',    // Medium contrast
    tertiary: '#6b7280',     // Lower contrast
    inverse: '#ffffff',      // White text
    inverseSecondary: 'rgba(255, 255, 255, 0.8)',
    inverseTertiary: 'rgba(255, 255, 255, 0.6)',
  },
  
  // Background Colors
  background: {
    primary: '#ffffff',
    secondary: '#f9fafb',
    tertiary: '#f3f4f6',
    dark: '#111827',
    glass: 'rgba(255, 255, 255, 0.1)',
  },
} as const;

export const typography = {
  // Font Families
  fontFamily: {
    primary: Platform.OS === 'ios' ? 'System' : 'Roboto',
    secondary: Platform.OS === 'ios' ? 'Helvetica' : 'Arial',
    mono: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  
  // Font Sizes with iOS optimization
  fontSize: {
    xs: Platform.OS === 'ios' ? 12 : 11,
    sm: Platform.OS === 'ios' ? 14 : 13,
    base: Platform.OS === 'ios' ? 16 : 15,
    lg: Platform.OS === 'ios' ? 18 : 17,
    xl: Platform.OS === 'ios' ? 20 : 19,
    '2xl': Platform.OS === 'ios' ? 24 : 22,
    '3xl': Platform.OS === 'ios' ? 30 : 28,
    '4xl': Platform.OS === 'ios' ? 36 : 34,
    '5xl': Platform.OS === 'ios' ? 48 : 46,
  },
  
  // Font Weights
  fontWeight: {
    thin: '100',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  
  // Letter Spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },
} as const;

export const spacing = {
  // Spacing Scale
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
  32: 128,
} as const;

export const borderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

export const shadows = {
  // iOS-optimized shadows
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
} as const;

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

// Accessibility helpers
export const accessibility = {
  // Minimum touch target size (44pt for iOS)
  minTouchTarget: Platform.OS === 'ios' ? 44 : 48,
  
  // High contrast mode support
  highContrast: {
    text: '#000000',
    background: '#ffffff',
    border: '#000000',
  },
  
  // Focus indicators
  focus: {
    ring: '2px solid #3b82f6',
    ringOffset: '2px',
  },
} as const;

// Animation presets
export const animations = {
  // Timing functions
  timing: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  
  // Easing functions
  easing: {
    linear: 'linear',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
} as const;

// Component-specific styles
export const components = {
  button: {
    minHeight: 44,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  input: {
    minHeight: 44,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modal: {
    borderRadius: 24,
    padding: 24,
    maxWidth: '90%',
  },
} as const;
