import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cn } from "../../utils/cn";

interface InlineBannerProps {
  type?: "success" | "error" | "warning" | "info";
  message: string;
}

export default function InlineBanner({ type = "info", message }: InlineBannerProps) {
  const map = {
    success: { bg: "bg-green-100", color: "text-green-800", icon: "checkmark-circle" as const },
    error: { bg: "bg-red-100", color: "text-red-800", icon: "close-circle" as const },
    warning: { bg: "bg-yellow-100", color: "text-yellow-800", icon: "warning" as const },
    info: { bg: "bg-blue-100", color: "text-blue-800", icon: "information-circle" as const },
  } as const;

  const cfg = map[type];

  return (
    <View className={cn("flex-row items-center rounded-xl px-3 py-2", cfg.bg)}>
      <Ionicons name={cfg.icon} size={16} color={cfg.color.includes("green") ? "#166534" : cfg.color.includes("red") ? "#991b1b" : cfg.color.includes("yellow") ? "#92400e" : "#1e40af"} />
      <Text className={cn("ml-2 text-sm", cfg.color)}>{message}</Text>
    </View>
  );
}
