"use server";

import { Project, Creator } from "@/types";
import { revalidatePath } from "next/cache";
import {
  getProjectByIdServer,
  createProjectServer,
  updateProjectServer,
  deleteProjectServer,
  getProjectMediaServer,
  getProjectDirectFromDB,
} from "@/lib/api/server/projects";
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
    const response = await getProjectMediaServer(projectId, page, limit);

    if (!response.success) {
      console.error("Failed to fetch project media:", response.error);
      return {
        success: false,
        error: response.error || "Failed to fetch media",
      };
    }

    return { success: true, data: response.data };
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
      .select("id, portfolio_id")
      .eq("profile_id", user.id)
      .single();

    if (!creator) {
      return { success: false, error: "Creator profile not found" };
    }

    // Validate required fields
    if (!projectData.title) {
      return { success: false, error: "Project title is required" };
    }

    // Add creator_id and portfolio_id to project data
    const completeProjectData = {
      title: projectData.title,
      description: projectData.description,
      short_description: projectData.short_description,
      roles: projectData.roles,
      client_ids: projectData.client_ids,
      year: projectData.year || undefined,
    };

    const response = await createProjectServer(completeProjectData);

    if (response.success) {
      // Revalidate creator pages to show the new project
      revalidatePath(`/${username}`, "layout");
      revalidatePath(`/${username}/work`, "page");

      return {
        success: true,
        message: "Project created successfully",
        data: response.data,
      };
    } else {
      return {
        success: false,
        message: response.error || "Failed to create project",
        error: response.error,
      };
    }
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

    const response = await updateProjectServer(projectId, projectData);

    console.log("projectData in updateProjectAction", projectData);
    console.log("project update response in updateProjectAction", response);

    if (response.success) {
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
        data: response.data,
      };
    } else {
      return {
        success: false,
        message: response.error || "Failed to update project",
        error: response.error,
      };
    }
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

    const response = await deleteProjectServer(projectId);

    if (response.success) {
      // Revalidate related paths
      revalidatePath(`/${username}`, "layout");
      revalidatePath(`/${username}/work`, "page");

      return {
        success: true,
        message: "Project deleted successfully",
      };
    } else {
      return {
        success: false,
        message: response.error || "Failed to delete project",
        error: response.error,
      };
    }
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
    const response = await getProjectByIdServer(projectId);

    if (!response.success || !response.data) {
      console.error("Project not found:", response.error);
      notFound();
    }

    return response.data;
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
