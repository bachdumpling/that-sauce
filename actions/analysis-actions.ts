"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Conditional Trigger.dev import - handle case where SDK is not installed
let tasks: any = null;
try {
  const triggerSdk = require("@trigger.dev/sdk/v3");
  tasks = triggerSdk.tasks;
} catch (error) {
  console.warn(
    "Trigger.dev SDK not available - analysis tasks will be logged but not executed"
  );
}

// Analysis types
export interface AnalysisJob {
  id: string;
  portfolio_id?: string;
  project_id?: string;
  creator_id: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  progress: number;
  status_message?: string;
  created_at: string;
  updated_at: string;
}

export interface CanAnalyzeResponse {
  allowed: boolean;
  message: string;
  nextAvailableTime?: string;
}

export interface CreatorAnalytics {
  profile_views: number;
  project_views: number;
  total_projects: number;
  total_media: number;
  engagement_rate: number;
  top_projects: any[];
  recent_activity: any[];
  growth_metrics: {
    projects_this_month: number;
    views_this_month: number;
    engagement_this_month: number;
  };
}

// Validation schemas
const portfolioAnalysisSchema = z.object({
  portfolioId: z.string().uuid("Invalid portfolio ID"),
});

const projectAnalysisSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
});

const jobStatusSchema = z.object({
  jobId: z.string().uuid("Invalid job ID"),
});

/**
 * Check if a portfolio can be analyzed
 */
export async function canAnalyzePortfolioAction(portfolioId: string) {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "Authentication required",
        message: "You must be logged in to check analysis eligibility",
      };
    }

    // Validate input
    const validatedData = portfolioAnalysisSchema.parse({ portfolioId });

    // Check if portfolio exists and verify ownership
    const { data: portfolio, error: portfolioError } = await supabase
      .from("portfolios")
      .select(
        `
        id,
        creator_id,
        creators!inner (
          profile_id
        )
      `
      )
      .eq("id", validatedData.portfolioId)
      .single();

    if (portfolioError || !portfolio) {
      return {
        success: false,
        error: "Portfolio not found",
        message: "The specified portfolio does not exist",
      };
    }

    // Verify ownership
    if ((portfolio.creators as any).profile_id !== user.id) {
      return {
        success: false,
        error: "Unauthorized",
        message: "You can only analyze your own portfolio",
      };
    }

    // Check for recent analysis (limit to once per 24 hours)
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const { data: recentAnalysis } = await supabase
      .from("analysis_jobs")
      .select("id, created_at, status")
      .eq("portfolio_id", validatedData.portfolioId)
      .eq("status", "completed")
      .gte("created_at", twentyFourHoursAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    if (recentAnalysis && recentAnalysis.length > 0) {
      const nextAvailable = new Date(recentAnalysis[0].created_at);
      nextAvailable.setHours(nextAvailable.getHours() + 24);

      return {
        success: true,
        data: {
          allowed: false,
          message:
            "Portfolio was analyzed recently. Please wait 24 hours between analyses.",
          nextAvailableTime: nextAvailable.toISOString(),
        },
        message: "Analysis not allowed at this time",
      };
    }

    // Check if there's an active analysis job
    const { data: activeJob } = await supabase
      .from("analysis_jobs")
      .select("id, status")
      .eq("portfolio_id", validatedData.portfolioId)
      .in("status", ["pending", "processing"])
      .order("created_at", { ascending: false })
      .limit(1);

    if (activeJob && activeJob.length > 0) {
      return {
        success: true,
        data: {
          allowed: false,
          message: "Analysis is already in progress for this portfolio.",
        },
        message: "Analysis already in progress",
      };
    }

    return {
      success: true,
      data: {
        allowed: true,
        message: "Portfolio is ready for analysis",
      },
      message: "Analysis allowed",
    };
  } catch (error: any) {
    console.error("Error in canAnalyzePortfolioAction:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation failed",
        message: error.errors.map((e) => e.message).join(", "),
      };
    }

    return {
      success: false,
      error: error.message,
      message: "An unexpected error occurred",
    };
  }
}

/**
 * Start portfolio analysis
 */
export async function startPortfolioAnalysisAction(portfolioId: string) {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "Authentication required",
        message: "You must be logged in to start analysis",
      };
    }

    // Validate input
    const validatedData = portfolioAnalysisSchema.parse({ portfolioId });

    // Check if analysis is allowed
    const canAnalyzeResult = await canAnalyzePortfolioAction(
      validatedData.portfolioId
    );
    if (!canAnalyzeResult.success || !canAnalyzeResult.data?.allowed) {
      return {
        success: false,
        error: "Analysis not allowed",
        message:
          canAnalyzeResult.data?.message ||
          "Cannot start analysis at this time",
      };
    }

    // Get portfolio and creator info
    const { data: portfolio, error: portfolioError } = await supabase
      .from("portfolios")
      .select(
        `
        id,
        creator_id,
        creators!inner (
          profile_id
        )
      `
      )
      .eq("id", validatedData.portfolioId)
      .single();

    if (portfolioError || !portfolio) {
      return {
        success: false,
        error: "Portfolio not found",
        message: "The specified portfolio does not exist",
      };
    }

    // Create analysis job
    const { data: job, error: jobError } = await supabase
      .from("analysis_jobs")
      .insert({
        portfolio_id: validatedData.portfolioId,
        creator_id: portfolio.creator_id,
        status: "pending",
        progress: 0,
      })
      .select()
      .single();

    if (jobError) {
      console.error("Error creating analysis job:", jobError);
      return {
        success: false,
        error: "Failed to create analysis job",
        message: "An error occurred while starting the analysis",
      };
    }

    try {
      // Trigger the portfolio analysis task using Trigger.dev
      if (tasks) {
        const handle = await tasks.trigger("portfolio-analysis", {
          portfolioId: validatedData.portfolioId,
          userId: user.id,
          jobId: job.id,
        });

        // Update job with handle ID
        await supabase
          .from("analysis_jobs")
          .update({
            status: "processing",
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);

        return {
          success: true,
          data: {
            job_id: job.id,
            status: "pending",
            handleId: handle.id,
          },
          message: "Portfolio analysis started successfully",
        };
      } else {
        // Trigger.dev not available - update job status but don't fail
        await supabase
          .from("analysis_jobs")
          .update({
            status: "failed",
            status_message:
              "Trigger.dev SDK not available - analysis cannot be processed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);

        return {
          success: false,
          error: "Analysis service unavailable",
          message:
            "Analysis service is not configured. Please contact support.",
        };
      }
    } catch (triggerError: any) {
      console.error("Error triggering portfolio analysis:", triggerError);

      // Update job status to failed
      await supabase
        .from("analysis_jobs")
        .update({
          status: "failed",
          status_message: `Failed to start analysis: ${triggerError.message}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      return {
        success: false,
        error: "Failed to start analysis",
        message: "An error occurred while starting the analysis process",
      };
    }
  } catch (error: any) {
    console.error("Error in startPortfolioAnalysisAction:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation failed",
        message: error.errors.map((e) => e.message).join(", "),
      };
    }

    return {
      success: false,
      error: error.message,
      message: "An unexpected error occurred",
    };
  }
}

/**
 * Get portfolio analysis results
 */
export async function getPortfolioAnalysisResultsAction(portfolioId: string) {
  try {
    const supabase = await createClient();

    // Validate input
    const validatedData = portfolioAnalysisSchema.parse({ portfolioId });

    // Get portfolio with analysis
    const { data: portfolio, error: portfolioError } = await supabase
      .from("portfolios")
      .select("id, creator_id, ai_analysis")
      .eq("id", validatedData.portfolioId)
      .single();

    if (portfolioError || !portfolio) {
      return {
        success: false,
        error: "Portfolio not found",
        message: "The specified portfolio does not exist",
      };
    }

    // Check for active analysis job
    const { data: activeJob } = await supabase
      .from("analysis_jobs")
      .select("id, status, progress, status_message")
      .eq("portfolio_id", validatedData.portfolioId)
      .in("status", ["pending", "processing"])
      .order("created_at", { ascending: false })
      .limit(1);

    if (activeJob && activeJob.length > 0) {
      return {
        success: true,
        data: {
          has_analysis: portfolio.ai_analysis !== null,
          analysis: portfolio.ai_analysis,
          job: activeJob[0],
        },
        message: "Analysis in progress",
      };
    }

    return {
      success: true,
      data: {
        has_analysis: portfolio.ai_analysis !== null,
        analysis: portfolio.ai_analysis,
      },
      message: "Analysis results retrieved successfully",
    };
  } catch (error: any) {
    console.error("Error in getPortfolioAnalysisResultsAction:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation failed",
        message: error.errors.map((e) => e.message).join(", "),
      };
    }

    return {
      success: false,
      error: error.message,
      message: "An unexpected error occurred",
    };
  }
}

/**
 * Start project analysis
 */
export async function startProjectAnalysisAction(projectId: string) {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "Authentication required",
        message: "You must be logged in to start analysis",
      };
    }

    // Validate input
    const validatedData = projectAnalysisSchema.parse({ projectId });

    // Check if project exists and verify ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select(
        `
        id,
        creator_id,
        creators!inner (
          profile_id
        )
      `
      )
      .eq("id", validatedData.projectId)
      .single();

    if (projectError || !project) {
      return {
        success: false,
        error: "Project not found",
        message: "The specified project does not exist",
      };
    }

    // Verify ownership
    if ((project.creators as any).profile_id !== user.id) {
      return {
        success: false,
        error: "Unauthorized",
        message: "You can only analyze your own projects",
      };
    }

    // Check for existing active analysis
    const { data: activeJob } = await supabase
      .from("analysis_jobs")
      .select("id, status")
      .eq("project_id", validatedData.projectId)
      .in("status", ["pending", "processing"])
      .order("created_at", { ascending: false })
      .limit(1);

    if (activeJob && activeJob.length > 0) {
      return {
        success: true,
        data: {
          job_id: activeJob[0].id,
          status: activeJob[0].status,
        },
        message: "Analysis is already in progress for this project",
      };
    }

    // Create analysis job
    const { data: job, error: jobError } = await supabase
      .from("analysis_jobs")
      .insert({
        project_id: validatedData.projectId,
        creator_id: project.creator_id,
        status: "pending",
        progress: 0,
      })
      .select()
      .single();

    if (jobError) {
      console.error("Error creating project analysis job:", jobError);
      return {
        success: false,
        error: "Failed to create analysis job",
        message: "An error occurred while starting the analysis",
      };
    }

    try {
      // Trigger the project analysis task using Trigger.dev
      if (tasks) {
        const handle = await tasks.trigger("project-analysis", {
          projectId: validatedData.projectId,
          userId: user.id,
          jobId: job.id,
        });

        // Update job with handle ID
        await supabase
          .from("analysis_jobs")
          .update({
            status: "processing",
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);

        return {
          success: true,
          data: {
            job_id: job.id,
            status: "pending",
            handleId: handle.id,
          },
          message: "Project analysis started successfully",
        };
      } else {
        // Trigger.dev not available - update job status but don't fail
        await supabase
          .from("analysis_jobs")
          .update({
            status: "failed",
            status_message:
              "Trigger.dev SDK not available - analysis cannot be processed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);

        return {
          success: false,
          error: "Analysis service unavailable",
          message:
            "Analysis service is not configured. Please contact support.",
        };
      }
    } catch (triggerError: any) {
      console.error("Error triggering project analysis:", triggerError);

      // Update job status to failed
      await supabase
        .from("analysis_jobs")
        .update({
          status: "failed",
          status_message: `Failed to start analysis: ${triggerError.message}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      return {
        success: false,
        error: "Failed to start analysis",
        message: "An error occurred while starting the analysis process",
      };
    }
  } catch (error: any) {
    console.error("Error in startProjectAnalysisAction:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation failed",
        message: error.errors.map((e) => e.message).join(", "),
      };
    }

    return {
      success: false,
      error: error.message,
      message: "An unexpected error occurred",
    };
  }
}

/**
 * Get analysis job status
 */
export async function getAnalysisJobStatusAction(jobId: string) {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "Authentication required",
        message: "You must be logged in to check job status",
      };
    }

    // Validate input
    const validatedData = jobStatusSchema.parse({ jobId });

    // Get job with ownership verification
    const { data: job, error: jobError } = await supabase
      .from("analysis_jobs")
      .select(
        `
        id,
        portfolio_id,
        project_id,
        creator_id,
        status,
        progress,
        status_message,
        created_at,
        updated_at,
        creators!inner (
          profile_id
        )
      `
      )
      .eq("id", validatedData.jobId)
      .single();

    if (jobError || !job) {
      return {
        success: false,
        error: "Job not found",
        message: "The specified analysis job does not exist",
      };
    }

    // Verify ownership
    if ((job.creators as any).profile_id !== user.id) {
      return {
        success: false,
        error: "Unauthorized",
        message: "You can only check the status of your own analysis jobs",
      };
    }

    return {
      success: true,
      data: {
        id: job.id,
        portfolio_id: job.portfolio_id,
        project_id: job.project_id,
        status: job.status,
        progress: job.progress,
        status_message: job.status_message,
        created_at: job.created_at,
        updated_at: job.updated_at,
      },
      message: "Job status retrieved successfully",
    };
  } catch (error: any) {
    console.error("Error in getAnalysisJobStatusAction:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation failed",
        message: error.errors.map((e) => e.message).join(", "),
      };
    }

    return {
      success: false,
      error: error.message,
      message: "An unexpected error occurred",
    };
  }
}

/**
 * Get creator analytics
 */
export async function getCreatorAnalyticsAction(username: string) {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "Authentication required",
        message: "You must be logged in to view analytics",
      };
    }

    // Get creator and verify ownership
    const { data: creator, error: creatorError } = await supabase
      .from("creators")
      .select("id, profile_id, username")
      .eq("username", username)
      .single();

    if (creatorError || !creator) {
      return {
        success: false,
        error: "Creator not found",
        message: "The specified creator does not exist",
      };
    }

    // Verify ownership
    if (creator.profile_id !== user.id) {
      return {
        success: false,
        error: "Unauthorized",
        message: "You can only view your own analytics",
      };
    }

    // Get project count
    const { count: totalProjects, error: projectCountError } = await supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", creator.id);

    if (projectCountError) {
      console.error("Error counting projects:", projectCountError);
    }

    // Get media count
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("id")
      .eq("creator_id", creator.id);

    if (projectsError) {
      console.error("Error fetching projects:", projectsError);
    }

    let totalMedia = 0;
    if (projects) {
      const projectIds = projects.map((p) => p.id);

      // Count images
      const { count: imageCount } = await supabase
        .from("images")
        .select("id", { count: "exact", head: true })
        .in("project_id", projectIds);

      // Count videos
      const { count: videoCount } = await supabase
        .from("videos")
        .select("id", { count: "exact", head: true })
        .in("project_id", projectIds);

      totalMedia = (imageCount || 0) + (videoCount || 0);
    }

    // Get top projects (by media count)
    const { data: topProjects, error: topProjectsError } = await supabase
      .from("projects")
      .select(
        `
        id,
        title,
        thumbnail_url,
        created_at,
        featured
      `
      )
      .eq("creator_id", creator.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (topProjectsError) {
      console.error("Error fetching top projects:", topProjectsError);
    }

    // Get recent activity (recent projects)
    const { data: recentActivity, error: recentActivityError } = await supabase
      .from("projects")
      .select(
        `
        id,
        title,
        created_at,
        updated_at
      `
      )
      .eq("creator_id", creator.id)
      .order("updated_at", { ascending: false })
      .limit(10);

    if (recentActivityError) {
      console.error("Error fetching recent activity:", recentActivityError);
    }

    // Calculate this month's metrics
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const { count: projectsThisMonth } = await supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", creator.id)
      .gte("created_at", thisMonth.toISOString());

    const analytics: CreatorAnalytics = {
      profile_views: 0, // TODO: Implement view tracking
      project_views: 0, // TODO: Implement view tracking
      total_projects: totalProjects || 0,
      total_media: totalMedia,
      engagement_rate: 0, // TODO: Implement engagement tracking
      top_projects: topProjects || [],
      recent_activity: recentActivity || [],
      growth_metrics: {
        projects_this_month: projectsThisMonth || 0,
        views_this_month: 0, // TODO: Implement view tracking
        engagement_this_month: 0, // TODO: Implement engagement tracking
      },
    };

    return {
      success: true,
      data: analytics,
      message: "Creator analytics retrieved successfully",
    };
  } catch (error: any) {
    console.error("Error in getCreatorAnalyticsAction:", error);
    return {
      success: false,
      error: error.message,
      message: "An unexpected error occurred",
    };
  }
}

/**
 * Get project analytics
 */
export async function getProjectAnalyticsAction(projectId: string) {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "Authentication required",
        message: "You must be logged in to view analytics",
      };
    }

    // Validate input
    const validatedData = projectAnalysisSchema.parse({ projectId });

    // Get project and verify ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select(
        `
        id,
        title,
        description,
        created_at,
        updated_at,
        featured,
        thumbnail_url,
        creators!inner (
          profile_id,
          username
        )
      `
      )
      .eq("id", validatedData.projectId)
      .single();

    if (projectError || !project) {
      return {
        success: false,
        error: "Project not found",
        message: "The specified project does not exist",
      };
    }

    // Verify ownership
    if ((project.creators as any).profile_id !== user.id) {
      return {
        success: false,
        error: "Unauthorized",
        message: "You can only view analytics for your own projects",
      };
    }

    // Get media counts
    const { count: imageCount } = await supabase
      .from("images")
      .select("id", { count: "exact", head: true })
      .eq("project_id", validatedData.projectId);

    const { count: videoCount } = await supabase
      .from("videos")
      .select("id", { count: "exact", head: true })
      .eq("project_id", validatedData.projectId);

    // Get recent media
    const { data: recentImages } = await supabase
      .from("images")
      .select("id, title, url, created_at")
      .eq("project_id", validatedData.projectId)
      .order("created_at", { ascending: false })
      .limit(3);

    const { data: recentVideos } = await supabase
      .from("videos")
      .select("id, title, url, created_at")
      .eq("project_id", validatedData.projectId)
      .order("created_at", { ascending: false })
      .limit(3);

    const analytics = {
      project: {
        id: project.id,
        title: project.title,
        description: project.description,
        created_at: project.created_at,
        updated_at: project.updated_at,
        featured: project.featured,
        thumbnail_url: project.thumbnail_url,
      },
      media_counts: {
        images: imageCount || 0,
        videos: videoCount || 0,
        total: (imageCount || 0) + (videoCount || 0),
      },
      recent_media: [
        ...(recentImages || []).map((img) => ({ ...img, type: "image" })),
        ...(recentVideos || []).map((vid) => ({ ...vid, type: "video" })),
      ].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
      // TODO: Add view counts, engagement metrics when implemented
      views: 0,
      engagement: 0,
      performance_score: 0,
    };

    return {
      success: true,
      data: analytics,
      message: "Project analytics retrieved successfully",
    };
  } catch (error: any) {
    console.error("Error in getProjectAnalyticsAction:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation failed",
        message: error.errors.map((e) => e.message).join(", "),
      };
    }

    return {
      success: false,
      error: error.message,
      message: "An unexpected error occurred",
    };
  }
}

/**
 * Cancel analysis job
 */
export async function cancelAnalysisJobAction(jobId: string) {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "Authentication required",
        message: "You must be logged in to cancel analysis jobs",
      };
    }

    // Validate input
    const validatedData = jobStatusSchema.parse({ jobId });

    // Get job and verify ownership
    const { data: job, error: jobError } = await supabase
      .from("analysis_jobs")
      .select(
        `
        id,
        status,
        creators!inner (
          profile_id
        )
      `
      )
      .eq("id", validatedData.jobId)
      .single();

    if (jobError || !job) {
      return {
        success: false,
        error: "Job not found",
        message: "The specified analysis job does not exist",
      };
    }

    // Verify ownership
    if ((job.creators as any).profile_id !== user.id) {
      return {
        success: false,
        error: "Unauthorized",
        message: "You can only cancel your own analysis jobs",
      };
    }

    // Check if job can be cancelled
    if (job.status !== "pending" && job.status !== "processing") {
      return {
        success: false,
        error: "Cannot cancel job",
        message: "Only pending or processing jobs can be cancelled",
      };
    }

    // Update job status to cancelled
    const { error: updateError } = await supabase
      .from("analysis_jobs")
      .update({
        status: "cancelled",
        status_message: "Cancelled by user",
        updated_at: new Date().toISOString(),
      })
      .eq("id", validatedData.jobId);

    if (updateError) {
      console.error("Error cancelling analysis job:", updateError);
      return {
        success: false,
        error: "Failed to cancel job",
        message: "An error occurred while cancelling the analysis job",
      };
    }

    return {
      success: true,
      message: "Analysis job cancelled successfully",
    };
  } catch (error: any) {
    console.error("Error in cancelAnalysisJobAction:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation failed",
        message: error.errors.map((e) => e.message).join(", "),
      };
    }

    return {
      success: false,
      error: error.message,
      message: "An unexpected error occurred",
    };
  }
}

/**
 * Export analytics data
 */
export async function exportAnalyticsAction(
  username: string,
  format: "json" | "csv" = "json"
) {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "Authentication required",
        message: "You must be logged in to export analytics",
      };
    }

    // Get creator analytics
    const analyticsResult = await getCreatorAnalyticsAction(username);
    if (!analyticsResult.success) {
      return analyticsResult;
    }

    // Get all projects with detailed analytics
    const { data: creator } = await supabase
      .from("creators")
      .select("id")
      .eq("username", username)
      .single();

    if (!creator) {
      return {
        success: false,
        error: "Creator not found",
        message: "The specified creator does not exist",
      };
    }

    const { data: projects } = await supabase
      .from("projects")
      .select(
        `
        id,
        title,
        description,
        created_at,
        updated_at,
        featured
      `
      )
      .eq("creator_id", creator.id)
      .order("created_at", { ascending: false });

    const exportData = {
      creator: {
        username,
        export_date: new Date().toISOString(),
      },
      analytics: analyticsResult.data,
      projects: projects || [],
      metadata: {
        format,
        version: "1.0",
        total_projects: projects?.length || 0,
      },
    };

    return {
      success: true,
      data: exportData,
      message: "Analytics data exported successfully",
    };
  } catch (error: any) {
    console.error("Error in exportAnalyticsAction:", error);
    return {
      success: false,
      error: error.message,
      message: "An unexpected error occurred",
    };
  }
}

// Legacy function names for backward compatibility
export async function canAnalyzePortfolio(portfolioId: string) {
  return canAnalyzePortfolioAction(portfolioId);
}

export async function startPortfolioAnalysis(portfolioId: string) {
  return startPortfolioAnalysisAction(portfolioId);
}

export async function getPortfolioAnalysisResults(portfolioId: string) {
  return getPortfolioAnalysisResultsAction(portfolioId);
}

export async function startProjectAnalysis(projectId: string) {
  return startProjectAnalysisAction(projectId);
}

export async function getAnalysisJobStatus(jobId: string) {
  return getAnalysisJobStatusAction(jobId);
}
