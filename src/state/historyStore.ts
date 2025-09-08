import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlogPost, BlogMetrics } from "../types/blog";
// Added imports for offline queue processing
import { conductSEOResearch, SEOResearchData } from "../api/seo-research";
import { generateEnhancedSEOBlog } from "../api/blog-generator";
import { networkService } from "../utils/network";

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
  
  // Offline queue
  queuedTasks: QueuedTask[];
  enqueueTask: (task: Omit<QueuedTask, "id" | "attempts">) => void;
  removeTask: (id: string) => void;
  processQueue: () => Promise<void>;
  
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

// New queued task type
export type QueuedTask = {
  id: string;
  topic: string;
  withResearch: boolean;
  options?: {
    wordCount?: number;
    includeFAQ?: boolean;
    includeSchema?: boolean;
    tone?: string;
    contentType?: string;
  };
  attempts: number;
};

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
      
      // Offline queue
      queuedTasks: [],
      enqueueTask: (task) => {
        const newTask: QueuedTask = {
          id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
          topic: task.topic,
          withResearch: task.withResearch,
          options: task.options,
          attempts: 0,
        };
        set((state) => ({ queuedTasks: [...state.queuedTasks, newTask] }));
      },
      removeTask: (id) => set((state) => ({ queuedTasks: state.queuedTasks.filter(t => t.id !== id) })),
      processQueue: async () => {
        const { queuedTasks } = get();
        if (!networkService.isOnline() || queuedTasks.length === 0) return;
        
        while (networkService.isOnline() && get().queuedTasks.length > 0) {
          const task = get().queuedTasks[0];
          try {
            let researchData: SEOResearchData | undefined = undefined;
            if (task.withResearch) {
              const research = await conductSEOResearch(task.topic);
              researchData = research;
            }
            const blogData = await generateEnhancedSEOBlog({
              topic: task.topic,
              researchData,
              contentType: (task.options?.contentType as any) ?? "guide",
              tone: (task.options?.tone as any) ?? "conversational",
              includeFAQ: task.options?.includeFAQ ?? true,
              includeSchema: task.options?.includeSchema ?? true,
              wordCount: task.options?.wordCount ?? 2500,
            });

            const blogPost: BlogPost = {
              id: `blog-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
              title: blogData.title,
              content: blogData.content,
              topic: task.topic,
              metaDescription: blogData.metaDescription,
              keywords: blogData.keywords,
              createdAt: new Date(),
              updatedAt: new Date(),
              status: "draft",
              seoScore: blogData.seoScore,
              wordCount: blogData.wordCount,
              readingTime: blogData.readingTime,
              tags: [],
              isFavorite: false,
              version: 1,
            };
            get().addBlog(blogPost);

            // remove processed task
            set((state) => ({ queuedTasks: state.queuedTasks.slice(1) }));
          } catch (err) {
            // Increment attempts and decide whether to keep or drop
            set((state) => ({
              queuedTasks: state.queuedTasks.map((t, idx) =>
                idx === 0 ? { ...t, attempts: t.attempts + 1 } : t
              ),
            }));
            const attempts = get().queuedTasks[0]?.attempts ?? 0;
            if (attempts >= 3) {
              // Drop the task after 3 failed attempts
              set((state) => ({ queuedTasks: state.queuedTasks.slice(1) }));
            } else {
              // Break to retry later when conditions improve
              break;
            }
          }
        }
      },

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
          ids.includes(blog.id) ? { ...blog, status, updatedAt: new Date() } : blog
        );
        set({ blogs: updatedBlogs });
        get().calculateMetrics();
      },
      
      bulkAddTag: (ids, tag) => {
        const { blogs } = get();
        const updatedBlogs = blogs.map(blog =>
          ids.includes(blog.id) ? { ...blog, tags: [...new Set([...blog.tags, tag])], updatedAt: new Date() } : blog
        );
        set({ blogs: updatedBlogs });
        get().calculateMetrics();
      },
      
      // Analytics
      calculateMetrics: () => {
         const { blogs } = get();
         const totalBlogs = blogs.length;
         const averageSeoScore = totalBlogs > 0 ? blogs.reduce((sum, blog) => sum + blog.seoScore, 0) / totalBlogs : 0;
         const averageWordCount = totalBlogs > 0 ? blogs.reduce((sum, blog) => sum + blog.wordCount, 0) / totalBlogs : 0;
         const totalWordsWritten = blogs.reduce((sum, blog) => sum + blog.wordCount, 0);
         
         set({
           metrics: {
             totalBlogs,
             averageSeoScore,
             averageWordCount,
             totalWordsWritten,
             blogsThisMonth: blogs.filter(b => new Date(b.createdAt).getMonth() === new Date().getMonth()).length,
             favoriteBlogs: blogs.filter(b => b.isFavorite).length,
             topKeywords: get().getTopKeywords(5),
             topTopics: get().getTopTopics(5),
             scoreDistribution: {
               excellent: blogs.filter(b => b.seoScore >= 90).length,
               good: blogs.filter(b => b.seoScore >= 70 && b.seoScore < 90).length,
               fair: blogs.filter(b => b.seoScore >= 50 && b.seoScore < 70).length,
               poor: blogs.filter(b => b.seoScore < 50).length,
             }
           }
         });
       },
      
      getTopKeywords: (limit = 10) => {
        const { blogs } = get();
        const keywordCount = new Map<string, number>();
        blogs.forEach(blog => {
          blog.keywords.forEach(keyword => {
            keywordCount.set(keyword, (keywordCount.get(keyword) || 0) + 1);
          });
        });
        return Array.from(keywordCount.entries())
          .map(([keyword, count]) => ({ keyword, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, limit);
      },
      
      getTopTopics: (limit = 10) => {
        const { blogs } = get();
        const topicCount = new Map<string, number>();
        blogs.forEach(blog => {
          topicCount.set(blog.topic, (topicCount.get(blog.topic) || 0) + 1);
        });
        return Array.from(topicCount.entries())
          .map(([topic, count]) => ({ topic, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, limit);
      },
      
      // Export/Import
      exportBlogs: (format) => {
        const { blogs } = get();
        if (format === 'json') {
          return JSON.stringify(blogs, null, 2);
        }
        // Add CSV and markdown export logic as needed
        return JSON.stringify(blogs);
      },
      
      importBlogs: (data, format) => {
        if (format === 'json') {
          try {
            const importedBlogs = JSON.parse(data);
            set(state => ({ blogs: [...state.blogs, ...importedBlogs] }));
            get().calculateMetrics();
          } catch (error) {
            console.error('Failed to import blogs:', error);
          }
        }
      },
      
      // Reset
      clearHistory: () => {
        set({ blogs: [], favorites: [], tags: [], metrics: null });
      },
      
      resetFilters: () => {
        set({
          searchQuery: '',
          selectedTags: [],
          sortBy: 'date',
          sortOrder: 'desc',
          statusFilter: 'all',
          currentPage: 1,
        });
      }
    }),
    {
      name: "history-store",
      storage: createJSONStorage(() => AsyncStorage),
      // Persist essential fields including queue
      partialize: (state) => ({
        blogs: state.blogs,
        favorites: state.favorites,
        tags: state.tags,
        metrics: state.metrics,
        queuedTasks: state.queuedTasks,
      }),
    }
  )
);

export default useHistoryStore;