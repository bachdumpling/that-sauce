import { logger, task, tasks } from "@trigger.dev/sdk/v3";
import { createClient } from "@/utils/supabase/server";
import { imageAnalysisTask } from "./imageAnalysisTask";
import { videoAnalysisTask } from "./videoAnalysisTask";

// Types for project analysis
interface ProjectAnalysisPayload {
  projectId: string;
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

interface ProjectDetails {
  id: string;
  title: string;
  description?: string;
}

// Analysis configuration
const ANALYSIS_CONFIG = {
  PROMPTS: {
    PROJECT_ANALYSIS: `Analyze this creative project based on the provided context and media analyses. Focus on:
    1. Overall creative concept and execution
    2. Technical proficiency and craftsmanship
    3. Visual coherence and design consistency
    4. Innovation and creativity demonstrated
    5. Professional quality and market readiness
    6. Target audience and commercial potential
    7. Strengths and notable achievements
    8. Style and artistic approach
    
    Provide a comprehensive project analysis in 2-3 paragraphs that captures the essence of this creative work for portfolio presentation and search.`,
  },
};

export const projectAnalysisTask = task({
  id: "project-analysis",
  maxDuration: 600, // 10 minutes
  run: async (payload: ProjectAnalysisPayload, { ctx }) => {
    logger.info("Starting project analysis task", { payload, ctx });

    const supabase = await createClient();

    try {
      // Verify authentication
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error("Authentication required");
      }

      // Get all images and videos for this project
      const { data: images, error: imagesError } = await supabase
        .from("images")
        .select("*")
        .eq("project_id", payload.projectId)
        .order("order", { ascending: true });

      if (imagesError) {
        logger.error(
          `Error fetching images for project ${payload.projectId}: ${imagesError.message}`
        );
        throw new Error(`Failed to fetch images: ${imagesError.message}`);
      }

      const { data: videos, error: videosError } = await supabase
        .from("videos")
        .select("*")
        .eq("project_id", payload.projectId)
        .order("created_at", { ascending: false });

      if (videosError) {
        logger.error(
          `Error fetching videos for project ${payload.projectId}: ${videosError.message}`
        );
        throw new Error(`Failed to fetch videos: ${videosError.message}`);
      }

      logger.info(
        `Found ${images?.length || 0} images and ${videos?.length || 0} videos for project ${payload.projectId}`
      );

      // Filter to only get media that needs analysis
      const imagesToAnalyze =
        images?.filter((img) => !img.ai_analysis || !img.embedding) || [];
      const videosToAnalyze =
        videos?.filter((vid) => !vid.ai_analysis || !vid.embedding) || [];

      logger.info(
        `Filtered to ${imagesToAnalyze.length} images and ${videosToAnalyze.length} videos that need analysis for project ${payload.projectId}`
      );

      const totalMediaToAnalyze =
        imagesToAnalyze.length + videosToAnalyze.length;

      // If there's no media to analyze, proceed directly to project analysis if there's any analyzed media
      if (totalMediaToAnalyze === 0) {
        logger.info(
          `No new media analyses needed for project ${payload.projectId}`
        );

        // Get already analyzed media counts
        const analyzedImages =
          images?.filter((img) => img.ai_analysis && img.embedding) || [];
        const analyzedVideos =
          videos?.filter((vid) => vid.ai_analysis && vid.embedding) || [];

        if (analyzedImages.length > 0 || analyzedVideos.length > 0) {
          logger.info(
            `Found ${analyzedImages.length} already analyzed images and ${analyzedVideos.length} already analyzed videos`
          );
          logger.info(
            `Proceeding to project analysis for ${payload.projectId}`
          );

          await analyzeProject(payload.projectId, supabase);

          logger.info(
            `Project analysis completed successfully ${payload.projectId}`
          );

          return {
            success: true,
            result: "Project analysis successful",
            projectId: payload.projectId,
          };
        } else {
          logger.warn(
            `No analyzed media available for project ${payload.projectId}, skipping project analysis`
          );
          return {
            success: false,
            error: "No analyzed media available for project",
            projectId: payload.projectId,
          };
        }
      }

      // Track failed media for retry
      const failedImageIds: string[] = [];
      const failedVideoIds: string[] = [];

      // Try analysis with up to 1 retry
      for (let attempt = 1; attempt <= 2; attempt++) {
        logger.info(
          `Media analysis attempt ${attempt} for project ${payload.projectId}`
        );

        // For the first attempt, analyze all media
        // For the second attempt, only retry failed media
        const currentImagesToAnalyze =
          attempt === 1
            ? imagesToAnalyze
            : images?.filter((img) => failedImageIds.includes(img.id)) || [];

        const currentVideosToAnalyze =
          attempt === 1
            ? videosToAnalyze
            : videos?.filter((vid) => failedVideoIds.includes(vid.id)) || [];

        if (attempt === 2) {
          logger.info(
            `Retry attempt for ${currentImagesToAnalyze.length} failed images and ${currentVideosToAnalyze.length} failed videos`
          );
        }

        // Clear tracking arrays for this attempt
        const imageIdsToTrack: string[] = [];
        const videoIdsToTrack: string[] = [];
        const imagePromises: Promise<any>[] = [];
        const videoPromises: Promise<any>[] = [];

        // Trigger image analysis tasks
        if (currentImagesToAnalyze.length > 0) {
          logger.info(
            `Starting rate-limited image analysis for ${currentImagesToAnalyze.length} images`
          );

          for (const image of currentImagesToAnalyze) {
            logger.info(`Triggering analysis for image ${image.id}`);
            imageIdsToTrack.push(image.id);

            const imageUrl = await getHighestResUrl(image);

            if (!imageUrl) {
              logger.warn(
                `No valid URL found for image ${image.id}, skipping analysis.`
              );
              continue;
            }

            const imagePromise = tasks.trigger<typeof imageAnalysisTask>(
              "image-analysis",
              {
                imageId: image.id,
                imageUrl: imageUrl,
                userId: payload.userId,
              }
            );

            imagePromises.push(imagePromise);
          }
        }

        // Trigger video analysis tasks
        if (currentVideosToAnalyze.length > 0) {
          logger.info(
            `Starting rate-limited video analysis for ${currentVideosToAnalyze.length} videos`
          );

          for (const video of currentVideosToAnalyze) {
            logger.info(`Triggering analysis for video ${video.id}`);
            videoIdsToTrack.push(video.id);

            // Determine video URL
            let videoUrl = null;
            if (video.vimeo_id) {
              videoUrl = `https://vimeo.com/${video.vimeo_id}`;
            } else if (video.youtube_id) {
              videoUrl = `https://www.youtube.com/watch?v=${video.youtube_id}`;
            } else if (video.url) {
              videoUrl = video.url;
            }

            if (!videoUrl) {
              logger.warn(
                `No valid URL found for video ${video.id}, skipping analysis.`
              );
              continue;
            }

            const videoPromise = tasks.trigger<typeof videoAnalysisTask>(
              "video-analysis",
              {
                videoId: video.id,
                videoUrl: videoUrl,
                userId: payload.userId,
              }
            );

            videoPromises.push(videoPromise);
          }
        }

        // Wait for all triggers to complete
        const allPromises = [...imagePromises, ...videoPromises];
        if (allPromises.length > 0) {
          logger.info(
            `Waiting for ${allPromises.length} analysis tasks to trigger...`
          );
          await Promise.all(allPromises);
          logger.info(
            `All ${allPromises.length} analysis tasks have been triggered.`
          );
        }

        // Wait for analyses to complete
        let allAnalysesComplete = false;
        let waitAttempts = 0;
        const maxWaitAttempts = 30; // 5 minutes with 10-second intervals

        while (!allAnalysesComplete && waitAttempts < maxWaitAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds

          // Check completion status
          const imageCompletionResults = await Promise.all(
            imageIdsToTrack.map(async (imageId) => {
              const { data: image } = await supabase
                .from("images")
                .select("id, analysis_status, ai_analysis, embedding")
                .eq("id", imageId)
                .single();

              return {
                id: imageId,
                complete: image?.ai_analysis && image?.embedding,
                failed: image?.analysis_status === "failed",
              };
            })
          );

          const videoCompletionResults = await Promise.all(
            videoIdsToTrack.map(async (videoId) => {
              const { data: video } = await supabase
                .from("videos")
                .select("id, analysis_status, ai_analysis, embedding")
                .eq("id", videoId)
                .single();

              return {
                id: videoId,
                complete: video?.ai_analysis && video?.embedding,
                failed: video?.analysis_status === "failed",
              };
            })
          );

          const completedImages = imageCompletionResults.filter(
            (r) => r.complete
          ).length;
          const failedImages = imageCompletionResults.filter((r) => r.failed);
          const completedVideos = videoCompletionResults.filter(
            (r) => r.complete
          ).length;
          const failedVideos = videoCompletionResults.filter((r) => r.failed);

          logger.info(
            `Analysis progress: ${completedImages}/${imageIdsToTrack.length} images, ${completedVideos}/${videoIdsToTrack.length} videos complete. Wait attempt: ${waitAttempts + 1}/${maxWaitAttempts}`
          );

          // Update failed tracking arrays
          failedImageIds.length = 0;
          failedImageIds.push(...failedImages.map((r) => r.id));
          failedVideoIds.length = 0;
          failedVideoIds.push(...failedVideos.map((r) => r.id));

          // Check if all are complete or failed
          const totalTracked = imageIdsToTrack.length + videoIdsToTrack.length;
          const totalCompleted = completedImages + completedVideos;
          const totalFailed = failedImages.length + failedVideos.length;

          if (totalCompleted + totalFailed >= totalTracked) {
            allAnalysesComplete = true;
            logger.info(
              `All tracked analyses completed or failed: ${totalCompleted} completed, ${totalFailed} failed`
            );
          }

          waitAttempts++;
        }

        if (waitAttempts >= maxWaitAttempts) {
          logger.warn(
            `Timeout waiting for media analyses to complete for project ${payload.projectId}`
          );
        }

        // If this was the second attempt, or if we have some successful analyses, break
        if (
          attempt === 2 ||
          (failedImageIds.length === 0 && failedVideoIds.length === 0)
        ) {
          break;
        }

        logger.info(
          `Will retry ${failedImageIds.length} failed images and ${failedVideoIds.length} failed videos`
        );
      }

      // Proceed with project analysis regardless of some failed media
      logger.info(`Proceeding to project analysis for ${payload.projectId}`);
      await analyzeProject(payload.projectId, supabase);
      logger.info(
        `Project analysis completed successfully for ${payload.projectId}`
      );

      return {
        success: true,
        result: "Project analysis successful",
        projectId: payload.projectId,
      };
    } catch (error) {
      logger.error("Error in project analysis task", {
        error: error instanceof Error ? error.message : String(error),
        projectId: payload.projectId,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        projectId: payload.projectId,
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
    if (
      image.resolutions &&
      typeof image.resolutions === "object" &&
      Object.keys(image.resolutions).length > 0
    ) {
      const sizes = Object.keys(image.resolutions)
        .map((key) => parseInt(key))
        .filter((key) => !isNaN(key));

      if (sizes.length > 0) {
        const maxSize = Math.max(...sizes).toString();
        const url = image.resolutions[maxSize];

        if (
          url &&
          typeof url === "string" &&
          (url.startsWith("http://") || url.startsWith("https://"))
        ) {
          logger.debug(`Using resolution ${maxSize} URL for image ${image.id}`);
          return url;
        }
      }
    }

    // Fall back to the original URL
    if (
      image.url &&
      typeof image.url === "string" &&
      (image.url.startsWith("http://") || image.url.startsWith("https://"))
    ) {
      logger.debug(`Falling back to base URL for image ${image.id}`);
      return image.url;
    }

    logger.warn(`No valid URL could be determined for image ${image.id}`);
    return null;
  } catch (error) {
    logger.error(
      `Error getting highest resolution URL for image ${image.id}: ${error}`
    );
    return null;
  }
}

/**
 * Analyze a complete project
 */
async function analyzeProject(projectId: string, supabase: any): Promise<void> {
  try {
    // Get project details
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, title, description")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      logger.error(
        `Project details not found for ID: ${projectId} during analysis.`
      );
      throw new Error(
        `Project not found: ${projectError?.message || "Unknown error"}`
      );
    }

    // Get all analyzed images
    const { data: images, error: imagesError } = await supabase
      .from("images")
      .select("ai_analysis")
      .eq("project_id", projectId)
      .not("ai_analysis", "is", null);

    if (imagesError) {
      logger.error(
        `Error fetching analyzed images for project ${projectId}: ${imagesError.message}`
      );
      throw new Error(
        `Failed to fetch analyzed images: ${imagesError.message}`
      );
    }

    // Get all analyzed videos
    const { data: videos, error: videosError } = await supabase
      .from("videos")
      .select("ai_analysis")
      .eq("project_id", projectId)
      .not("ai_analysis", "is", null);

    if (videosError) {
      logger.error(
        `Error fetching analyzed videos for project ${projectId}: ${videosError.message}`
      );
      throw new Error(
        `Failed to fetch analyzed videos: ${videosError.message}`
      );
    }

    // Combine all analyses as context
    const mediaAnalyses = [
      ...(images || []).map((img: any) => img.ai_analysis),
      ...(videos || []).map((vid: any) => vid.ai_analysis),
    ].filter(Boolean);

    if (mediaAnalyses.length === 0) {
      logger.warn(
        `No analyzed media found for project ${projectId}, skipping project analysis.`
      );
      return;
    }

    logger.info(
      `Generating analysis for project ${projectId} using ${mediaAnalyses.length} media items.`
    );

    // Set status to processing
    await supabase
      .from("projects")
      .update({
        analysis_status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    // Initialize Google Generative AI
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Generate project analysis
    const mediaContext = mediaAnalyses.join("\n\n---\n\n");
    const projectContext = `
Project Title: ${project.title}
Project Description: ${project.description || "No description provided"}

Number of analyzed media items: ${mediaAnalyses.length}

Media analysis summaries:
${mediaContext}
    `;

    const prompt = ANALYSIS_CONFIG.PROMPTS.PROJECT_ANALYSIS;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const result = await model.generateContent([
      prompt + "\n\n" + projectContext,
    ]);

    const analysis = result.response.text();
    if (!analysis) {
      logger.warn(
        `Project analysis generated empty response for project ${projectId}.`
      );
      throw new Error("Project analysis returned empty/undefined text.");
    }

    // Generate embedding
    const embeddingModel = genAI.getGenerativeModel({
      model: "text-embedding-004",
    });
    const embeddingResult = await embeddingModel.embedContent(analysis);

    if (!embeddingResult.embedding?.values) {
      throw new Error("Failed to generate embedding");
    }

    const embedding = embeddingResult.embedding.values;

    // Update the project
    const { error: updateError } = await supabase
      .from("projects")
      .update({
        ai_analysis: analysis,
        embedding: embedding,
        analysis_status: "success",
        analysis_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    if (updateError) {
      throw new Error(
        `Failed to update project analysis: ${updateError.message}`
      );
    }

    logger.info(`Successfully analyzed project ${projectId}`);
  } catch (error) {
    logger.error(`Error analyzing project ${projectId}: ${error}`);

    // Update status to failed
    await supabase
      .from("projects")
      .update({
        analysis_status: "failed",
        analysis_error: error instanceof Error ? error.message : String(error),
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    throw error;
  }
}
