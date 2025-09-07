import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlogDraft, SEOAnalysis, ContentSuggestion } from "../types/blog";
import { SEOResearchData } from "../api/seo-research";

interface BlogState {
  // Current blog generation state
  currentTopic: string;
  currentResearch: SEOResearchData | null;
  currentDraft: BlogDraft | null;
  currentAnalysis: SEOAnalysis | null;
  currentSuggestions: ContentSuggestion[];
  
  // Generation state
  isGenerating: boolean;
  isResearching: boolean;
  isAnalyzing: boolean;
  generationProgress: number;
  
  // UI state
  showResearchPanel: boolean;
  showSuggestions: boolean;
  activeSection: string | null;
  
  // Actions
  setCurrentTopic: (topic: string) => void;
  setCurrentResearch: (research: SEOResearchData | null) => void;
  setCurrentDraft: (draft: BlogDraft | null) => void;
  setCurrentAnalysis: (analysis: SEOAnalysis | null) => void;
  setCurrentSuggestions: (suggestions: ContentSuggestion[]) => void;
  
  setIsGenerating: (generating: boolean) => void;
  setIsResearching: (researching: boolean) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setGenerationProgress: (progress: number) => void;
  
  setShowResearchPanel: (show: boolean) => void;
  setShowSuggestions: (show: boolean) => void;
  setActiveSection: (section: string | null) => void;
  
  // Draft management
  updateDraftContent: (content: string) => void;
  updateDraftTitle: (title: string) => void;
  updateDraftMetaDescription: (metaDescription: string) => void;
  addDraftTag: (tag: string) => void;
  removeDraftTag: (tag: string) => void;
  
  // Reset functions
  resetCurrentBlog: () => void;
  resetGenerationState: () => void;
}

const useBlogStore = create<BlogState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentTopic: "",
      currentResearch: null,
      currentDraft: null,
      currentAnalysis: null,
      currentSuggestions: [],
      
      isGenerating: false,
      isResearching: false,
      isAnalyzing: false,
      generationProgress: 0,
      
      showResearchPanel: false,
      showSuggestions: false,
      activeSection: null,
      
      // Actions
      setCurrentTopic: (topic) => set({ currentTopic: topic }),
      setCurrentResearch: (research) => set({ currentResearch: research }),
      setCurrentDraft: (draft) => set({ currentDraft: draft }),
      setCurrentAnalysis: (analysis) => set({ currentAnalysis: analysis }),
      setCurrentSuggestions: (suggestions) => set({ currentSuggestions: suggestions }),
      
      setIsGenerating: (generating) => set({ isGenerating: generating }),
      setIsResearching: (researching) => set({ isResearching: researching }),
      setIsAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
      setGenerationProgress: (progress) => set({ generationProgress: progress }),
      
      setShowResearchPanel: (show) => set({ showResearchPanel: show }),
      setShowSuggestions: (show) => set({ showSuggestions: show }),
      setActiveSection: (section) => set({ activeSection: section }),
      
      // Draft management
      updateDraftContent: (content) => {
        const { currentDraft } = get();
        if (currentDraft) {
          set({
            currentDraft: {
              ...currentDraft,
              content,
              lastSaved: new Date(),
              wordCount: content.split(/\s+/).filter(word => word.length > 0).length,
              readingTime: Math.ceil(content.split(/\s+/).length / 200), // 200 words per minute
            },
          });
        }
      },
      
      updateDraftTitle: (title) => {
        const { currentDraft } = get();
        if (currentDraft) {
          set({
            currentDraft: {
              ...currentDraft,
              title,
              lastSaved: new Date(),
            },
          });
        }
      },
      
      updateDraftMetaDescription: (metaDescription) => {
        const { currentDraft } = get();
        if (currentDraft) {
          set({
            currentDraft: {
              ...currentDraft,
              metaDescription,
              lastSaved: new Date(),
            },
          });
        }
      },
      
      addDraftTag: (tag) => {
        const { currentDraft } = get();
        if (currentDraft && !currentDraft.tags.includes(tag)) {
          set({
            currentDraft: {
              ...currentDraft,
              tags: [...currentDraft.tags, tag],
              lastSaved: new Date(),
            },
          });
        }
      },
      
      removeDraftTag: (tag) => {
        const { currentDraft } = get();
        if (currentDraft) {
          set({
            currentDraft: {
              ...currentDraft,
              tags: currentDraft.tags.filter(t => t !== tag),
              lastSaved: new Date(),
            },
          });
        }
      },
      
      // Reset functions
      resetCurrentBlog: () => set({
        currentTopic: "",
        currentResearch: null,
        currentDraft: null,
        currentAnalysis: null,
        currentSuggestions: [],
        activeSection: null,
      }),
      
      resetGenerationState: () => set({
        isGenerating: false,
        isResearching: false,
        isAnalyzing: false,
        generationProgress: 0,
      }),
    }),
    {
      name: "blog-store",
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist certain fields, not UI state
      partialize: (state) => ({
        currentTopic: state.currentTopic,
        currentResearch: state.currentResearch,
        currentDraft: state.currentDraft,
        currentAnalysis: state.currentAnalysis,
        currentSuggestions: state.currentSuggestions,
      }),
    }
  )
);

export default useBlogStore;