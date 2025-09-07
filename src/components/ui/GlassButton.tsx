import React from "react";
import { Text, Pressable, ViewStyle, TextStyle } from "react-native";
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
  const opacity = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.96);
      opacity.value = withTiming(0.8, { duration: 100 });
      glowOpacity.value = withTiming(0.6, { duration: 100 });
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(1);
      opacity.value = withTiming(1, { duration: 150 });
      glowOpacity.value = withTiming(0, { duration: 150 });
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return {
          gradientColors: gradientColors || ["rgba(59, 130, 246, 0.8)", "rgba(147, 51, 234, 0.8)"],
          borderColor: "rgba(255, 255, 255, 0.3)",
          textColor: "#ffffff",
          shadowColor: "#3b82f6",
        };
      case "secondary":
        return {
          gradientColors: gradientColors || ["rgba(255, 255, 255, 0.2)", "rgba(255, 255, 255, 0.1)"],
          borderColor: "rgba(255, 255, 255, 0.2)",
          textColor: "#1f2937",
          shadowColor: "#ffffff",
        };
      case "ghost":
        return {
          gradientColors: gradientColors || ["rgba(255, 255, 255, 0.05)", "rgba(255, 255, 255, 0.02)"],
          borderColor: "rgba(255, 255, 255, 0.1)",
          textColor: "#6b7280",
          shadowColor: "#ffffff",
        };
      default:
        return {
          gradientColors: gradientColors || ["rgba(59, 130, 246, 0.8)", "rgba(147, 51, 234, 0.8)"],
          borderColor: "rgba(255, 255, 255, 0.3)",
          textColor: "#ffffff",
          shadowColor: "#3b82f6",
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return {
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 12,
          fontSize: 14,
          iconSize: 16,
        };
      case "medium":
        return {
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 16,
          fontSize: 16,
          iconSize: 20,
        };
      case "large":
        return {
          paddingHorizontal: 32,
          paddingVertical: 16,
          borderRadius: 20,
          fontSize: 18,
          iconSize: 24,
        };
      default:
        return {
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 16,
          fontSize: 16,
          iconSize: 20,
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
          borderWidth: 1,
          borderColor: variantStyles.borderColor,
          overflow: "hidden",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
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
                  fontWeight: "600",
                  color: variantStyles.textColor,
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