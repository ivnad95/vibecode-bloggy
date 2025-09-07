import React from "react";
import { View, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { cn } from "../../utils/cn";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
  intensity?: number;
  tint?: "light" | "dark" | "default";
  gradient?: boolean;
  gradientColors?: [string, string, ...string[]];
  pressable?: boolean;
  onPress?: () => void;
  borderRadius?: number;
  padding?: number;
}

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export default function GlassCard({
  children,
  className,
  style,
  intensity = 20,
  tint = "light",
  gradient = true,
  gradientColors = ["rgba(255, 255, 255, 0.25)", "rgba(255, 255, 255, 0.1)"],
  pressable = false,
  onPress,
  borderRadius = 20,
  padding = 20,
}: GlassCardProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    if (pressable) {
      scale.value = withSpring(0.98);
      opacity.value = withSpring(0.8);
    }
  };

  const handlePressOut = () => {
    if (pressable) {
      scale.value = withSpring(1);
      opacity.value = withSpring(1);
    }
  };

  const handlePress = () => {
    if (pressable && onPress) {
      onPress();
    }
  };

  const CardContent = () => (
    <View
      style={[
        {
          borderRadius,
          padding,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.2)",
        },
        style,
      ]}
      className={cn("shadow-lg", className)}
    >
      <AnimatedBlurView
        intensity={intensity}
        tint={tint}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />
      {gradient && (
        <LinearGradient
          colors={gradientColors}
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
      )}
      <View style={{ position: "relative", zIndex: 1 }}>
        {children}
      </View>
    </View>
  );

  if (pressable) {
    return (
      <Animated.View style={animatedStyle}>
        <Animated.View
          onTouchStart={handlePressIn}
          onTouchEnd={handlePressOut}
          onTouchCancel={handlePressOut}
          style={{ cursor: "pointer" }}
        >
          <View onStartShouldSetResponder={() => true} onResponderRelease={handlePress}>
            <CardContent />
          </View>
        </Animated.View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={animatedStyle}>
      <CardContent />
    </Animated.View>
  );
}