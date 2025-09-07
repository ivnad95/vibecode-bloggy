import { getOpenAIClient } from "./openai";

export interface SEOKeyword {
  keyword: string;
  searchVolume: "high" | "medium" | "low";
  difficulty: "easy" | "medium" | "hard";
  intent: "informational" | "commercial" | "transactional" | "navigational";
  relevanceScore: number;
}

export interface PeopleAlsoAsk {
  question: string;
  suggestedAnswer: string;
  relatedKeywords: string[];
}

export interface ContentGap {
  topic: string;
  opportunity: string;
  priority: "high" | "medium" | "low";
}

export interface SEOResearchData {
  primaryKeywords: SEOKeyword[];
  secondaryKeywords: SEOKeyword[];
  longTailKeywords: SEOKeyword[];
  peopleAlsoAsk: PeopleAlsoAsk[];
  relatedSearches: string[];
  contentGaps: ContentGap[];
  searchIntent: {
    primary: "informational" | "commercial" | "transactional" | "navigational";
    confidence: number;
    reasoning: string;
  };
  competitorInsights: {
    commonTopics: string[];
    missingAngles: string[];
    contentLength: { min: number; max: number; recommended: number };
  };
  seoScore: {
    keywordOptimization: number;
    contentStructure: number;
    userIntent: number;
    overall: number;
  };
}

// In-memory cache and request coalescing to minimize API calls
const RESEARCH_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const researchCacheMem = new Map<string, { data: SEOResearchData; expiresAt: number }>();
const inFlightResearch = new Map<string, Promise<SEOResearchData>>();

function normalizeTopic(t: string) {
  return t.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function conductSEOResearch(topic: string): Promise<SEOResearchData> {
  const client = getOpenAIClient();
  const key = normalizeTopic(topic);

  // Memory cache check
  const cached = researchCacheMem.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  // In-flight coalescing
  const flight = inFlightResearch.get(key);
  if (flight) return flight;

  const task = (async () => {
    const prompt = `You are an expert SEO researcher and digital marketing strategist. Conduct comprehensive SEO research for the following topic and provide detailed insights.

Topic: "${topic}"

Please analyze and provide:

1. PRIMARY KEYWORDS (3-5 main keywords):
   - High search volume, medium to high difficulty
   - Direct relevance to the topic
   - Include search volume estimate, difficulty, and intent

2. SECONDARY KEYWORDS (5-8 supporting keywords):
   - Medium search volume, varied difficulty
   - Support the primary keywords
   - Include semantic variations

3. LONG-TAIL KEYWORDS (8-12 specific phrases):
   - Lower search volume but higher conversion potential
   - Question-based and specific phrases
   - Less competitive, easier to rank

4. PEOPLE ALSO ASK (6-10 questions):
   - Common questions users search for
   - Provide suggested answers (2-3 sentences each)
   - Include related keywords for each question

5. RELATED SEARCHES (10-15 terms):
   - Terms users search for after the main topic
   - Semantic variations and related concepts

6. CONTENT GAPS (3-5 opportunities):
   - Underserved topics in the niche
   - Opportunities for unique angles
   - Priority level for each gap

7. SEARCH INTENT ANALYSIS:
   - Primary intent classification
   - Confidence level (0-100)
   - Reasoning for the classification

8. COMPETITOR INSIGHTS:
   - Common topics competitors cover
   - Missing angles or unique opportunities
   - Recommended content length range

9. SEO SCORING (0-100 for each):
   - Keyword optimization potential
   - Content structure opportunities
   - User intent alignment
   - Overall SEO potential

Format your response as a detailed JSON object that matches the TypeScript interfaces. Be specific and actionable in your recommendations. Focus on 2024-2025 SEO best practices including E-E-A-T, user experience signals, and semantic search optimization.`;

    try {
      const response = await client.chat.completions.create({
        model: "gpt-4o-2024-11-20",
        messages: [
          {
            role: "system",
            content: "You are an expert SEO researcher who provides comprehensive, actionable SEO insights based on current Google algorithm requirements and best practices. Always respond with valid JSON that matches the requested TypeScript interfaces."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.3,
      });
  
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No SEO research data generated");
      }
  
      try {
        // Try to parse the JSON response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No JSON found in response");
        }
        
        const researchData = JSON.parse(jsonMatch[0]) as SEOResearchData;
        return researchData;
      } catch (parseError) {
        console.error("Failed to parse SEO research JSON:", parseError);
        // Return fallback data structure
        return createFallbackSEOData(topic);
      }
    } catch (error) {
      console.error("Error conducting SEO research:", error);
      throw new Error("Failed to conduct SEO research");
    }
  })();

  inFlightResearch.set(key, task);
  try {
    const result = await task;
    researchCacheMem.set(key, { data: result, expiresAt: Date.now() + RESEARCH_TTL_MS });
    return result;
  } finally {
    inFlightResearch.delete(key);
  }
}

function createFallbackSEOData(topic: string): SEOResearchData {
  return {
    primaryKeywords: [
      {
        keyword: topic.toLowerCase(),
        searchVolume: "medium",
        difficulty: "medium",
        intent: "informational",
        relevanceScore: 95
      }
    ],
    secondaryKeywords: [
      {
        keyword: `${topic.toLowerCase()} guide`,
        searchVolume: "medium",
        difficulty: "medium",
        intent: "informational",
        relevanceScore: 85
      },
      {
        keyword: `best ${topic.toLowerCase()}`,
        searchVolume: "high",
        difficulty: "hard",
        intent: "commercial",
        relevanceScore: 80
      }
    ],
    longTailKeywords: [
      {
        keyword: `how to ${topic.toLowerCase()}`,
        searchVolume: "low",
        difficulty: "easy",
        intent: "informational",
        relevanceScore: 90
      },
      {
        keyword: `${topic.toLowerCase()} for beginners`,
        searchVolume: "low",
        difficulty: "easy",
        intent: "informational",
        relevanceScore: 85
      }
    ],
    peopleAlsoAsk: [
      {
        question: `What is ${topic.toLowerCase()}?`,
        suggestedAnswer: `${topic} is a comprehensive approach that involves multiple strategies and techniques to achieve optimal results.`,
        relatedKeywords: [topic.toLowerCase(), "definition", "meaning"]
      },
      {
        question: `How does ${topic.toLowerCase()} work?`,
        suggestedAnswer: `${topic} works through a systematic process that combines proven methodologies with modern best practices.`,
        relatedKeywords: [topic.toLowerCase(), "process", "how it works"]
      }
    ],
    relatedSearches: [
      `${topic.toLowerCase()} tips`,
      `${topic.toLowerCase()} examples`,
      `${topic.toLowerCase()} tools`,
      `${topic.toLowerCase()} strategy`,
      `${topic.toLowerCase()} benefits`
    ],
    contentGaps: [
      {
        topic: `Advanced ${topic.toLowerCase()} techniques`,
        opportunity: "Create in-depth content covering advanced strategies",
        priority: "high"
      }
    ],
    searchIntent: {
      primary: "informational",
      confidence: 85,
      reasoning: "Users are primarily seeking information and guidance on this topic"
    },
    competitorInsights: {
      commonTopics: ["basics", "tips", "guide", "examples"],
      missingAngles: ["advanced techniques", "case studies", "tools comparison"],
      contentLength: { min: 1500, max: 3500, recommended: 2500 }
    },
    seoScore: {
      keywordOptimization: 75,
      contentStructure: 80,
      userIntent: 85,
      overall: 80
    }
  };
}

export async function generateContentOutline(
  topic: string, 
  researchData: SEOResearchData
): Promise<{
  title: string;
  metaDescription: string;
  headings: Array<{
    level: number;
    text: string;
    keywords: string[];
    wordCount: number;
  }>;
  faqSection: Array<{
    question: string;
    answer: string;
  }>;
  callToAction: string;
}> {
  const client = getOpenAIClient();
  
  const prompt = `Based on the SEO research data, create a comprehensive content outline for: "${topic}"

SEO Research Data:
- Primary Keywords: ${researchData.primaryKeywords.map(k => k.keyword).join(", ")}
- People Also Ask: ${researchData.peopleAlsoAsk.map(p => p.question).join(", ")}
- Search Intent: ${researchData.searchIntent.primary}
- Recommended Length: ${researchData.competitorInsights.contentLength.recommended} words

Create:
1. SEO-optimized title (include primary keyword, under 60 characters)
2. Meta description (150-160 characters, compelling, includes primary keyword)
3. Content structure with H1, H2, H3 headings (include target keywords and estimated word count for each section)
4. FAQ section based on People Also Ask questions
5. Strong call-to-action that aligns with search intent

Format as JSON matching the TypeScript interface.`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-2024-11-20",
      messages: [
        {
          role: "system",
          content: "You are an expert content strategist who creates SEO-optimized content outlines. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content outline generated");
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Error generating content outline:", error);
    // Return fallback outline
    return {
      title: `The Complete Guide to ${topic}`,
      metaDescription: `Discover everything you need to know about ${topic}. Expert tips, strategies, and actionable insights to help you succeed.`,
      headings: [
        {
          level: 1,
          text: `The Complete Guide to ${topic}`,
          keywords: researchData.primaryKeywords.map(k => k.keyword),
          wordCount: 300
        },
        {
          level: 2,
          text: `What is ${topic}?`,
          keywords: [topic.toLowerCase(), "definition"],
          wordCount: 400
        },
        {
          level: 2,
          text: `How to Get Started with ${topic}`,
          keywords: [`${topic.toLowerCase()} guide`, "beginners"],
          wordCount: 500
        }
      ],
      faqSection: researchData.peopleAlsoAsk.map(paa => ({
        question: paa.question,
        answer: paa.suggestedAnswer
      })),
      callToAction: `Ready to master ${topic}? Start implementing these strategies today and see the results for yourself!`
    };
  }
}