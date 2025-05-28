"use server";

import { Project, Creator } from "@/types";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

/**
 * Get a project by ID
 */
export async function getProjectByIdAction(projectId: string) {
  try {
    const supabase = await createClient();

    // Get project with all related data
    const { data: project, error } = await supabase
      .from("projects")
      .select(
        `
        *,
        creators!inner (
          id,
          username,
          profile_id
        ),
        images (
          id,
          url,
          alt_text,
          resolutions,
          order,
          created_at,
          updated_at        
        ),
        videos (
          id,
          url,
          title,
          description,
          youtube_id,
          vimeo_id,
          created_at,
          updated_at
        )
      `
      )
      .eq("id", projectId)
      .single();

    if (error) {
      console.error("Failed to fetch project:", error);
      return { success: false, error: "Project not found" };
    }

    // Sort media by order (images) and created_at (videos)
    const sortedImages =
      project.images?.sort((a: any, b: any) => a.order - b.order) || [];
    const sortedVideos =
      project.videos?.sort(
        (a: any, b: any) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ) || [];

    // Remove sensitive fields
    const { embedding, ...sanitizedProject } = project as any;

    return {
      success: true,
      data: {
        ...sanitizedProject,
        images: sortedImages,
        videos: sortedVideos,
      },
    };
  } catch (error: any) {
    console.error("Error in getProjectByIdAction:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    };
  }
}

/**
 * Get a project with full media details
 */
export async function getProjectWithMediaAction(projectId: string) {
  try {
    const supabase = await createClient();

    // Get current user for ownership check
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Get project with all related data
    const { data: project, error } = await supabase
      .from("projects")
      .select(
        `
        *,
        creators!inner (
          id,
          username,
          profile_id
        ),
        images (
          id,
          url,
          alt_text,
          resolutions,
          order,
          created_at,
          updated_at
        ),
        videos (
          id,
          url,
          title,
          description,
          youtube_id,
          vimeo_id,
          created_at,
          updated_at
        )
      `
      )
      .eq("id", projectId)
      .single();

    if (error) {
      console.error("Failed to fetch project with media:", error);
      return { success: false, error: "Project not found" };
    }

    // Check if user is the owner
    const isOwner = user?.id === (project.creators as any).profile_id;

    // Sort media by order (images) and created_at (videos)
    const sortedImages =
      project.images?.sort((a: any, b: any) => a.order - b.order) || [];
    const sortedVideos =
      project.videos?.sort(
        (a: any, b: any) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ) || [];

    return {
      success: true,
      data: {
        ...project,
        images: sortedImages,
        videos: sortedVideos,
        isOwner,
      },
    };
  } catch (error: any) {
    console.error("Error in getProjectWithMediaAction:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    };
  }
}

/**
 * Get project media (images and videos)
 */
export async function getProjectMediaAction(
  projectId: string,
  page = 1,
  limit = 50
) {
  try {
    const supabase = await createClient();

    // Check if project exists
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, title")
      .eq("id", projectId)
      .single();

    if (projectError) {
      console.error("Failed to fetch project:", projectError);
      return {
        success: false,
        error: "Project not found",
      };
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Fetch images with pagination
    const { data: images, error: imagesError } = await supabase
      .from("images")
      .select(
        `
        id,
        url,
        alt_text,
        resolutions,
        order,
        created_at,
        updated_at
      `
      )
      .eq("project_id", projectId)
      .order("order", { ascending: true })
      .range(offset, offset + limit - 1);

    if (imagesError) {
      console.error("Failed to fetch images:", imagesError);
    }

    // Fetch videos with pagination
    const { data: videos, error: videosError } = await supabase
      .from("videos")
      .select(
        `
        id,
        url,
        title,
        description,
        youtube_id,
        vimeo_id,
        created_at,
        updated_at
      `
      )
      .eq("project_id", projectId)
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (videosError) {
      console.error("Failed to fetch videos:", videosError);
    }

    // Get total counts
    const { count: totalImages } = await supabase
      .from("images")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId);

    const { count: totalVideos } = await supabase
      .from("videos")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId);

    return {
      success: true,
      data: {
        project_id: projectId,
        project_title: project.title,
        images: images || [],
        videos: videos || [],
        total: (totalImages || 0) + (totalVideos || 0),
        images_count: totalImages || 0,
        videos_count: totalVideos || 0,
      },
    };
  } catch (error: any) {
    console.error("Error in getProjectMediaAction:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    };
  }
}

/**
 * Create a new project
 */
export async function createProjectAction(
  username: string,
  projectData: Partial<Project>
) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    // Get creator info
    const { data: creator } = await supabase
      .from("creators")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (!creator) {
      return {
        success: false,
        error:
          "Creator profile not found. Please complete your profile setup first by visiting the onboarding page.",
        redirectTo: "/onboarding",
      };
    }

    // Validate required fields
    if (!projectData.title) {
      return { success: false, error: "Project title is required" };
    }

    // Get the creator's portfolio_id
    const { data: portfolio } = await supabase
      .from("portfolios")
      .select("id")
      .eq("creator_id", creator.id)
      .single();

    if (!portfolio) {
      return {
        success: false,
        error: "Portfolio not found. Please complete your profile setup.",
        redirectTo: "/onboarding",
      };
    }

    // Create the project directly in Supabase
    const { data: newProject, error: createError } = await supabase
      .from("projects")
      .insert({
        creator_id: creator.id,
        portfolio_id: portfolio.id,
        title: projectData.title,
        description: projectData.description || "",
        short_description: projectData.short_description || "",
        roles: projectData.roles || [],
        client_ids: projectData.client_ids || [],
        year: projectData.year,
        featured: false,
        order: 0,
        ai_analysis: "",
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating project:", createError);
      return {
        success: false,
        error: "Failed to create project",
        message: createError.message,
      };
    }

    // Revalidate creator pages to show the new project
    revalidatePath(`/${username}`, "layout");
    revalidatePath(`/${username}/work`, "page");

    return {
      success: true,
      message: "Project created successfully",
      data: newProject,
    };
  } catch (error: any) {
    console.error("Error in createProjectAction:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    };
  }
}

/**
 * Update a project
 */
export async function updateProjectAction(
  username: string,
  projectId: string,
  projectData: Partial<Project>
) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    // Verify ownership
    const { data: project } = await supabase
      .from("projects")
      .select(
        `
        id,
        creators!inner (
          profile_id
        )
      `
      )
      .eq("id", projectId)
      .single();

    if (!project || (project.creators as any).profile_id !== user.id) {
      return { success: false, error: "Project not found or access denied" };
    }

    // Prepare update data - only include defined fields
    const updateData: any = {};
    if (projectData.title !== undefined) updateData.title = projectData.title;
    if (projectData.description !== undefined)
      updateData.description = projectData.description;
    if (projectData.short_description !== undefined)
      updateData.short_description = projectData.short_description;
    if (projectData.roles !== undefined) updateData.roles = projectData.roles;
    if (projectData.client_ids !== undefined)
      updateData.client_ids = projectData.client_ids;
    if (projectData.year !== undefined) updateData.year = projectData.year;
    if (projectData.featured !== undefined)
      updateData.featured = projectData.featured;

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return { success: false, error: "No fields to update" };
    }

    // Update the project
    const { data: updatedProject, error: updateError } = await supabase
      .from("projects")
      .update(updateData)
      .eq("id", projectId)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to update project:", updateError);
      return {
        success: false,
        message: "Failed to update project",
        error: updateError.message,
      };
    }

    // Revalidate related paths
    revalidatePath(`/${username}`, "layout");
    revalidatePath(`/${username}/work`, "page");
    revalidatePath(`/${username}/work/${projectId}`, "page");

    // Also revalidate by project title if available
    if (projectData.title) {
      revalidatePath(`/${username}/work/${projectData.title}`, "page");
    }

    return {
      success: true,
      message: "Project updated successfully",
      data: updatedProject,
    };
  } catch (error: any) {
    console.error("Error in updateProjectAction:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    };
  }
}

/**
 * Delete a project
 */
export async function deleteProjectAction(
  username: string,
  projectId: string,
  cascade = true
) {
  try {
    console.log("deleteProjectAction called with:", {
      username,
      projectId,
      cascade,
    });

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log("Current user:", user?.id);

    if (!user) {
      console.log("No user found, returning auth error");
      return { success: false, error: "Authentication required" };
    }

    // Verify ownership
    const { data: project } = await supabase
      .from("projects")
      .select(
        `
        id,
        title,
        creators!inner (
          profile_id
        )
      `
      )
      .eq("id", projectId)
      .single();

    console.log("Project ownership check:", {
      project,
      userProfileId: user.id,
    });

    if (!project || (project.creators as any).profile_id !== user.id) {
      console.log("Ownership verification failed");
      return { success: false, error: "Project not found or access denied" };
    }

    console.log("Starting cascade delete process...");

    // If cascade delete, remove all associated media first
    if (cascade) {
      // Get all media files to delete from storage
      const { data: images } = await supabase
        .from("images")
        .select("url")
        .eq("project_id", projectId);

      const { data: videos } = await supabase
        .from("videos")
        .select("url")
        .eq("project_id", projectId);

      console.log("Found media to delete:", {
        images: images?.length || 0,
        videos: videos?.length || 0,
      });

      // Extract file paths and delete from storage
      const filePaths: string[] = [];

      if (images) {
        images.forEach((image: any) => {
          try {
            const url = new URL(image.url);
            const pathParts = url.pathname.split("/");
            const filePath = pathParts
              .slice(pathParts.indexOf("media") + 1)
              .join("/");
            if (filePath) filePaths.push(filePath);
          } catch (error) {
            console.error("Error parsing image URL:", error);
          }
        });
      }

      if (videos) {
        videos.forEach((video: any) => {
          try {
            const url = new URL(video.url);
            const pathParts = url.pathname.split("/");
            const filePath = pathParts
              .slice(pathParts.indexOf("media") + 1)
              .join("/");
            if (filePath) filePaths.push(filePath);
          } catch (error) {
            console.error("Error parsing video URL:", error);
          }
        });
      }

      console.log("File paths to delete from storage:", filePaths);

      // Delete files from storage
      if (filePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from("media")
          .remove(filePaths);

        if (storageError) {
          console.error("Error deleting files from storage:", storageError);
          // Continue with project deletion even if storage cleanup fails
        } else {
          console.log("Successfully deleted files from storage");
        }
      }

      // Delete media records (this should cascade due to foreign key constraints)
      console.log("Deleting media records...");
      const imageDeleteResult = await supabase
        .from("images")
        .delete()
        .eq("project_id", projectId);
      const videoDeleteResult = await supabase
        .from("videos")
        .delete()
        .eq("project_id", projectId);

      console.log("Media deletion results:", {
        images: imageDeleteResult.error || "success",
        videos: videoDeleteResult.error || "success",
      });
    }

    console.log("Deleting project record...");

    // Delete the project
    const { error: deleteError } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (deleteError) {
      console.error("Failed to delete project:", deleteError);
      return {
        success: false,
        message: "Failed to delete project",
        error: deleteError.message,
      };
    }

    console.log("Project deleted successfully, revalidating paths...");

    // Revalidate related paths
    revalidatePath(`/${username}`, "layout");
    revalidatePath(`/${username}/work`, "page");

    console.log("Delete operation completed successfully");

    return {
      success: true,
      message: "Project deleted successfully",
    };
  } catch (error: any) {
    console.error("Error in deleteProjectAction:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    };
  }
}

/**
 * Update project media order
 */
export async function updateProjectMediaOrderAction(
  username: string,
  projectId: string,
  mediaUpdates: Array<{ id: string; type: "image" | "video"; order: number }>
) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    // Verify ownership
    const { data: project } = await supabase
      .from("projects")
      .select(
        `
        id,
        creators!inner (
          profile_id
        )
      `
      )
      .eq("id", projectId)
      .single();

    if (!project || (project.creators as any).profile_id !== user.id) {
      return { success: false, error: "Project not found or access denied" };
    }

    // Update media order (only for images, videos don't have order column)
    const updatePromises = mediaUpdates
      .filter((update) => update.type === "image") // Only update images
      .map(async (update) => {
        return supabase
          .from("images")
          .update({ order: update.order })
          .eq("id", update.id)
          .eq("project_id", projectId);
      });

    const results = await Promise.all(updatePromises);

    // Check for errors
    const errors = results.filter((result) => result.error);
    if (errors.length > 0) {
      console.error("Error updating media order:", errors);
      return { success: false, error: "Failed to update media order" };
    }

    // Revalidate project page
    revalidatePath(`/${username}/work/${projectId}`, "page");

    return {
      success: true,
      message: "Media order updated successfully",
    };
  } catch (error: any) {
    console.error("Error in updateProjectMediaOrderAction:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    };
  }
}

/**
 * Get project analytics
 */
export async function getProjectAnalyticsAction(projectId: string) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    // Verify ownership
    const { data: project } = await supabase
      .from("projects")
      .select(
        `
        id,
        title,
        created_at,
        creators!inner (
          profile_id
        )
      `
      )
      .eq("id", projectId)
      .single();

    if (!project || (project.creators as any).profile_id !== user.id) {
      return { success: false, error: "Project not found or access denied" };
    }

    // Get media counts
    const { data: images } = await supabase
      .from("images")
      .select("id")
      .eq("project_id", projectId);

    const { data: videos } = await supabase
      .from("videos")
      .select("id")
      .eq("project_id", projectId);

    // TODO: Add view counts, engagement metrics when implemented
    const analytics = {
      project_id: projectId,
      title: project.title,
      created_at: project.created_at,
      media_counts: {
        images: images?.length || 0,
        videos: videos?.length || 0,
        total: (images?.length || 0) + (videos?.length || 0),
      },
      // Placeholder for future analytics
      views: 0,
      engagement: 0,
      last_updated: new Date().toISOString(),
    };

    return {
      success: true,
      data: analytics,
    };
  } catch (error: any) {
    console.error("Error in getProjectAnalyticsAction:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    };
  }
}

/**
 * Check if a project exists - Use in middleware or layout
 * This throws notFound() if the project doesn't exist
 */
export async function checkProjectExistsAction(
  projectId: string
): Promise<Project> {
  try {
    const supabase = await createClient();

    const { data: project, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (error || !project) {
      console.error("Project not found:", error);
      notFound();
    }

    return project;
  } catch (error) {
    console.error("Error checking if project exists:", error);
    notFound();
  }
}

/**
 * Get user's projects with pagination
 */
export async function getUserProjectsAction(
  userId?: string,
  page = 1,
  limit = 10
) {
  try {
    const supabase = await createClient();

    // Get current user if userId not provided
    let targetUserId = userId;
    if (!targetUserId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: "Authentication required" };
      }
      targetUserId = user.id;
    }

    // Get creator ID
    const { data: creator } = await supabase
      .from("creators")
      .select("id")
      .eq("profile_id", targetUserId)
      .single();

    if (!creator) {
      return { success: false, error: "Creator profile not found" };
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Get projects with count
    const {
      data: projects,
      error,
      count,
    } = await supabase
      .from("projects")
      .select(
        `
        *,
        images (id, url, alt_text, order),
        videos (id, url, title)
      `,
        { count: "exact" }
      )
      .eq("creator_id", creator.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Failed to fetch user projects:", error);
      return { success: false, error: "Failed to fetch projects" };
    }

    return {
      success: true,
      data: {
        projects: projects || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  } catch (error: any) {
    console.error("Error in getUserProjectsAction:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    };
  }
}
