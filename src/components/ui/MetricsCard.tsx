import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";

import GlassCard from "./GlassCard";
import { cn } from "../../utils/cn";
import { colors, typography, spacing, borderRadius, shadows } from "../../styles/design-system";

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
          iconBg: colors.success[100],
          iconColor: colors.success[600],
          valueColor: colors.success[600],
        };
      case "yellow":
        return {
          iconBg: colors.warning[100],
          iconColor: colors.warning[600],
          valueColor: colors.warning[600],
        };
      case "red":
        return {
          iconBg: colors.error[100],
          iconColor: colors.error[600],
          valueColor: colors.error[600],
        };
      case "purple":
        return {
          iconBg: colors.accent.purple + "20",
          iconColor: colors.accent.purple,
          valueColor: colors.accent.purple,
        };
      default:
        return {
          iconBg: colors.primary[100],
          iconColor: colors.primary[600],
          valueColor: colors.primary[600],
        };
    }
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case "small":
        return {
          padding: spacing[3],
          iconSize: 20,
          titleSize: {
            fontSize: typography.fontSize.sm,
            fontFamily: typography.fontFamily.primary,
            fontWeight: typography.fontWeight.medium,
          },
          valueSize: {
            fontSize: typography.fontSize.lg,
            fontFamily: typography.fontFamily.primary,
            fontWeight: typography.fontWeight.bold,
          },
          subtitleSize: {
            fontSize: typography.fontSize.xs,
            fontFamily: typography.fontFamily.primary,
            fontWeight: typography.fontWeight.normal,
          },
        };
      case "large":
        return {
          padding: spacing[5],
          iconSize: 28,
          titleSize: {
            fontSize: typography.fontSize.lg,
            fontFamily: typography.fontFamily.primary,
            fontWeight: typography.fontWeight.medium,
          },
          valueSize: {
            fontSize: typography.fontSize['3xl'],
            fontFamily: typography.fontFamily.primary,
            fontWeight: typography.fontWeight.bold,
          },
          subtitleSize: {
            fontSize: typography.fontSize.sm,
            fontFamily: typography.fontFamily.primary,
            fontWeight: typography.fontWeight.normal,
          },
        };
      default:
        return {
          padding: spacing[4],
          iconSize: 24,
          titleSize: {
            fontSize: typography.fontSize.base,
            fontFamily: typography.fontFamily.primary,
            fontWeight: typography.fontWeight.medium,
          },
          valueSize: {
            fontSize: typography.fontSize['2xl'],
            fontFamily: typography.fontFamily.primary,
            fontWeight: typography.fontWeight.bold,
          },
          subtitleSize: {
            fontSize: typography.fontSize.sm,
            fontFamily: typography.fontFamily.primary,
            fontWeight: typography.fontWeight.normal,
          },
        };
    }
  };

  const colorClasses = getColorClasses(color);
  const sizeClasses = getSizeClasses(size);

  return (
    <Animated.View entering={FadeIn}>
      <GlassCard
        intensity={20}
        gradientColors={[colors.background.glass, colors.background.glass + "B3"]}
        borderRadius={borderRadius.xl}
        padding={sizeClasses.padding}
      >
        <View style={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}>
          <View style={{ flex: 1 }}>
            {/* Title */}
            <Text style={[
              sizeClasses.titleSize,
              { 
                color: colors.text.secondary,
                marginBottom: spacing[2],
              }
            ]}>
              {title}
            </Text>

            {/* Value */}
            <Text style={[
              sizeClasses.valueSize,
              { 
                color: colorClasses.valueColor,
                marginBottom: spacing[1],
              }
            ]}>
              {typeof value === "number" ? value.toLocaleString() : value}
            </Text>

            {/* Subtitle */}
            {subtitle && (
              <Text style={[
                sizeClasses.subtitleSize,
                { color: colors.text.tertiary }
              ]}>
                {subtitle}
              </Text>
            )}

            {/* Trend */}
            {trend && (
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: spacing[2],
              }}>
                <Ionicons
                  name={trend.isPositive ? "trending-up" : "trending-down"}
                  size={14}
                  color={trend.isPositive ? colors.success[600] : colors.error[600]}
                />
                <Text style={[
                  {
                    fontSize: typography.fontSize.xs,
                    fontFamily: typography.fontFamily.primary,
                    fontWeight: typography.fontWeight.medium,
                    marginLeft: spacing[1],
                    color: trend.isPositive ? colors.success[600] : colors.error[600],
                  }
                ]}>
                  {trend.isPositive ? "+" : ""}{trend.value}%
                </Text>
              </View>
            )}
          </View>

          {/* Icon */}
          <View style={{
            borderRadius: borderRadius.xl,
            padding: spacing[3],
            backgroundColor: colorClasses.iconBg,
          }}>
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