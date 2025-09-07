import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";

import GlassCard from "./GlassCard";
import { cn } from "../../utils/cn";

interface MetricsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "blue" | "green" | "yellow" | "red" | "purple";
  size?: "small" | "medium" | "large";
}

export default function MetricsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = "blue",
  size = "medium",
}: MetricsCardProps) {
  const getColorClasses = (color: string) => {
    switch (color) {
      case "green":
        return {
          iconBg: "bg-green-100",
          iconColor: "#10b981",
          valueColor: "text-green-600",
        };
      case "yellow":
        return {
          iconBg: "bg-yellow-100",
          iconColor: "#f59e0b",
          valueColor: "text-yellow-600",
        };
      case "red":
        return {
          iconBg: "bg-red-100",
          iconColor: "#ef4444",
          valueColor: "text-red-600",
        };
      case "purple":
        return {
          iconBg: "bg-purple-100",
          iconColor: "#8b5cf6",
          valueColor: "text-purple-600",
        };
      default:
        return {
          iconBg: "bg-blue-100",
          iconColor: "#3b82f6",
          valueColor: "text-blue-600",
        };
    }
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case "small":
        return {
          padding: 12,
          iconSize: 20,
          titleSize: "text-sm",
          valueSize: "text-lg",
          subtitleSize: "text-xs",
        };
      case "large":
        return {
          padding: 20,
          iconSize: 28,
          titleSize: "text-lg",
          valueSize: "text-3xl",
          subtitleSize: "text-sm",
        };
      default:
        return {
          padding: 16,
          iconSize: 24,
          titleSize: "text-base",
          valueSize: "text-2xl",
          subtitleSize: "text-sm",
        };
    }
  };

  const colorClasses = getColorClasses(color);
  const sizeClasses = getSizeClasses(size);

  return (
    <Animated.View entering={FadeIn}>
      <GlassCard
        intensity={20}
        gradientColors={["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.7)"]}
        borderRadius={16}
        padding={sizeClasses.padding}
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            {/* Title */}
            <Text className={cn("font-medium text-gray-600 mb-2", sizeClasses.titleSize)}>
              {title}
            </Text>

            {/* Value */}
            <Text className={cn("font-bold mb-1", colorClasses.valueColor, sizeClasses.valueSize)}>
              {typeof value === "number" ? value.toLocaleString() : value}
            </Text>

            {/* Subtitle */}
            {subtitle && (
              <Text className={cn("text-gray-500", sizeClasses.subtitleSize)}>
                {subtitle}
              </Text>
            )}

            {/* Trend */}
            {trend && (
              <View className="flex-row items-center mt-2">
                <Ionicons
                  name={trend.isPositive ? "trending-up" : "trending-down"}
                  size={14}
                  color={trend.isPositive ? "#10b981" : "#ef4444"}
                />
                <Text
                  className={cn(
                    "text-xs font-medium ml-1",
                    trend.isPositive ? "text-green-600" : "text-red-600"
                  )}
                >
                  {trend.isPositive ? "+" : ""}{trend.value}%
                </Text>
              </View>
            )}
          </View>

          {/* Icon */}
          <View className={cn("rounded-xl p-3", colorClasses.iconBg)}>
            <Ionicons
              name={icon}
              size={sizeClasses.iconSize}
              color={colorClasses.iconColor}
            />
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );
}