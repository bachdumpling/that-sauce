import { logger, task } from "@trigger.dev/sdk/v3";
import { createClient } from "@/utils/supabase/server";
import { triggerRateLimiter, ContentType } from "@/utils/triggerRateLimiter";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

// Types for video analysis
interface VideoAnalysisPayload {
  videoId: string;
  videoUrl: string;
  userId: string;
}

interface VideoMedia {
  id: string;
  url: string;
  project_id: string;
  creator_id: string;
  ai_analysis?: string;
  embedding?: number[];
  analysis_status?: string;
  vimeo_id?: string;
  youtube_id?: string;
}

// Analysis configuration
const ANALYSIS_CONFIG = {
  PROMPTS: {
    VIDEO_CONTENT_ANALYSIS: `Analyze this video content and provide a detailed description focusing on:
    1. Visual storytelling and narrative elements
    2. Cinematography and video production quality
    3. Motion graphics, animation, or editing techniques
    4. Color grading and visual mood
    5. Audio design and soundtrack integration
    6. Creative concept and execution
    7. Technical proficiency and craftsmanship
    8. Target audience and commercial applications
    
    Provide a comprehensive analysis in 2-3 paragraphs that would be useful for search and portfolio presentation.`,
  },
};

export const videoAnalysisTask = task({
  id: "video-analysis",
  maxDuration: 900, // 15 minutes
  run: async (payload: VideoAnalysisPayload, { ctx }) => {
    logger.info("Starting video analysis task", { payload, ctx });

    const supabase = await createClient();
    let videoPath: string | null = null;

    try {
      // Verify authentication
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error("Authentication required");
      }

      // Get the video data
      const { data: video, error: videoError } = await supabase
        .from("videos")
        .select("*")
        .eq("id", payload.videoId)
        .single();

      if (videoError || !video) {
        throw new Error(`Video not found with ID: ${payload.videoId}`);
      }

      // Skip if already analyzed
      if (video.ai_analysis && video.embedding) {
        logger.info(`Video ${payload.videoId} is already analyzed, skipping`);
        return {
          success: true,
          result: "Video already analyzed",
          videoId: payload.videoId,
        };
      }

      // Update video status to processing
      await supabase
        .from("videos")
        .update({
          analysis_status: "processing",
          updated_at: new Date().toISOString(),
        })
        .eq("id", payload.videoId);

      // Acquire a rate limit slot for video analysis
      logger.info(
        `Waiting for rate limiting slot for video analysis of ${payload.videoId}`
      );
      await triggerRateLimiter.waitForSlot(ContentType.VIDEO);

      try {
        // Determine video source for processing
        let videoUrl: string | null = null;
        let isExternalVideo = false;

        if (video.vimeo_id) {
          videoUrl = `https://vimeo.com/${video.vimeo_id}`;
          isExternalVideo = true;
        } else if (video.youtube_id) {
          videoUrl = `https://www.youtube.com/watch?v=${video.youtube_id}`;
          isExternalVideo = true;
        } else if (
          video.url &&
          (video.url.startsWith("http://") || video.url.startsWith("https://"))
        ) {
          videoUrl = video.url;
          isExternalVideo = !(
            video.url.includes(".supabase.co/") ||
            video.url.includes(".supabase.in/")
          );
        }

        if (!videoUrl) {
          throw new Error(`No valid URL found for video ${video.id}`);
        }

        logger.info(`Processing video ${video.id} from URL: ${videoUrl}`);

        // Create temporary directory for downloads if it doesn't exist
        const tempDir = path.join(process.cwd(), "temp");
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        // Create a timestamp-based filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const outputPath = path.join(
          tempDir,
          `video_${video.id}_${timestamp}.mp4`
        );
        videoPath = outputPath;

        if (isExternalVideo) {
          // For external videos (Vimeo, YouTube), download them
          logger.info(
            `Downloading external video ${video.id} from ${videoUrl}`
          );
          const downloadResult = await downloadVideo(videoUrl, outputPath);

          if (!downloadResult.success) {
            throw new Error(
              `Failed to download video: ${downloadResult.error}`
            );
          }
          logger.info(`External video ${video.id} downloaded to ${outputPath}`);
        } else {
          // For Supabase storage videos, download directly
          try {
            logger.info(
              `Downloading video ${video.id} from Supabase storage: ${videoUrl}`
            );
            const response = await fetch(videoUrl);

            if (!response.ok || !response.body) {
              throw new Error(
                `Failed to fetch video: ${response.status} ${response.statusText}`
              );
            }

            const arrayBuffer = await response.arrayBuffer();
            fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));
            logger.info(
              `Storage video ${video.id} downloaded to ${outputPath}`
            );
          } catch (error) {
            throw new Error(
              `Storage download failed: ${error instanceof Error ? error.message : String(error)}`
            );
          }
        }

        // Verify the downloaded video
        if (!fs.existsSync(videoPath) || fs.statSync(videoPath).size === 0) {
          throw new Error(
            `Failed to download valid video file ${video.id} to ${videoPath}`
          );
        }

        logger.info(
          `Video ${video.id} downloaded to: ${videoPath}, size: ${fs.statSync(videoPath).size}, proceeding with analysis`
        );

        // Analyze the downloaded video
        const analysis = await analyzeVideoContent(videoPath);

        if (!analysis) {
          throw new Error("Failed to analyze video content");
        }

        // Initialize Google Generative AI for embedding
        if (!process.env.GEMINI_API_KEY) {
          throw new Error("GEMINI_API_KEY is not configured");
        }

        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // Generate embedding
        const embeddingModel = genAI.getGenerativeModel({
          model: "text-embedding-004",
        });
        const embeddingResult = await embeddingModel.embedContent(analysis);

        if (!embeddingResult.embedding?.values) {
          throw new Error("Failed to generate embedding");
        }

        const embedding = embeddingResult.embedding.values;

        // Update the database with analysis and embedding
        const { error: updateError } = await supabase
          .from("videos")
          .update({
            ai_analysis: analysis,
            embedding: embedding,
            analysis_status: "success",
            analysis_error: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", payload.videoId);

        if (updateError) {
          throw new Error(
            `Failed to update video analysis: ${updateError.message}`
          );
        }

        logger.info("Video analysis completed successfully", {
          videoId: payload.videoId,
        });

        return {
          success: true,
          result: "Video analysis successful",
          videoId: payload.videoId,
        };
      } finally {
        // Always mark the task as completed to release the rate limit slot
        triggerRateLimiter.completeTask(ContentType.VIDEO);
      }
    } catch (error) {
      logger.error("Error in video analysis task", {
        error: error instanceof Error ? error.message : String(error),
        videoId: payload.videoId,
      });

      // Try to update the video status to failed
      try {
        await supabase
          .from("videos")
          .update({
            analysis_status: "failed",
            analysis_error:
              error instanceof Error ? error.message : String(error),
            updated_at: new Date().toISOString(),
          })
          .eq("id", payload.videoId);
      } catch (statusError) {
        logger.error("Failed to update video status", { statusError });
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        videoId: payload.videoId,
      };
    } finally {
      // Ensure temporary file cleanup
      if (videoPath && fs.existsSync(videoPath)) {
        try {
          fs.unlinkSync(videoPath);
          logger.info(`Temporary video file cleaned up: ${videoPath}`);
        } catch (cleanupError) {
          logger.warn(
            `Failed to clean up temporary file ${videoPath}: ${cleanupError}`
          );
        }
      }
    }
  },
});

/**
 * Download a video from a URL using yt-dlp
 */
async function downloadVideo(
  url: string,
  outputPath: string
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    try {
      logger.info(`Starting download from URL: ${url}`);
      logger.info(`Output path: ${outputPath}`);

      // Create temp directory if it doesn't exist
      const tempDir = path.dirname(outputPath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Prepare yt-dlp command
      const ytdlpOptions = [
        "--format",
        "bestvideo[height<=480]+bestaudio/best[height<=480]",
        "--merge-output-format",
        "mp4",
        "--quiet",
        "--no-playlist",
        "--ignore-errors",
        "-o",
        outputPath,
        "--socket-timeout",
        "30",
        url,
      ];

      // Execute yt-dlp command
      const downloadProcess = spawn("yt-dlp", ytdlpOptions);

      let stderr = "";
      downloadProcess.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      downloadProcess.on("error", (spawnError) => {
        logger.error(`Failed to start yt-dlp process: ${spawnError}`);
        resolve({
          success: false,
          error: `Failed to spawn yt-dlp: ${spawnError.message}`,
        });
      });

      downloadProcess.on("close", (code) => {
        if (code !== 0) {
          logger.error(`yt-dlp process exited with code ${code}: ${stderr}`);
          resolve({
            success: false,
            error: `Exit code ${code}: ${stderr || "Unknown error"}`,
          });
          return;
        }

        // Verify file exists and has content
        if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
          logger.info(`Video downloaded successfully to ${outputPath}`);
          resolve({ success: true });
        } else {
          logger.error(
            `yt-dlp exited successfully but output file is missing or empty: ${outputPath}`
          );
          resolve({
            success: false,
            error:
              "Downloaded file is empty or doesn't exist. Stderr: " + stderr,
          });
        }
      });
    } catch (error) {
      logger.error(`Error in downloadVideo setup: ${error}`);
      resolve({ success: false, error: String(error) });
    }
  });
}

/**
 * Analyze video content using Gemini Vision
 */
async function analyzeVideoContent(videoPath: string): Promise<string | null> {
  try {
    const videoSizeBytes = fs.statSync(videoPath).size;
    const maxSizeMBInline = 18;
    const maxSizeBytesInline = maxSizeMBInline * 1024 * 1024;

    const prompt = ANALYSIS_CONFIG.PROMPTS.VIDEO_CONTENT_ANALYSIS;

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    let result: any;

    if (videoSizeBytes < maxSizeBytesInline) {
      // Inline Data Method (< 18MB)
      logger.info(
        `Analyzing video content for ${videoPath} using inline data (size: ${(videoSizeBytes / (1024 * 1024)).toFixed(2)} MB).`
      );

      const videoBytes = fs.readFileSync(videoPath);
      const base64Video = videoBytes.toString("base64");

      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

      result = await model.generateContent([
        {
          inlineData: {
            mimeType: "video/mp4",
            data: base64Video,
          },
        },
        prompt,
      ]);
    } else {
      // For larger videos, we'll need to use a different approach or throw an error
      throw new Error(
        `Video file ${videoPath} (${(videoSizeBytes / (1024 * 1024)).toFixed(2)} MB) exceeds the inline data limit of ${maxSizeMBInline}MB. Large video analysis is not currently supported.`
      );
    }

    const analysis = result.response.text();
    if (!analysis) {
      logger.warn(
        `Video analysis generated empty response for video ${videoPath}.`
      );
      throw new Error("Video analysis returned empty/undefined text.");
    }

    logger.info(
      `Successfully generated video content analysis for ${videoPath}`
    );
    return analysis;
  } catch (error) {
    logger.error(`Error in analyzeVideoContent for ${videoPath}: ${error}`);
    throw error;
  }
}
