import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  SlideInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import { HomeStackParamList } from "../navigation/AppNavigator";
import useHistoryStore from "../state/historyStore";
import useBlogStore from "../state/blogStore";
import { BlogPost, SEOAnalysis } from "../types/blog";

// UI Components
import GradientBackground from "../components/ui/GradientBackground";
import GlassCard from "../components/ui/GlassCard";
import GlassButton from "../components/ui/GlassButton";
import GlassInput from "../components/ui/GlassInput";
import MetricsCard from "../components/ui/MetricsCard";


type EditBlogScreenNavigationProp = NativeStackNavigationProp<
  HomeStackParamList,
  "EditBlog"
>;

type EditBlogScreenRouteProp = RouteProp<HomeStackParamList, "EditBlog">;

interface Props {
  navigation: EditBlogScreenNavigationProp;
  route: EditBlogScreenRouteProp;
}

const { width } = Dimensions.get("window");

export default function EditBlogScreen({ navigation, route }: Props) {
  const { blogId, draft } = route.params || {};
  
  // State
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [seoAnalysis, setSeoAnalysis] = useState<SEOAnalysis | null>(null);
  const [showSEOPanel, setShowSEOPanel] = useState(false);

  // Zustand stores
  const { getBlogById, updateBlog } = useHistoryStore();
  const { setCurrentAnalysis } = useBlogStore();

  // Animations
  const seoOpacity = useSharedValue(0);

  const seoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: seoOpacity.value,
  }));

  // Load blog data
  useEffect(() => {
    if (blogId) {
      const existingBlog = getBlogById(blogId);
      if (existingBlog) {
        setBlog(existingBlog);
        setTitle(existingBlog.title);
        setContent(existingBlog.content);
        setMetaDescription(existingBlog.metaDescription);
        setKeywords(existingBlog.keywords);
        setTags(existingBlog.tags);
      }
    } else if (draft) {
      setTitle(draft.title || "");
      setContent(draft.content || "");
      setMetaDescription(draft.metaDescription || "");
      setKeywords(draft.keywords || []);
      setTags(draft.tags || []);
    }
  }, [blogId, draft, getBlogById]);

  // Auto-save functionality
  useEffect(() => {
    const autoSaveTimer = setTimeout(() => {
      if (blog && (title !== blog.title || content !== blog.content || metaDescription !== blog.metaDescription)) {
        handleAutoSave();
      }
    }, 2000);

    return () => clearTimeout(autoSaveTimer);
  }, [title, content, metaDescription, blog]);

  // SEO Analysis
  const analyzeSEO = async () => {
    if (!content.trim()) return;

    setIsAnalyzing(true);
    
    try {
      // Simulate SEO analysis
      const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const avgSentenceLength = sentences.length > 0 ? wordCount / sentences.length : 0;
      
      // Calculate keyword density
      const keywordAnalysis = keywords.map(keyword => {
        const regex = new RegExp(keyword, "gi");
        const matches = content.match(regex) || [];
        const density = (matches.length / wordCount) * 100;
        return {
          keyword,
          density: Math.round(density * 100) / 100,
          occurrences: matches.length,
        };
      });

      // Basic SEO scoring
      let score = 0;
      const issues = [];

      // Title length check
      if (title.length >= 30 && title.length <= 60) {
        score += 20;
      } else {
        issues.push({
          type: "warning" as const,
          message: "Title should be between 30-60 characters for optimal SEO",
        });
      }

      // Meta description check
      if (metaDescription.length >= 150 && metaDescription.length <= 160) {
        score += 20;
      } else {
        issues.push({
          type: "warning" as const,
          message: "Meta description should be between 150-160 characters",
        });
      }

      // Content length check
      if (wordCount >= 1500) {
        score += 20;
      } else {
        issues.push({
          type: "suggestion" as const,
          message: "Consider adding more content. Longer articles tend to rank better.",
        });
      }

      // Keyword usage check
      if (keywordAnalysis.some(k => k.density > 0.5 && k.density < 3)) {
        score += 20;
      } else {
        issues.push({
          type: "warning" as const,
          message: "Keyword density should be between 0.5% and 3%",
        });
      }

      // Readability check
      if (avgSentenceLength <= 20) {
        score += 20;
      } else {
        issues.push({
          type: "suggestion" as const,
          message: "Consider shorter sentences for better readability",
        });
      }

      const analysis: SEOAnalysis = {
        score,
        issues,
        keywords: {
          primary: keywordAnalysis[0] || { keyword: "", density: 0, occurrences: 0 },
          secondary: keywordAnalysis.slice(1),
        },
        readability: {
          score: Math.max(0, 100 - avgSentenceLength * 2),
          level: avgSentenceLength <= 15 ? "Easy" : avgSentenceLength <= 20 ? "Medium" : "Hard",
          avgSentenceLength: Math.round(avgSentenceLength),
          avgWordsPerSentence: Math.round(avgSentenceLength),
        },
        structure: {
          hasH1: content.includes("# "),
          h2Count: (content.match(/## /g) || []).length,
          h3Count: (content.match(/### /g) || []).length,
          paragraphCount: content.split("\n\n").length,
          listCount: (content.match(/^[-*+] /gm) || []).length,
        },
      };

      setSeoAnalysis(analysis);
      setCurrentAnalysis(analysis);
      setShowSEOPanel(true);
      seoOpacity.value = withTiming(1, { duration: 300 });
    } catch (error) {
      Alert.alert("Analysis Failed", "Failed to analyze SEO. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handlers
  const handleAutoSave = async () => {
    if (!blog) return;

    try {
      const updatedBlog = {
        ...blog,
        title,
        content,
        metaDescription,
        keywords,
        tags,
        updatedAt: new Date(),
        wordCount: content.split(/\s+/).filter(word => word.length > 0).length,
        readingTime: Math.ceil(content.split(/\s+/).length / 200),
      };

      updateBlog(blog.id, updatedBlog);
    } catch (error) {
      console.error("Auto-save failed:", error);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert("Missing Content", "Please provide both a title and content for your blog.");
      return;
    }

    setIsSaving(true);

    try {
      if (blog) {
        // Update existing blog
        const updatedBlog = {
          ...blog,
          title: title.trim(),
          content: content.trim(),
          metaDescription: metaDescription.trim(),
          keywords,
          tags,
          updatedAt: new Date(),
          wordCount: content.split(/\s+/).filter(word => word.length > 0).length,
          readingTime: Math.ceil(content.split(/\s+/).length / 200),
          seoScore: seoAnalysis?.score || blog.seoScore,
        };

        updateBlog(blog.id, updatedBlog);
        Alert.alert("Saved", "Your blog has been updated successfully.");
      } else {
        // Create new blog (if coming from draft)
        Alert.alert("Feature Coming Soon", "Creating new blogs from editor will be available soon.");
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert("Save Failed", "Failed to save your blog. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim().toLowerCase())) {
      setKeywords([...keywords, newKeyword.trim().toLowerCase()]);
      setNewKeyword("");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim().toLowerCase())) {
      setTags([...tags, newTag.trim().toLowerCase()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  return (
    <GradientBackground variant="primary" animated>
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          {/* Header */}
          <Animated.View entering={FadeIn.delay(200)} className="px-6 pt-4 pb-2">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-2xl font-bold text-white mb-1">
                  {blog ? "Edit Blog" : "Create Blog"}
                </Text>
                <Text className="text-white/80">
                  {blog ? "Update your content" : "Write your new blog post"}
                </Text>
              </View>
              
              <View className="flex-row space-x-2">
                <GlassButton
                  title="Analyze SEO"
                  onPress={analyzeSEO}
                  loading={isAnalyzing}
                  variant="secondary"
                  size="small"
                  icon="analytics-outline"
                />
                <GlassButton
                  title="Save"
                  onPress={handleSave}
                  loading={isSaving}
                  variant="primary"
                  size="small"
                  icon="checkmark-outline"
                />
              </View>
            </View>
          </Animated.View>

          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View className="px-6 space-y-6">
              {/* SEO Analysis Panel */}
              {showSEOPanel && seoAnalysis && (
                <Animated.View
                  entering={SlideInUp.delay(300)}
                  style={seoAnimatedStyle}
                >
                  <GlassCard
                    intensity={25}
                    gradientColors={["rgba(255, 255, 255, 0.95)", "rgba(255, 255, 255, 0.8)"]}
                    borderRadius={16}
                    padding={20}
                  >
                    <View className="flex-row items-center justify-between mb-4">
                      <Text className="text-lg font-bold text-gray-900">
                        SEO Analysis
                      </Text>
                      <View className="flex-row items-center">
                        <Text className="text-2xl font-bold text-blue-600 mr-2">
                          {seoAnalysis.score}
                        </Text>
                        <Text className="text-gray-600">/ 100</Text>
                      </View>
                    </View>

                    <View className="flex-row space-x-4 mb-4">
                      <View style={{ width: (width - 120) / 3 }}>
                        <MetricsCard
                          title="Readability"
                          value={seoAnalysis.readability.level}
                          subtitle={`${seoAnalysis.readability.score}/100`}
                          icon="eye-outline"
                          color="green"
                          size="small"
                        />
                      </View>
                      <View style={{ width: (width - 120) / 3 }}>
                        <MetricsCard
                          title="Structure"
                          value={seoAnalysis.structure.h2Count}
                          subtitle="H2 headings"
                          icon="list-outline"
                          color="blue"
                          size="small"
                        />
                      </View>
                      <View style={{ width: (width - 120) / 3 }}>
                        <MetricsCard
                          title="Keywords"
                          value={keywords.length}
                          subtitle="Total keywords"
                          icon="key-outline"
                          color="purple"
                          size="small"
                        />
                      </View>
                    </View>

                    {seoAnalysis.issues.length > 0 && (
                      <View>
                        <Text className="text-sm font-semibold text-gray-700 mb-2">
                          Suggestions
                        </Text>
                        {seoAnalysis.issues.slice(0, 3).map((issue, index) => (
                          <View key={index} className="flex-row items-start mb-2">
                            <Ionicons
                              name={
                                issue.type === "error"
                                  ? "close-circle"
                                  : issue.type === "warning"
                                  ? "warning"
                                  : "information-circle"
                              }
                              size={16}
                              color={
                                issue.type === "error"
                                  ? "#ef4444"
                                  : issue.type === "warning"
                                  ? "#f59e0b"
                                  : "#3b82f6"
                              }
                              style={{ marginTop: 2 }}
                            />
                            <Text className="text-sm text-gray-600 ml-2 flex-1">
                              {issue.message}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </GlassCard>
                </Animated.View>
              )}

              {/* Title Input */}
              <Animated.View entering={SlideInUp.delay(400)}>
                <GlassInput
                  label="Blog Title"
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Enter your blog title..."
                  variant="floating"
                  leftIcon="create-outline"
                />
              </Animated.View>

              {/* Meta Description */}
              <Animated.View entering={SlideInUp.delay(500)}>
                <GlassInput
                  label="Meta Description"
                  value={metaDescription}
                  onChangeText={setMetaDescription}
                  placeholder="Brief description for search engines..."
                  variant="floating"
                  multiline
                  numberOfLines={3}
                  leftIcon="document-text-outline"
                />
                <Text className="text-xs text-white/70 mt-1 ml-4">
                  {metaDescription.length}/160 characters
                </Text>
              </Animated.View>

              {/* Keywords */}
              <Animated.View entering={SlideInUp.delay(600)}>
                <GlassCard
                  intensity={25}
                  gradientColors={["rgba(255, 255, 255, 0.25)", "rgba(255, 255, 255, 0.1)"]}
                  borderRadius={16}
                  padding={16}
                >
                  <Text className="text-lg font-semibold text-white mb-3">
                    Keywords
                  </Text>
                  
                  <View className="flex-row mb-3">
                    <TextInput
                      value={newKeyword}
                      onChangeText={setNewKeyword}
                      placeholder="Add keyword..."
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      className="flex-1 bg-white/20 rounded-lg px-3 py-2 text-white mr-2"
                      onSubmitEditing={handleAddKeyword}
                    />
                    <GlassButton
                      title="Add"
                      onPress={handleAddKeyword}
                      variant="secondary"
                      size="small"
                      icon="add-outline"
                    />
                  </View>

                  <View className="flex-row flex-wrap">
                    {keywords.map((keyword, index) => (
                      <View
                        key={index}
                        className="bg-white/30 rounded-lg px-3 py-1 mr-2 mb-2 flex-row items-center"
                      >
                        <Text className="text-white text-sm mr-2">
                          {keyword}
                        </Text>
                        <Ionicons
                          name="close"
                          size={14}
                          color="white"
                          onPress={() => handleRemoveKeyword(keyword)}
                        />
                      </View>
                    ))}
                  </View>
                </GlassCard>
              </Animated.View>

              {/* Tags */}
              <Animated.View entering={SlideInUp.delay(700)}>
                <GlassCard
                  intensity={25}
                  gradientColors={["rgba(255, 255, 255, 0.25)", "rgba(255, 255, 255, 0.1)"]}
                  borderRadius={16}
                  padding={16}
                >
                  <Text className="text-lg font-semibold text-white mb-3">
                    Tags
                  </Text>
                  
                  <View className="flex-row mb-3">
                    <TextInput
                      value={newTag}
                      onChangeText={setNewTag}
                      placeholder="Add tag..."
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      className="flex-1 bg-white/20 rounded-lg px-3 py-2 text-white mr-2"
                      onSubmitEditing={handleAddTag}
                    />
                    <GlassButton
                      title="Add"
                      onPress={handleAddTag}
                      variant="secondary"
                      size="small"
                      icon="add-outline"
                    />
                  </View>

                  <View className="flex-row flex-wrap">
                    {tags.map((tag, index) => (
                      <View
                        key={index}
                        className="bg-blue-500/30 rounded-lg px-3 py-1 mr-2 mb-2 flex-row items-center"
                      >
                        <Text className="text-white text-sm mr-2">
                          {tag}
                        </Text>
                        <Ionicons
                          name="close"
                          size={14}
                          color="white"
                          onPress={() => handleRemoveTag(tag)}
                        />
                      </View>
                    ))}
                  </View>
                </GlassCard>
              </Animated.View>

              {/* Content Editor */}
              <Animated.View entering={SlideInUp.delay(800)} className="mb-8">
                <GlassCard
                  intensity={25}
                  gradientColors={["rgba(255, 255, 255, 0.25)", "rgba(255, 255, 255, 0.1)"]}
                  borderRadius={16}
                  padding={16}
                >
                  <Text className="text-lg font-semibold text-white mb-3">
                    Content
                  </Text>
                  
                  <TextInput
                    value={content}
                    onChangeText={setContent}
                    placeholder="Write your blog content here... Use markdown formatting for headings (# ## ###), lists, and emphasis."
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    multiline
                    numberOfLines={20}
                    className="bg-white/20 rounded-lg p-4 text-white min-h-[400px]"
                    style={{ textAlignVertical: "top" }}
                  />
                  
                  <View className="flex-row justify-between mt-2">
                    <Text className="text-xs text-white/70">
                      {content.split(/\s+/).filter(word => word.length > 0).length} words
                    </Text>
                    <Text className="text-xs text-white/70">
                      ~{Math.ceil(content.split(/\s+/).length / 200)} min read
                    </Text>
                  </View>
                </GlassCard>
              </Animated.View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}