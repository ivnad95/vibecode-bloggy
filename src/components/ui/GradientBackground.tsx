import React from "react";
import { View, ViewStyle, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { cn } from "../../utils/cn";
import { colors } from "../../styles/design-system";

interface GradientBackgroundProps {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
  variant?: "primary" | "secondary" | "accent" | "neutral" | "custom";
  animated?: boolean;
  customColors?: [string, string, ...string[]];
  direction?: "vertical" | "horizontal" | "diagonal";
}

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function GradientBackground({
  children,
  className,
  style,
  variant = "primary",
  animated = false,
  customColors,
  direction = "diagonal",
}: GradientBackgroundProps) {
  const animationProgress = useSharedValue(0);

  React.useEffect(() => {
    if (animated) {
      animationProgress.value = withRepeat(
        withTiming(1, { duration: Platform.OS === "ios" ? 10000 : 8000 }),
        -1,
        true
      );
    }
  }, [animated, animationProgress]);

  const getGradientColors = (): [string, string, ...string[]] => {
    if (customColors) return customColors;

    switch (variant) {
      case "primary":
        return [
          '#2563eb',
          '#1d4ed8',
          '#8b5cf6',
        ];
      case "secondary":
        return [
          '#f59e0b',
          '#ec4899',
          '#ef4444',
        ];
      case "accent":
        return [
          '#10b981',
          '#3b82f6',
          '#8b5cf6',
        ];
      case "neutral":
        return [
          '#f9fafb',
          '#f3f4f6',
          '#e2e8f0',
        ];
      default:
        return [
          '#2563eb',
          '#1d4ed8',
          '#8b5cf6',
        ];
    }
  };

  const getGradientDirection = () => {
    switch (direction) {
      case "vertical":
        return { start: { x: 0, y: 0 }, end: { x: 0, y: 1 } };
      case "horizontal":
        return { start: { x: 0, y: 0 }, end: { x: 1, y: 0 } };
      case "diagonal":
        return { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } };
      default:
        return { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } };
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    if (!animated) return {};

    const t = animationProgress.value;
    const translateY = interpolate(t, [0, 0.5, 1], [0, -6, 0]);
    const scale = 1 + 0.01 * Math.sin(t * Math.PI * 2);

    return {
      transform: [{ translateY }, { scale }],
    };
  });

  const gradientDirection = getGradientDirection();
  const colors = getGradientColors();

  if (animated) {
    return (
      <View style={[{ flex: 1 }, style]} className={cn("relative", className)}>
        <AnimatedLinearGradient
          colors={colors}
          start={gradientDirection.start}
          end={gradientDirection.end}
          style={[
            {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            },
            animatedStyle,
          ]}
        />
        <View style={{ flex: 1, position: "relative", zIndex: 1 }}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={colors}
      start={gradientDirection.start}
      end={gradientDirection.end}
      style={[{ flex: 1 }, style]}
      className={cn("relative", className)}
    >
      {children}
    </LinearGradient>
  );
}