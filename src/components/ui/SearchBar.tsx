import React, { useState } from "react";
import { View, TextInput, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import GlassCard from "./GlassCard";
import { cn } from "../../utils/cn";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onFilter?: () => void;
  onClear?: () => void;
  placeholder?: string;
  showFilter?: boolean;
  filterActive?: boolean;
}

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export default function SearchBar({
  value,
  onChangeText,
  onFilter,
  onClear,
  placeholder = "Search...",
  showFilter = false,
  filterActive = false,
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const focusAnimation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    borderColor: withTiming(
      focusAnimation.value > 0 ? "#3b82f6" : "rgba(255, 255, 255, 0.3)",
      { duration: 200 }
    ),
  }));

  const handleFocus = () => {
    setIsFocused(true);
    focusAnimation.value = 1;
  };

  const handleBlur = () => {
    setIsFocused(false);
    focusAnimation.value = 0;
  };

  const handleClear = () => {
    onChangeText("");
    onClear?.();
  };

  return (
    <Animated.View style={animatedStyle}>
      <GlassCard
        intensity={20}
        gradientColors={["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.7)"]}
        borderRadius={16}
        padding={0}
        className="border"
      >
        <View className="flex-row items-center px-4 py-3">
          {/* Search Icon */}
          <Ionicons
            name="search"
            size={20}
            color={isFocused ? "#3b82f6" : "#6b7280"}
          />

          {/* Search Input */}
          <AnimatedTextInput
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            placeholderTextColor="#9ca3af"
            className="flex-1 ml-3 text-base text-gray-900"
            returnKeyType="search"
          />

          {/* Clear Button */}
          {value.length > 0 && (
            <Pressable
              onPress={handleClear}
              className="p-1 ml-2"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={20} color="#6b7280" />
            </Pressable>
          )}

          {/* Filter Button */}
          {showFilter && (
            <Pressable
              onPress={onFilter}
              className={cn(
                "p-2 ml-2 rounded-lg",
                filterActive ? "bg-blue-100" : "bg-gray-100"
              )}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <Ionicons
                name="options"
                size={18}
                color={filterActive ? "#3b82f6" : "#6b7280"}
              />
            </Pressable>
          )}
        </View>
      </GlassCard>
    </Animated.View>
  );
}