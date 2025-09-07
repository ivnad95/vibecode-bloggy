import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

import { SEOKeyword } from "../../api/seo-research";
import { cn } from "../../utils/cn";

interface KeywordChipProps {
  keyword: SEOKeyword;
  onPress?: () => void;
  onRemove?: () => void;
  variant?: "default" | "selected" | "suggestion";
  size?: "small" | "medium" | "large";
  showMetrics?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function KeywordChip({
  keyword,
  onPress,
  onRemove,
  variant = "default",
  size = "medium",
  showMetrics = true,
}: KeywordChipProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "selected":
        return {
          container: "bg-blue-600 border-blue-600",
          text: "text-white",
          metrics: "text-blue-100",
        };
      case "suggestion":
        return {
          container: "bg-green-50 border-green-200",
          text: "text-green-800",
          metrics: "text-green-600",
        };
      default:
        return {
          container: "bg-gray-50 border-gray-200",
          text: "text-gray-800",
          metrics: "text-gray-600",
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return {
          padding: "px-2 py-1",
          text: "text-xs",
          metrics: "text-xs",
          icon: 12,
        };
      case "large":
        return {
          padding: "px-4 py-3",
          text: "text-base",
          metrics: "text-sm",
          icon: 18,
        };
      default:
        return {
          padding: "px-3 py-2",
          text: "text-sm",
          metrics: "text-xs",
          icon: 14,
        };
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "text-green-600";
      case "medium":
        return "text-yellow-600";
      case "hard":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getVolumeColor = (volume: string) => {
    switch (volume) {
      case "high":
        return "text-green-600";
      case "medium":
        return "text-blue-600";
      case "low":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const ChipContent = () => (
    <View className={cn(
      "flex-row items-center rounded-lg border",
      sizeStyles.padding,
      variantStyles.container
    )}>
      <View className="flex-1">
        <Text className={cn("font-medium", sizeStyles.text, variantStyles.text)}>
          {keyword.keyword}
        </Text>
        
        {showMetrics && (
          <View className="flex-row items-center mt-1 space-x-2">
            <View className="flex-row items-center">
              <Text className={cn(sizeStyles.metrics, getDifficultyColor(keyword.difficulty))}>
                {keyword.difficulty}
              </Text>
            </View>
            
            <Text className={cn(sizeStyles.metrics, variantStyles.metrics)}>•</Text>
            
            <View className="flex-row items-center">
              <Text className={cn(sizeStyles.metrics, getVolumeColor(keyword.searchVolume))}>
                {keyword.searchVolume} vol
              </Text>
            </View>
            
            <Text className={cn(sizeStyles.metrics, variantStyles.metrics)}>•</Text>
            
            <View className="flex-row items-center">
              <Text className={cn(sizeStyles.metrics, variantStyles.metrics)}>
                {keyword.relevanceScore}%
              </Text>
            </View>
          </View>
        )}
      </View>

      {onRemove && (
        <Pressable
          onPress={onRemove}
          className="ml-2 p-1"
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <Ionicons
            name="close"
            size={sizeStyles.icon}
            color={variant === "selected" ? "white" : "#6b7280"}
          />
        </Pressable>
      )}
    </View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        style={animatedStyle}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <ChipContent />
      </AnimatedPressable>
    );
  }

  return <ChipContent />;
}