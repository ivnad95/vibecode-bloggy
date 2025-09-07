import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { formatDistanceToNow } from "date-fns";

import { BlogPost } from "../../types/blog";
import GlassCard from "./GlassCard";
import { cn } from "../../utils/cn";

interface BlogCardProps {
  blog: BlogPost;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  showActions?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function BlogCard({
  blog,
  onPress,
  onEdit,
  onDelete,
  onToggleFavorite,
  showActions = true,
}: BlogCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const getStatusColor = (status: BlogPost["status"]) => {
    switch (status) {
      case "published":
        return "text-green-600";
      case "draft":
        return "text-yellow-600";
      case "archived":
        return "text-gray-500";
      default:
        return "text-gray-600";
    }
  };

  const getStatusIcon = (status: BlogPost["status"]) => {
    switch (status) {
      case "published":
        return "checkmark-circle";
      case "draft":
        return "create-outline";
      case "archived":
        return "archive-outline";
      default:
        return "document-outline";
    }
  };

  const getSEOScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-blue-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getSEOScoreBackground = (score: number) => {
    if (score >= 90) return "bg-green-100";
    if (score >= 70) return "bg-blue-100";
    if (score >= 50) return "bg-yellow-100";
    return "bg-red-100";
  };

  return (
    <AnimatedPressable
      style={animatedStyle}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      className="mb-4"
    >
      <GlassCard
        intensity={20}
        gradientColors={["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.7)"]}
        borderRadius={16}
        padding={16}
      >
        {/* Header */}
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1 mr-3">
            <Text className="text-lg font-bold text-gray-900 mb-1" numberOfLines={2}>
              {blog.title}
            </Text>
            <Text className="text-sm text-gray-600 mb-2" numberOfLines={1}>
              {blog.topic}
            </Text>
          </View>
          
          {/* Favorite Button */}
          <Pressable
            onPress={onToggleFavorite}
            className="p-2 -m-2"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={blog.isFavorite ? "heart" : "heart-outline"}
              size={20}
              color={blog.isFavorite ? "#ef4444" : "#6b7280"}
            />
          </Pressable>
        </View>

        {/* Metrics Row */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center space-x-4">
            {/* SEO Score */}
            <View className="flex-row items-center">
              <View className={cn(
                "px-2 py-1 rounded-lg mr-2",
                getSEOScoreBackground(blog.seoScore)
              )}>
                <Text className={cn("text-xs font-semibold", getSEOScoreColor(blog.seoScore))}>
                  {blog.seoScore}
                </Text>
              </View>
              <Text className="text-xs text-gray-500">SEO</Text>
            </View>

            {/* Word Count */}
            <View className="flex-row items-center">
              <Ionicons name="document-text-outline" size={14} color="#6b7280" />
              <Text className="text-xs text-gray-600 ml-1">
                {blog.wordCount.toLocaleString()}
              </Text>
            </View>

            {/* Reading Time */}
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={14} color="#6b7280" />
              <Text className="text-xs text-gray-600 ml-1">
                {blog.readingTime}m
              </Text>
            </View>
          </View>

          {/* Status */}
          <View className="flex-row items-center">
            <Ionicons
              name={getStatusIcon(blog.status) as any}
              size={14}
              color="#6b7280"
            />
            <Text className={cn("text-xs font-medium ml-1 capitalize", getStatusColor(blog.status))}>
              {blog.status}
            </Text>
          </View>
        </View>

        {/* Tags */}
        {blog.tags.length > 0 && (
          <View className="flex-row flex-wrap mb-3">
            {blog.tags.slice(0, 3).map((tag, index) => (
              <View
                key={index}
                className="bg-blue-100 px-2 py-1 rounded-lg mr-2 mb-1"
              >
                <Text className="text-xs text-blue-700 font-medium">
                  {tag}
                </Text>
              </View>
            ))}
            {blog.tags.length > 3 && (
              <View className="bg-gray-100 px-2 py-1 rounded-lg">
                <Text className="text-xs text-gray-600 font-medium">
                  +{blog.tags.length - 3}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <View className="flex-row items-center justify-between">
          <Text className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(blog.createdAt), { addSuffix: true })}
          </Text>

          {showActions && (
            <View className="flex-row items-center space-x-2">
              <Pressable
                onPress={onEdit}
                className="p-2 -m-2"
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Ionicons name="create-outline" size={16} color="#6b7280" />
              </Pressable>
              <Pressable
                onPress={onDelete}
                className="p-2 -m-2"
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
              </Pressable>
            </View>
          )}
        </View>
      </GlassCard>
    </AnimatedPressable>
  );
}