import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  SlideInUp,
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
} from "react-native-reanimated";

import { HomeStackParamList } from "../navigation/AppNavigator";
import { conductSEOResearch, SEOResearchData } from "../api/seo-research";
import useSEOStore from "../state/seoStore";
import useBlogStore from "../state/blogStore";

// UI Components
import GradientBackground from "../components/ui/GradientBackground";
import GlassCard from "../components/ui/GlassCard";
import GlassButton from "../components/ui/GlassButton";
import KeywordChip from "../components/ui/KeywordChip";
import MetricsCard from "../components/ui/MetricsCard";
import ProgressIndicator from "../components/ui/ProgressIndicator";
import GlassModal from "../components/ui/GlassModal";

type ResearchScreenNavigationProp = NativeStackNavigationProp<
  HomeStackParamList,
  "Research"
>;

type ResearchScreenRouteProp = RouteProp<HomeStackParamList, "Research">;

interface Props {
  navigation: ResearchScreenNavigationProp;
  route: ResearchScreenRouteProp;
}

const { width } = Dimensions.get("window");

export default function ResearchScreen({ navigation, route }: Props) {
  const { topic } = route.params;
  
  // State
  const [researchData, setResearchData] = useState<SEOResearchData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"info" | "warn" | "destructive">("info");
  const [modalActions, setModalActions] = useState<{ label: string; onPress: () => void; variant?: "primary" | "secondary" | "destructive" }[]>([]);

  // Zustand stores
  const { addResearch, getCachedResearch } = useSEOStore();
  const { setCurrentResearch, setIsResearching } = useBlogStore();

  const showModal = (title: string, message: string, type: "info" | "warn" | "destructive" = "info") => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalActions([{ label: "OK", onPress: () => setModalVisible(false), variant: "primary" }]);
    setModalVisible(true);
  };

  // Animations
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 100], [1, 0.9], "clamp"),
    transform: [
      {
        translateY: interpolate(scrollY.value, [0, 100], [0, -10], "clamp"),
      },
    ],
  }));

  // Load research data
  useEffect(() => {
    loadResearchData();
  }, [topic]);

  const loadResearchData = async () => {
    setIsLoading(true);
    setIsResearching(true);

    try {
      // Check cache first
      const cached = getCachedResearch(topic);
      if (cached) {
        setResearchData(cached);
        setCurrentResearch(cached);
        setIsLoading(false);
        setIsResearching(false);
        return;
      }

      // Conduct new research
      const research = await conductSEOResearch(topic);
      setResearchData(research);
      setCurrentResearch(research);
      addResearch(topic, research);
    } catch (error) {
      showModal("Research Failed", "Failed to conduct SEO research. Please try again.", "destructive");
      console.error("SEO research error:", error);
    } finally {
      setIsLoading(false);
      setIsResearching(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadResearchData();
    setRefreshing(false);
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleGenerateBlog = () => {
    navigation.navigate("Home");
  };

  if (isLoading) {
    return (
      <GradientBackground variant="accent" animated>
        <SafeAreaView className="flex-1">
          <View className="flex-1 items-center justify-center px-6">
            <ProgressIndicator
              progress={75}
              title="Conducting SEO Research"
              subtitle={`Analyzing "${topic}" for optimal content strategy`}
              variant="circular"
              color="blue"
              size="large"
              animated
            />
            <Text className="text-white/80 text-center mt-6 leading-relaxed">
              Gathering keyword data, analyzing search intent, and identifying content opportunities...
            </Text>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  if (!researchData) {
    return (
      <GradientBackground variant="accent" animated>
        <SafeAreaView className="flex-1">
          <View className="flex-1 items-center justify-center px-6">
            <View className="w-24 h-24 rounded-3xl bg-white/20 items-center justify-center mb-6">
              <Ionicons name="warning-outline" size={40} color="white" />
            </View>
            <Text className="text-2xl font-bold text-white text-center mb-4">
              Research Failed
            </Text>
            <Text className="text-lg text-white/80 text-center mb-8 leading-relaxed">
              We couldn't gather SEO research for this topic. Please try again.
            </Text>
            <GlassButton
              title="Retry Research"
              onPress={loadResearchData}
              variant="primary"
              size="medium"
              icon="refresh-outline"
            />
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground variant="accent" animated>
      <SafeAreaView className="flex-1">
        {/* Header */}
        <Animated.View style={headerAnimatedStyle} className="px-6 pt-4 pb-2">
          <Text className="text-2xl font-bold text-white mb-1">
            SEO Research
          </Text>
          <Text className="text-lg text-white/80" numberOfLines={2}>
            {topic}
          </Text>
        </Animated.View>

        <Animated.ScrollView
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="white"
            />
          }
          showsVerticalScrollIndicator={false}
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <View className="px-6 space-y-6">
            {/* Overview Metrics */}
            <Animated.View entering={SlideInUp.delay(200)}>
              <Text className="text-xl font-bold text-white mb-4">
                Research Overview
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 24 }}
              >
                <View className="flex-row space-x-3">
                  <View style={{ width: Math.max((width - 80) / 2.2, 160) }}>
                    <MetricsCard
                      title="SEO Score"
                      value={researchData.seoScore.overall}
                      subtitle="Overall potential"
                      icon="trending-up"
                      color="green"
                      size="small"
                    />
                  </View>
                  <View style={{ width: Math.max((width - 80) / 2.2, 160) }}>
                    <MetricsCard
                      title="Search Intent"
                      value={researchData.searchIntent.primary}
                      subtitle={`${researchData.searchIntent.confidence}% confidence`}
                      icon="search"
                      color="blue"
                      size="small"
                    />
                  </View>
                  <View style={{ width: Math.max((width - 80) / 2.2, 160) }}>
                    <MetricsCard
                      title="Keywords Found"
                      value={
                        researchData.primaryKeywords.length +
                        researchData.secondaryKeywords.length +
                        researchData.longTailKeywords.length
                      }
                      subtitle="Total opportunities"
                      icon="key"
                      color="purple"
                      size="small"
                    />
                  </View>
                  <View style={{ width: Math.max((width - 80) / 2.2, 160) }}>
                    <MetricsCard
                      title="Content Gaps"
                      value={researchData.contentGaps.length}
                      subtitle="Opportunities"
                      icon="bulb"
                      color="yellow"
                      size="small"
                    />
                  </View>
                </View>
              </ScrollView>
            </Animated.View>

            {/* Primary Keywords */}
            <Animated.View entering={SlideInUp.delay(400)}>
              <GlassCard
                intensity={20}
                gradientColors={["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.7)"]}
                borderRadius={16}
                padding={20}
                pressable
                onPress={() => toggleSection("primary")}
              >
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-lg font-bold text-gray-900">
                    Primary Keywords ({researchData.primaryKeywords.length})
                  </Text>
                  <Ionicons
                    name={expandedSections.has("primary") ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#6b7280"
                  />
                </View>

                {expandedSections.has("primary") ? (
                  <View className="space-y-3">
                    {researchData.primaryKeywords.map((keyword, index) => (
                      <KeywordChip
                        key={index}
                        keyword={keyword}
                        variant="default"
                        size="medium"
                        showMetrics
                      />
                    ))}
                  </View>
                ) : (
                  <View className="flex-row flex-wrap gap-2">
                    {researchData.primaryKeywords.slice(0, 3).map((keyword, index) => (
                      <View key={index} className="bg-blue-100 rounded-lg px-3 py-2">
                        <Text className="text-blue-800 text-sm font-medium">
                          {keyword.keyword}
                        </Text>
                      </View>
                    ))}
                    {researchData.primaryKeywords.length > 3 && (
                      <View className="bg-gray-100 rounded-lg px-3 py-2">
                        <Text className="text-gray-600 text-sm font-medium">
                          +{researchData.primaryKeywords.length - 3} more
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </GlassCard>
            </Animated.View>

            {/* Secondary Keywords */}
            <Animated.View entering={SlideInUp.delay(500)}>
              <GlassCard
                intensity={20}
                gradientColors={["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.7)"]}
                borderRadius={16}
                padding={20}
                pressable
                onPress={() => toggleSection("secondary")}
              >
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-lg font-bold text-gray-900">
                    Secondary Keywords ({researchData.secondaryKeywords.length})
                  </Text>
                  <Ionicons
                    name={expandedSections.has("secondary") ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#6b7280"
                  />
                </View>

                {expandedSections.has("secondary") ? (
                  <View className="space-y-2">
                    {researchData.secondaryKeywords.map((keyword, index) => (
                      <KeywordChip
                        key={index}
                        keyword={keyword}
                        variant="default"
                        size="medium"
                        showMetrics
                      />
                    ))}
                  </View>
                ) : (
                  <View className="flex-row flex-wrap">
                    {researchData.secondaryKeywords.slice(0, 4).map((keyword, index) => (
                      <View key={index} className="bg-green-100 rounded-lg px-3 py-1 mr-2 mb-2">
                        <Text className="text-green-800 text-sm font-medium">
                          {keyword.keyword}
                        </Text>
                      </View>
                    ))}
                    {researchData.secondaryKeywords.length > 4 && (
                      <View className="bg-gray-100 rounded-lg px-3 py-1">
                        <Text className="text-gray-600 text-sm">
                          +{researchData.secondaryKeywords.length - 4} more
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </GlassCard>
            </Animated.View>

            {/* Long-tail Keywords */}
            <Animated.View entering={SlideInUp.delay(600)}>
              <GlassCard
                intensity={20}
                gradientColors={["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.7)"]}
                borderRadius={16}
                padding={20}
                pressable
                onPress={() => toggleSection("longtail")}
              >
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-lg font-bold text-gray-900">
                    Long-tail Keywords ({researchData.longTailKeywords.length})
                  </Text>
                  <Ionicons
                    name={expandedSections.has("longtail") ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#6b7280"
                  />
                </View>

                {expandedSections.has("longtail") ? (
                  <View className="space-y-2">
                    {researchData.longTailKeywords.map((keyword, index) => (
                      <KeywordChip
                        key={index}
                        keyword={keyword}
                        variant="suggestion"
                        size="medium"
                        showMetrics
                      />
                    ))}
                  </View>
                ) : (
                  <View className="flex-row flex-wrap">
                    {researchData.longTailKeywords.slice(0, 3).map((keyword, index) => (
                      <View key={index} className="bg-purple-100 rounded-lg px-3 py-1 mr-2 mb-2">
                        <Text className="text-purple-800 text-sm font-medium">
                          {keyword.keyword}
                        </Text>
                      </View>
                    ))}
                    {researchData.longTailKeywords.length > 3 && (
                      <View className="bg-gray-100 rounded-lg px-3 py-1">
                        <Text className="text-gray-600 text-sm">
                          +{researchData.longTailKeywords.length - 3} more
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </GlassCard>
            </Animated.View>

            {/* People Also Ask */}
            <Animated.View entering={SlideInUp.delay(700)}>
              <GlassCard
                intensity={20}
                gradientColors={["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.7)"]}
                borderRadius={16}
                padding={20}
                pressable
                onPress={() => toggleSection("paa")}
              >
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-lg font-bold text-gray-900">
                    People Also Ask ({researchData.peopleAlsoAsk.length})
                  </Text>
                  <Ionicons
                    name={expandedSections.has("paa") ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#6b7280"
                  />
                </View>

                {expandedSections.has("paa") ? (
                  <View className="space-y-4">
                    {researchData.peopleAlsoAsk.map((paa, index) => (
                      <View key={index} className="border-l-4 border-blue-500 pl-4">
                        <Text className="font-semibold text-gray-900 mb-2">
                          {paa.question}
                        </Text>
                        <Text className="text-gray-700 text-sm leading-relaxed">
                          {paa.suggestedAnswer}
                        </Text>
                        <View className="flex-row flex-wrap mt-2">
                          {paa.relatedKeywords.map((keyword, kIndex) => (
                            <View key={kIndex} className="bg-blue-50 rounded px-2 py-1 mr-1 mb-1">
                              <Text className="text-blue-700 text-xs">
                                {keyword}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View className="space-y-2">
                    {researchData.peopleAlsoAsk.slice(0, 3).map((paa, index) => (
                      <Text key={index} className="text-gray-700 text-sm">
                        • {paa.question}
                      </Text>
                    ))}
                    {researchData.peopleAlsoAsk.length > 3 && (
                      <Text className="text-gray-500 text-sm">
                        +{researchData.peopleAlsoAsk.length - 3} more questions
                      </Text>
                    )}
                  </View>
                )}
              </GlassCard>
            </Animated.View>

            {/* Content Gaps */}
            <Animated.View entering={SlideInUp.delay(800)}>
              <GlassCard
                intensity={20}
                gradientColors={["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.7)"]}
                borderRadius={16}
                padding={20}
              >
                <Text className="text-lg font-bold text-gray-900 mb-4">
                  Content Opportunities
                </Text>
                
                <View className="space-y-3">
                  {researchData.contentGaps.map((gap, index) => (
                    <View key={index} className="flex-row items-start">
                      <View className={`w-3 h-3 rounded-full mt-1 mr-3 ${
                        gap.priority === "high" ? "bg-red-500" :
                        gap.priority === "medium" ? "bg-yellow-500" : "bg-green-500"
                      }`} />
                      <View className="flex-1">
                        <Text className="font-semibold text-gray-900 mb-1">
                          {gap.topic}
                        </Text>
                        <Text className="text-gray-700 text-sm">
                          {gap.opportunity}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </GlassCard>
            </Animated.View>

            {/* Action Buttons */}
            <Animated.View entering={SlideInUp.delay(900)} className="pb-8">
              <View className="space-y-3">
                <GlassButton
                  title="Generate Blog with This Research"
                  onPress={handleGenerateBlog}
                  variant="primary"
                  size="large"
                  fullWidth
                  icon="create"
                  gradientColors={["rgba(59, 130, 246, 0.9)", "rgba(147, 51, 234, 0.9)"]}
                />
                
                <View className="flex-row space-x-3">
                  <View className="flex-1">
                    <GlassButton
                      title="Export Research"
                      onPress={() => showModal("Coming Soon", "Export functionality will be available soon.")}
                      variant="secondary"
                      size="medium"
                      fullWidth
                      icon="download-outline"
                    />
                  </View>
                  <View className="flex-1">
                    <GlassButton
                      title="Save Research"
                      onPress={() => showModal("Saved", "Research data has been saved to your history.")}
                      variant="secondary"
                      size="medium"
                      fullWidth
                      icon="bookmark-outline"
                    />
                  </View>
                </View>
              </View>
            </Animated.View>
          </View>
        </Animated.ScrollView>
        
        <GlassModal
          visible={modalVisible}
          title={modalTitle}
          message={modalMessage}
          type={modalType}
          actions={modalActions}
          onRequestClose={() => setModalVisible(false)}
        />
      </SafeAreaView>
    </GradientBackground>
  );
}