import React from "react";
import { Text, Pressable, ViewStyle, TextStyle, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { cn } from "../../utils/cn";
import { colors, typography, spacing, borderRadius, shadows, accessibility } from "../../styles/design-system";

interface GlassButtonProps {
  title: string;
  onPress: () => void;
  className?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  size?: "small" | "medium" | "large";
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  intensity?: number;
  gradientColors?: [string, string, ...string[]];
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export default function GlassButton({
  title,
  onPress,
  className,
  style,
  textStyle,
  disabled = false,
  loading = false,
  variant = "primary",
  size = "medium",
  icon,
  iconPosition = "left",
  fullWidth = false,
  intensity = 25,
  gradientColors,
}: GlassButtonProps) {

  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.96);
      glowOpacity.value = withTiming(0.6, { duration: 100 });
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(1);
      glowOpacity.value = withTiming(0, { duration: 150 });
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return {
          gradientColors: gradientColors || [colors.primary[600], colors.primary[700]],
          borderColor: colors.glass.border,
          textColor: colors.text.inverse,
          shadowColor: colors.primary[600],
          backgroundColor: colors.primary[600],
        };
      case "secondary":
        return {
          gradientColors: gradientColors || [colors.glass.light, colors.glass.medium],
          borderColor: colors.glass.border,
          textColor: colors.text.primary,
          shadowColor: colors.glass.shadow,
          backgroundColor: colors.background.glass,
        };
      case "ghost":
        return {
          gradientColors: gradientColors || [colors.glass.dark, "transparent"],
          borderColor: colors.glass.border,
          textColor: colors.text.tertiary,
          shadowColor: colors.glass.shadow,
          backgroundColor: "transparent",
        };
      default:
        return {
          gradientColors: gradientColors || [colors.primary[600], colors.primary[700]],
          borderColor: colors.glass.border,
          textColor: colors.text.inverse,
          shadowColor: colors.primary[600],
          backgroundColor: colors.primary[600],
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return {
          paddingHorizontal: spacing[4],
          paddingVertical: spacing[2],
          borderRadius: borderRadius.md,
          fontSize: typography.fontSize.sm,
          iconSize: 16,
          minHeight: accessibility.minTouchTarget,
        };
      case "medium":
        return {
          paddingHorizontal: spacing[6],
          paddingVertical: spacing[3],
          borderRadius: borderRadius.lg,
          fontSize: typography.fontSize.base,
          iconSize: 20,
          minHeight: accessibility.minTouchTarget,
        };
      case "large":
        return {
          paddingHorizontal: spacing[8],
          paddingVertical: spacing[4],
          borderRadius: borderRadius.xl,
          fontSize: typography.fontSize.lg,
          iconSize: 24,
          minHeight: accessibility.minTouchTarget + 8,
        };
      default:
        return {
          paddingHorizontal: spacing[6],
          paddingVertical: spacing[3],
          borderRadius: borderRadius.lg,
          fontSize: typography.fontSize.base,
          iconSize: 20,
          minHeight: accessibility.minTouchTarget,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        animatedStyle,
        {
          alignSelf: fullWidth ? "stretch" : "flex-start",
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
      className={cn("relative overflow-hidden", className)}
    >
      {/* Glow Effect */}
      <Animated.View
        style={[
          glowStyle,
          {
            position: "absolute",
            top: -2,
            left: -2,
            right: -2,
            bottom: -2,
            borderRadius: sizeStyles.borderRadius + 2,
            backgroundColor: variantStyles.shadowColor,
            opacity: 0.3,
          },
        ]}
      />

      {/* Main Button Container */}
      <Animated.View
        style={{
          borderRadius: sizeStyles.borderRadius,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          paddingVertical: sizeStyles.paddingVertical,
          minHeight: sizeStyles.minHeight,
          borderWidth: 1,
          borderColor: variantStyles.borderColor,
          backgroundColor: variantStyles.backgroundColor,
          overflow: "hidden",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          ...shadows.base,
        }}
      >
        {/* Blur Background */}
        <AnimatedBlurView
          intensity={intensity}
          tint="light"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />

        {/* Gradient Overlay */}
        <LinearGradient
          colors={variantStyles.gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />

        {/* Button Content */}
        <Animated.View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1,
          }}
        >
          {icon && iconPosition === "left" && (
            <Ionicons
              name={icon}
              size={sizeStyles.iconSize}
              color={variantStyles.textColor}
              style={{ marginRight: 8 }}
            />
          )}

          {loading ? (
            <Ionicons
              name="hourglass-outline"
              size={sizeStyles.iconSize}
              color={variantStyles.textColor}
            />
          ) : (
            <Text
              style={[
                {
                  fontSize: sizeStyles.fontSize,
                  fontWeight: typography.fontWeight.semibold,
                  color: variantStyles.textColor,
                  fontFamily: typography.fontFamily.primary,
                },
                textStyle,
              ]}
            >
              {title}
            </Text>
          )}

          {icon && iconPosition === "right" && !loading && (
            <Ionicons
              name={icon}
              size={sizeStyles.iconSize}
              color={variantStyles.textColor}
              style={{ marginLeft: 8 }}
            />
          )}
        </Animated.View>
      </Animated.View>
    </AnimatedPressable>
  );
}