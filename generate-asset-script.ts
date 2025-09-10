/*
IMPORTANT NOTICE: DO NOT REMOVE
This is a script that generates an image and saves it to the assets folder. 
You should not use this script unless the user EXPLICITLY asks you to generate an asset.
DO NOT PROACTIVELY GENERATE ASSETS FOR THE USER.

You will need to update the prompt and the options (2nd parameter of the generateImage function) depending on your use case.
options: {
  size?: "1024x1024" | "1536x1024" | "1024x1536" | "auto";
  quality?: "low" | "medium" | "high" | "auto";
  format?: "png" | "jpeg" | "webp";
  background?: undefined | "transparent";
}

If you need to generate many assets, REFACTOR THIS SCRIPT TO CONCURRENTLY GENERATE UP TO 3 ASSETS AT A TIME. If you do not, the bash tool may time out.
use npx tsx generate-asset-script.ts to run this script.
*/

import { generateImage } from "./src/api/image-generation";
import * as fs from "fs";
import * as path from "path";
import { Readable } from "stream";
import { finished } from "stream/promises";
import { logger } from "./src/utils/logger";

async function downloadImage(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
  }

  const fileStream = fs.createWriteStream(outputPath);
  // @ts-ignore - Node.js types are not fully compatible with the fetch API
  await finished(Readable.fromWeb(response.body).pipe(fileStream));
  logger.info(`Image downloaded successfully to ${outputPath}`);
}

async function logImageGeneration(prompt: string, imageUrl: string): Promise<void> {
  const logDir = path.join(__dirname, "logs");
  const logFile = path.join(logDir, "imageGenerationsLog");

  // Create logs directory if it doesn't exist
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logEntry = `[${new Date().toISOString()}] Prompt: "${prompt}"\nImage URL: ${imageUrl}\n\n`;
  fs.appendFileSync(logFile, logEntry);
}

async function main() {
  try {
    //update this to
    const prompt = "describe the asset you want to generate";

    logger.info("Generating image with prompt:", prompt);
    const imageUrl = await generateImage(prompt, {
      size: "1024x1024",
      quality: "high",
      format: "png",
    });

    logger.info("Image generated successfully. URL:", imageUrl);

    // Log the image generation
    await logImageGeneration(prompt, imageUrl);

    const outputPath = path.join(__dirname, "assets", "japanese-art-logo.png");
    await downloadImage(imageUrl, outputPath);

    logger.info("Process completed successfully");
    logger.info("Image URL:", imageUrl);
    logger.info("Image saved to:", outputPath);
  } catch (error) {
    logger.error("Error:", error);
  }
}

main();
