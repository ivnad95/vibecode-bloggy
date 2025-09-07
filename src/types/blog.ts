export interface BlogPost {
  id: string;
  title: string;
  content: string;
  topic: string;
  metaDescription: string;
  keywords: string[];
  createdAt: Date;
  updatedAt: Date;
  status: "draft" | "published" | "archived";
  seoScore: number;
  wordCount: number;
  readingTime: number;
  featuredImage?: string;
  tags: string[];
  isFavorite: boolean;
  version: number;
  generationData?: {
    researchId: string;
    generationTime: number;
    model: string;
    prompt: string;
  };
}

export interface BlogDraft extends Omit<BlogPost, "id" | "createdAt" | "updatedAt"> {
  id?: string;
  lastSaved?: Date;
  autoSaveEnabled: boolean;
}

export interface BlogTemplate {
  id: string;
  name: string;
  description: string;
  structure: {
    sections: Array<{
      title: string;
      type: "heading" | "paragraph" | "list" | "faq" | "cta";
      content?: string;
      placeholder?: string;
    }>;
  };
  category: string;
  tags: string[];
  isCustom: boolean;
}

export interface SEOAnalysis {
  score: number;
  issues: Array<{
    type: "error" | "warning" | "suggestion";
    message: string;
    section?: string;
  }>;
  keywords: {
    primary: { keyword: string; density: number; occurrences: number };
    secondary: Array<{ keyword: string; density: number; occurrences: number }>;
  };
  readability: {
    score: number;
    level: string;
    avgSentenceLength: number;
    avgWordsPerSentence: number;
  };
  structure: {
    hasH1: boolean;
    h2Count: number;
    h3Count: number;
    paragraphCount: number;
    listCount: number;
  };
}

export interface ContentSuggestion {
  id: string;
  type: "keyword" | "structure" | "content" | "readability";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  effort: "easy" | "medium" | "hard";
  section?: string;
  suggestedChange?: string;
}

export interface BlogMetrics {
  totalBlogs: number;
  averageSeoScore: number;
  averageWordCount: number;
  totalWordsWritten: number;
  blogsThisMonth: number;
  favoriteBlogs: number;
  topKeywords: Array<{ keyword: string; count: number }>;
  topTopics: Array<{ topic: string; count: number }>;
  scoreDistribution: {
    excellent: number; // 90-100
    good: number; // 70-89
    fair: number; // 50-69
    poor: number; // 0-49
  };
}