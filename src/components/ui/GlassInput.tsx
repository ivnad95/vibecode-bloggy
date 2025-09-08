import React, { useState } from "react";
import {
  TextInput,
  Text,
  View,
  TextInputProps,
  ViewStyle,
  TextStyle,
  Platform,
} from "react-native";
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

interface GlassInputProps extends Omit<TextInputProps, "style"> {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  className?: string;
  variant?: "default" | "floating" | "minimal";
  size?: "small" | "medium" | "large";
  intensity?: number;
}

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export default function GlassInput({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  labelStyle,
  className,
  variant = "default",
  size = "medium",
  intensity = 15,
  ...textInputProps
}: GlassInputProps) {

  const [hasValue, setHasValue] = useState(!!textInputProps.value || !!textInputProps.defaultValue);

  const focusAnimation = useSharedValue(0);
  const borderAnimation = useSharedValue(0);
  const glowAnimation = useSharedValue(0);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    borderColor: withTiming(
      borderAnimation.value > 0 ? colors.primary[500] : colors.glass.border,
      { duration: 200 }
    ),
    shadowOpacity: withTiming(glowAnimation.value * 0.3, { duration: 200 }),
  }));

  const animatedLabelStyle = useAnimatedStyle(() => {
    if (variant === "floating") {
      return {
        transform: [
          {
            translateY: withSpring(
              focusAnimation.value > 0 || hasValue ? -12 : 0
            ),
          },
          {
            scale: withSpring(
              focusAnimation.value > 0 || hasValue ? 0.85 : 1
            ),
          },
        ],
        color: withTiming(
          focusAnimation.value > 0 ? colors.primary[500] : colors.text.tertiary,
          { duration: 200 }
        ),
      };
    }
    return {};
  });

  const handleFocus = (e: any) => {
    focusAnimation.value = 1;
    borderAnimation.value = 1;
    glowAnimation.value = 1;
    textInputProps.onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    focusAnimation.value = 0;
    borderAnimation.value = 0;
    glowAnimation.value = 0;
    textInputProps.onBlur?.(e);
  };

  const handleChangeText = (text: string) => {
    setHasValue(text.length > 0);
    textInputProps.onChangeText?.(text);
  };

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return {
          height: accessibility.minTouchTarget,
          paddingHorizontal: spacing[3],
          fontSize: typography.fontSize.sm,
          borderRadius: borderRadius.md,
          iconSize: 16,
        };
      case "medium":
        return {
          height: accessibility.minTouchTarget + 4,
          paddingHorizontal: spacing[4],
          fontSize: typography.fontSize.base,
          borderRadius: borderRadius.lg,
          iconSize: 20,
        };
      case "large":
        return {
          height: accessibility.minTouchTarget + 12,
          paddingHorizontal: spacing[5],
          fontSize: typography.fontSize.lg,
          borderRadius: borderRadius.xl,
          iconSize: 24,
        };
      default:
        return {
          height: accessibility.minTouchTarget + 4,
          paddingHorizontal: spacing[4],
          fontSize: typography.fontSize.base,
          borderRadius: borderRadius.lg,
          iconSize: 20,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const renderInput = () => (
    <Animated.View
      style={[
        animatedContainerStyle,
        {
          height: textInputProps.multiline ? undefined : sizeStyles.height,
          minHeight: textInputProps.multiline ? sizeStyles.height : undefined,
          borderRadius: sizeStyles.borderRadius,
          borderWidth: 1,
          backgroundColor: colors.background.glass,
          overflow: "hidden",
          ...shadows.base,
        },
        containerStyle,
      ]}
      className={cn("relative", className)}
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
        colors={["rgba(255, 255, 255, 0.1)", "rgba(255, 255, 255, 0.05)"]}
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

      {/* Input Container */}
      <View
        style={{
          flexDirection: "row",
          alignItems: textInputProps.multiline ? "flex-start" : "center",
          paddingHorizontal: sizeStyles.paddingHorizontal,
          paddingVertical: textInputProps.multiline ? 12 : 0,
          height: "100%",
          zIndex: 1,
        }}
      >
        {/* Left Icon */}
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={sizeStyles.iconSize}
            color={colors.text.tertiary}
            style={{ marginRight: spacing[3] }}
          />
        )}

        {/* Input Field */}
        <AnimatedTextInput
          {...textInputProps}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChangeText={handleChangeText}
          style={[
            {
              flex: 1,
              fontSize: sizeStyles.fontSize,
              color: colors.text.primary,
              fontFamily: typography.fontFamily.primary,
              paddingVertical: textInputProps.multiline ? 4 : 0,
              textAlignVertical: textInputProps.multiline ? "top" : "center",
            },
            inputStyle,
          ]}
          placeholderTextColor={colors.text.tertiary}
        />

        {/* Floating Label */}
        {variant === "floating" && label && (
          <Animated.Text
            style={[
              animatedLabelStyle,
              {
                position: "absolute",
                left: leftIcon ? sizeStyles.paddingHorizontal + sizeStyles.iconSize + 12 : sizeStyles.paddingHorizontal,
                fontSize: sizeStyles.fontSize,
                fontWeight: "500",
                pointerEvents: "none",
              },
              labelStyle,
            ]}
          >
            {label}
          </Animated.Text>
        )}

        {/* Right Icon */}
        {rightIcon && (
          <Ionicons
            name={rightIcon}
            size={sizeStyles.iconSize}
            color={colors.text.tertiary}
            style={{ marginLeft: spacing[3] }}
            onPress={onRightIconPress}
          />
        )}
      </View>
    </Animated.View>
  );

  if (variant === "floating") {
    return (
      <View style={{ marginBottom: 16 }}>
        {renderInput()}
        {error && (
          <Text
            style={{
              color: colors.status.error,
              fontSize: typography.fontSize.xs,
              fontFamily: typography.fontFamily.primary,
              marginTop: spacing[1],
              marginLeft: spacing[1],
            }}
          >
            {error}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={{ marginBottom: 16 }}>
      {/* Static Label */}
      {label && variant === "default" && (
        <Text
          style={[
            {
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
              fontFamily: typography.fontFamily.primary,
              marginBottom: spacing[2],
            },
            labelStyle,
          ]}
        >
          {label}
        </Text>
      )}

      {renderInput()}

      {/* Error Message */}
      {error && (
        <Text
          style={{
            color: colors.status.error,
            fontSize: typography.fontSize.xs,
            fontFamily: typography.fontFamily.primary,
            marginTop: spacing[1],
            marginLeft: spacing[1],
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}