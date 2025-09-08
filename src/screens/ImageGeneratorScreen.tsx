import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Sharing from "expo-sharing";
import Animated, {
  FadeIn,
  SlideInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

import { HomeStackParamList } from "../navigation/AppNavigator";
import { generateImage } from "../api/image-generation";

// UI Components
import GradientBackground from "../components/ui/GradientBackground";
import GlassCard from "../components/ui/GlassCard";
import GlassButton from "../components/ui/GlassButton";
import GlassInput from "../components/ui/GlassInput";
import ProgressIndicator from "../components/ui/ProgressIndicator";
import GlassModal from "../components/ui/GlassModal";

type ImageGeneratorScreenNavigationProp = NativeStackNavigationProp<
  HomeStackParamList,
  "ImageGenerator"
>;

type ImageGeneratorScreenRouteProp = RouteProp<HomeStackParamList, "ImageGenerator">;

interface Props {
  navigation: ImageGeneratorScreenNavigationProp;
  route: ImageGeneratorScreenRouteProp;
}

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  style: string;
  size: string;
  createdAt: Date;
}

export default function ImageGeneratorScreen({ route }: Props) {
  const { topic } = route.params || {};
  
  // State
  const [prompt, setPrompt] = useState(topic ? `Professional blog header image for "${topic}"` : "");
  const [selectedStyle, setSelectedStyle] = useState("professional");
  const [selectedSize, setSelectedSize] = useState("1536x1024");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"info" | "warn" | "destructive">("info");
  const [modalActions, setModalActions] = useState<{ label: string; onPress: () => void; variant?: "primary" | "secondary" | "destructive" }[]>([]);

  // Animations
  const imageScale = useSharedValue(1);

  const showModal = (title: string, message: string, type: "info" | "warn" | "destructive" = "info") => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalActions([{ label: "OK", onPress: () => setModalVisible(false), variant: "primary" }]);
    setModalVisible(true);
  };

  const imageAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: imageScale.value }],
  }));

  // Image styles
  const imageStyles = [
    { key: "professional", label: "Professional", description: "Clean, business-focused imagery" },
    { key: "creative", label: "Creative", description: "Artistic and imaginative visuals" },
    { key: "minimalist", label: "Minimalist", description: "Simple, clean design" },
    { key: "vibrant", label: "Vibrant", description: "Bold colors and dynamic composition" },
    { key: "illustration", label: "Illustration", description: "Hand-drawn or digital art style" },
    { key: "photography", label: "Photography", description: "Realistic photographic style" },
  ];

  const imageSizes = [
    { key: "1024x1024", label: "Square (1:1)", description: "Perfect for social media" },
    { key: "1536x1024", label: "Landscape (3:2)", description: "Great for blog headers" },
    { key: "1024x1536", label: "Portrait (2:3)", description: "Ideal for mobile content" },
  ];

  // Prompt suggestions
  const promptSuggestions = [
    "Professional blog header with modern design elements",
    "Abstract background representing innovation and technology",
    "Minimalist illustration of productivity and success",
    "Creative workspace with laptop and coffee",
    "Digital marketing concept with charts and graphs",
    "Team collaboration in modern office environment",
  ];

  // Handlers
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      showModal("Missing Prompt", "Please enter a description for your image.", "warn");
      return;
    }

    setIsGenerating(true);

    try {
      const enhancedPrompt = `${prompt}, ${selectedStyle} style, high quality, detailed, professional`;
      
      const imageUrl = await generateImage(enhancedPrompt, {
        size: selectedSize as any,
        quality: "high",
        format: "png",
      });

      const newImage: GeneratedImage = {
        id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        url: imageUrl,
        prompt: prompt.trim(),
        style: selectedStyle,
        size: selectedSize,
        createdAt: new Date(),
      };

      setGeneratedImages(prev => [newImage, ...prev]);
      setSelectedImage(newImage);
      
      showModal("Success", "Your image has been generated successfully!");
    } catch (error) {
      let errorMessage = "Failed to generate image. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes("network")) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else if (error.message.includes("quota") || error.message.includes("limit")) {
          errorMessage = "Generation limit reached. Please try again later.";
        } else if (error.message.includes("content")) {
          errorMessage = "Content policy violation. Please modify your prompt and try again.";
        }
      }
      
      showModal("Generation Failed", errorMessage, "destructive");
      console.error("Image generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImagePress = (image: GeneratedImage) => {
    setSelectedImage(image);
    imageScale.value = withSpring(0.95, {}, () => {
      imageScale.value = withSpring(1);
    });
  };

  const handleCopyPrompt = async (prompt: string) => {
    await Clipboard.setStringAsync(prompt);
    showModal("Copied", "Prompt copied to clipboard!");
  };

  const handleShareImage = async (image: GeneratedImage) => {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(image.url, {
          mimeType: "image/png",
          dialogTitle: "Share Generated Image",
        });
        showModal("Shared", "Image shared successfully!");
      } else {
        showModal("Sharing not available", "Sharing is not available on this device.", "warn");
      }
    } catch (error) {
      let errorMessage = "Failed to share image.";
      
      if (error instanceof Error) {
        if (error.message.includes("cancelled")) {
          return; // User cancelled, don't show error
        } else if (error.message.includes("network")) {
          errorMessage = "Network error. Please check your connection and try again.";
        }
      }
      
      showModal("Share Failed", errorMessage, "destructive");
    }
  };

  const handleUsePromptSuggestion = (suggestion: string) => {
    setPrompt(suggestion);
  };

  return (
    <GradientBackground variant="primary" animated>
      <SafeAreaView className="flex-1">
        {/* Header */}
        <Animated.View entering={FadeIn.delay(200)} className="px-6 pt-4 pb-2">
          <Text className="text-2xl font-bold text-white mb-1">
            AI Image Generator
          </Text>
          <Text className="text-white/80">
            {topic ? `Creating images for "${topic}"` : "Generate custom images for your content"}
          </Text>
        </Animated.View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View className="px-6 space-y-8">
            {/* Image Prompt */}
            <Animated.View entering={SlideInUp.delay(300)}>
              <GlassInput
                label="Image Description"
                value={prompt}
                onChangeText={setPrompt}
                placeholder="Describe the image you want to generate..."
                variant="floating"
                multiline
                numberOfLines={3}
                leftIcon="image-outline"
              />
            </Animated.View>

            {/* Prompt Suggestions */}
            <Animated.View entering={SlideInUp.delay(400)}>
              <GlassCard
                intensity={25}
                gradientColors={["rgba(255, 255, 255, 0.25)", "rgba(255, 255, 255, 0.1)"]}
                borderRadius={16}
                padding={16}
              >
                <Text className="text-lg font-semibold text-white mb-4">
                  Prompt Suggestions
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row space-x-4">
                    {promptSuggestions.map((suggestion, index) => (
                      <Pressable
                        key={index}
                        onPress={() => handleUsePromptSuggestion(suggestion)}
                        className="bg-white/20 rounded-lg px-4 py-2 min-w-[200px]"
                      >
                        <Text className="text-white text-sm" numberOfLines={2}>
                          {suggestion}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </GlassCard>
            </Animated.View>

            {/* Style Selection */}
            <Animated.View entering={SlideInUp.delay(500)}>
              <GlassCard
                intensity={25}
                gradientColors={["rgba(255, 255, 255, 0.25)", "rgba(255, 255, 255, 0.1)"]}
                borderRadius={16}
                padding={16}
              >
                <Text className="text-lg font-semibold text-white mb-4">
                  Image Style
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {imageStyles.map((style) => (
                    <Pressable
                      key={style.key}
                      onPress={() => setSelectedStyle(style.key)}
                      className={`rounded-lg px-3 py-2 ${
                        selectedStyle === style.key
                          ? "bg-blue-500/50 border border-blue-300"
                          : "bg-white/20"
                      }`}
                    >
                      <Text className="text-white text-sm font-medium">
                        {style.label}
                      </Text>
                      <Text className="text-white/70 text-xs">
                        {style.description}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </GlassCard>
            </Animated.View>

            {/* Size Selection */}
            <Animated.View entering={SlideInUp.delay(600)}>
              <GlassCard
                intensity={25}
                gradientColors={["rgba(255, 255, 255, 0.25)", "rgba(255, 255, 255, 0.1)"]}
                borderRadius={16}
                padding={16}
              >
                <Text className="text-lg font-semibold text-white mb-4">
                  Image Size
                </Text>
                <View className="space-y-3">
                  {imageSizes.map((size) => (
                    <Pressable
                      key={size.key}
                      onPress={() => setSelectedSize(size.key)}
                      className={`rounded-lg p-3 flex-row items-center justify-between ${
                        selectedSize === size.key
                          ? "bg-blue-500/50 border border-blue-300"
                          : "bg-white/20"
                      }`}
                    >
                      <View>
                        <Text className="text-white font-medium">
                          {size.label}
                        </Text>
                        <Text className="text-white/70 text-sm">
                          {size.description}
                        </Text>
                      </View>
                      {selectedSize === size.key && (
                        <Ionicons name="checkmark-circle" size={20} color="white" />
                      )}
                    </Pressable>
                  ))}
                </View>
              </GlassCard>
            </Animated.View>

            {/* Generate Button */}
            <Animated.View entering={SlideInUp.delay(700)}>
              <GlassButton
                title={isGenerating ? "Generating..." : "Generate Image"}
                onPress={handleGenerate}
                loading={isGenerating}
                disabled={!prompt.trim()}
                variant="primary"
                size="large"
                fullWidth
                icon="sparkles"
                gradientColors={["rgba(59, 130, 246, 0.9)", "rgba(147, 51, 234, 0.9)"]}
              />
            </Animated.View>

            {/* Generation Progress */}
            {isGenerating && (
              <Animated.View entering={FadeIn} className="px-4">
                <GlassCard
                  intensity={25}
                  gradientColors={["rgba(255, 255, 255, 0.25)", "rgba(255, 255, 255, 0.1)"]}
                  borderRadius={16}
                  padding={20}
                >
                  <ProgressIndicator
                    progress={75}
                    title="Generating Your Image"
                    subtitle="This may take a few moments..."
                    variant="linear"
                    color="blue"
                    animated
                  />
                </GlassCard>
              </Animated.View>
            )}

            {/* Selected Image Preview */}
            {selectedImage && (
              <Animated.View entering={SlideInUp.delay(300)} style={imageAnimatedStyle}>
                <GlassCard
                  intensity={25}
                  gradientColors={["rgba(255, 255, 255, 0.95)", "rgba(255, 255, 255, 0.8)"]}
                  borderRadius={16}
                  padding={16}
                >
                  <Text className="text-lg font-bold text-gray-900 mb-4">
                    Generated Image
                  </Text>
                  
                  <Animated.View style={imageAnimatedStyle}>
                    <Image
                      source={{ uri: selectedImage.url }}
                      style={{
                        width: "100%",
                        height: 240,
                        borderRadius: 12,
                        marginBottom: 16,
                      }}
                      resizeMode="cover"
                    />
                  </Animated.View>
                  
                  <View className="space-y-3 mb-5">
                    <Text className="text-gray-700 text-sm">
                      <Text className="font-semibold">Prompt:</Text> {selectedImage.prompt}
                    </Text>
                    <Text className="text-gray-700 text-sm">
                      <Text className="font-semibold">Style:</Text> {selectedImage.style}
                    </Text>
                    <Text className="text-gray-700 text-sm">
                      <Text className="font-semibold">Size:</Text> {selectedImage.size}
                    </Text>
                  </View>

                  <View className="flex-row space-x-3">
                    <View className="flex-1">
                      <GlassButton
                        title="Copy Prompt"
                        onPress={() => handleCopyPrompt(selectedImage.prompt)}
                        variant="secondary"
                        size="small"
                        fullWidth
                        icon="copy-outline"
                      />
                    </View>
                    <View className="flex-1">
                      <GlassButton
                        title="Share"
                        onPress={() => handleShareImage(selectedImage)}
                        variant="secondary"
                        size="small"
                        fullWidth
                        icon="share-outline"
                      />
                    </View>
                  </View>
                </GlassCard>
              </Animated.View>
            )}

            {/* Generated Images Gallery */}
            {generatedImages.length > 1 && (
              <Animated.View entering={SlideInUp.delay(800)}>
                <GlassCard
                  intensity={25}
                  gradientColors={["rgba(255, 255, 255, 0.25)", "rgba(255, 255, 255, 0.1)"]}
                  borderRadius={16}
                  padding={16}
                >
                  <Text className="text-lg font-semibold text-white mb-4">
                    Recent Images ({generatedImages.length})
                  </Text>
                  
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingRight: 24 }}
                  >
                    <View className="flex-row space-x-4">
                      {generatedImages.map((image, index) => (
                        <Animated.View
                          key={image.id}
                          entering={SlideInUp.delay(900 + index * 100)}
                        >
                          <Pressable
                            onPress={() => handleImagePress(image)}
                            className={`rounded-lg overflow-hidden ${
                              selectedImage?.id === image.id ? "border-2 border-blue-400" : "border border-white/20"
                            }`}
                          >
                            <Image
                              source={{ uri: image.url }}
                              style={{ width: 140, height: 100 }}
                              resizeMode="cover"
                            />
                            <View className="absolute bottom-0 left-0 right-0 bg-black/60 p-2">
                              <Text className="text-white text-xs font-medium" numberOfLines={1}>
                                {image.style}
                              </Text>
                            </View>
                          </Pressable>
                        </Animated.View>
                      ))}
                    </View>
                  </ScrollView>
                </GlassCard>
              </Animated.View>
            )}

            {/* Tips */}
            <Animated.View entering={SlideInUp.delay(900)} className="pb-8">
              <GlassCard
                intensity={20}
                gradientColors={["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.7)"]}
                borderRadius={16}
                padding={16}
              >
                <Text className="text-lg font-semibold text-gray-900 mb-4">
                  💡 Tips for Better Images
                </Text>
                
                <View className="space-y-3">
                  <Text className="text-gray-700 text-sm">
                    • Be specific about colors, mood, and composition
                  </Text>
                  <Text className="text-gray-700 text-sm">
                    • Include style keywords like "modern", "minimalist", or "vibrant"
                  </Text>
                  <Text className="text-gray-700 text-sm">
                    • Mention the intended use (blog header, social media, etc.)
                  </Text>
                  <Text className="text-gray-700 text-sm">
                    • Try different styles to find what works best for your content
                  </Text>
                </View>
              </GlassCard>
            </Animated.View>
          </View>
        </ScrollView>
        
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