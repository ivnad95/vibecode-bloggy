import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SEOResearchData } from "../api/seo-research";
import { logger } from "../utils/logger";

interface SEOResearchHistory {
  id: string;
  topic: string;
  research: SEOResearchData;
  createdAt: Date;
  usedInBlogs: string[]; // Blog IDs that used this research
}

interface SEOState {
  // Research history
  researchHistory: SEOResearchHistory[];
  
  // Current research session
  currentResearchId: string | null;
  
  // Cached research data
  researchCache: Map<string, SEOResearchData>;
  
  // Analytics
  totalResearches: number;
  averageResearchScore: number;
  topResearchedTopics: Array<{ topic: string; count: number }>;
  
  // Actions
  addResearch: (topic: string, research: SEOResearchData) => string;
  getResearch: (id: string) => SEOResearchHistory | undefined;
  getResearchByTopic: (topic: string) => SEOResearchHistory | undefined;
  updateResearchUsage: (researchId: string, blogId: string) => void;
  deleteResearch: (id: string) => void;
  
  setCurrentResearchId: (id: string | null) => void;
  
  // Cache management
  getCachedResearch: (topic: string) => SEOResearchData | undefined;
  setCachedResearch: (topic: string, research: SEOResearchData) => void;
  clearCache: () => void;
  
  // Analytics
  calculateAnalytics: () => void;
  getTopKeywords: (limit?: number) => Array<{ keyword: string; count: number; avgScore: number }>;
  getResearchTrends: () => Array<{ date: string; count: number; avgScore: number }>;
  
  // Export/Import
  exportResearch: (format: "json" | "csv") => string;
  importResearch: (data: string, format: "json") => void;
  
  // Cleanup
  clearHistory: () => void;
  cleanupOldResearch: (daysOld: number) => void;
}

const useSEOStore = create<SEOState>()(
  persist(
    (set, get) => ({
      // Initial state
      researchHistory: [],
      currentResearchId: null,
      researchCache: new Map(),
      totalResearches: 0,
      averageResearchScore: 0,
      topResearchedTopics: [],
      
      // Actions
      addResearch: (topic, research) => {
        const id = `research-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        const newResearch: SEOResearchHistory = {
          id,
          topic,
          research,
          createdAt: new Date(),
          usedInBlogs: [],
        };
        
        const { researchHistory } = get();
        set({
          researchHistory: [newResearch, ...researchHistory],
          currentResearchId: id,
        });
        
        // Also cache it
        get().setCachedResearch(topic, research);
        get().calculateAnalytics();
        
        return id;
      },
      
      getResearch: (id) => {
        const { researchHistory } = get();
        return researchHistory.find(research => research.id === id);
      },
      
      getResearchByTopic: (topic) => {
        const { researchHistory } = get();
        return researchHistory.find(research => 
          research.topic.toLowerCase() === topic.toLowerCase()
        );
      },
      
      updateResearchUsage: (researchId, blogId) => {
        const { researchHistory } = get();
        const updatedHistory = researchHistory.map(research =>
          research.id === researchId
            ? {
                ...research,
                usedInBlogs: [...new Set([...research.usedInBlogs, blogId])],
              }
            : research
        );
        set({ researchHistory: updatedHistory });
      },
      
      deleteResearch: (id) => {
        const { researchHistory } = get();
        set({
          researchHistory: researchHistory.filter(research => research.id !== id),
          currentResearchId: get().currentResearchId === id ? null : get().currentResearchId,
        });
        get().calculateAnalytics();
      },
      
      setCurrentResearchId: (id) => set({ currentResearchId: id }),
      
      // Cache management
      getCachedResearch: (topic) => {
        const { researchCache } = get();
        return researchCache.get(topic.toLowerCase());
      },
      
      setCachedResearch: (topic, research) => {
        const { researchCache } = get();
        const newCache = new Map(researchCache);
        newCache.set(topic.toLowerCase(), research);
        set({ researchCache: newCache });
      },
      
      clearCache: () => {
        set({ researchCache: new Map() });
      },
      
      // Analytics
      calculateAnalytics: () => {
        const { researchHistory } = get();
        
        if (researchHistory.length === 0) {
          set({
            totalResearches: 0,
            averageResearchScore: 0,
            topResearchedTopics: [],
          });
          return;
        }
        
        const totalScore = researchHistory.reduce(
          (sum, research) => sum + research.research.seoScore.overall,
          0
        );
        
        const topicCount: Record<string, number> = {};
        researchHistory.forEach(research => {
          const topic = research.topic.toLowerCase();
          topicCount[topic] = (topicCount[topic] || 0) + 1;
        });
        
        const topTopics = Object.entries(topicCount)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([topic, count]) => ({ topic, count }));
        
        set({
          totalResearches: researchHistory.length,
          averageResearchScore: totalScore / researchHistory.length,
          topResearchedTopics: topTopics,
        });
      },
      
      getTopKeywords: (limit = 20) => {
        const { researchHistory } = get();
        const keywordData: Record<string, { count: number; totalScore: number }> = {};
        
        researchHistory.forEach(research => {
          const allKeywords = [
            ...research.research.primaryKeywords,
            ...research.research.secondaryKeywords,
            ...research.research.longTailKeywords,
          ];
          
          allKeywords.forEach(keywordObj => {
            const keyword = keywordObj.keyword.toLowerCase();
            if (!keywordData[keyword]) {
              keywordData[keyword] = { count: 0, totalScore: 0 };
            }
            keywordData[keyword].count += 1;
            keywordData[keyword].totalScore += keywordObj.relevanceScore;
          });
        });
        
        return Object.entries(keywordData)
          .map(([keyword, data]) => ({
            keyword,
            count: data.count,
            avgScore: data.totalScore / data.count,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, limit);
      },
      
      getResearchTrends: () => {
        const { researchHistory } = get();
        const trends: Record<string, { count: number; totalScore: number }> = {};
        
        researchHistory.forEach(research => {
          const date = new Date(research.createdAt).toISOString().split("T")[0];
          if (!trends[date]) {
            trends[date] = { count: 0, totalScore: 0 };
          }
          trends[date].count += 1;
          trends[date].totalScore += research.research.seoScore.overall;
        });
        
        return Object.entries(trends)
          .map(([date, data]) => ({
            date,
            count: data.count,
            avgScore: data.totalScore / data.count,
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      },
      
      // Export/Import
      exportResearch: (format) => {
        const { researchHistory } = get();
        
        switch (format) {
          case "json":
            return JSON.stringify(researchHistory, null, 2);
          case "csv":
            const headers = [
              "Topic",
              "Created At",
              "SEO Score",
              "Primary Keywords",
              "Used in Blogs",
            ];
            const rows = researchHistory.map(research => [
              research.topic,
              new Date(research.createdAt as unknown as string).toISOString(),
              research.research.seoScore.overall.toString(),
              research.research.primaryKeywords.map(k => k.keyword).join("; "),
              research.usedInBlogs.length.toString(),
            ]);
            return [headers, ...rows].map(row => row.join(",")).join("\n");
          default:
            return JSON.stringify(researchHistory, null, 2);
        }
      },
      
      importResearch: (data, format) => {
        try {
          if (format === "json") {
            const importedResearch: SEOResearchHistory[] = JSON.parse(data);
            const { researchHistory } = get();
            
            // Merge with existing research, avoiding duplicates
            const existingIds = new Set(researchHistory.map(research => research.id));
            const newResearch = importedResearch.filter(research => !existingIds.has(research.id));
            
            set({ researchHistory: [...researchHistory, ...newResearch] });
            get().calculateAnalytics();
          }
        } catch (error) {
          logger.error("Failed to import research:", error);
        }
      },
      
      // Cleanup
      clearHistory: () => {
        set({
          researchHistory: [],
          currentResearchId: null,
          totalResearches: 0,
          averageResearchScore: 0,
          topResearchedTopics: [],
        });
        get().clearCache();
      },
      
      cleanupOldResearch: (daysOld) => {
        const { researchHistory } = get();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        
        const filteredHistory = researchHistory.filter(
          research => new Date(research.createdAt) > cutoffDate
        );
        
        set({ researchHistory: filteredHistory });
        get().calculateAnalytics();
      },
    }),
    {
      name: "seo-store",
      storage: createJSONStorage(() => AsyncStorage),

      // Persist most data except current session state
      partialize: (state) => ({
        researchHistory: state.researchHistory,
        totalResearches: state.totalResearches,
        averageResearchScore: state.averageResearchScore,
        topResearchedTopics: state.topResearchedTopics,
      }),
    }
  )
);

export default useSEOStore;