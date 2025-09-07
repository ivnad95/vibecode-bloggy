import React, { useState } from "react";
import {
  View,
  Text,
  Switch,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Application from "expo-application";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import Animated, {
  FadeIn,
  SlideInUp,
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
} from "react-native-reanimated";

import useHistoryStore from "../state/historyStore";
import useSEOStore from "../state/seoStore";
import useBlogStore from "../state/blogStore";

// UI Components
import GradientBackground from "../components/ui/GradientBackground";
import GlassCard from "../components/ui/GlassCard";
import GlassButton from "../components/ui/GlassButton";
import GlassModal from "../components/ui/GlassModal";

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  type: "toggle" | "button" | "info";
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  destructive?: boolean;
}

export default function SettingsScreen() {
  // State
  const [autoSave, setAutoSave] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [analytics, setAnalytics] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"info" | "warn" | "destructive">("info");
  const [modalActions, setModalActions] = useState<{ label: string; onPress: () => void; variant?: "primary" | "secondary" | "destructive" }[]>([]);

  // Zustand stores
  const { blogs, clearHistory, exportBlogs, metrics } = useHistoryStore();
  const { clearHistory: clearSEOHistory, exportResearch } = useSEOStore();
  const { resetCurrentBlog } = useBlogStore();

  const showModal = (title: string, message: string, type: "info" | "warn" | "destructive" = "info", actions?: { label: string; onPress: () => void; variant?: "primary" | "secondary" | "destructive" }[]) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalActions(actions || [{ label: "OK", onPress: () => setModalVisible(false), variant: "primary" }]);
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

  // Handlers
  const handleExportData = () => {
    showModal(
      "Export Data",
      "Choose the format for your data export:",
      "info",
      [
        { label: "Cancel", onPress: () => setModalVisible(false), variant: "secondary" },
        {
          label: "JSON",
          onPress: async () => {
            try {
              const blogData = exportBlogs("json");
              const researchData = exportResearch("json");
              const combinedData = {
                blogs: JSON.parse(blogData),
                research: JSON.parse(researchData),
                exportDate: new Date().toISOString(),
                version: "1.0",
              };
              
              const jsonString = JSON.stringify(combinedData, null, 2);
              const fileName = `seo-blog-data-${new Date().toISOString().split('T')[0]}.json`;
              const fileUri = FileSystem.documentDirectory + fileName;
              
              await FileSystem.writeAsStringAsync(fileUri, jsonString);
              
              if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri, {
                  mimeType: "application/json",
                  dialogTitle: "Export SEO Blog Data",
                });
              }
              
              setModalVisible(false);
              setTimeout(() => showModal("Export Complete", "Your data has been exported successfully."), 100);
            } catch (error) {
              setModalVisible(false);
              setTimeout(() => showModal("Export Failed", "Failed to export data. Please try again.", "destructive"), 100);
            }
          },
          variant: "primary"
        },
        {
          label: "CSV",
          onPress: async () => {
            try {
              const csvData = exportBlogs("csv");
              const fileName = `seo-blogs-${new Date().toISOString().split('T')[0]}.csv`;
              const fileUri = FileSystem.documentDirectory + fileName;
              
              await FileSystem.writeAsStringAsync(fileUri, csvData);
              
              if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri, {
                  mimeType: "text/csv",
                  dialogTitle: "Export Blog Data",
                });
              }
              
              setModalVisible(false);
              setTimeout(() => showModal("Export Complete", "Your blog data has been exported as CSV."), 100);
            } catch (error) {
              setModalVisible(false);
              setTimeout(() => showModal("Export Failed", "Failed to export CSV data. Please try again.", "destructive"), 100);
            }
          },
          variant: "primary"
        },
      ]
    );
  };

  const handleImportData = () => {
    showModal(
      "Import Data",
      "This feature allows you to import previously exported data. Please ensure you have a valid JSON export file.",
      "info",
      [
        { label: "Cancel", onPress: () => setModalVisible(false), variant: "secondary" },
        {
          label: "Import",
          onPress: () => {
            // In a real app, you would open a file picker
            setModalVisible(false);
            setTimeout(() => showModal("Coming Soon", "File import functionality will be available in a future update."), 100);
          },
          variant: "primary"
        },
      ]
    );
  };

  const handleClearAllData = () => {
    showModal(
      "Clear All Data",
      "This will permanently delete all your blogs, research data, and settings. This action cannot be undone.",
      "destructive",
      [
        { label: "Cancel", onPress: () => setModalVisible(false), variant: "secondary" },
        {
          label: "Clear All",
          onPress: () => {
            clearHistory();
            clearSEOHistory();
            resetCurrentBlog();
            setModalVisible(false);
            setTimeout(() => showModal("Data Cleared", "All your data has been cleared successfully."), 100);
          },
          variant: "destructive"
        },
      ]
    );
  };

  const handleContactSupport = () => {
    showModal(
      "Contact Support",
      "Choose how you'd like to get help:",
      "info",
      [
        { label: "Cancel", onPress: () => setModalVisible(false), variant: "secondary" },
        {
          label: "Email Support",
          onPress: () => {
            Linking.openURL("mailto:support@seobloggen.com?subject=SEO Blog Generator Support");
            setModalVisible(false);
          },
          variant: "primary"
        },
        {
          label: "FAQ",
          onPress: () => {
            setModalVisible(false);
            setTimeout(() => showModal("Coming Soon", "FAQ section will be available soon."), 100);
          },
          variant: "primary"
        },
      ]
    );
  };

  const handleRateApp = () => {
    showModal(
      "Rate Our App",
      "We'd love to hear your feedback! Would you like to rate the SEO Blog Generator?",
      "info",
      [
        { label: "Not Now", onPress: () => setModalVisible(false), variant: "secondary" },
        {
          label: "Rate App",
          onPress: () => {
            // In a real app, you would open the app store
            setModalVisible(false);
            setTimeout(() => showModal("Thank You!", "Thank you for your feedback!"), 100);
          },
          variant: "primary"
        },
      ]
    );
  };

  const handleShareApp = () => {
    showModal(
      "Share App",
      "Help others discover the SEO Blog Generator!",
      "info",
      [
        { label: "Cancel", onPress: () => setModalVisible(false), variant: "secondary" },
        {
          label: "Share",
          onPress: () => {
            // In a real app, you would use the sharing API
            setModalVisible(false);
            setTimeout(() => showModal("Coming Soon", "Sharing functionality will be available soon."), 100);
          },
          variant: "primary"
        },
      ]
    );
  };

  // Settings sections
  const settingSections = [
    {
      title: "Content Preferences",
      items: [
        {
          id: "auto-save",
          title: "Auto-save Drafts",
          subtitle: "Automatically save your work while editing",
          icon: "save-outline" as const,
          type: "toggle" as const,
          value: autoSave,
          onToggle: setAutoSave,
        },
        {
          id: "notifications",
          title: "Notifications",
          subtitle: "Get notified about generation progress",
          icon: "notifications-outline" as const,
          type: "toggle" as const,
          value: notifications,
          onToggle: setNotifications,
        },
        {
          id: "analytics",
          title: "Usage Analytics",
          subtitle: "Help improve the app with anonymous usage data",
          icon: "analytics-outline" as const,
          type: "toggle" as const,
          value: analytics,
          onToggle: setAnalytics,
        },
      ],
    },
    {
      title: "Data Management",
      items: [
        {
          id: "export",
          title: "Export Data",
          subtitle: "Download your blogs and research data",
          icon: "download-outline" as const,
          type: "button" as const,
          onPress: handleExportData,
        },
        {
          id: "import",
          title: "Import Data",
          subtitle: "Restore from a previous export",
          icon: "cloud-upload-outline" as const,
          type: "button" as const,
          onPress: handleImportData,
        },
        {
          id: "clear",
          title: "Clear All Data",
          subtitle: "Permanently delete all content",
          icon: "trash-outline" as const,
          type: "button" as const,
          onPress: handleClearAllData,
          destructive: true,
        },
      ],
    },
    {
      title: "Support & Feedback",
      items: [
        {
          id: "contact",
          title: "Contact Support",
          subtitle: "Get help with any issues",
          icon: "help-circle-outline" as const,
          type: "button" as const,
          onPress: handleContactSupport,
        },
        {
          id: "rate",
          title: "Rate This App",
          subtitle: "Share your experience with others",
          icon: "star-outline" as const,
          type: "button" as const,
          onPress: handleRateApp,
        },
        {
          id: "share",
          title: "Share App",
          subtitle: "Tell your friends about SEO Blog Generator",
          icon: "share-outline" as const,
          type: "button" as const,
          onPress: handleShareApp,
        },
      ],
    },
    {
      title: "About",
      items: [
        {
          id: "version",
          title: "App Version",
          subtitle: Application.nativeApplicationVersion || "1.0.0",
          icon: "information-circle-outline" as const,
          type: "info" as const,
        },
        {
          id: "build",
          title: "Build Number",
          subtitle: Application.nativeBuildVersion || "1",
          icon: "code-outline" as const,
          type: "info" as const,
        },
      ],
    },
  ];

  const renderSettingItem = (item: SettingItem) => {
    return (
      <View
        key={item.id}
        className={`flex-row items-center justify-between py-4 ${
          item.destructive ? "opacity-80" : ""
        }`}
      >
        <View className="flex-row items-center flex-1">
          <View className={`w-10 h-10 rounded-xl items-center justify-center mr-4 ${
            item.destructive ? "bg-red-100" : "bg-blue-100"
          }`}>
            <Ionicons
              name={item.icon}
              size={20}
              color={item.destructive ? "#ef4444" : "#3b82f6"}
            />
          </View>
          
          <View className="flex-1">
            <Text className={`text-base font-semibold ${
              item.destructive ? "text-red-600" : "text-gray-900"
            }`}>
              {item.title}
            </Text>
            {item.subtitle && (
              <Text className="text-sm text-gray-600 mt-1">
                {item.subtitle}
              </Text>
            )}
          </View>
        </View>

        {item.type === "toggle" && (
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: "#d1d5db", true: "#3b82f6" }}
            thumbColor={item.value ? "#ffffff" : "#f3f4f6"}
            style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
          />
        )}

        {item.type === "button" && (
          <GlassButton
            title="Open"
            onPress={item.onPress!}
            variant={item.destructive ? "secondary" : "ghost"}
            size="small"
            icon="chevron-forward"
          />
        )}

        {item.type === "info" && (
          <Text className="text-gray-500 text-sm">
            {item.subtitle}
          </Text>
        )}
      </View>
    );
  };

  return (
    <GradientBackground variant="secondary" animated>
      <SafeAreaView className="flex-1">
        {/* Header */}
        <Animated.View style={headerAnimatedStyle} className="px-6 pt-4 pb-2">
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            Settings
          </Text>
          <Text className="text-lg text-gray-600">
            Customize your experience
          </Text>
        </Animated.View>

        <Animated.ScrollView
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <View className="px-6 space-y-6">
            {/* App Stats */}
            <Animated.View entering={SlideInUp.delay(200)}>
              <GlassCard
                intensity={20}
                gradientColors={["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.7)"]}
                borderRadius={16}
                padding={20}
              >
                <Text className="text-lg font-bold text-gray-900 mb-4">
                  Your Stats
                </Text>
                
                <View className="flex-row justify-between">
                  <View className="items-center">
                    <Text className="text-2xl font-bold text-blue-600">
                      {blogs.length}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      Blogs Created
                    </Text>
                  </View>
                  
                  <View className="items-center">
                    <Text className="text-2xl font-bold text-green-600">
                      {metrics ? Math.round(metrics.averageSeoScore) : 0}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      Avg SEO Score
                    </Text>
                  </View>
                  
                  <View className="items-center">
                    <Text className="text-2xl font-bold text-purple-600">
                      {metrics ? metrics.totalWordsWritten.toLocaleString() : 0}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      Words Written
                    </Text>
                  </View>
                </View>
              </GlassCard>
            </Animated.View>

            {/* Settings Sections */}
            {settingSections.map((section, sectionIndex) => (
              <Animated.View
                key={section.title}
                entering={SlideInUp.delay(300 + sectionIndex * 100)}
              >
                <GlassCard
                  intensity={20}
                  gradientColors={["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.7)"]}
                  borderRadius={16}
                  padding={20}
                >
                  <Text className="text-lg font-bold text-gray-900 mb-4">
                    {section.title}
                  </Text>
                  
                  <View className="space-y-2">
                    {section.items.map((item, index) => (
                      <View key={item.id}>
                        {renderSettingItem(item)}
                        {index < section.items.length - 1 && (
                          <View className="h-px bg-gray-200/50 ml-14 my-2" />
                        )}
                      </View>
                    ))}
                  </View>
                </GlassCard>
              </Animated.View>
            ))}

            {/* Footer */}
            <Animated.View entering={FadeIn.delay(800)} className="pb-12">
              <Text className="text-center text-gray-500 text-sm leading-relaxed px-4">
                SEO Blog Generator helps you create high-quality, optimized content that ranks well in search engines.
                {"\n\n"}
                Made with ❤️ for content creators
              </Text>
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