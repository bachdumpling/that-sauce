"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { tasks } from "@trigger.dev/sdk/v3";

// Validation schemas
const urlSchema = z.string().url("Invalid URL format");

const scrapeRequestSchema = z.object({
  url: z.string().url("Invalid URL format"),
  projectId: z.string().uuid("Invalid project ID").optional(),
  autoImport: z.boolean().default(false),
  extractImages: z.boolean().default(true),
  extractVideos: z.boolean().default(true),
  maxImages: z.number().min(1).max(50).default(20),
  maxVideos: z.number().min(1).max(10).default(5),
});

const batchScrapeSchema = z.object({
  urls: z.array(z.string().url("Invalid URL format")).min(1).max(10),
  projectId: z.string().uuid("Invalid project ID").optional(),
  autoImport: z.boolean().default(false),
  extractImages: z.boolean().default(true),
  extractVideos: z.boolean().default(true),
});

const importMediaSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  url: z.string().url("Invalid media URL"),
  mediaType: z.enum(["image", "video"]),
  title: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Extract media from a URL using the scraper service
 */
export async function extractMediaFromUrlAction(
  requestData: z.infer<typeof scrapeRequestSchema>
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
        message: "You must be logged in to extract media",
      };
    }

    // Validate input data
    const validatedData = scrapeRequestSchema.parse(requestData);

    // If projectId is provided, verify ownership
    if (validatedData.projectId) {
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("id, creator_id, creators!inner(profile_id)")
        .eq("id", validatedData.projectId)
        .single();

      if (projectError || !project) {
        return {
          success: false,
          error: "Project not found",
          message: "The specified project does not exist",
        };
      }

      if (project.creators.profile_id !== user.id) {
        return {
          success: false,
          error: "Unauthorized",
          message: "You can only extract media to your own projects",
        };
      }
    }

    // Log the scraping request
    const { data: scrapeLog, error: logError } = await supabase
      .from("scrape_logs")
      .insert({
        user_id: user.id,
        url: validatedData.url,
        project_id: validatedData.projectId,
        auto_import: validatedData.autoImport,
        status: "pending",
        settings: {
          extractImages: validatedData.extractImages,
          extractVideos: validatedData.extractVideos,
          maxImages: validatedData.maxImages,
          maxVideos: validatedData.maxVideos,
        },
      })
      .select()
      .single();

    if (logError) {
      console.error("Error logging scrape request:", logError);
      // Continue anyway, don't fail the request
    }

    try {
      // Trigger the scraper task using Trigger.dev
      const handle = await tasks.trigger("website-scraper", {
        url: validatedData.url,
        projectId: validatedData.projectId,
        userId: user.id,
        autoImport: validatedData.autoImport,
        settings: {
          extractImages: validatedData.extractImages,
          extractVideos: validatedData.extractVideos,
          maxImages: validatedData.maxImages,
          maxVideos: validatedData.maxVideos,
        },
        scrapeLogId: scrapeLog?.id,
      });

      // Update scrape log with handle ID
      if (scrapeLog) {
        await supabase
          .from("scrape_logs")
          .update({
            handle_id: handle.id,
            status: "running",
          })
          .eq("id", scrapeLog.id);
      }

      return {
        success: true,
        data: {
          handleId: handle.id,
          publicAccessToken: handle.publicAccessToken,
          status: "pending",
          url: validatedData.url,
          scrapeLogId: scrapeLog?.id,
        },
        message: "Media extraction started successfully",
      };
    } catch (triggerError: any) {
      console.error("Error triggering scraper task:", triggerError);

      // Update scrape log with error
      if (scrapeLog) {
        await supabase
          .from("scrape_logs")
          .update({
            status: "failed",
            error_message: triggerError.message,
          })
          .eq("id", scrapeLog.id);
      }

      return {
        success: false,
        error: "Failed to start extraction",
        message:
          "An error occurred while starting the media extraction process",
      };
    }
  } catch (error: any) {
    console.error("Error in extractMediaFromUrlAction:", error);

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
 * Batch extract media from multiple URLs
 */
export async function batchExtractMediaAction(
  requestData: z.infer<typeof batchScrapeSchema>
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
        message: "You must be logged in to extract media",
      };
    }

    // Validate input data
    const validatedData = batchScrapeSchema.parse(requestData);

    // If projectId is provided, verify ownership
    if (validatedData.projectId) {
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("id, creator_id, creators!inner(profile_id)")
        .eq("id", validatedData.projectId)
        .single();

      if (projectError || !project) {
        return {
          success: false,
          error: "Project not found",
          message: "The specified project does not exist",
        };
      }

      if (project.creators.profile_id !== user.id) {
        return {
          success: false,
          error: "Unauthorized",
          message: "You can only extract media to your own projects",
        };
      }
    }

    const results = [];
    const errors = [];

    // Process each URL
    for (const url of validatedData.urls) {
      try {
        const result = await extractMediaFromUrlAction({
          url,
          projectId: validatedData.projectId,
          autoImport: validatedData.autoImport,
          extractImages: validatedData.extractImages,
          extractVideos: validatedData.extractVideos,
        });

        if (result.success) {
          results.push({ url, ...result.data });
        } else {
          errors.push({ url, error: result.error });
        }
      } catch (error: any) {
        errors.push({ url, error: error.message });
      }
    }

    return {
      success: true,
      data: {
        successful: results,
        failed: errors,
        totalUrls: validatedData.urls.length,
        successCount: results.length,
        errorCount: errors.length,
      },
      message: `Batch extraction started: ${results.length} successful, ${errors.length} failed`,
    };
  } catch (error: any) {
    console.error("Error in batchExtractMediaAction:", error);

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
 * Import media from URL to a project
 */
export async function importMediaFromUrlAction(
  requestData: z.infer<typeof importMediaSchema>
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
        message: "You must be logged in to import media",
      };
    }

    // Validate input data
    const validatedData = importMediaSchema.parse(requestData);

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, creator_id, creators!inner(profile_id)")
      .eq("id", validatedData.projectId)
      .single();

    if (projectError || !project) {
      return {
        success: false,
        error: "Project not found",
        message: "The specified project does not exist",
      };
    }

    if (project.creators.profile_id !== user.id) {
      return {
        success: false,
        error: "Unauthorized",
        message: "You can only import media to your own projects",
      };
    }

    // Get the next order for media in this project
    const { data: lastMedia } = await supabase
      .from(validatedData.mediaType === "image" ? "images" : "videos")
      .select("order")
      .eq("project_id", validatedData.projectId)
      .order("order", { ascending: false })
      .limit(1)
      .single();

    const nextOrder = (lastMedia?.order || 0) + 1;

    // Create media record
    const mediaData = {
      project_id: validatedData.projectId,
      url: validatedData.url,
      title: validatedData.title || `Imported ${validatedData.mediaType}`,
      description: validatedData.description,
      order: nextOrder,
      metadata: validatedData.metadata || {},
      imported_from_url: true,
    };

    const tableName = validatedData.mediaType === "image" ? "images" : "videos";
    const { data, error } = await supabase
      .from(tableName)
      .insert([mediaData])
      .select()
      .single();

    if (error) {
      console.error("Error importing media:", error);
      return {
        success: false,
        error: "Failed to import media",
        message: "An error occurred while importing the media",
      };
    }

    // Get creator username for revalidation
    const { data: creator } = await supabase
      .from("creators")
      .select("username")
      .eq("profile_id", user.id)
      .single();

    // Revalidate project paths
    if (creator) {
      revalidatePath(
        `/${creator.username}/work/${validatedData.projectId}`,
        "page"
      );
    }

    return {
      success: true,
      data,
      message: "Media imported successfully",
    };
  } catch (error: any) {
    console.error("Error in importMediaFromUrlAction:", error);

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
 * Get scraping history for the current user
 */
export async function getScrapingHistoryAction(options?: {
  page?: number;
  limit?: number;
  status?: "pending" | "running" | "completed" | "failed";
}) {
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
        message: "You must be logged in to view scraping history",
      };
    }

    const { page = 1, limit = 20, status } = options || {};

    let query = supabase
      .from("scrape_logs")
      .select(
        `
        *,
        projects (
          id,
          title
        )
      `,
        { count: "exact" }
      )
      .eq("user_id", user.id);

    // Add status filter
    if (status) {
      query = query.eq("status", status);
    }

    // Add pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching scraping history:", error);
      return {
        success: false,
        error: "Failed to fetch history",
        message: "An error occurred while retrieving scraping history",
      };
    }

    return {
      success: true,
      data: {
        history: data,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      },
      message: "Scraping history retrieved successfully",
    };
  } catch (error: any) {
    console.error("Error in getScrapingHistoryAction:", error);
    return {
      success: false,
      error: error.message,
      message: "An unexpected error occurred",
    };
  }
}

/**
 * Get scraping analytics for the current user
 */
export async function getScrapingAnalyticsAction() {
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

    // Get total scrapes count
    const { count: totalScrapes, error: totalError } = await supabase
      .from("scrape_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (totalError) {
      console.error("Error counting total scrapes:", totalError);
      return {
        success: false,
        error: "Failed to get analytics",
        message: "An error occurred while retrieving analytics",
      };
    }

    // Get scrapes by status
    const { data: statusCounts, error: statusError } = await supabase
      .from("scrape_logs")
      .select("status")
      .eq("user_id", user.id);

    if (statusError) {
      console.error("Error getting status counts:", statusError);
      return {
        success: false,
        error: "Failed to get analytics",
        message: "An error occurred while retrieving analytics",
      };
    }

    const statusBreakdown = statusCounts.reduce(
      (acc, log) => {
        acc[log.status] = (acc[log.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Get recent scrapes
    const { data: recentScrapes, error: recentError } = await supabase
      .from("scrape_logs")
      .select(
        `
        id,
        url,
        status,
        created_at,
        projects (
          title
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (recentError) {
      console.error("Error getting recent scrapes:", recentError);
      return {
        success: false,
        error: "Failed to get analytics",
        message: "An error occurred while retrieving analytics",
      };
    }

    // Get scrapes by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: monthlyData, error: monthlyError } = await supabase
      .from("scrape_logs")
      .select("created_at")
      .eq("user_id", user.id)
      .gte("created_at", sixMonthsAgo.toISOString());

    if (monthlyError) {
      console.error("Error getting monthly data:", monthlyError);
      return {
        success: false,
        error: "Failed to get analytics",
        message: "An error occurred while retrieving analytics",
      };
    }

    const monthlyBreakdown = monthlyData.reduce(
      (acc, log) => {
        const month = new Date(log.created_at).toISOString().slice(0, 7); // YYYY-MM
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      success: true,
      data: {
        totalScrapes: totalScrapes || 0,
        statusBreakdown,
        recentScrapes: recentScrapes || [],
        monthlyBreakdown,
        successRate: totalScrapes
          ? Math.round(((statusBreakdown.completed || 0) / totalScrapes) * 100)
          : 0,
      },
      message: "Analytics retrieved successfully",
    };
  } catch (error: any) {
    console.error("Error in getScrapingAnalyticsAction:", error);
    return {
      success: false,
      error: error.message,
      message: "An unexpected error occurred",
    };
  }
}

/**
 * Cancel a running scrape job
 */
export async function cancelScrapeJobAction(scrapeLogId: string) {
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
        message: "You must be logged in to cancel scrape jobs",
      };
    }

    // Get scrape log and verify ownership
    const { data: scrapeLog, error: logError } = await supabase
      .from("scrape_logs")
      .select("id, handle_id, status, user_id")
      .eq("id", scrapeLogId)
      .single();

    if (logError || !scrapeLog) {
      return {
        success: false,
        error: "Scrape job not found",
        message: "The specified scrape job does not exist",
      };
    }

    if (scrapeLog.user_id !== user.id) {
      return {
        success: false,
        error: "Unauthorized",
        message: "You can only cancel your own scrape jobs",
      };
    }

    if (scrapeLog.status !== "pending" && scrapeLog.status !== "running") {
      return {
        success: false,
        error: "Cannot cancel job",
        message: "Only pending or running jobs can be cancelled",
      };
    }

    // Update status to cancelled
    const { error: updateError } = await supabase
      .from("scrape_logs")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", scrapeLogId);

    if (updateError) {
      console.error("Error cancelling scrape job:", updateError);
      return {
        success: false,
        error: "Failed to cancel job",
        message: "An error occurred while cancelling the scrape job",
      };
    }

    // TODO: If we have handle_id, we could try to cancel the Trigger.dev job
    // This would require additional Trigger.dev API integration

    return {
      success: true,
      message: "Scrape job cancelled successfully",
    };
  } catch (error: any) {
    console.error("Error in cancelScrapeJobAction:", error);
    return {
      success: false,
      error: error.message,
      message: "An unexpected error occurred",
    };
  }
}

/**
 * Validate URL for scraping
 */
export async function validateUrlForScrapingAction(url: string) {
  try {
    // Validate URL format
    const validatedUrl = urlSchema.parse(url);

    // Check if URL is accessible
    try {
      const response = await fetch(validatedUrl, {
        method: "HEAD",
        headers: {
          "User-Agent": "ThatSauce-Scraper/1.0",
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: "URL not accessible",
          message: `URL returned status ${response.status}`,
        };
      }

      const contentType = response.headers.get("content-type");
      const isHtml = contentType?.includes("text/html");

      return {
        success: true,
        data: {
          url: validatedUrl,
          accessible: true,
          contentType,
          isHtml,
          canScrape: isHtml,
        },
        message: isHtml
          ? "URL is valid for scraping"
          : "URL is accessible but may not contain scrapeable content",
      };
    } catch (fetchError) {
      return {
        success: false,
        error: "URL not accessible",
        message: "Could not access the provided URL",
      };
    }
  } catch (error: any) {
    console.error("Error in validateUrlForScrapingAction:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Invalid URL",
        message: "Please provide a valid URL",
      };
    }

    return {
      success: false,
      error: error.message,
      message: "An unexpected error occurred",
    };
  }
}
