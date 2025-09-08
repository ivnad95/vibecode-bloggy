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
import { colors, typography, spacing, borderRadius, shadows } from "../../styles/design-system";

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
          container: {
            backgroundColor: colors.primary[600],
            borderColor: colors.primary[600],
            ...shadows.md,
          },
          text: colors.text.inverse,
          metrics: colors.primary[100],
        };
      case "suggestion":
        return {
          container: {
            backgroundColor: colors.success[50],
            borderColor: colors.success[200],
            ...shadows.sm,
          },
          text: colors.success[800],
          metrics: colors.success[600],
        };
      default:
        return {
          container: {
            backgroundColor: colors.background.glass,
            borderColor: colors.glass.border,
            ...shadows.sm,
          },
          text: colors.text.primary,
          metrics: colors.text.secondary,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return {
          padding: {
            paddingHorizontal: spacing[2],
            paddingVertical: spacing[1],
          },
          text: {
            fontSize: typography.fontSize.xs,
            fontFamily: typography.fontFamily.primary,
            fontWeight: typography.fontWeight.medium,
          },
          metrics: {
            fontSize: typography.fontSize.xs,
            fontFamily: typography.fontFamily.primary,
            fontWeight: typography.fontWeight.normal,
          },
          icon: 12,
        };
      case "large":
        return {
          padding: {
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[3],
          },
          text: {
            fontSize: typography.fontSize.base,
            fontFamily: typography.fontFamily.primary,
            fontWeight: typography.fontWeight.medium,
          },
          metrics: {
            fontSize: typography.fontSize.sm,
            fontFamily: typography.fontFamily.primary,
            fontWeight: typography.fontWeight.normal,
          },
          icon: 18,
        };
      default:
        return {
          padding: {
            paddingHorizontal: spacing[3],
            paddingVertical: spacing[2],
          },
          text: {
            fontSize: typography.fontSize.sm,
            fontFamily: typography.fontFamily.primary,
            fontWeight: typography.fontWeight.medium,
          },
          metrics: {
            fontSize: typography.fontSize.xs,
            fontFamily: typography.fontFamily.primary,
            fontWeight: typography.fontWeight.normal,
          },
          icon: 14,
        };
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return colors.success[600];
      case "medium":
        return colors.warning[600];
      case "hard":
        return colors.error[600];
      default:
        return colors.text.secondary;
    }
  };

  const getVolumeColor = (volume: string) => {
    switch (volume) {
      case "high":
        return colors.success[600];
      case "medium":
        return colors.primary[600];
      case "low":
        return colors.text.secondary;
      default:
        return colors.text.secondary;
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const ChipContent = () => (
    <View style={[
      {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        ...sizeStyles.padding,
        ...variantStyles.container,
      }
    ]}>
      <View style={{ flex: 1 }}>
        <Text style={[
          sizeStyles.text,
          { color: variantStyles.text }
        ]}>
          {keyword.keyword}
        </Text>
        
        {showMetrics && (
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: spacing[1],
            gap: spacing[2],
          }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={[
                sizeStyles.metrics,
                { color: getDifficultyColor(keyword.difficulty) }
              ]}>
                {keyword.difficulty}
              </Text>
            </View>
            
            <Text style={[
              sizeStyles.metrics,
              { color: variantStyles.metrics }
            ]}>•</Text>
            
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={[
                sizeStyles.metrics,
                { color: getVolumeColor(keyword.searchVolume) }
              ]}>
                {keyword.searchVolume} vol
              </Text>
            </View>
            
            <Text style={[
              sizeStyles.metrics,
              { color: variantStyles.metrics }
            ]}>•</Text>
            
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={[
                sizeStyles.metrics,
                { color: variantStyles.metrics }
              ]}>
                {keyword.relevanceScore}%
              </Text>
            </View>
          </View>
        )}
      </View>

      {onRemove && (
        <Pressable
          onPress={onRemove}
          style={{
            marginLeft: spacing[2],
            padding: spacing[1],
          }}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <Ionicons
            name="close"
            size={sizeStyles.icon}
            color={variant === "selected" ? colors.text.inverse : colors.text.secondary}
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