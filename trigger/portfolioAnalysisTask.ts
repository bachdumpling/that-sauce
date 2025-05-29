import { logger, task, tasks } from "@trigger.dev/sdk/v3";
import { createClient } from "@/utils/supabase/server";
import { projectAnalysisTask } from "./projectAnalysisTask";

// Types for portfolio analysis
interface PortfolioAnalysisPayload {
  portfolioId: string;
  userId: string;
  jobId: string;
}

interface ProjectForAnalysis {
  id: string;
  title: string;
  description: string | null;
  ai_analysis: string | null;
}

interface AnalyzedProjectForPortfolio {
  id: string;
  title: string;
  description: string | null;
  ai_analysis: string;
}

interface CreatorDetails {
  username: string;
  primary_role: any;
  bio: string | null;
}

// Analysis configuration
const ANALYSIS_CONFIG = {
  PROMPTS: {
    PORTFOLIO_ANALYSIS: `Analyze this creative portfolio and provide a comprehensive overview that highlights:
    1. Overall creative vision and artistic direction
    2. Range and diversity of creative skills demonstrated
    3. Technical proficiency across different mediums
    4. Professional quality and market competitiveness
    5. Unique style and creative voice
    6. Target market and commercial appeal
    7. Strengths and standout projects
    8. Areas of expertise and specialization
    9. Growth trajectory and creative evolution
    10. Industry positioning and career potential
    
    Provide a detailed portfolio analysis in 3-4 paragraphs that would be compelling for potential clients and employers, showcasing the creator's unique value proposition and creative capabilities.`,
  },
};

export const portfolioAnalysisTask = task({
  id: "portfolio-analysis",
  maxDuration: 1200, // 20 minutes
  run: async (payload: PortfolioAnalysisPayload, { ctx }) => {
    logger.info("Starting portfolio analysis task", { payload, ctx });

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

      // Update job status to "processing"
      await supabase
        .from("analysis_jobs")
        .update({
          status: "processing",
          updated_at: new Date().toISOString(),
        })
        .eq("id", payload.jobId);

      // Get all projects for this portfolio
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("id, title, description, ai_analysis")
        .eq("portfolio_id", payload.portfolioId);

      if (projectsError) {
        logger.error(
          `Error fetching projects for portfolio ${payload.portfolioId}: ${projectsError.message}`
        );
        throw new Error(`Failed to fetch projects: ${projectsError.message}`);
      }

      if (!projects || projects.length === 0) {
        await supabase
          .from("analysis_jobs")
          .update({
            status: "completed",
            status_message: "No projects found to analyze",
            updated_at: new Date().toISOString(),
          })
          .eq("id", payload.jobId);

        return {
          success: true,
          status: "completed",
          message: "No projects found to analyze",
          portfolioId: payload.portfolioId,
          jobId: payload.jobId,
        };
      }

      logger.info(
        `Found ${projects.length} projects to analyze for portfolio ${payload.portfolioId}`
      );

      // Track progress
      let progress = 0;
      const totalSteps = projects.length + 1; // Projects + Portfolio analysis
      let currentStep = 0;

      // Trigger project analysis tasks for each project
      const projectPromises = [];
      const projectIds: string[] = [];

      for (const project of projects) {
        logger.info(`Triggering analysis for project ${project.id}`);
        projectIds.push(project.id);

        const projectPromise = tasks
          .trigger<typeof projectAnalysisTask>("project-analysis", {
            projectId: project.id,
            userId: payload.userId,
          })
          .then(async (result) => {
            // Update progress after each project completes
            currentStep++;
            progress = (currentStep / totalSteps) * 100;
            await supabase
              .from("analysis_jobs")
              .update({
                progress: progress,
                updated_at: new Date().toISOString(),
              })
              .eq("id", payload.jobId);
            return result;
          });

        projectPromises.push(projectPromise);
      }

      // Wait for all project analysis triggers to complete
      await Promise.all(projectPromises);
      logger.info(
        `All project analysis triggers completed for portfolio ${payload.portfolioId}`
      );

      // Wait for projects to be analyzed - with a timeout
      let projectsComplete = false;
      let attemptsRemaining = 20; // 20 attempts with 10-second intervals
      const SUFFICIENT_PERCENTAGE = 70; // Consider 70% completion as sufficient

      while (!projectsComplete && attemptsRemaining > 0) {
        // Wait 10 seconds between checks
        await new Promise((resolve) => setTimeout(resolve, 10000));

        // Get the current analyzed project count
        const { data: analyzedProjects, error: analyzedError } = await supabase
          .from("projects")
          .select("id, title, description, ai_analysis")
          .eq("portfolio_id", payload.portfolioId)
          .not("ai_analysis", "is", null);

        if (analyzedError) {
          logger.error(
            `Error fetching analyzed projects: ${analyzedError.message}`
          );
          throw new Error(
            `Failed to fetch analyzed projects: ${analyzedError.message}`
          );
        }

        // Calculate percentage of projects that are analyzed
        const percentageAnalyzed =
          projects.length > 0
            ? (analyzedProjects.length / projects.length) * 100
            : 0;

        // Check if we have the same number of analyzed projects as total projects
        const allProjectsAnalyzed = analyzedProjects.length >= projects.length;

        // Check if all our triggered projects are in the analyzed list
        let allTriggeredProjectsFound = true;
        if (allProjectsAnalyzed) {
          // Create a set of analyzed project IDs for efficient checking
          const analyzedProjectIds = new Set(
            analyzedProjects.map((p: any) => p.id)
          );

          // Check if each of our triggered projects is in the analyzed list
          for (const projectId of projectIds) {
            if (!analyzedProjectIds.has(projectId)) {
              allTriggeredProjectsFound = false;
              break;
            }
          }
        }

        // Log progress
        logger.info(
          `Waiting for project analyses to complete: ${analyzedProjects.length}/${projects.length} projects analyzed (${percentageAnalyzed.toFixed(2)}%). Attempts remaining: ${attemptsRemaining}`
        );

        // If all conditions are met, we're done!
        if (allProjectsAnalyzed && allTriggeredProjectsFound) {
          projectsComplete = true;
          logger.info(
            `All ${analyzedProjects.length} projects for portfolio ${payload.portfolioId} are now analyzed.`
          );
          break;
        }

        // Check if we have a sufficient percentage of projects analyzed (70% threshold)
        if (percentageAnalyzed >= SUFFICIENT_PERCENTAGE) {
          logger.info(
            `Sufficient projects analyzed (${percentageAnalyzed.toFixed(2)}% >= ${SUFFICIENT_PERCENTAGE}%), proceeding with portfolio analysis`
          );
          break;
        }

        // Also check if we've been waiting a while and have at least some analyzed projects
        if (attemptsRemaining <= 15 && analyzedProjects.length > 0) {
          logger.warn(
            `Been waiting for a while and have ${analyzedProjects.length} analyzed projects. Proceeding with portfolio analysis using available projects.`
          );
          break;
        }

        attemptsRemaining--;
      }

      if (attemptsRemaining === 0) {
        logger.warn(
          `Timeout reached waiting for projects to be analyzed in portfolio ${payload.portfolioId}.`
        );

        // Check one last time how many projects we have analyzed
        const { data: finalAnalyzedProjects } = await supabase
          .from("projects")
          .select("id, title, description, ai_analysis")
          .eq("portfolio_id", payload.portfolioId)
          .not("ai_analysis", "is", null);

        if (!finalAnalyzedProjects || finalAnalyzedProjects.length === 0) {
          await supabase
            .from("analysis_jobs")
            .update({
              status: "failed",
              status_message:
                "No projects were successfully analyzed after waiting",
              updated_at: new Date().toISOString(),
            })
            .eq("id", payload.jobId);

          return {
            success: false,
            status: "failed",
            message: "No projects were successfully analyzed after waiting",
            portfolioId: payload.portfolioId,
            jobId: payload.jobId,
          };
        }

        logger.info(
          `Found ${finalAnalyzedProjects.length} analyzed projects after timeout. Proceeding with portfolio analysis using available projects.`
        );
      }

      // Wait an additional 5 seconds to ensure all database updates are complete
      logger.info(
        `Waiting for final database updates to complete for portfolio ${payload.portfolioId}`
      );
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Re-fetch all analyzed projects one final time
      const { data: finalAnalyzedProjects } = await supabase
        .from("projects")
        .select("id, title, description, ai_analysis")
        .eq("portfolio_id", payload.portfolioId)
        .not("ai_analysis", "is", null);

      logger.info(
        `Re-fetched ${finalAnalyzedProjects?.length || 0} analyzed projects for portfolio ${payload.portfolioId}`
      );

      // Analyze portfolio
      logger.info(`Starting analysis for portfolio ${payload.portfolioId}`);
      const portfolioAnalysis = await analyzePortfolio(
        payload.portfolioId,
        supabase
      );

      if (!portfolioAnalysis) {
        await supabase
          .from("analysis_jobs")
          .update({
            status: "failed",
            status_message: "Failed to generate portfolio analysis",
            updated_at: new Date().toISOString(),
          })
          .eq("id", payload.jobId);

        return {
          success: false,
          status: "failed",
          message: "Failed to generate portfolio analysis",
          portfolioId: payload.portfolioId,
          jobId: payload.jobId,
        };
      }

      currentStep++;
      progress = 100;
      await supabase
        .from("analysis_jobs")
        .update({
          progress: progress,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payload.jobId);

      // Mark job as completed
      await supabase
        .from("analysis_jobs")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", payload.jobId);

      logger.info(
        `Portfolio analysis job ${payload.jobId} completed successfully.`
      );

      return {
        success: true,
        status: "completed",
        message: "Portfolio analysis completed successfully",
        portfolioId: payload.portfolioId,
        jobId: payload.jobId,
      };
    } catch (error) {
      logger.error(
        `Error in portfolio analysis job ${payload.jobId}: ${error instanceof Error ? error.message : String(error)}`
      );

      await supabase
        .from("analysis_jobs")
        .update({
          status: "failed",
          status_message:
            error instanceof Error ? error.message : String(error),
          updated_at: new Date().toISOString(),
        })
        .eq("id", payload.jobId);

      return {
        success: false,
        status: "failed",
        message: error instanceof Error ? error.message : String(error),
        portfolioId: payload.portfolioId,
        jobId: payload.jobId,
      };
    }
  },
});

/**
 * Analyze the entire portfolio
 */
async function analyzePortfolio(
  portfolioId: string,
  supabase: any
): Promise<string | null> {
  try {
    // Get all analyzed projects for this portfolio
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("id, title, description, ai_analysis")
      .eq("portfolio_id", portfolioId)
      .not("ai_analysis", "is", null);

    if (projectsError) {
      logger.error(
        `Error fetching analyzed projects for portfolio ${portfolioId}: ${projectsError.message}`
      );
      throw new Error(
        `Failed to fetch analyzed projects: ${projectsError.message}`
      );
    }

    logger.info(
      `Re-fetched ${projects?.length || 0} analyzed projects for portfolio ${portfolioId}`
    );

    if (!projects || projects.length === 0) {
      logger.warn(
        `No analyzed projects found for portfolio ${portfolioId}, cannot analyze portfolio.`
      );
      return null;
    }

    // Get creator ID for this portfolio
    const { data: portfolio, error: portfolioError } = await supabase
      .from("portfolios")
      .select("creator_id")
      .eq("id", portfolioId)
      .single();

    if (portfolioError || !portfolio) {
      logger.error(
        `Could not find creator ID for portfolio ${portfolioId}: ${portfolioError?.message}`
      );
      return null;
    }

    // Get creator details
    const { data: creator, error: creatorError } = await supabase
      .from("creators")
      .select("username, primary_role, bio")
      .eq("id", portfolio.creator_id)
      .single();

    if (creatorError) {
      logger.warn(
        `Creator details not found for ID: ${portfolio.creator_id} (portfolio ${portfolioId}): ${creatorError.message}`
      );
    }

    logger.info(
      `Generating analysis for portfolio ${portfolioId} using ${projects.length} analyzed projects.`
    );

    // Set portfolio status to processing
    await supabase
      .from("portfolios")
      .update({
        analysis_status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", portfolioId);

    // Create context for portfolio analysis
    const context = preparePortfolioContext(
      projects as AnalyzedProjectForPortfolio[],
      creator
    );

    // Generate portfolio analysis
    const portfolioAnalysis = await generatePortfolioAnalysis(context);
    if (!portfolioAnalysis) {
      await supabase
        .from("portfolios")
        .update({
          analysis_status: "failed",
          analysis_error: "Failed to generate portfolio analysis",
          updated_at: new Date().toISOString(),
        })
        .eq("id", portfolioId);
      return null;
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
    const embeddingResult =
      await embeddingModel.embedContent(portfolioAnalysis);

    if (!embeddingResult.embedding?.values) {
      logger.error(`Failed to generate embedding for portfolio ${portfolioId}`);
      await supabase
        .from("portfolios")
        .update({
          analysis_status: "failed",
          analysis_error: "Embedding generation failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", portfolioId);
      return null;
    }

    const embedding = embeddingResult.embedding.values;

    // Update portfolio with analysis
    const { error: updateError } = await supabase
      .from("portfolios")
      .update({
        ai_analysis: portfolioAnalysis,
        embedding: embedding,
        analysis_status: "success",
        analysis_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", portfolioId);

    if (updateError) {
      logger.error(
        `Error updating portfolio analysis for ${portfolioId}: ${updateError.message}`
      );
      throw new Error(`Failed to update portfolio: ${updateError.message}`);
    }

    logger.info(`Successfully analyzed portfolio ${portfolioId}`);
    return portfolioAnalysis;
  } catch (error) {
    logger.error(`Error analyzing portfolio ${portfolioId}: ${error}`);
    await supabase
      .from("portfolios")
      .update({
        analysis_status: "failed",
        analysis_error: error instanceof Error ? error.message : String(error),
        updated_at: new Date().toISOString(),
      })
      .eq("id", portfolioId);
    return null;
  }
}

/**
 * Prepare portfolio context from projects with creator info
 */
function preparePortfolioContext(
  projects: AnalyzedProjectForPortfolio[],
  creator: CreatorDetails | null
): string {
  let context = `Analyzing a professional portfolio of ${projects.length} projects:\n\n`;

  // Add creator info if available
  if (creator) {
    context += `Creator: ${creator.username}\n`;
    if (creator.primary_role) {
      context += `Primary Role: ${JSON.stringify(creator.primary_role) ?? "Not specified"}\n`;
    }
    if (creator.bio) context += `Bio: ${creator.bio}\n\n`;
  } else {
    context += `Creator information not available.\n\n`;
  }

  // Add project info
  context += "Analyzed Projects:\n";
  for (const project of projects) {
    context += `\n---\n`;
    context += `Project: ${project.title}\n`;
    context += `Description: ${project.description || "No description provided"}\n`;
    context += `AI Analysis Summary: ${project.ai_analysis || "No AI analysis available"}\n`;
  }
  context += `\n---\n`;

  return context;
}

/**
 * Generate portfolio analysis using Gemini
 */
async function generatePortfolioAnalysis(
  context: string
): Promise<string | null> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const prompt = ANALYSIS_CONFIG.PROMPTS.PORTFOLIO_ANALYSIS;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const result = await model.generateContent([prompt + "\n\n" + context]);

    const analysis = result.response.text();
    if (!analysis) {
      logger.warn(`Portfolio analysis generated empty response.`);
      return null;
    }

    logger.info("Successfully generated portfolio analysis.");
    return analysis;
  } catch (error) {
    logger.error(`Error generating portfolio analysis: ${error}`);
    return null;
  }
}
