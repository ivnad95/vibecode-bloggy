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
      borderAnimation.value > 0 ? "rgba(59, 130, 246, 0.6)" : "rgba(255, 255, 255, 0.2)",
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
          focusAnimation.value > 0 ? "#3b82f6" : "#6b7280",
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
    const isIOS = Platform.OS === "ios";
    switch (size) {
      case "small":
        return {
          height: isIOS ? 44 : 40,
          paddingHorizontal: 12,
          fontSize: isIOS ? 15 : 14,
          borderRadius: 12,
          iconSize: 16,
        };
      case "medium":
        return {
          height: isIOS ? 50 : 48,
          paddingHorizontal: 16,
          fontSize: isIOS ? 17 : 16,
          borderRadius: 16,
          iconSize: 20,
        };
      case "large":
        return {
          height: isIOS ? 56 : 56,
          paddingHorizontal: 20,
          fontSize: isIOS ? 19 : 18,
          borderRadius: 20,
          iconSize: 24,
        };
      default:
        return {
          height: isIOS ? 50 : 48,
          paddingHorizontal: 16,
          fontSize: isIOS ? 17 : 16,
          borderRadius: 16,
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
          overflow: "hidden",
          shadowColor: "#3b82f6",
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 8,
          elevation: 2,
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
            color="#6b7280"
            style={{ marginRight: 12 }}
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
              color: "#1f2937",
              paddingVertical: textInputProps.multiline ? 4 : 0,
              textAlignVertical: textInputProps.multiline ? "top" : "center",
            },
            inputStyle,
          ]}
          placeholderTextColor="#9ca3af"
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
            color="#6b7280"
            style={{ marginLeft: 12 }}
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
              color: "#ef4444",
              fontSize: 12,
              marginTop: 4,
              marginLeft: 4,
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
              fontSize: 14,
              fontWeight: "600",
              color: "#374151",
              marginBottom: 8,
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
            color: "#ef4444",
            fontSize: 12,
            marginTop: 4,
            marginLeft: 4,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}