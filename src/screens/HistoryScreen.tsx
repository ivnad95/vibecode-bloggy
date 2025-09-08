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
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import Animated, {
  FadeIn,
  SlideInUp,
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
} from "react-native-reanimated";

import { HistoryStackParamList } from "../navigation/AppNavigator";
import useHistoryStore from "../state/historyStore";
import { BlogPost } from "../types/blog";

// UI Components
import GradientBackground from "../components/ui/GradientBackground";
import GlassCard from "../components/ui/GlassCard";
import GlassButton from "../components/ui/GlassButton";
import SearchBar from "../components/ui/SearchBar";
import BlogCard from "../components/ui/BlogCard";
import MetricsCard from "../components/ui/MetricsCard";
import GlassModal from "../components/ui/GlassModal";

type HistoryScreenNavigationProp = NativeStackNavigationProp<
  HistoryStackParamList,
  "History"
>;

interface Props {
  navigation: HistoryScreenNavigationProp;
}

const { width } = Dimensions.get("window");

export default function HistoryScreen({ navigation }: Props) {
  const [confirm, setConfirm] = useState<{ visible: boolean; title: string; message: string; onConfirm?: () => void }>({ visible: false, title: "", message: "" });
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Zustand store
  const {
    blogs,
    searchQuery,
    selectedTags,
    sortBy,
    sortOrder,
    statusFilter,
    metrics,
    setSearchQuery,
    setSortBy,
    setSortOrder,
    setStatusFilter,
    getFilteredBlogs,
    deleteBlog,
    toggleFavorite,
    calculateMetrics,
    resetFilters,
  } = useHistoryStore();

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

  // Computed values
  const filteredBlogs = useMemo(() => getFilteredBlogs(), [
    blogs,
    searchQuery,
    selectedTags,
    sortBy,
    sortOrder,
    statusFilter,
  ]);

  const hasActiveFilters = useMemo(() => {
    return searchQuery.length > 0 || selectedTags.length > 0 || statusFilter !== "all";
  }, [searchQuery, selectedTags, statusFilter]);

  // Handlers
  const handleRefresh = async () => {
    setRefreshing(true);
    calculateMetrics();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleBlogPress = useCallback((blog: BlogPost) => {
    navigation.navigate("Preview", {
      blogContent: blog.content,
      topic: blog.topic,
      blogId: blog.id,
    });
  }, [navigation]);

  const handleEditBlog = useCallback((blog: BlogPost) => {
    navigation.navigate("EditBlog", { blogId: blog.id });
  }, [navigation]);

  const handleDeleteBlog = useCallback((blog: BlogPost) => {
    setConfirm({
      visible: true,
      title: "Delete Blog",
      message: `Are you sure you want to delete "${blog.title}"?`,
      onConfirm: () => deleteBlog(blog.id),
    });
  }, [deleteBlog]);

  const handleToggleFavorite = useCallback((blog: BlogPost) => {
    toggleFavorite(blog.id);
  }, [toggleFavorite]);

  const handleSortChange = useCallback((newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
  }, [sortBy, sortOrder, setSortBy, setSortOrder]);

  const handleStatusFilter = useCallback((status: typeof statusFilter) => {
    setStatusFilter(status);
  }, [setStatusFilter]);

  const handleClearFilters = useCallback(() => {
    resetFilters();
  }, [resetFilters]);

  // Empty state
  const renderEmptyState = () => (
    <Animated.View
      entering={FadeIn.delay(300)}
      className="flex-1 items-center justify-center px-6 py-12"
    >
      <View className="w-24 h-24 rounded-3xl bg-white/20 items-center justify-center mb-6">
        <Ionicons name="library-outline" size={40} color="white" />
      </View>
      <Text className="text-2xl font-bold text-white text-center mb-4">
        {hasActiveFilters ? "No blogs found" : "No blogs yet"}
      </Text>
      <Text className="text-lg text-white/80 text-center mb-8 leading-relaxed">
        {hasActiveFilters
          ? "Try adjusting your search or filters to find what you're looking for."
          : "Start creating SEO-optimized blog posts to see them here."}
      </Text>
      {hasActiveFilters ? (
        <GlassButton
          title="Clear Filters"
          onPress={handleClearFilters}
          variant="secondary"
          size="medium"
          icon="refresh-outline"
        />
      ) : (
        <GlassButton
          title="Create Your First Blog"
          onPress={() => navigation.getParent()?.navigate("HomeTab" as never)}
          variant="primary"
          size="medium"
          icon="add-outline"
        />
      )}
    </Animated.View>
  );

  // Metrics overview
  const renderMetrics = () => {
    if (!metrics || blogs.length === 0) return null;

    return (
      <Animated.View entering={SlideInUp.delay(400)} className="mb-6">
        <Text className="text-xl font-bold text-white mb-4 px-6">
          Overview
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingRight: 48 }}
          className="mb-4"
        >
          <View className="flex-row space-x-3">
            <View style={{ width: Math.max((width - 80) / 2.2, 160) }}>
              <MetricsCard
                title="Total Blogs"
                value={metrics.totalBlogs}
                icon="library"
                color="blue"
                size="small"
              />
            </View>
            <View style={{ width: Math.max((width - 80) / 2.2, 160) }}>
              <MetricsCard
                title="Avg SEO Score"
                value={Math.round(metrics.averageSeoScore)}
                icon="trending-up"
                color="green"
                size="small"
              />
            </View>
            <View style={{ width: Math.max((width - 80) / 2.2, 160) }}>
              <MetricsCard
                title="Total Words"
                value={metrics.totalWordsWritten.toLocaleString()}
                icon="document-text"
                color="purple"
                size="small"
              />
            </View>
            <View style={{ width: Math.max((width - 80) / 2.2, 160) }}>
              <MetricsCard
                title="This Month"
                value={metrics.blogsThisMonth}
                icon="calendar"
                color="yellow"
                size="small"
              />
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    );
  };

  // Filter bar
  const renderFilterBar = () => (
    <Animated.View entering={SlideInUp.delay(600)} className="px-6 mb-6">
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        onFilter={() => setShowFilters(!showFilters)}
        placeholder="Search blogs..."
        showFilter
        filterActive={hasActiveFilters}
      />

      {showFilters && (
        <Animated.View entering={SlideInUp.delay(200)} className="mt-4">
          <GlassCard
            intensity={20}
            gradientColors={["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.7)"]}
            borderRadius={16}
            padding={16}
          >
            {/* Status Filter */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-3">
                Status
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row space-x-2">
                  {["all", "draft", "published", "archived"].map((status) => (
                    <GlassButton
                      key={status}
                      title={status.charAt(0).toUpperCase() + status.slice(1)}
                      onPress={() => handleStatusFilter(status as typeof statusFilter)}
                      variant={statusFilter === status ? "primary" : "ghost"}
                      size="small"
                    />
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Sort Options */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-3">
                Sort by
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row space-x-2">
                  {[
                    { key: "date", label: "Date" },
                    { key: "title", label: "Title" },
                    { key: "seoScore", label: "SEO Score" },
                    { key: "wordCount", label: "Word Count" },
                  ].map((option) => (
                    <GlassButton
                      key={option.key}
                      title={`${option.label} ${
                        sortBy === option.key
                          ? sortOrder === "asc"
                            ? "↑"
                            : "↓"
                          : ""
                      }`}
                      onPress={() => handleSortChange(option.key as typeof sortBy)}
                      variant={sortBy === option.key ? "primary" : "ghost"}
                      size="small"
                    />
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <GlassButton
                title="Clear All Filters"
                onPress={handleClearFilters}
                variant="secondary"
                size="small"
                icon="refresh-outline"
                fullWidth
              />
            )}
          </GlassCard>
        </Animated.View>
      )}
    </Animated.View>
  );

  return (
    <GradientBackground variant="neutral" animated>
      <SafeAreaView className="flex-1">
        {/* Header */}
        <Animated.View style={headerAnimatedStyle} className="px-6 pt-4 pb-2">
          <Text className="text-3xl font-bold text-white mb-2">
            Blog History
          </Text>
          <Text className="text-lg text-white/80">
            {blogs.length} blog{blogs.length !== 1 ? "s" : ""} created
          </Text>
        </Animated.View>

        {blogs.length === 0 ? (
          renderEmptyState()
        ) : (
          <Animated.ScrollView
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="white"
                progressBackgroundColor={Platform.OS === "ios" ? "transparent" : "#ffffff"}
              />
            }
            showsVerticalScrollIndicator={false}
            automaticallyAdjustContentInsets={Platform.OS === "ios"}
            contentInsetAdjustmentBehavior={Platform.OS === "ios" ? "automatic" : undefined}
            contentContainerStyle={{ 
              paddingBottom: Platform.OS === "ios" ? 120 : 100 
            }}
          >
            {renderMetrics()}
            {renderFilterBar()}

            {/* Blog List */}
            <View className="px-6 pb-12">
              {filteredBlogs.length === 0 ? (
                <Animated.View
                  entering={FadeIn.delay(300)}
                  className="items-center py-12"
                >
                  <Ionicons name="search-outline" size={48} color="white" />
                  <Text className="text-xl font-semibold text-white mt-4 mb-2">
                    No blogs found
                  </Text>
                  <Text className="text-white/80 text-center">
                    Try adjusting your search or filters
                  </Text>
                </Animated.View>
              ) : (
                <Animated.View entering={FadeIn.delay(800)} className="space-y-4">
                  {filteredBlogs.map((blog, index) => (
                    <Animated.View
                      key={blog.id}
                      entering={SlideInUp.delay(900 + index * 100)}
                    >
                      <BlogCard
                        blog={blog}
                        onPress={() => handleBlogPress(blog)}
                        onEdit={() => handleEditBlog(blog)}
                        onDelete={() => handleDeleteBlog(blog)}
                        onToggleFavorite={() => handleToggleFavorite(blog)}
                      />
                    </Animated.View>
                  ))}
                </Animated.View>
              )}
            </View>
          </Animated.ScrollView>
        )}
        <GlassModal
          visible={confirm.visible}
          title={confirm.title}
          message={confirm.message}
          actions={[
            { label: "Cancel", onPress: () => setConfirm({ visible: false, title: "", message: "" }), variant: "secondary" },
            { label: "Delete", onPress: () => { confirm.onConfirm?.(); setConfirm({ visible: false, title: "", message: "" }); }, variant: "destructive" }
          ]}
          onRequestClose={() => setConfirm({ visible: false, title: "", message: "" })}
        />
      </SafeAreaView>
    </GradientBackground>
  );
}