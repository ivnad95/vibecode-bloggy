import React from "react";
import { Modal, View, Text, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { cn } from "../../utils/cn";

export type GlassModalAction = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "destructive";
};

interface GlassModalProps {
  visible: boolean;
  title: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  type?: "info" | "warn" | "destructive";
  actions: GlassModalAction[];
  onRequestClose?: () => void;
}

export default function GlassModal({
  visible,
  title,
  message,
  icon = "information-circle",
  type = "info",
  actions,
  onRequestClose,
}: GlassModalProps) {
  const handlePress = (action: GlassModalAction) => {
    if (action.variant === "destructive") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.selectionAsync();
    }
    action.onPress();
  };

  const colorMap = {
    info: { icon: "#3b82f6", badge: "bg-blue-100" },
    warn: { icon: "#f59e0b", badge: "bg-yellow-100" },
    destructive: { icon: "#ef4444", badge: "bg-red-100" },
  } as const;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      <View className="flex-1 items-center justify-center">
        <BlurView intensity={50} tint="light" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
        <View className="w-11/12 max-w-md rounded-2xl overflow-hidden border border-white/30">
          <BlurView intensity={30} tint="light" style={{ padding: 20 }}>
            <View className="items-center mb-3">
              <View className={cn("w-12 h-12 rounded-full items-center justify-center", colorMap[type].badge)}>
                <Ionicons name={icon} size={24} color={colorMap[type].icon} />
              </View>
            </View>
            <Text className="text-xl font-semibold text-gray-900 text-center mb-2">{title}</Text>
            {message ? (
              <Text className="text-gray-600 text-center mb-4">{message}</Text>
            ) : null}
            <View className="flex-row justify-end space-x-2 mt-2">
              {actions.map((action, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => handlePress(action)}
                  className={cn(
                    "px-4 py-2 rounded-xl",
                    action.variant === "primary" && "bg-blue-600",
                    action.variant === "secondary" && "bg-gray-200",
                    action.variant === "destructive" && "bg-red-600"
                  )}
                >
                  <Text className={cn(
                    "font-semibold",
                    action.variant === "secondary" ? "text-gray-800" : "text-white"
                  )}>
                    {action.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </BlurView>
        </View>
      </View>
    </Modal>
  );
}
