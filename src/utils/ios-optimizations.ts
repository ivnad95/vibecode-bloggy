import { Platform } from "react-native";

/**
 * iOS-specific optimizations and utilities
 */

// iOS-specific haptic feedback patterns
export const iOSHaptics = {
  light: () => {
    if (Platform.OS === "ios") {
      import("expo-haptics").then(({ Haptics }) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      });
    }
  },
  medium: () => {
    if (Platform.OS === "ios") {
      import("expo-haptics").then(({ Haptics }) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      });
    }
  },
  heavy: () => {
    if (Platform.OS === "ios") {
      import("expo-haptics").then(({ Haptics }) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      });
    }
  },
  success: () => {
    if (Platform.OS === "ios") {
      import("expo-haptics").then(({ Haptics }) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      });
    }
  },
  warning: () => {
    if (Platform.OS === "ios") {
      import("expo-haptics").then(({ Haptics }) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      });
    }
  },
  error: () => {
    if (Platform.OS === "ios") {
      import("expo-haptics").then(({ Haptics }) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      });
    }
  },
};

// iOS-specific animation configurations
export const iOSAnimations = {
  // Spring configurations optimized for iOS
  spring: {
    gentle: {
      damping: 20,
      stiffness: 300,
      mass: 0.8,
    },
    bouncy: {
      damping: 15,
      stiffness: 400,
      mass: 0.6,
    },
    snappy: {
      damping: 25,
      stiffness: 500,
      mass: 0.5,
    },
  },
  // Timing configurations
  timing: {
    fast: { duration: 200 },
    normal: { duration: 300 },
    slow: { duration: 500 },
  },
};

// iOS-specific layout helpers
export const iOSLayout = {
  // Safe area insets for different screen sizes
  getSafeAreaInsets: () => {
    if (Platform.OS === "ios") {
      // These would be dynamically calculated based on device
      return {
        top: 44, // Status bar height
        bottom: 34, // Home indicator height
        left: 0,
        right: 0,
      };
    }
    return { top: 0, bottom: 0, left: 0, right: 0 };
  },
  
  // iOS-specific spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  // iOS-specific border radius
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
  },
};

// iOS-specific performance optimizations
export const iOSPerformance = {
  // Optimize scroll performance
  scrollConfig: {
    decelerationRate: Platform.OS === "ios" ? 0.998 : 0.985,
    bounces: Platform.OS === "ios",
    alwaysBounceVertical: Platform.OS === "ios",
    showsVerticalScrollIndicator: Platform.OS === "ios",
  },
  
  // Optimize image loading
  imageConfig: {
    resizeMode: "cover" as const,
    cache: "force-cache" as const,
  },
  
  // Optimize text rendering
  textConfig: {
    allowFontScaling: Platform.OS === "ios",
    adjustsFontSizeToFit: Platform.OS === "ios",
  },
};

// iOS-specific accessibility
export const iOSAccessibility = {
  // VoiceOver optimizations
  voiceOver: {
    announceForAccessibility: (message: string) => {
      if (Platform.OS === "ios") {
        // This would use AccessibilityInfo.announceForAccessibility
        console.log(`VoiceOver: ${message}`);
      }
    },
  },
  
  // Dynamic Type support
  dynamicType: {
    maxFontSizeMultiplier: Platform.OS === "ios" ? 1.3 : 1.0,
    minFontSizeMultiplier: Platform.OS === "ios" ? 0.8 : 1.0,
  },
};

// iOS-specific keyboard handling
export const iOSKeyboard = {
  // Keyboard avoidance configurations
  avoidance: {
    behavior: Platform.OS === "ios" ? "padding" : "height",
    keyboardVerticalOffset: Platform.OS === "ios" ? 88 : 0,
  },
  
  // Keyboard dismiss configurations
  dismiss: {
    mode: Platform.OS === "ios" ? "interactive" : "on-drag",
    keyboardShouldPersistTaps: "handled" as const,
  },
};

// iOS-specific blur effects
export const iOSBlur = {
  // System blur effects
  systemBlur: {
    light: "systemUltraThinMaterialLight" as const,
    medium: "systemThinMaterialLight" as const,
    heavy: "systemMaterialLight" as const,
    dark: "systemUltraThinMaterialDark" as const,
  },
  
  // Custom blur intensities
  intensity: {
    subtle: 20,
    light: 40,
    medium: 60,
    heavy: 80,
    max: 100,
  },
};

// iOS-specific color schemes
export const iOSColors = {
  // System colors that adapt to light/dark mode
  system: {
    background: "#ffffff",
    secondaryBackground: "#f2f2f7",
    tertiaryBackground: "#ffffff",
    groupedBackground: "#f2f2f7",
    secondaryGroupedBackground: "#ffffff",
    tertiaryGroupedBackground: "#f2f2f7",
    label: "#000000",
    secondaryLabel: "#3c3c43",
    tertiaryLabel: "#3c3c43",
    quaternaryLabel: "#2c2c2e",
    placeholderText: "#3c3c43",
    separator: "#3c3c43",
    opaqueSeparator: "#c6c6c8",
    link: "#007aff",
    systemBlue: "#007aff",
    systemGreen: "#34c759",
    systemIndigo: "#5856d6",
    systemOrange: "#ff9500",
    systemPink: "#ff2d92",
    systemPurple: "#af52de",
    systemRed: "#ff3b30",
    systemTeal: "#5ac8fa",
    systemYellow: "#ffcc00",
  },
};

// iOS-specific typography
export const iOSTypography = {
  // System font configurations
  systemFont: {
    largeTitle: {
      fontSize: 34,
      fontWeight: "400" as const,
      lineHeight: 41,
      letterSpacing: 0.37,
    },
    title1: {
      fontSize: 28,
      fontWeight: "400" as const,
      lineHeight: 34,
      letterSpacing: 0.36,
    },
    title2: {
      fontSize: 22,
      fontWeight: "400" as const,
      lineHeight: 28,
      letterSpacing: 0.35,
    },
    title3: {
      fontSize: 20,
      fontWeight: "400" as const,
      lineHeight: 25,
      letterSpacing: 0.38,
    },
    headline: {
      fontSize: 17,
      fontWeight: "600" as const,
      lineHeight: 22,
      letterSpacing: -0.41,
    },
    body: {
      fontSize: 17,
      fontWeight: "400" as const,
      lineHeight: 22,
      letterSpacing: -0.41,
    },
    callout: {
      fontSize: 16,
      fontWeight: "400" as const,
      lineHeight: 21,
      letterSpacing: -0.32,
    },
    subhead: {
      fontSize: 15,
      fontWeight: "400" as const,
      lineHeight: 20,
      letterSpacing: -0.24,
    },
    footnote: {
      fontSize: 13,
      fontWeight: "400" as const,
      lineHeight: 18,
      letterSpacing: -0.08,
    },
    caption1: {
      fontSize: 12,
      fontWeight: "400" as const,
      lineHeight: 16,
      letterSpacing: 0,
    },
    caption2: {
      fontSize: 11,
      fontWeight: "400" as const,
      lineHeight: 13,
      letterSpacing: 0.07,
    },
  },
};

// Export all iOS optimizations
export default {
  haptics: iOSHaptics,
  animations: iOSAnimations,
  layout: iOSLayout,
  performance: iOSPerformance,
  accessibility: iOSAccessibility,
  keyboard: iOSKeyboard,
  blur: iOSBlur,
  colors: iOSColors,
  typography: iOSTypography,
};
