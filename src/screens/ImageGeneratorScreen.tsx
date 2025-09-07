import React from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import GradientBackground from "../components/ui/GradientBackground";

export default function ImageGeneratorScreen() {
  return (
    <GradientBackground variant="primary">
      <SafeAreaView className="flex-1">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-2xl font-bold text-white mb-4">
            Generate Images
          </Text>
          <Text className="text-white/80 text-center">
            AI image generation for your blog posts will appear here. This screen is under construction.
          </Text>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}