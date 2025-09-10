import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Pressable,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  SlideInUp,
  useAnimatedScrollHandler,
  interpolate,
  withTiming,
} from "react-native-reanimated";

import { HomeStackParamList } from "../navigation/AppNavigator";
import { generateEnhancedSEOBlog } from "../api/blog-generator";
import { conductSEOResearch, SEOResearchData } from "../api/seo-research";
import { networkService, NetworkError, useNetworkState } from "../utils/network";
import useBlogStore from "../state/blogStore";
import useSEOStore from "../state/seoStore";
import useHistoryStore from "../state/historyStore";
import { colors, typography, spacing, shadows } from "../styles/design-system";

// UI Components
import GradientBackground from "../components/ui/GradientBackground";
import GlassCard from "../components/ui/GlassCard";
import GlassButton from "../components/ui/GlassButton";
import GlassInput from "../components/ui/GlassInput";
import GlassModal from "../components/ui/GlassModal";

type HomeScreenNavigationProp = NativeStackNavigationProp<
  HomeStackParamList,
  "Home"
>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const { width } = Dimensions.get("window");

export default function HomeScreen({ navigation }: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalActions, setModalActions] = useState<{ label: string; onPress: () => void; variant?: "primary" | "secondary" | "destructive" }[]>([]);

  const showModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalActions([{ label: "OK", onPress: () => setModalVisible(false), variant: "primary" }]);
    setModalVisible(true);
  };
  const [topic, setTopic] = useState("");

  const [researchData, setResearchData] = useState<SEOResearchData | null>(null);
  const [featuresExpanded, setFeaturesExpanded] = useState(false);
  const expand = useSharedValue(0);
  const insets = useSafeAreaInsets();
  
  useEffect(() => {
    expand.value = withTiming(featuresExpanded ? 1 : 0, { 
      duration: Platform.OS === "ios" ? 300 : 220 
    });
  }, [featuresExpanded]);
  
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${expand.value * 90}deg` }],
  }));
  const featuresAnimatedStyle = useAnimatedStyle(() => ({
    // Avoid animating "opacity" here because layout animations can overwrite it
    transform: [
      {
        translateY: interpolate(expand.value, [0, 1], [8, 0]),
      },
      {
        scale: 0.98 + expand.value * 0.02,
      },
    ],
  }));
  
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
  const { addBlog, enqueueTask } = useHistoryStore();
  const { isOnline, quality } = useNetworkState();

  // Animations
  const scrollY = useSharedValue(0);
  const headerOpacity = useSharedValue(1);
  const cardScale = useSharedValue(1);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      headerOpacity.value = interpolate(
        scrollY.value,
        [0, Platform.OS === "ios" ? 80 : 100],
        [1, Platform.OS === "ios" ? 0.9 : 0.8],
        "clamp"
      );
    },
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, Platform.OS === "ios" ? 80 : 100],
          [0, Platform.OS === "ios" ? -15 : -20],
          "clamp"
        ),
      },
    ],
  }), []);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  // Research functionality
  const handleResearch = useCallback(async () => {
    if (!topic.trim()) {
      showModal("Please enter a topic", "You need to provide a blog topic to conduct research.");
      return;
    }

    setIsResearching(true);
    setCurrentTopic(topic.trim());

    // Ensure we are online before making network requests
    if (!networkService.isOnline()) {
      setIsResearching(false);
      setModalTitle("No Internet");
      setModalMessage("You can queue this research + generation task. It will run automatically when you're back online.");
      setModalActions([
        { label: "Cancel", onPress: () => setModalVisible(false), variant: "secondary" },
        { label: "Queue for later", variant: "primary", onPress: () => {
            enqueueTask({ topic: topic.trim(), withResearch: true, options: { contentType: "guide", tone: "conversational", includeFAQ: true, includeSchema: true, wordCount: 2500 } });
            setModalVisible(false);
            setModalTitle("Queued");
            setModalMessage("Your task has been added to the offline queue.");
            setModalActions([{ label: "OK", onPress: () => setModalVisible(false), variant: "primary" }]);
            setModalVisible(true);
          }
        },
      ]);
      setModalVisible(true);
      return;
    }

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
      if ((error as NetworkError).isNetworkError) {
        showModal("Network Error", "Unable to reach the server. Please check your connection and retry.");
      } else {
        showModal("Research Failed", "Failed to conduct SEO research. Please try again.");
      }
    } finally {
      setIsResearching(false);
    }
  }, [topic, showModal, setIsResearching, setCurrentTopic, getCachedResearch, setResearchData, setCurrentResearch, addResearch, navigation]);

  // Blog generation functionality
  const handleGenerate = async () => {
    if (!topic.trim()) {
      showModal("Please enter a topic", "You need to provide a blog topic to generate content.");
      return;
    }

    setIsGenerating(true);
    cardScale.value = withSpring(0.98);

    // Ensure we are online before making network requests
    if (!networkService.isOnline()) {
      setIsGenerating(false);
      cardScale.value = withSpring(1);
      setModalTitle("No Internet");
      setModalMessage("You can queue this quick generation task. It will run automatically when you're back online.");
      setModalActions([
        { label: "Cancel", onPress: () => setModalVisible(false), variant: "secondary" },
        { label: "Queue for later", variant: "primary", onPress: () => {
            enqueueTask({ topic: topic.trim(), withResearch: false, options: { contentType: "guide", tone: "conversational", includeFAQ: true, includeSchema: true, wordCount: 2500 } });
            setModalVisible(false);
            setModalTitle("Queued");
            setModalMessage("Your task has been added to the offline queue.");
            setModalActions([{ label: "OK", onPress: () => setModalVisible(false), variant: "primary" }]);
            setModalVisible(true);
          }
        },
      ]);
      setModalVisible(true);
      return;
    }

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
      if ((error as NetworkError).isNetworkError) {
        showModal("Network Error", "Unable to reach the server. Please check your connection and retry.");
      } else {
        showModal("Generation Failed", "Failed to generate blog content. Please try again.");
      }
    } finally {
      setIsGenerating(false);
      cardScale.value = withSpring(1);
    }
  };

  const handleQuickGenerate = async () => {
    if (!topic.trim()) {
      showModal("Please enter a topic", "You need to provide a blog topic to generate content.");
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
          keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
          className="flex-1"
        >
          <Animated.ScrollView
            className="flex-1"
            contentContainerStyle={{ 
              flexGrow: 1, 
              paddingBottom: Platform.OS === "ios" ? 140 : 120 
            }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
            automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
            automaticallyAdjustContentInsets={Platform.OS === "ios"}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
          >
            {/* Header Section */}
            <Animated.View
              entering={FadeIn.delay(200)}
              style={headerAnimatedStyle}
              className="px-6 pt-4 pb-2"
            >
              {/* Connection status indicator */}
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    marginRight: 8,
                    backgroundColor: !isOnline ? "#ef4444" : quality === "excellent" ? "#10b981" : quality === "good" ? "#f59e0b" : "#f97316",
                  }}
                />
                <Text style={{ color: colors.text.secondary, fontSize: 12 }}>
                  {isOnline ? `Online • ${quality.charAt(0).toUpperCase()}${quality.slice(1)}` : "Offline • queued tasks will run when back online"}
                </Text>
              </View>
              <View className="items-center mb-4">
                <Animated.View
                  entering={SlideInUp.delay(400)}
                  className="w-16 h-16 rounded-2xl items-center justify-center mb-4"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.3)",
                  }}
                >
                  <Ionicons name="create" size={32} color="white" />
                </Animated.View>
                
                <Animated.Text
                  entering={SlideInUp.delay(600)}
                  className="text-3xl font-semibold text-center mb-3"
                  style={{
                    fontSize: typography.fontSize['4xl'],
                    lineHeight: typography.lineHeight.tight,
                    letterSpacing: typography.letterSpacing.tight,
                    color: colors.text.inverse,
                    fontFamily: typography.fontFamily.primary,
                    fontWeight: typography.fontWeight.bold,
                    textShadowColor: colors.glass.shadow,
                    textShadowOffset: { width: 0, height: 2 },
                    textShadowRadius: 4,
                  }}
                >
                  SEO Blog Generator
                </Animated.Text>
                
                <Animated.Text
                  entering={SlideInUp.delay(800)}
                  numberOfLines={2}
                  className="text-center px-4"
                  style={{
                    fontSize: typography.fontSize.lg,
                    lineHeight: typography.lineHeight.normal,
                    letterSpacing: typography.letterSpacing.tight,
                    color: colors.text.inverseSecondary,
                    fontFamily: typography.fontFamily.primary,
                    fontWeight: typography.fontWeight.medium,
                    textShadowColor: colors.glass.shadow,
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 2,
                  }}
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
                  <Text 
                    className="mb-4"
                    style={{
                      fontSize: typography.fontSize['2xl'],
                      lineHeight: typography.lineHeight.tight,
                      letterSpacing: typography.letterSpacing.tight,
                      color: colors.text.inverse,
                      fontFamily: typography.fontFamily.primary,
                      fontWeight: typography.fontWeight.bold,
                      textShadowColor: colors.glass.shadow,
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 2,
                    }}
                  >
                    What's your blog topic?
                  </Text>
                  
                  <GlassInput
                    value={topic}
                    onChangeText={setTopic}
                    placeholder="e.g., Best productivity apps for remote workers"
                    multiline
                    numberOfLines={2}
                    variant="floating"
                    label="Blog Topic"
                    leftIcon="bulb-outline"
                    className="mb-4"
                    size="small"
                  />
                  
                  <Text 
                    className="leading-relaxed"
                    style={{
                      fontSize: typography.fontSize.sm,
                      lineHeight: typography.lineHeight.relaxed,
                      color: colors.text.inverseTertiary,
                      fontFamily: typography.fontFamily.primary,
                      fontWeight: typography.fontWeight.normal,
                      textShadowColor: colors.glass.shadow,
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 1,
                    }}
                  >
                    💡 Be specific about your target audience and main keywords for better SEO results. 
                    The more detailed your topic, the more targeted your content will be.
                  </Text>
                </GlassCard>
              </Animated.View>

              {/* Features (collapsible) */}
              <Animated.View entering={SlideInUp.delay(1200)}>
                <Pressable onPress={() => setFeaturesExpanded((v) => !v)} className="flex-row items-center justify-between py-3 mb-2">
                  <Text 
                    style={{
                      fontSize: typography.fontSize.xl,
                      color: colors.text.inverse,
                      fontFamily: typography.fontFamily.primary,
                      fontWeight: typography.fontWeight.bold,
                      textShadowColor: colors.glass.shadow,
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 2,
                    }}
                  >
                    What you get
                  </Text>
                  <Animated.View style={chevronStyle}>
                    <Ionicons name="chevron-forward" size={20} color={colors.text.inverse} />
                  </Animated.View>
                </Pressable>
                {featuresExpanded && (
                  <Animated.View style={[featuresAnimatedStyle]}>
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
                          entering={SlideInUp.delay(1300 + index * 80)}
                          style={{ width: (width - 60) / 2 - 8 }}
                          className="mb-3"
                        >
                          <GlassCard
                            intensity={20}
                            gradientColors={["rgba(255, 255, 255, 0.15)", "rgba(255, 255, 255, 0.05)"]}
                            padding={14}
                            borderRadius={14}
                            compact
                          >
                            <View className="items-center">
                              <View className="w-10 h-10 rounded-2xl bg-white/20 items-center justify-center mb-2">
                                <Ionicons name={feature.icon as any} size={20} color="white" />
                              </View>
                              <Text className="text-white font-semibold text-center mb-0.5">
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
                )}
              </Animated.View>

              {/* Quick Actions */}
              <Animated.View entering={SlideInUp.delay(1400)}>
                <GlassCard
                  intensity={20}
                  gradientColors={["rgba(255, 255, 255, 0.1)", "rgba(255, 255, 255, 0.05)"]}
                  compact
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-base font-semibold text-white">Quick Actions</Text>
                  </View>
                  <View className="flex-row space-x-3">
                    <View className="flex-1">
                      <GlassButton
                        title="History"
                        onPress={() => navigation.getParent()?.navigate("HistoryTab" as never)}
                        variant="ghost"
                        size="small"
                        icon="library-outline"
                        fullWidth
                      />
                    </View>
                    <View className="flex-1">
                      <GlassButton
                        title="Analytics"
                        onPress={() => navigation.getParent()?.navigate("AnalyticsTab" as never)}
                        variant="ghost"
                        size="small"
                        icon="analytics-outline"
                        fullWidth
                      />
                    </View>
                  </View>
                </GlassCard>
              </Animated.View>
            </View>
          </Animated.ScrollView>

          {/* Sticky CTA Bar */}
          <View
            pointerEvents="box-none"
            style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}
          >
            {Platform.OS === "ios" && (
              <BlurView
                intensity={60}
                tint="systemUltraThinMaterialLight"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                }}
              />
            )}
            <View
              style={{
                paddingHorizontal: 24,
                paddingBottom: Platform.OS === "ios" ? Math.max(insets.bottom, 20) : 12,
                paddingTop: Platform.OS === "ios" ? 16 : 12,
                backgroundColor: Platform.OS === "ios" ? "transparent" : "rgba(255, 255, 255, 0.95)",
                borderTopLeftRadius: Platform.OS === "ios" ? 20 : 0,
                borderTopRightRadius: Platform.OS === "ios" ? 20 : 0,
              }}
            >
              {/* Connection status indicator */}
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    marginRight: 8,
                    backgroundColor: !isOnline ? "#ef4444" : quality === "excellent" ? "#10b981" : quality === "good" ? "#f59e0b" : "#f97316",
                  }}
                />
                <Text style={{ color: colors.text.secondary, fontSize: 12 }}>
                  {isOnline ? `Online • ${quality.charAt(0).toUpperCase()}${quality.slice(1)}` : "Offline • queued tasks will run when back online"}
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
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
                </View>
                <View style={{ flex: 1 }}>
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
                </View>
              </View>
            </View>
          </View>

          <GlassModal
            visible={modalVisible}
            title={modalTitle}
            message={modalMessage}
            actions={modalActions}
            onRequestClose={() => setModalVisible(false)}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}
