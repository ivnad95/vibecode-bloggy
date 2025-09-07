import React from "react";
import { View, Text, Dimensions } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Svg, Circle, Path } from "react-native-svg";

import GlassCard from "./GlassCard";

const { width } = Dimensions.get("window");

interface ChartData {
  x: string | number;
  y: number;
  label?: string;
  color?: string;
}

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  data: ChartData[];
  type: "line" | "area" | "bar" | "pie";
  color?: string;
  height?: number;
}

export default function ChartContainer({
  title,
  subtitle,
  data,
  type,
  color = "#3b82f6",
  height = 200,
}: ChartContainerProps) {
  const chartWidth = width - 80;
  const chartHeight = height - 40;

  const renderSimpleBarChart = () => {
    if (!data || data.length === 0) return null;

    const maxValue = Math.max(...data.map(d => d.y));
    const barWidth = (chartWidth - 40) / data.length - 8;

    return (
      <View className="flex-row items-end justify-between px-4" style={{ height: chartHeight }}>
        {data.map((item, index) => {
          const barHeight = (item.y / maxValue) * (chartHeight - 40);
          return (
            <View key={index} className="items-center">
              <Text className="text-xs text-gray-600 mb-2">
                {item.y}
              </Text>
              <View
                style={{
                  width: barWidth,
                  height: barHeight,
                  backgroundColor: item.color || color,
                  borderRadius: 4,
                }}
              />
              <Text className="text-xs text-gray-500 mt-2" numberOfLines={1}>
                {item.label || item.x}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderSimpleLineChart = () => {
    if (!data || data.length === 0) return null;

    const maxValue = Math.max(...data.map(d => d.y));
    const minValue = Math.min(...data.map(d => d.y));
    const range = maxValue - minValue || 1;

    return (
      <View style={{ height: chartHeight, width: chartWidth }}>
        <Svg height={chartHeight} width={chartWidth}>
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * (chartWidth - 40) + 20;
            const y = chartHeight - 20 - ((item.y - minValue) / range) * (chartHeight - 40);
            
            return (
              <Circle
                key={index}
                cx={x}
                cy={y}
                r={4}
                fill={color}
              />
            );
          })}
          
          {/* Connect points with lines */}
          {data.length > 1 && (
            <Path
              d={data.map((item, index) => {
                const x = (index / (data.length - 1)) * (chartWidth - 40) + 20;
                const y = chartHeight - 20 - ((item.y - minValue) / range) * (chartHeight - 40);
                return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ')}
              stroke={color}
              strokeWidth={2}
              fill="none"
            />
          )}
        </Svg>
        
        {/* Labels */}
        <View className="flex-row justify-between px-5 mt-2">
          {data.map((item, index) => (
            <Text key={index} className="text-xs text-gray-500" numberOfLines={1}>
              {item.label || item.x}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  const renderSimplePieChart = () => {
    if (!data || data.length === 0) return null;

    const total = data.reduce((sum, item) => sum + item.y, 0);
    const colors = [color, "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

    return (
      <View className="items-center">
        <View className="flex-row flex-wrap justify-center mb-4">
          {data.map((item, index) => {
            const percentage = ((item.y / total) * 100).toFixed(1);
            const itemColor = item.color || colors[index % colors.length];
            
            return (
              <View key={index} className="flex-row items-center m-1">
                <View
                  style={{
                    width: 12,
                    height: 12,
                    backgroundColor: itemColor,
                    borderRadius: 6,
                    marginRight: 6,
                  }}
                />
                <Text className="text-xs text-gray-600">
                  {item.label || item.x}: {percentage}%
                </Text>
              </View>
            );
          })}
        </View>
        
        {/* Simple pie representation with bars */}
        <View className="w-full">
          {data.map((item, index) => {
            const percentage = (item.y / total) * 100;
            const itemColor = item.color || colors[index % colors.length];
            
            return (
              <View key={index} className="mb-2">
                <View className="flex-row justify-between mb-1">
                  <Text className="text-sm text-gray-700">
                    {item.label || item.x}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    {item.y}
                  </Text>
                </View>
                <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <View
                    style={{
                      width: `${percentage}%`,
                      height: "100%",
                      backgroundColor: itemColor,
                    }}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderChart = () => {
    switch (type) {
      case "bar":
        return renderSimpleBarChart();
      case "line":
      case "area":
        return renderSimpleLineChart();
      case "pie":
        return renderSimplePieChart();
      default:
        return renderSimpleBarChart();
    }
  };

  if (!data || data.length === 0) {
    return (
      <Animated.View entering={FadeIn}>
        <GlassCard
          intensity={20}
          gradientColors={["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.7)"]}
          borderRadius={16}
          padding={20}
        >
          <Text className="text-lg font-semibold text-gray-900 mb-2">
            {title}
          </Text>
          {subtitle && (
            <Text className="text-sm text-gray-600 mb-4">
              {subtitle}
            </Text>
          )}
          <View className="items-center justify-center py-12">
            <Text className="text-gray-500 text-center">
              No data available
            </Text>
          </View>
        </GlassCard>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn}>
      <GlassCard
        intensity={20}
        gradientColors={["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.7)"]}
        borderRadius={16}
        padding={20}
      >
        <Text className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </Text>
        {subtitle && (
          <Text className="text-sm text-gray-600 mb-4">
            {subtitle}
          </Text>
        )}
        
        <View className="items-center">
          {renderChart()}
        </View>
      </GlassCard>
    </Animated.View>
  );
}