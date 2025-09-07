import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  useAnimatedProps,
} from "react-native-reanimated";
import { Circle, Svg } from "react-native-svg";

import GlassCard from "./GlassCard";
import { cn } from "../../utils/cn";

interface ProgressIndicatorProps {
  progress: number; // 0-100
  title: string;
  subtitle?: string;
  variant?: "circular" | "linear" | "steps";
  size?: "small" | "medium" | "large";
  color?: "blue" | "green" | "purple";
  animated?: boolean;
  steps?: string[];
  currentStep?: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function ProgressIndicator({
  progress,
  title,
  subtitle,
  variant = "circular",
  size = "medium",
  color = "blue",
  animated = true,
  steps = [],
  currentStep = 0,
}: ProgressIndicatorProps) {
  const animatedProgress = useSharedValue(0);
  const pulseAnimation = useSharedValue(1);

  React.useEffect(() => {
    if (animated) {
      animatedProgress.value = withTiming(progress, { duration: 1000 });
      
      if (progress > 0 && progress < 100) {
        pulseAnimation.value = withRepeat(
          withSequence(
            withTiming(1.1, { duration: 800 }),
            withTiming(1, { duration: 800 })
          ),
          -1,
          true
        );
      }
    } else {
      animatedProgress.value = progress;
    }
  }, [progress, animated]);

  const getColorClasses = () => {
    switch (color) {
      case "green":
        return {
          primary: "#10b981",
          secondary: "#d1fae5",
          text: "text-green-600",
        };
      case "purple":
        return {
          primary: "#8b5cf6",
          secondary: "#ede9fe",
          text: "text-purple-600",
        };
      default:
        return {
          primary: "#3b82f6",
          secondary: "#dbeafe",
          text: "text-blue-600",
        };
    }
  };

  const getSizeConfig = () => {
    switch (size) {
      case "small":
        return { radius: 30, strokeWidth: 4, textSize: "text-sm" };
      case "large":
        return { radius: 50, strokeWidth: 6, textSize: "text-lg" };
      default:
        return { radius: 40, strokeWidth: 5, textSize: "text-base" };
    }
  };

  const colors = getColorClasses();
  const sizeConfig = getSizeConfig();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnimation.value }],
  }));

  const animatedProps = useAnimatedProps(() => {
    const circumference = 2 * Math.PI * sizeConfig.radius;
    const strokeDashoffset = circumference - (animatedProgress.value / 100) * circumference;
    
    return {
      strokeDashoffset,
    };
  });

  const linearAnimatedStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value}%`,
  }));

  if (variant === "circular") {
    const circumference = 2 * Math.PI * sizeConfig.radius;
    
    return (
      <GlassCard
        intensity={20}
        gradientColors={["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.7)"]}
        borderRadius={16}
        padding={20}
      >
        <View className="items-center">
          <Animated.View style={animatedStyle} className="mb-4">
            <Svg
              width={(sizeConfig.radius + sizeConfig.strokeWidth) * 2}
              height={(sizeConfig.radius + sizeConfig.strokeWidth) * 2}
            >
              {/* Background Circle */}
              <Circle
                cx={sizeConfig.radius + sizeConfig.strokeWidth}
                cy={sizeConfig.radius + sizeConfig.strokeWidth}
                r={sizeConfig.radius}
                stroke={colors.secondary}
                strokeWidth={sizeConfig.strokeWidth}
                fill="transparent"
              />
              
              {/* Progress Circle */}
              <AnimatedCircle
                cx={sizeConfig.radius + sizeConfig.strokeWidth}
                cy={sizeConfig.radius + sizeConfig.strokeWidth}
                r={sizeConfig.radius}
                stroke={colors.primary}
                strokeWidth={sizeConfig.strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeLinecap="round"
                animatedProps={animatedProps}
                transform={`rotate(-90 ${sizeConfig.radius + sizeConfig.strokeWidth} ${sizeConfig.radius + sizeConfig.strokeWidth})`}
              />
            </Svg>
            
            {/* Progress Text */}
            <View className="absolute inset-0 items-center justify-center">
              <Text className={cn("font-bold", colors.text, sizeConfig.textSize)}>
                {Math.round(progress)}%
              </Text>
            </View>
          </Animated.View>

          <Text className="text-lg font-semibold text-gray-900 text-center mb-1">
            {title}
          </Text>
          
          {subtitle && (
            <Text className="text-sm text-gray-600 text-center">
              {subtitle}
            </Text>
          )}
        </View>
      </GlassCard>
    );
  }

  if (variant === "linear") {
    return (
      <GlassCard
        intensity={20}
        gradientColors={["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.7)"]}
        borderRadius={16}
        padding={16}
      >
        <View className="mb-3">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-base font-semibold text-gray-900">
              {title}
            </Text>
            <Text className={cn("text-sm font-medium", colors.text)}>
              {Math.round(progress)}%
            </Text>
          </View>
          
          {subtitle && (
            <Text className="text-sm text-gray-600 mb-3">
              {subtitle}
            </Text>
          )}
        </View>

        <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <Animated.View
            style={[linearAnimatedStyle, { backgroundColor: colors.primary }]}
            className="h-full rounded-full"
          />
        </View>
      </GlassCard>
    );
  }

  if (variant === "steps") {
    return (
      <GlassCard
        intensity={20}
        gradientColors={["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.7)"]}
        borderRadius={16}
        padding={16}
      >
        <Text className="text-lg font-semibold text-gray-900 mb-4">
          {title}
        </Text>

        <View className="space-y-3">
          {steps.map((step, index) => (
            <View key={index} className="flex-row items-center">
              <View className={cn(
                "w-6 h-6 rounded-full items-center justify-center mr-3",
                index < currentStep ? colors.primary : index === currentStep ? colors.secondary : "bg-gray-200"
              )}>
                {index < currentStep ? (
                  <Ionicons name="checkmark" size={14} color="white" />
                ) : (
                  <Text className={cn(
                    "text-xs font-medium",
                    index === currentStep ? colors.text : "text-gray-500"
                  )}>
                    {index + 1}
                  </Text>
                )}
              </View>
              
              <Text className={cn(
                "flex-1 text-sm",
                index <= currentStep ? "text-gray-900 font-medium" : "text-gray-500"
              )}>
                {step}
              </Text>
            </View>
          ))}
        </View>
      </GlassCard>
    );
  }

  return null;
}