import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Share,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import InlineBanner from "../components/ui/InlineBanner";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import MarkdownDisplay from "react-native-markdown-display";

import { HomeStackParamList } from "../navigation/AppNavigator";
import { cn } from "../utils/cn";

type PreviewScreenNavigationProp = NativeStackNavigationProp<
  HomeStackParamList,
  "Preview"
>;

type PreviewScreenRouteProp = RouteProp<HomeStackParamList, "Preview">;

interface Props {
  navigation: PreviewScreenNavigationProp;
  route: PreviewScreenRouteProp;
}

export default function PreviewScreen({ navigation, route }: Props) {
  const { blogContent, topic } = route.params;
  const [isCopying, setIsCopying] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error" | "warning" | "info"; message: string } | null>(null);
  
  const copyButtonScale = useSharedValue(1);
  const shareButtonScale = useSharedValue(1);

  const copyAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: copyButtonScale.value }],
  }));

  const shareAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shareButtonScale.value }],
  }));

  const handleCopy = async () => {
    setIsCopying(true);
    copyButtonScale.value = withSpring(0.95);
    
    try {
      await Clipboard.setStringAsync(blogContent);
      setBanner({ type: "success", message: "Copied to clipboard" });
    } catch (error) {
      setBanner({ type: "error", message: "Failed to copy content" });
    } finally {
      setIsCopying(false);
      copyButtonScale.value = withSpring(1);
    }
  };

  const handleShare = async () => {
    shareButtonScale.value = withSpring(0.95);
    
    try {
      await Share.share({
        message: `Check out this SEO blog post about "${topic}":\n\n${blogContent}`,
        title: `SEO Blog: ${topic}`,
      });
    } catch (error) {
      setBanner({ type: "error", message: "Failed to share" });
    } finally {
      shareButtonScale.value = withSpring(1);
    }
  };

  const markdownStyles = {
    body: {
      fontSize: 16,
      lineHeight: 24,
      color: "#374151",
      fontFamily: "System",
    },
    heading1: {
      fontSize: 28,
      fontWeight: "700" as const,
      color: "#111827",
      marginBottom: 16,
      marginTop: 24,
    },
    heading2: {
      fontSize: 24,
      fontWeight: "600" as const,
      color: "#1f2937",
      marginBottom: 12,
      marginTop: 20,
    },
    heading3: {
      fontSize: 20,
      fontWeight: "600" as const,
      color: "#374151",
      marginBottom: 8,
      marginTop: 16,
    },
    paragraph: {
      marginBottom: 16,
      lineHeight: 24,
    },
    strong: {
      fontWeight: "600" as const,
      color: "#111827",
    },
    em: {
      fontStyle: "italic" as const,
      color: "#4b5563",
    },
    list_item: {
      marginBottom: 8,
    },
    bullet_list: {
      marginBottom: 16,
    },
    ordered_list: {
      marginBottom: 16,
    },
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 py-4 border-b border-gray-100">
          <Text className="text-sm text-gray-500 mb-1">Generated for:</Text>
          <Text className="text-lg font-semibold text-gray-900" numberOfLines={2}>
            {topic}
          </Text>
        </View>

        {/* Content */}
        <ScrollView 
          className="flex-1 px-6 py-4"
          automaticallyAdjustContentInsets={Platform.OS === "ios"}
          contentInsetAdjustmentBehavior={Platform.OS === "ios" ? "automatic" : undefined}
          showsVerticalScrollIndicator={Platform.OS !== "ios"}
        >
          {banner && (
            <View className="mb-3">
              <InlineBanner type={banner.type} message={banner.message} />
            </View>
          )}
          <MarkdownDisplay style={markdownStyles}>
            {blogContent}
          </MarkdownDisplay>
        </ScrollView>

        {/* Action Buttons */}
        <View className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <View className="flex-row space-x-3">
            <Animated.View style={[copyAnimatedStyle, { flex: 1 }]}>
              <Pressable
                onPress={handleCopy}
                onPressIn={() => (copyButtonScale.value = withSpring(0.95))}
                onPressOut={() => (copyButtonScale.value = withSpring(1))}
                disabled={isCopying}
                className={cn(
                  "bg-blue-600 rounded-xl flex-row items-center justify-center",
                  isCopying && "opacity-50"
                )}
                style={{
                  paddingVertical: Platform.OS === "ios" ? 14 : 12,
                  paddingHorizontal: Platform.OS === "ios" ? 20 : 16,
                  minHeight: Platform.OS === "ios" ? 44 : 36,
                }}
              >
                <Ionicons 
                  name={isCopying ? "checkmark-outline" : "copy-outline"} 
                  size={20} 
                  color="white" 
                />
                <Text className="text-white font-semibold ml-2">
                  {isCopying ? "Copied!" : "Copy"}
                </Text>
              </Pressable>
            </Animated.View>

            <Animated.View style={shareAnimatedStyle}>
              <Pressable
                onPress={handleShare}
                onPressIn={() => (shareButtonScale.value = withSpring(0.95))}
                onPressOut={() => (shareButtonScale.value = withSpring(1))}
                className="bg-gray-600 rounded-xl flex-row items-center justify-center min-w-[100px]"
                style={{
                  paddingVertical: Platform.OS === "ios" ? 14 : 12,
                  paddingHorizontal: Platform.OS === "ios" ? 20 : 16,
                  minHeight: Platform.OS === "ios" ? 44 : 36,
                }}
              >
                <Ionicons name="share-outline" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">Share</Text>
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}