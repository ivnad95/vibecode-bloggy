import { getOpenAIClient } from "./openai";
import { SEOResearchData } from "./seo-research";
import { retryOpenAICall } from "../utils/retry";
import { logger } from "../utils/logger";

export interface BlogGenerationOptions {
  topic: string;
  researchData?: SEOResearchData;
  contentType?: "how-to" | "listicle" | "review" | "comparison" | "guide" | "news";
  targetAudience?: string;
  tone?: "professional" | "casual" | "friendly" | "authoritative" | "conversational";
  includeImages?: boolean;
  includeFAQ?: boolean;
  includeSchema?: boolean;
  wordCount?: number;
}

export interface GeneratedBlog {
  title: string;
  metaDescription: string;
  content: string;
  keywords: string[];
  headings: Array<{
    level: number;
    text: string;
    anchor: string;
  }>;
  faqSection?: Array<{
    question: string;
    answer: string;
  }>;
  schemaMarkup?: string;
  seoScore: number;
  readingTime: number;
  wordCount: number;
}

export async function generateSEOBlog(
  topic: string,
  options: Partial<BlogGenerationOptions> = {}
): Promise<string> {
  const enhancedBlog = await generateEnhancedSEOBlog({
    topic,
    ...options,
  } as BlogGenerationOptions);
  return enhancedBlog.content;
}

// In-memory cache and request coalescing for blog generation
const BLOG_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const blogCacheMem = new Map<string, { data: GeneratedBlog; expiresAt: number }>();
const inFlightBlogs = new Map<string, Promise<GeneratedBlog>>();

function blogKey(opts: BlogGenerationOptions) {
  const {
    topic,
    contentType = "guide",
    targetAudience = "general",
    tone = "conversational",
    includeFAQ = true,
    includeSchema = true,
    includeImages = false,
    wordCount = 2500,
  } = opts;
  return JSON.stringify({
    t: topic.trim().toLowerCase(),
    ct: contentType,
    ta: targetAudience,
    tn: tone,
    faq: includeFAQ,
    schema: includeSchema,
    img: includeImages,
    wc: wordCount,
  });
}

export async function generateEnhancedSEOBlog(
  options: BlogGenerationOptions
): Promise<GeneratedBlog> {
  const client = getOpenAIClient();
  const key = blogKey(options);

  // Cache check
  const cached = blogCacheMem.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  // Coalesce in-flight requests
  const flight = inFlightBlogs.get(key);
  if (flight) return flight;

  const {
    topic,
    researchData,
    contentType = "guide",
    targetAudience = "general audience",
    tone = "conversational",
    includeImages = false,
    includeFAQ = true,
    includeSchema = true,
    wordCount = 2500,
  } = options;

  // Build comprehensive prompt with research data
  let prompt = `You are an expert SEO content writer and digital marketing specialist with deep knowledge of Google's 2024-2025 ranking algorithms, E-E-A-T guidelines, and user experience signals.

Create a comprehensive, high-quality ${contentType} blog post that will rank well in search engines and drive traffic and conversions.

TOPIC: ${topic}
TARGET AUDIENCE: ${targetAudience}
TONE: ${tone}
WORD COUNT TARGET: ${wordCount}+ words

`;

  // Add research data if available
  if (researchData) {
    prompt += `SEO RESEARCH DATA:
Primary Keywords: ${researchData.primaryKeywords.map((k) => k.keyword).join(", ")}
Secondary Keywords: ${researchData.secondaryKeywords.map((k) => k.keyword).join(", ")}
Long-tail Keywords: ${researchData.longTailKeywords.map((k) => k.keyword).join(", ")}
Search Intent: ${researchData.searchIntent.primary}
People Also Ask: ${researchData.peopleAlsoAsk.map((p) => p.question).join(", ")}
Related Searches: ${researchData.relatedSearches.join(", ")}

`;
  }

  prompt += `MODERN SEO REQUIREMENTS (2024-2025):
1. E-E-A-T Optimization:
   - Demonstrate Experience through personal insights and real examples
   - Show Expertise with in-depth knowledge and technical accuracy
   - Build Authoritativeness with credible sources and data
   - Establish Trustworthiness with transparent, honest content

2. User Experience Signals:
   - Create scannable content with clear headings and bullet points
   - Use short paragraphs (2-3 sentences max)
   - Include transition words for better flow
   - Add internal linking opportunities
   - Optimize for featured snippets

3. Content Structure:
   - Compelling H1 title with primary keyword (under 60 characters)
   - Clear H2 and H3 subheadings with semantic keywords
   - Introduction that hooks readers and previews value
   - Body sections with actionable insights
   - Conclusion with clear next steps

4. Technical SEO Elements:
   - Meta description (150-160 characters) with primary keyword
   - Natural keyword integration (avoid stuffing)
   - Semantic keyword variations
   - Related entity mentions
   - Internal linking suggestions

${includeFAQ ? `5. FAQ Section:
   - Include 5-8 frequently asked questions
   - Base questions on "People Also Ask" data
   - Provide comprehensive answers (50-100 words each)
   - Optimize for voice search queries

` : ""}

${includeSchema ? `6. Schema Markup Suggestions:
   - Provide JSON-LD schema markup for the content type
   - Include Article, FAQ, and HowTo schemas as appropriate
   - Add breadcrumb and organization markup

` : ""}

${includeImages ? `7. Image Optimization:
   - Suggest 3-5 relevant images with descriptive alt text
   - Include image placement recommendations
   - Provide SEO-optimized file name suggestions

` : ""}

CONTENT REQUIREMENTS:
- Write ${wordCount}+ words of high-quality, original content
- Include statistics, examples, and case studies where relevant
- Add actionable tips and step-by-step instructions
- Use transition words and varied sentence structure
- Include a compelling call-to-action
- Optimize for readability (Flesch score 60+)
- Add value that competitors don't provide

FORMAT REQUIREMENTS:
Return a JSON object with the following structure:
{
  "title": "SEO-optimized title with primary keyword",
  "metaDescription": "Compelling meta description 150-160 characters",
  "content": "Full blog post content in markdown format",
  "keywords": ["array", "of", "target", "keywords"],
  "headings": [
    {
      "level": 1,
      "text": "Heading text",
      "anchor": "url-friendly-anchor"
    }
  ],
  ${includeFAQ ? `"faqSection": [
    {
      "question": "Question text",
      "answer": "Comprehensive answer"
    }
  ],` : ""}
  ${includeSchema ? `"schemaMarkup": "JSON-LD schema markup string",` : ""}
  "seoScore": 85,
  "readingTime": 12,
  "wordCount": 2500
}

Focus on creating content that genuinely helps users while satisfying search engine requirements. Prioritize user value over keyword density.`;

  const task = (async () => {
    // Dynamically calculate max_tokens based on the requested wordCount.
    const maxTokens = Math.min(Math.max(wordCount * 2, 4000), 16000);
    const response = await retryOpenAICall(() => client.chat.completions.create({
      model: "gpt-4o-2024-11-20",
      messages: [
        {
          role: "system",
          content:
            "You are an expert SEO content writer who creates high-converting, E-E-A-T optimized blog posts that rank well in Google's 2024-2025 algorithms. Always respond with valid JSON matching the requested structure.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    }));

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content generated");
    }

    try {
      // Try to parse the JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const blogData = JSON.parse(jsonMatch[0]) as GeneratedBlog;

      // Validate and ensure required fields
      if (!blogData.title || !blogData.content) {
        throw new Error("Invalid blog data structure");
      }

      // Calculate reading time if not provided
      if (!blogData.readingTime) {
        const words = blogData.content.split(/\s+/).length;
        blogData.readingTime = Math.ceil(words / 200); // 200 words per minute
      }

      // Calculate word count if not provided
      if (!blogData.wordCount) {
        blogData.wordCount = blogData.content
          .split(/\s+/)
          .filter((word) => word.length > 0).length;
      }

      return blogData;
    } catch (parseError) {
      logger.error("Failed to parse blog JSON:", parseError);
      // Return fallback structure with the raw content
      return createFallbackBlogData(topic, content);
    }
  })();

  inFlightBlogs.set(key, task);
  try {
    const result = await task;
    blogCacheMem.set(key, { data: result, expiresAt: Date.now() + BLOG_TTL_MS });
    return result;
  } finally {
    inFlightBlogs.delete(key);
  }
}

function createFallbackBlogData(topic: string, content: string): GeneratedBlog {
  const wordCount = content.split(/\s+/).filter((word) => word.length > 0).length;

  return {
    title: `The Complete Guide to ${topic}`,
    metaDescription: `Discover everything you need to know about ${topic}. Expert tips, strategies, and actionable insights to help you succeed.`,
    content: content,
    keywords: [
      topic.toLowerCase(),
      `${topic.toLowerCase()} guide`,
      `how to ${topic.toLowerCase()}`,
    ],
    headings: [
      {
        level: 1,
        text: `The Complete Guide to ${topic}`,
        anchor: "complete-guide",
      },
    ],
    faqSection: [
      {
        question: `What is ${topic}?`,
        answer:
          `${topic} is a comprehensive approach that involves multiple strategies and techniques to achieve optimal results.`,
      },
    ],
    seoScore: 75,
    readingTime: Math.ceil(wordCount / 200),
    wordCount: wordCount,
  };
}
