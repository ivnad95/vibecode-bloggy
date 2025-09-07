import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { RootStackParamList } from "../navigation/AppNavigator";
import { generateSEOBlog } from "../api/blog-generator";
import { cn } from "../utils/cn";

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

export default function HomeScreen({ navigation }: Props) {
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  
  const buttonScale = useSharedValue(1);
  const inputFocus = useSharedValue(0);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const inputAnimatedStyle = useAnimatedStyle(() => ({
    borderColor: withTiming(
      inputFocus.value ? "#3b82f6" : "#e5e7eb",
      { duration: 200 }
    ),
    shadowOpacity: withTiming(inputFocus.value ? 0.1 : 0, { duration: 200 }),
  }));

  const handleGenerate = async () => {
    if (!topic.trim()) {
      Alert.alert("Please enter a topic", "You need to provide a blog topic to generate content.");
      return;
    }

    setIsGenerating(true);
    buttonScale.value = withSpring(0.95);

    try {
      const blogContent = await generateSEOBlog(topic.trim());
      navigation.navigate("Preview", { blogContent, topic: topic.trim() });
    } catch (error) {
      Alert.alert("Generation Failed", "Failed to generate blog content. Please try again.");
      console.error("Blog generation error:", error);
    } finally {
      setIsGenerating(false);
      buttonScale.value = withSpring(1);
    }
  };

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 py-8">
            {/* Hero Section */}
            <View className="mb-12">
              <View className="mb-6 items-center">
                <View className="w-20 h-20 bg-blue-100 rounded-2xl items-center justify-center mb-4">
                  <Ionicons name="create-outline" size={32} color="#3b82f6" />
                </View>
                <Text className="text-3xl font-bold text-gray-900 text-center mb-3">
                  SEO Blog Generator
                </Text>
                <Text className="text-lg text-gray-600 text-center leading-relaxed">
                  Create high-quality, SEO-optimized blog posts that rank, drive traffic, and generate sales
                </Text>
              </View>
            </View>

            {/* Input Section */}
            <View className="mb-8">
              <Text className="text-lg font-semibold text-gray-900 mb-3">
                What's your blog topic?
              </Text>
              <Animated.View style={inputAnimatedStyle}>
                <TextInput
                  value={topic}
                  onChangeText={setTopic}
                  placeholder="e.g., Best productivity apps for remote workers"
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={4}
                  onFocus={() => (inputFocus.value = 1)}
                  onBlur={() => (inputFocus.value = 0)}
                  className={cn(
                    "bg-white rounded-2xl p-4 text-base text-gray-900",
                    "border border-gray-200 shadow-sm",
                    "min-h-[120px] text-top"
                  )}
                  style={{
                    textAlignVertical: "top",
                    shadowColor: "#3b82f6",
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                />
              </Animated.View>
              <Text className="text-sm text-gray-500 mt-2">
                Be specific about your target audience and main keywords for better SEO results
              </Text>
            </View>

            {/* Features List */}
            <View className="mb-8">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                What you'll get:
              </Text>
              <View className="space-y-3">
                {[
                  { icon: "document-text-outline", text: "2500+ word comprehensive blog post" },
                  { icon: "search-outline", text: "SEO-optimized with relevant keywords" },
                  { icon: "trending-up-outline", text: "Structured for maximum engagement" },
                  { icon: "copy-outline", text: "Ready to copy and publish" },
                ].map((feature, index) => (
                  <View key={index} className="flex-row items-center">
                    <View className="w-8 h-8 bg-blue-50 rounded-full items-center justify-center mr-3">
                      <Ionicons name={feature.icon as any} size={16} color="#3b82f6" />
                    </View>
                    <Text className="text-gray-700 flex-1">{feature.text}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Generate Button */}
            <View className="mt-auto">
              <Animated.View style={buttonAnimatedStyle}>
                <Pressable
                  onPress={handleGenerate}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  disabled={isGenerating || !topic.trim()}
                  className={cn(
                    "rounded-2xl overflow-hidden",
                    (isGenerating || !topic.trim()) && "opacity-50"
                  )}
                >
                  <LinearGradient
                    colors={["#3b82f6", "#1e40af"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="px-8 py-4 items-center justify-center min-h-[56px]"
                  >
                    <View className="flex-row items-center">
                      {isGenerating ? (
                        <>
                          <Ionicons name="hourglass-outline" size={20} color="white" />
                          <Text className="text-white font-semibold text-lg ml-2">
                            Generating...
                          </Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="sparkles-outline" size={20} color="white" />
                          <Text className="text-white font-semibold text-lg ml-2">
                            Generate SEO Blog
                          </Text>
                        </>
                      )}
                    </View>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}