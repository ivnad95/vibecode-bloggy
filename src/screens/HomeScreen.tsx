import React, { useState } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  SlideInUp,
  useAnimatedScrollHandler,
  interpolate,
} from "react-native-reanimated";

import { HomeStackParamList } from "../navigation/AppNavigator";
import { generateEnhancedSEOBlog } from "../api/blog-generator";
import { conductSEOResearch, SEOResearchData } from "../api/seo-research";
import useBlogStore from "../state/blogStore";
import useSEOStore from "../state/seoStore";
import useHistoryStore from "../state/historyStore";

// UI Components
import GradientBackground from "../components/ui/GradientBackground";
import GlassCard from "../components/ui/GlassCard";
import GlassButton from "../components/ui/GlassButton";
import GlassInput from "../components/ui/GlassInput";

type HomeScreenNavigationProp = NativeStackNavigationProp<
  HomeStackParamList,
  "Home"
>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const { width } = Dimensions.get("window");

export default function HomeScreen({ navigation }: Props) {
  const [topic, setTopic] = useState("");

  const [researchData, setResearchData] = useState<SEOResearchData | null>(null);
  
  // Zustand stores
  const {
    isGenerating,
    isResearching,
    setIsGenerating,
    setIsResearching,
    setCurrentTopic,
    setCurrentResearch,
  } = useBlogStore();
  
  const { addResearch, getCachedResearch } = useSEOStore();
  const { addBlog } = useHistoryStore();

  // Animations
  const scrollY = useSharedValue(0);
  const headerOpacity = useSharedValue(1);
  const cardScale = useSharedValue(1);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      headerOpacity.value = interpolate(
        scrollY.value,
        [0, 100],
        [1, 0.8],
        "clamp"
      );
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, 100],
          [0, -20],
          "clamp"
        ),
      },
    ],
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  // Research functionality
  const handleResearch = async () => {
    if (!topic.trim()) {
      Alert.alert("Please enter a topic", "You need to provide a blog topic to conduct research.");
      return;
    }

    setIsResearching(true);
    setCurrentTopic(topic.trim());

    try {
      // Check cache first
      const cached = getCachedResearch(topic.trim());
      if (cached) {
        setResearchData(cached);
        setCurrentResearch(cached);
        return;
      }

      // Conduct new research
      const research = await conductSEOResearch(topic.trim());
      addResearch(topic.trim(), research);
      
      setResearchData(research);
      setCurrentResearch(research);
      
      // Navigate to research screen
      navigation.navigate("Research", { topic: topic.trim() });
    } catch (error) {
      Alert.alert("Research Failed", "Failed to conduct SEO research. Please try again.");
      console.error("SEO research error:", error);
    } finally {
      setIsResearching(false);
    }
  };

  // Blog generation functionality
  const handleGenerate = async () => {
    if (!topic.trim()) {
      Alert.alert("Please enter a topic", "You need to provide a blog topic to generate content.");
      return;
    }

    setIsGenerating(true);
    cardScale.value = withSpring(0.98);

    try {
      const blogData = await generateEnhancedSEOBlog({
        topic: topic.trim(),
        researchData: researchData || undefined,
        contentType: "guide",
        tone: "conversational",
        includeFAQ: true,
        includeSchema: true,
        wordCount: 2500,
      });

      // Create blog post object
      const blogPost = {
        id: `blog-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        title: blogData.title,
        content: blogData.content,
        topic: topic.trim(),
        metaDescription: blogData.metaDescription,
        keywords: blogData.keywords,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: "draft" as const,
        seoScore: blogData.seoScore,
        wordCount: blogData.wordCount,
        readingTime: blogData.readingTime,
        tags: [],
        isFavorite: false,
        version: 1,
      };

      // Add to history
      addBlog(blogPost);

      // Navigate to preview
      navigation.navigate("Preview", { 
        blogContent: blogData.content, 
        topic: topic.trim(),
        researchId: researchData ? "current" : undefined,
      });
    } catch (error) {
      Alert.alert("Generation Failed", "Failed to generate blog content. Please try again.");
      console.error("Blog generation error:", error);
    } finally {
      setIsGenerating(false);
      cardScale.value = withSpring(1);
    }
  };

  const handleQuickGenerate = async () => {
    if (!topic.trim()) {
      Alert.alert("Please enter a topic", "You need to provide a blog topic to generate content.");
      return;
    }

    // Quick generation without research
    await handleGenerate();
  };

  return (
    <GradientBackground variant="primary" animated>
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <Animated.ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
            keyboardShouldPersistTaps="handled"
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
          >
            {/* Header Section */}
            <Animated.View
              entering={FadeIn.delay(200)}
              style={headerAnimatedStyle}
              className="px-6 pt-8 pb-6"
            >
              <View className="items-center mb-8">
                <Animated.View
                  entering={SlideInUp.delay(400)}
                  className="w-24 h-24 rounded-3xl items-center justify-center mb-6"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.3)",
                  }}
                >
                  <Ionicons name="create" size={40} color="white" />
                </Animated.View>
                
                <Animated.Text
                  entering={SlideInUp.delay(600)}
                  className="text-4xl font-bold text-white text-center mb-4"
                >
                  SEO Blog Generator
                </Animated.Text>
                
                <Animated.Text
                  entering={SlideInUp.delay(800)}
                  className="text-lg text-white/90 text-center leading-relaxed px-4"
                >
                  Create high-ranking, traffic-driving blog posts with AI-powered SEO research and optimization
                </Animated.Text>
              </View>
            </Animated.View>

            {/* Main Content */}
            <View className="px-6 space-y-6">
              {/* Topic Input Card */}
              <Animated.View entering={SlideInUp.delay(1000)} style={cardAnimatedStyle}>
                <GlassCard
                  intensity={25}
                  gradientColors={["rgba(255, 255, 255, 0.25)", "rgba(255, 255, 255, 0.1)"]}
                  className="mb-6"
                >
                  <Text className="text-xl font-bold text-white mb-4">
                    What's your blog topic?
                  </Text>
                  
                  <GlassInput
                    value={topic}
                    onChangeText={setTopic}
                    placeholder="e.g., Best productivity apps for remote workers"
                    multiline
                    numberOfLines={3}
                    variant="floating"
                    label="Blog Topic"
                    leftIcon="bulb-outline"
                    className="mb-4"
                  />
                  
                  <Text className="text-sm text-white/70 leading-relaxed">
                    💡 Be specific about your target audience and main keywords for better SEO results. 
                    The more detailed your topic, the more targeted your content will be.
                  </Text>
                </GlassCard>
              </Animated.View>

              {/* Action Buttons */}
              <Animated.View entering={SlideInUp.delay(1200)} className="space-y-4">
                <GlassButton
                  title="🔍 Research & Generate"
                  onPress={handleResearch}
                  loading={isResearching}
                  disabled={isGenerating || !topic.trim()}
                  variant="primary"
                  size="large"
                  fullWidth
                  icon="search"
                  gradientColors={["rgba(59, 130, 246, 0.9)", "rgba(147, 51, 234, 0.9)"]}
                />
                
                <GlassButton
                  title="⚡ Quick Generate"
                  onPress={handleQuickGenerate}
                  loading={isGenerating}
                  disabled={isResearching || !topic.trim()}
                  variant="secondary"
                  size="large"
                  fullWidth
                  icon="flash"
                />
              </Animated.View>

              {/* Features Grid */}
              <Animated.View entering={SlideInUp.delay(1400)} className="mt-8">
                <Text className="text-xl font-bold text-white mb-6 text-center">
                  What you'll get:
                </Text>
                
                <View className="flex-row flex-wrap justify-between">
                  {[
                    { icon: "document-text", title: "2500+ Words", desc: "Comprehensive content" },
                    { icon: "search", title: "SEO Optimized", desc: "Keyword research" },
                    { icon: "trending-up", title: "High Rankings", desc: "Google-friendly" },
                    { icon: "people", title: "People Also Ask", desc: "FAQ sections" },
                    { icon: "image", title: "Image Suggestions", desc: "Visual content" },
                    { icon: "analytics", title: "SEO Scoring", desc: "Performance metrics" },
                  ].map((feature, index) => (
                    <Animated.View
                      key={index}
                      entering={SlideInUp.delay(1600 + index * 100)}
                      style={{ width: (width - 60) / 2 - 8 }}
                      className="mb-4"
                    >
                      <GlassCard
                        intensity={20}
                        gradientColors={["rgba(255, 255, 255, 0.15)", "rgba(255, 255, 255, 0.05)"]}
                        padding={16}
                        borderRadius={16}
                      >
                        <View className="items-center">
                          <View className="w-12 h-12 rounded-2xl bg-white/20 items-center justify-center mb-3">
                            <Ionicons name={feature.icon as any} size={24} color="white" />
                          </View>
                          <Text className="text-white font-semibold text-center mb-1">
                            {feature.title}
                          </Text>
                          <Text className="text-white/70 text-xs text-center">
                            {feature.desc}
                          </Text>
                        </View>
                      </GlassCard>
                    </Animated.View>
                  ))}
                </View>
              </Animated.View>

              {/* Recent Activity */}
              <Animated.View entering={SlideInUp.delay(2000)} className="mt-8">
                <GlassCard
                  intensity={20}
                  gradientColors={["rgba(255, 255, 255, 0.1)", "rgba(255, 255, 255, 0.05)"]}
                >
                  <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-lg font-semibold text-white">
                      Quick Actions
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color="white" />
                  </View>
                  
                  <View className="space-y-3">
                    <GlassButton
                      title="View Blog History"
                      onPress={() => navigation.navigate("History" as any)}
                      variant="ghost"
                      size="medium"
                      fullWidth
                      icon="library-outline"
                    />
                    <GlassButton
                      title="SEO Analytics"
                      onPress={() => navigation.navigate("Analytics" as any)}
                      variant="ghost"
                      size="medium"
                      fullWidth
                      icon="analytics-outline"
                    />
                  </View>
                </GlassCard>
              </Animated.View>
            </View>
          </Animated.ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}