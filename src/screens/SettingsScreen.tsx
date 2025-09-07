import React from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import GradientBackground from "../components/ui/GradientBackground";

export default function SettingsScreen() {
  return (
    <GradientBackground variant="secondary">
      <SafeAreaView className="flex-1">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-2xl font-bold text-gray-900 mb-4">
            Settings
          </Text>
          <Text className="text-gray-600 text-center">
            App settings and preferences will appear here. This screen is under construction.
          </Text>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}