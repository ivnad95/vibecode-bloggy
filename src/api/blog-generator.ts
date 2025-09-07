import { getOpenAIClient } from "./openai";

export async function generateSEOBlog(topic: string): Promise<string> {
  const client = getOpenAIClient();
  
  const prompt = `You are an expert SEO content writer and digital marketing specialist. Create a comprehensive, high-quality blog post that will rank well in search engines and drive traffic and sales.

Topic: ${topic}

Requirements:
- Write a 2500+ word blog post
- Include an engaging title with primary keyword
- Add a compelling meta description (150-160 characters)
- Structure with proper H1, H2, H3 headings
- Include relevant keywords naturally throughout
- Add actionable tips and insights
- Include a strong call-to-action at the end
- Write in a conversational, engaging tone
- Focus on providing real value to readers
- Include statistics and examples where relevant

Format the response as a complete blog post with proper markdown formatting.`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-2024-11-20",
      messages: [
        {
          role: "system",
          content: "You are an expert SEO content writer who creates high-converting blog posts that rank well in search engines."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content generated");
    }

    return content;
  } catch (error) {
    console.error("Error generating blog:", error);
    throw new Error("Failed to generate blog content");
  }
}