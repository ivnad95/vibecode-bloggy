import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlogPost, BlogMetrics } from "../types/blog";

interface HistoryState {
  // Blog history
  blogs: BlogPost[];
  favorites: string[];
  tags: string[];
  
  // Filters and search
  searchQuery: string;
  selectedTags: string[];
  sortBy: "date" | "title" | "seoScore" | "wordCount";
  sortOrder: "asc" | "desc";
  statusFilter: "all" | "draft" | "published" | "archived";
  
  // Pagination
  currentPage: number;
  itemsPerPage: number;
  
  // Metrics
  metrics: BlogMetrics | null;
  
  // Actions
  addBlog: (blog: BlogPost) => void;
  updateBlog: (id: string, updates: Partial<BlogPost>) => void;
  deleteBlog: (id: string) => void;
  duplicateBlog: (id: string) => void;
  
  toggleFavorite: (id: string) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  
  setSearchQuery: (query: string) => void;
  setSelectedTags: (tags: string[]) => void;
  setSortBy: (sortBy: "date" | "title" | "seoScore" | "wordCount") => void;
  setSortOrder: (order: "asc" | "desc") => void;
  setStatusFilter: (status: "all" | "draft" | "published" | "archived") => void;
  
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
  
  // Computed getters
  getFilteredBlogs: () => BlogPost[];
  getBlogById: (id: string) => BlogPost | undefined;
  getFavoriteBlogs: () => BlogPost[];
  getBlogsByTag: (tag: string) => BlogPost[];
  getRecentBlogs: (limit?: number) => BlogPost[];
  
  // Bulk operations
  bulkDelete: (ids: string[]) => void;
  bulkUpdateStatus: (ids: string[], status: BlogPost["status"]) => void;
  bulkAddTag: (ids: string[], tag: string) => void;
  
  // Analytics
  calculateMetrics: () => void;
  getTopKeywords: (limit?: number) => Array<{ keyword: string; count: number }>;
  getTopTopics: (limit?: number) => Array<{ topic: string; count: number }>;
  
  // Export/Import
  exportBlogs: (format: "json" | "csv" | "markdown") => string;
  importBlogs: (data: string, format: "json") => void;
  
  // Reset
  clearHistory: () => void;
  resetFilters: () => void;
}

const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      // Initial state
      blogs: [],
      favorites: [],
      tags: [],
      
      searchQuery: "",
      selectedTags: [],
      sortBy: "date",
      sortOrder: "desc",
      statusFilter: "all",
      
      currentPage: 1,
      itemsPerPage: 10,
      
      metrics: null,
      
      // Actions
      addBlog: (blog) => {
        const { blogs, tags } = get();
        const newTags = [...new Set([...tags, ...blog.tags])];
        set({
          blogs: [blog, ...blogs],
          tags: newTags,
        });
        get().calculateMetrics();
      },
      
      updateBlog: (id, updates) => {
        const { blogs } = get();
        const updatedBlogs = blogs.map(blog =>
          blog.id === id
            ? { ...blog, ...updates, updatedAt: new Date() }
            : blog
        );
        set({ blogs: updatedBlogs });
        get().calculateMetrics();
      },
      
      deleteBlog: (id) => {
        const { blogs, favorites } = get();
        set({
          blogs: blogs.filter(blog => blog.id !== id),
          favorites: favorites.filter(fav => fav !== id),
        });
        get().calculateMetrics();
      },
      
      duplicateBlog: (id) => {
        const { blogs } = get();
        const originalBlog = blogs.find(blog => blog.id === id);
        if (originalBlog) {
          const duplicatedBlog: BlogPost = {
            ...originalBlog,
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            title: `${originalBlog.title} (Copy)`,
            createdAt: new Date(),
            updatedAt: new Date(),
            status: "draft",
            version: 1,
          };
          get().addBlog(duplicatedBlog);
        }
      },
      
      toggleFavorite: (id) => {
        const { favorites } = get();
        const isFavorite = favorites.includes(id);
        set({
          favorites: isFavorite
            ? favorites.filter(fav => fav !== id)
            : [...favorites, id],
        });
        
        // Update the blog's favorite status
        get().updateBlog(id, { isFavorite: !isFavorite });
      },
      
      addTag: (tag) => {
        const { tags } = get();
        if (!tags.includes(tag)) {
          set({ tags: [...tags, tag] });
        }
      },
      
      removeTag: (tag) => {
        const { tags } = get();
        set({ tags: tags.filter(t => t !== tag) });
      },
      
      setSearchQuery: (query) => set({ searchQuery: query, currentPage: 1 }),
      setSelectedTags: (tags) => set({ selectedTags: tags, currentPage: 1 }),
      setSortBy: (sortBy) => set({ sortBy, currentPage: 1 }),
      setSortOrder: (order) => set({ sortOrder: order, currentPage: 1 }),
      setStatusFilter: (status) => set({ statusFilter: status, currentPage: 1 }),
      
      setCurrentPage: (page) => set({ currentPage: page }),
      setItemsPerPage: (items) => set({ itemsPerPage: items, currentPage: 1 }),
      
      // Computed getters
      getFilteredBlogs: () => {
        const { blogs, searchQuery, selectedTags, sortBy, sortOrder, statusFilter } = get();
        
        let filtered = blogs.filter(blog => {
          // Search filter
          const matchesSearch = !searchQuery || 
            blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            blog.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
            blog.content.toLowerCase().includes(searchQuery.toLowerCase());
          
          // Tag filter
          const matchesTags = selectedTags.length === 0 ||
            selectedTags.some(tag => blog.tags.includes(tag));
          
          // Status filter
          const matchesStatus = statusFilter === "all" || blog.status === statusFilter;
          
          return matchesSearch && matchesTags && matchesStatus;
        });
        
        // Sort
        filtered.sort((a, b) => {
          let comparison = 0;
          
          switch (sortBy) {
            case "date":
              comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
              break;
            case "title":
              comparison = a.title.localeCompare(b.title);
              break;
            case "seoScore":
              comparison = a.seoScore - b.seoScore;
              break;
            case "wordCount":
              comparison = a.wordCount - b.wordCount;
              break;
          }
          
          return sortOrder === "asc" ? comparison : -comparison;
        });
        
        return filtered;
      },
      
      getBlogById: (id) => {
        const { blogs } = get();
        return blogs.find(blog => blog.id === id);
      },
      
      getFavoriteBlogs: () => {
        const { blogs, favorites } = get();
        return blogs.filter(blog => favorites.includes(blog.id));
      },
      
      getBlogsByTag: (tag) => {
        const { blogs } = get();
        return blogs.filter(blog => blog.tags.includes(tag));
      },
      
      getRecentBlogs: (limit = 5) => {
        const { blogs } = get();
        return blogs
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit);
      },
      
      // Bulk operations
      bulkDelete: (ids) => {
        const { blogs, favorites } = get();
        set({
          blogs: blogs.filter(blog => !ids.includes(blog.id)),
          favorites: favorites.filter(fav => !ids.includes(fav)),
        });
        get().calculateMetrics();
      },
      
      bulkUpdateStatus: (ids, status) => {
        const { blogs } = get();
        const updatedBlogs = blogs.map(blog =>
          ids.includes(blog.id)
            ? { ...blog, status, updatedAt: new Date() }
            : blog
        );
        set({ blogs: updatedBlogs });
        get().calculateMetrics();
      },
      
      bulkAddTag: (ids, tag) => {
        const { blogs } = get();
        const updatedBlogs = blogs.map(blog =>
          ids.includes(blog.id)
            ? { ...blog, tags: [...new Set([...blog.tags, tag])], updatedAt: new Date() }
            : blog
        );
        set({ blogs: updatedBlogs });
        get().addTag(tag);
      },
      
      // Analytics
      calculateMetrics: () => {
        const { blogs } = get();
        
        if (blogs.length === 0) {
          set({ metrics: null });
          return;
        }
        
        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const metrics: BlogMetrics = {
          totalBlogs: blogs.length,
          averageSeoScore: blogs.reduce((sum, blog) => sum + blog.seoScore, 0) / blogs.length,
          averageWordCount: blogs.reduce((sum, blog) => sum + blog.wordCount, 0) / blogs.length,
          totalWordsWritten: blogs.reduce((sum, blog) => sum + blog.wordCount, 0),
          blogsThisMonth: blogs.filter(blog => new Date(blog.createdAt) >= thisMonth).length,
          favoriteBlogs: blogs.filter(blog => blog.isFavorite).length,
          topKeywords: get().getTopKeywords(10),
          topTopics: get().getTopTopics(10),
          scoreDistribution: {
            excellent: blogs.filter(blog => blog.seoScore >= 90).length,
            good: blogs.filter(blog => blog.seoScore >= 70 && blog.seoScore < 90).length,
            fair: blogs.filter(blog => blog.seoScore >= 50 && blog.seoScore < 70).length,
            poor: blogs.filter(blog => blog.seoScore < 50).length,
          },
        };
        
        set({ metrics });
      },
      
      getTopKeywords: (limit = 10) => {
        const { blogs } = get();
        const keywordCount: Record<string, number> = {};
        
        blogs.forEach(blog => {
          blog.keywords.forEach(keyword => {
            keywordCount[keyword] = (keywordCount[keyword] || 0) + 1;
          });
        });
        
        return Object.entries(keywordCount)
          .sort(([, a], [, b]) => b - a)
          .slice(0, limit)
          .map(([keyword, count]) => ({ keyword, count }));
      },
      
      getTopTopics: (limit = 10) => {
        const { blogs } = get();
        const topicCount: Record<string, number> = {};
        
        blogs.forEach(blog => {
          topicCount[blog.topic] = (topicCount[blog.topic] || 0) + 1;
        });
        
        return Object.entries(topicCount)
          .sort(([, a], [, b]) => b - a)
          .slice(0, limit)
          .map(([topic, count]) => ({ topic, count }));
      },
      
      // Export/Import
      exportBlogs: (format) => {
        const { blogs } = get();
        
        switch (format) {
          case "json":
            return JSON.stringify(blogs, null, 2);
          case "csv":
            const headers = ["Title", "Topic", "Status", "SEO Score", "Word Count", "Created At"];
            const rows = blogs.map(blog => [
              blog.title,
              blog.topic,
              blog.status,
              blog.seoScore.toString(),
              blog.wordCount.toString(),
              blog.createdAt.toISOString(),
            ]);
            return [headers, ...rows].map(row => row.join(",")).join("\n");
          case "markdown":
            return blogs.map(blog => `# ${blog.title}\n\n${blog.content}\n\n---\n`).join("\n");
          default:
            return JSON.stringify(blogs, null, 2);
        }
      },
      
      importBlogs: (data, format) => {
        try {
          if (format === "json") {
            const importedBlogs: BlogPost[] = JSON.parse(data);
            const { blogs } = get();
            
            // Merge with existing blogs, avoiding duplicates
            const existingIds = new Set(blogs.map(blog => blog.id));
            const newBlogs = importedBlogs.filter(blog => !existingIds.has(blog.id));
            
            set({ blogs: [...blogs, ...newBlogs] });
            get().calculateMetrics();
          }
        } catch (error) {
          console.error("Failed to import blogs:", error);
        }
      },
      
      // Reset
      clearHistory: () => {
        set({
          blogs: [],
          favorites: [],
          tags: [],
          metrics: null,
        });
      },
      
      resetFilters: () => {
        set({
          searchQuery: "",
          selectedTags: [],
          sortBy: "date",
          sortOrder: "desc",
          statusFilter: "all",
          currentPage: 1,
        });
      },
    }),
    {
      name: "history-store",
      storage: createJSONStorage(() => AsyncStorage),
      // Persist everything except UI state
      partialize: (state) => ({
        blogs: state.blogs,
        favorites: state.favorites,
        tags: state.tags,
        metrics: state.metrics,
      }),
    }
  )
);

export default useHistoryStore;