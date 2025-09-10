import { AIMessage, AIRequestOptions, AIResponse } from "../types/ai";
import { logger } from "../utils/logger";

const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;

export async function grokChat(
  messages: AIMessage[],
  options?: AIRequestOptions,
): Promise<AIResponse> {
  try {
    const response = await fetch(`${backendUrl}/api/grok/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages, options }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Grok API error: ${errorText}`);
    }

    return (await response.json()) as AIResponse;
  } catch (error) {
    logger.error("Grok fetch error:", error);
    throw error;
  }
}
