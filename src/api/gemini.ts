/*
IMPORTANT NOTICE: DO NOT REMOVE
This is a custom client for the Gemini API. You may update this service, but you should not need to.

Valid model names:
gemini-1.5-pro-latest
gemini-1.5-flash-latest
gemini-1.0-pro-latest
*/
import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "../utils/logger";

export const getGeminiClient = () => {
  const apiKey = process.env.EXPO_PUBLIC_VIBECODE_GEMINI_API_KEY;
  if (!apiKey) {
    logger.warn("Gemini API key not found in environment variables");
  }
  return new GoogleGenerativeAI(apiKey);
};
