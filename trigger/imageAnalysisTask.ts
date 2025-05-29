import { logger, task } from "@trigger.dev/sdk/v3";
import { createClient } from "@/utils/supabase/server";
import { triggerRateLimiter, ContentType } from "@/utils/triggerRateLimiter";

// Types for image analysis
interface ImageAnalysisPayload {
  imageId: string;
  imageUrl: string;
  userId: string;
}

interface ImageMedia {
  id: string;
  url: string;
  project_id: string;
  creator_id: string;
  ai_analysis?: string;
  embedding?: number[];
  analysis_status?: string;
  resolutions?: Record<string, string>;
  alt_text?: string;
}

// Analysis configuration
const ANALYSIS_CONFIG = {
  PROMPTS: {
    IMAGE_ANALYSIS: `Analyze this image and provide a detailed description focusing on:
    1. Visual composition and design elements
    2. Color palette and visual mood
    3. Subject matter and content
    4. Artistic style and technique
    5. Creative quality and craftsmanship
    6. Potential use cases or applications
    
    Provide a comprehensive analysis in 2-3 paragraphs that would be useful for search and portfolio presentation.`,
  },
  RATE_LIMITS: {
    IMAGE_REQUESTS_PER_MINUTE: 30,
    TEXT_REQUESTS_PER_MINUTE: 60,
  },
};

export const imageAnalysisTask = task({
  id: "image-analysis",
  maxDuration: 300, // 5 minutes
  run: async (payload: ImageAnalysisPayload, { ctx }) => {
    logger.info("Starting image analysis task", { payload, ctx });

    const supabase = await createClient();
    
    try {
      // Verify authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error("Authentication required");
      }

      // Get the image data
      const { data: image, error: imageError } = await supabase
        .from("images")
        .select("*")
        .eq("id", payload.imageId)
        .single();

      if (imageError || !image) {
        throw new Error(`Image not found with ID: ${payload.imageId}`);
      }

      // Skip if already analyzed
      if (image.ai_analysis && image.embedding) {
        logger.info(`Image ${payload.imageId} is already analyzed, skipping`);
        return {
          success: true,
          result: "Image already analyzed",
          imageId: payload.imageId,
        };
      }

      // Update image status to processing
      await supabase
        .from("images")
        .update({
          analysis_status: "processing",
          updated_at: new Date().toISOString(),
        })
        .eq("id", payload.imageId);

      // Acquire a rate limit slot for image analysis
      logger.info(`Waiting for rate limiting slot for image analysis of ${payload.imageId}`);
      await triggerRateLimiter.waitForSlot(ContentType.IMAGE);

      try {
        // Get the highest resolution URL
        const imageUrl = await getHighestResUrl(image);
        if (!imageUrl) {
          throw new Error(`No valid URL found for image ${payload.imageId}`);
        }

        // Initialize Google Generative AI
        if (!process.env.GEMINI_API_KEY) {
          throw new Error("GEMINI_API_KEY is not configured");
        }

        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // Convert image to base64
        const imageBase64 = await urlToBase64(imageUrl);

        // Generate image analysis
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        
        const imagePart = {
          inlineData: {
            mimeType: "image/jpeg",
            data: imageBase64,
          },
        };

        const result = await model.generateContent([
          imagePart,
          ANALYSIS_CONFIG.PROMPTS.IMAGE_ANALYSIS,
        ]);

        const analysis = result.response.text();
        if (!analysis) {
          throw new Error("Image analysis returned empty response");
        }

        // Generate embedding
        const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const embeddingResult = await embeddingModel.embedContent(analysis);
        
        if (!embeddingResult.embedding?.values) {
          throw new Error("Failed to generate embedding");
        }

        const embedding = embeddingResult.embedding.values;

        // Update the database with analysis and embedding
        const { error: updateError } = await supabase
          .from("images")
          .update({
            ai_analysis: analysis,
            embedding: embedding,
            analysis_status: "success",
            analysis_error: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", payload.imageId);

        if (updateError) {
          throw new Error(`Failed to update image analysis: ${updateError.message}`);
        }

        logger.info("Image analysis completed successfully", {
          imageId: payload.imageId,
        });

        return {
          success: true,
          result: "Image analysis successful",
          imageId: payload.imageId,
        };
      } finally {
        // Always mark the task as completed to release the rate limit slot
        triggerRateLimiter.completeTask(ContentType.IMAGE);
      }
    } catch (error) {
      logger.error("Error in image analysis task", {
        error: error instanceof Error ? error.message : String(error),
        imageId: payload.imageId,
      });

      // Try to update the image status to failed
      try {
        await supabase
          .from("images")
          .update({
            analysis_status: "failed",
            analysis_error: error instanceof Error ? error.message : String(error),
            updated_at: new Date().toISOString(),
          })
          .eq("id", payload.imageId);
      } catch (statusError) {
        logger.error("Failed to update image status", { statusError });
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        imageId: payload.imageId,
      };
    }
  },
});

/**
 * Get highest resolution URL from image
 */
async function getHighestResUrl(image: ImageMedia): Promise<string | null> {
  try {
    // Prioritize higher resolutions if available
    if (image.resolutions && typeof image.resolutions === "object" && Object.keys(image.resolutions).length > 0) {
      const sizes = Object.keys(image.resolutions)
        .map((key) => parseInt(key))
        .filter((key) => !isNaN(key));

      if (sizes.length > 0) {
        const maxSize = Math.max(...sizes).toString();
        const url = image.resolutions[maxSize];

        if (url && typeof url === "string" && (url.startsWith("http://") || url.startsWith("https://"))) {
          logger.debug(`Using resolution ${maxSize} URL for image ${image.id}`);
          return url;
        }
      }
    }

    // Fall back to the original URL
    if (image.url && typeof image.url === "string" && (image.url.startsWith("http://") || image.url.startsWith("https://"))) {
      logger.debug(`Falling back to base URL for image ${image.id}`);
      return image.url;
    }

    logger.warn(`No valid URL could be determined for image ${image.id}`);
    return null;
  } catch (error) {
    logger.error(`Error getting highest resolution URL for image ${image.id}: ${error}`);
    return null;
  }
}

/**
 * Convert URL to base64
 */
async function urlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString("base64");
  } catch (error) {
    logger.error(`Error converting image URL to base64 (${url}): ${error}`);
    throw error;
  }
}
