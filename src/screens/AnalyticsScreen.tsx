import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Animated, {
  FadeIn,
  SlideInUp,
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
} from "react-native-reanimated";
import { format, subDays, startOfDay } from "date-fns";

import useHistoryStore from "../state/historyStore";
import useSEOStore from "../state/seoStore";

// UI Components
import GradientBackground from "../components/ui/GradientBackground";
import GlassCard from "../components/ui/GlassCard";
import GlassButton from "../components/ui/GlassButton";
import MetricsCard from "../components/ui/MetricsCard";
import ChartContainer from "../components/ui/ChartContainer";

const { width } = Dimensions.get("window");

export default function AnalyticsScreen() {
  const nav = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");

  // Zustand stores
  const { blogs, metrics, calculateMetrics } = useHistoryStore();
  const { totalResearches, averageResearchScore } = useSEOStore();

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

  // Computed analytics data
  const analyticsData = useMemo(() => {
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const startDate = startOfDay(subDays(new Date(), days));

    // Filter blogs by time range
    const filteredBlogs = blogs.filter(
      blog => new Date(blog.createdAt) >= startDate
    );

    // SEO Score trend
    const seoTrend = Array.from({ length: days }, (_, i) => {
      const date = subDays(new Date(), days - 1 - i);
      const dayBlogs = filteredBlogs.filter(
        blog => format(new Date(blog.createdAt), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
      );
      const avgScore = dayBlogs.length > 0 
        ? dayBlogs.reduce((sum, blog) => sum + blog.seoScore, 0) / dayBlogs.length
        : 0;
      
      return {
        x: format(date, "MM/dd"),
        y: Math.round(avgScore),
        label: format(date, "MMM dd"),
      };
    });

    // Content type distribution
    const contentTypes = filteredBlogs.reduce((acc, blog) => {
      const type = blog.tags.find(tag => 
        ["guide", "tutorial", "review", "comparison", "listicle"].includes(tag.toLowerCase())
      ) || "other";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const contentTypeData = Object.entries(contentTypes).map(([type, count]) => ({
      x: type.charAt(0).toUpperCase() + type.slice(1),
      y: count,
      label: type.charAt(0).toUpperCase() + type.slice(1),
    }));

    // Word count distribution
    const wordCountRanges = {
      "0-1000": 0,
      "1000-2000": 0,
      "2000-3000": 0,
      "3000+": 0,
    };

    filteredBlogs.forEach(blog => {
      if (blog.wordCount < 1000) wordCountRanges["0-1000"]++;
      else if (blog.wordCount < 2000) wordCountRanges["1000-2000"]++;
      else if (blog.wordCount < 3000) wordCountRanges["2000-3000"]++;
      else wordCountRanges["3000+"]++;
    });

    const wordCountData = Object.entries(wordCountRanges).map(([range, count]) => ({
      x: range,
      y: count,
      label: range,
    }));

    // Top keywords
    const keywordCount = filteredBlogs.reduce((acc, blog) => {
      blog.keywords.forEach(keyword => {
        acc[keyword] = (acc[keyword] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const topKeywords = Object.entries(keywordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([keyword, count]) => ({
        x: keyword,
        y: count,
        label: keyword,
      }));

    return {
      seoTrend,
      contentTypeData,
      wordCountData,
      topKeywords,
      filteredBlogs,
    };
  }, [blogs, timeRange]);

  // Handlers
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    calculateMetrics();
    setTimeout(() => setRefreshing(false), 1000);
  }, [calculateMetrics]);

  const handleTimeRangeChange = useCallback((range: typeof timeRange) => {
    setTimeRange(range);
  }, []);

  // Empty state
  if (blogs.length === 0) {
    return (
      <GradientBackground variant="accent" animated>
        <SafeAreaView className="flex-1">
          <Animated.View
            entering={FadeIn.delay(300)}
            className="flex-1 items-center justify-center px-6"
          >
            <View className="w-24 h-24 rounded-3xl bg-white/20 items-center justify-center mb-6">
              <Ionicons name="analytics-outline" size={40} color="white" />
            </View>
            <Text className="text-2xl font-bold text-white text-center mb-4">
              No Analytics Yet
            </Text>
            <Text className="text-lg text-white/80 text-center mb-8 leading-relaxed">
              Create some blog posts to see your SEO analytics and performance insights.
            </Text>
            <GlassButton
              title="Create Your First Blog"
              onPress={() => nav.getParent()?.navigate("HomeTab" as never)}
              variant="primary"
              size="medium"
              icon="add-outline"
            />
          </Animated.View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground variant="accent" animated>
      <SafeAreaView className="flex-1">
        {/* Header */}
        <Animated.View style={headerAnimatedStyle} className="px-6 pt-4 pb-2">
          <Text className="text-3xl font-bold text-white mb-2">
            SEO Analytics
          </Text>
          <Text className="text-lg text-white/80">
            Performance insights and trends
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
            automaticallyAdjustContentInsets={Platform.OS === "ios"}
            contentInsetAdjustmentBehavior={Platform.OS === "ios" ? "automatic" : undefined}
            contentContainerStyle={{ 
              paddingBottom: Platform.OS === "ios" ? 140 : 120 
            }}
          >
          {/* Time Range Selector */}
          <Animated.View entering={SlideInUp.delay(200)} className="px-6 mb-8">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row space-x-3">
                {[
                  { key: "7d", label: "7 Days" },
                  { key: "30d", label: "30 Days" },
                  { key: "90d", label: "90 Days" },
                ].map((option) => (
                  <GlassButton
                    key={option.key}
                    title={option.label}
                    onPress={() => handleTimeRangeChange(option.key as typeof timeRange)}
                    variant={timeRange === option.key ? "primary" : "secondary"}
                    size="small"
                  />
                ))}
              </View>
            </ScrollView>
          </Animated.View>

          {/* Key Metrics */}
          <Animated.View entering={SlideInUp.delay(400)} className="mb-8">
            <Text className="text-xl font-bold text-white mb-5 px-6">
              Key Metrics
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, paddingRight: 48 }}
              className="mb-4"
            >
              <View className="flex-row space-x-4">
                <View style={{ width: Math.max((width - 80) / 2.2, 160) }}>
                  <MetricsCard
                    title="Total Blogs"
                    value={analyticsData.filteredBlogs.length}
                    subtitle={`${timeRange} period`}
                    icon="library"
                    color="blue"
                    size="small"
                  />
                </View>
                <View style={{ width: Math.max((width - 80) / 2.2, 160) }}>
                  <MetricsCard
                    title="Avg SEO Score"
                    value={
                      analyticsData.filteredBlogs.length > 0
                        ? Math.round(
                            analyticsData.filteredBlogs.reduce((sum, blog) => sum + blog.seoScore, 0) /
                            analyticsData.filteredBlogs.length
                          )
                        : 0
                    }
                    subtitle="Quality rating"
                    icon="trending-up"
                    color="green"
                    size="small"
                  />
                </View>
                <View style={{ width: Math.max((width - 80) / 2.2, 160) }}>
                  <MetricsCard
                    title="Total Words"
                    value={analyticsData.filteredBlogs.reduce((sum, blog) => sum + blog.wordCount, 0).toLocaleString()}
                    subtitle="Content volume"
                    icon="document-text"
                    color="purple"
                    size="small"
                  />
                </View>
                <View style={{ width: Math.max((width - 80) / 2.2, 160) }}>
                  <MetricsCard
                    title="Research Sessions"
                    value={totalResearches}
                    subtitle={`Avg score: ${Math.round(averageResearchScore)}`}
                    icon="search"
                    color="yellow"
                    size="small"
                  />
                </View>
              </View>
            </ScrollView>
          </Animated.View>

          {/* Charts Section */}
          <View className="px-6 space-y-8">
            {/* SEO Score Trend */}
            <Animated.View entering={SlideInUp.delay(600)}>
              <ChartContainer
                title="SEO Score Trend"
                subtitle={`Average SEO scores over the last ${timeRange}`}
                data={analyticsData.seoTrend}
                type="line"
                color="#10b981"
                height={200}
              />
            </Animated.View>

            {/* Content Type Distribution */}
            <Animated.View entering={SlideInUp.delay(800)}>
              <ChartContainer
                title="Content Types"
                subtitle="Distribution of blog post types"
                data={analyticsData.contentTypeData}
                type="pie"
                color="#3b82f6"
                height={250}
              />
            </Animated.View>

            {/* Word Count Distribution */}
            <Animated.View entering={SlideInUp.delay(1000)}>
              <ChartContainer
                title="Word Count Distribution"
                subtitle="Blog length analysis"
                data={analyticsData.wordCountData}
                type="bar"
                color="#8b5cf6"
                height={200}
              />
            </Animated.View>

            {/* Top Keywords */}
            <Animated.View entering={SlideInUp.delay(1200)}>
              <ChartContainer
                title="Top Keywords"
                subtitle="Most frequently used keywords"
                data={analyticsData.topKeywords}
                type="bar"
                color="#f59e0b"
                height={200}
              />
            </Animated.View>

            {/* Performance Insights */}
            <Animated.View entering={SlideInUp.delay(1400)} className="mb-16">
              <GlassCard
                intensity={20}
                gradientColors={["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.7)"]}
                borderRadius={16}
                padding={24}
              >
                <Text className="text-lg font-semibold text-gray-900 mb-5">
                  Performance Insights
                </Text>
                
                <View className="space-y-4">
                  {metrics && (
                    <>
                      <View className="flex-row items-center">
                        <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                        <Text className="text-gray-700 ml-3 flex-1">
                          {metrics.scoreDistribution.excellent} blogs with excellent SEO scores (90+)
                        </Text>
                      </View>
                      
                      <View className="flex-row items-center">
                        <Ionicons name="trending-up" size={20} color="#3b82f6" />
                        <Text className="text-gray-700 ml-3 flex-1">
                          Average of {Math.round(metrics.averageWordCount)} words per blog
                        </Text>
                      </View>
                      
                      <View className="flex-row items-center">
                        <Ionicons name="heart" size={20} color="#ef4444" />
                        <Text className="text-gray-700 ml-3 flex-1">
                          {metrics.favoriteBlogs} blogs marked as favorites
                        </Text>
                      </View>
                      
                      {metrics.topKeywords.length > 0 && (
                        <View className="flex-row items-center">
                          <Ionicons name="key" size={20} color="#f59e0b" />
                          <Text className="text-gray-700 ml-3 flex-1">
                            Most used keyword: "{metrics.topKeywords[0].keyword}" ({metrics.topKeywords[0].count} times)
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                </View>
              </GlassCard>
            </Animated.View>
          </View>
        </Animated.ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}