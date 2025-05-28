import { serverApiRequest } from "./apiServer";
import { API_ENDPOINTS } from "@/lib/api/endpoints/endpoints";
import { Project, ProjectImage, ProjectVideo, ApiResponse } from "@/types";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

// Type for client-safe data (excludes embedding and other sensitive fields)
type WithoutEmbedding<T> = Omit<T, "embedding">;

/**
 * Generic utility to sanitize any object with an embedding field
 */
function sanitizeData<T extends { embedding?: any }>(
  data: T
): WithoutEmbedding<T> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { embedding, ...sanitizedData } = data;
  return sanitizedData as WithoutEmbedding<T>;
}

/**
 * Sanitize a project by removing sensitive fields before sending to client
 */
function sanitizeProject(project: any): WithoutEmbedding<Project> {
  const { embedding, ...sanitizedData } = project;
  return sanitizedData as WithoutEmbedding<Project>;
}

/**
 * Create a new project from the server-side
 * Uses server-side authentication and data fetching
 */
export async function createProjectServer(projectData: {
  title: string;
  description?: string;
  short_description?: string;
  roles?: string[];
  client_ids?: string[];
  year?: number;
}): Promise<ApiResponse<WithoutEmbedding<Project>>> {
  const response = await serverApiRequest.post<Project>(
    API_ENDPOINTS.projects,
    projectData
  );

  if (response.success && response.data) {
    return {
      ...response,
      data: sanitizeProject(response.data),
    };
  }

  return response as ApiResponse<WithoutEmbedding<Project>>;
}

/**
 * Get project by ID from the server-side
 * Uses server-side authentication and data fetching
 */
export async function getProjectByIdServer(
  projectId: string
): Promise<ApiResponse<WithoutEmbedding<Project>>> {
  const response = await serverApiRequest.get<Project>(
    API_ENDPOINTS.getProject(projectId)
  );

  if (response.success && response.data) {
    return {
      ...response,
      data: sanitizeProject(response.data),
    };
  }

  return response as ApiResponse<WithoutEmbedding<Project>>;
}

/**
 * Get project's media from the server-side
 */
export async function getProjectMediaServer(
  projectId: string,
  page = 1,
  limit = 10
): Promise<
  ApiResponse<{
    images: WithoutEmbedding<ProjectImage>[];
    videos: WithoutEmbedding<ProjectVideo>[];
    total: number;
  }>
> {
  const response = await serverApiRequest.get<{
    images: ProjectImage[];
    videos: ProjectVideo[];
    total: number;
  }>(API_ENDPOINTS.getProjectMedia(projectId), { page, limit });

  if (response.success && response.data) {
    // Filter out embedding field from images if present
    const sanitizedImages = response.data.images.map((img) =>
      sanitizeData(img)
    );

    // Filter out embedding field from videos if present
    const sanitizedVideos = response.data.videos.map((vid) =>
      sanitizeData(vid)
    );

    return {
      ...response,
      data: {
        ...response.data,
        images: sanitizedImages,
        videos: sanitizedVideos,
      },
    };
  }

  return response;
}

/**
 * Direct database access for project (server-only functionality)
 */
export async function getProjectDirectFromDB(
  projectId: string
): Promise<WithoutEmbedding<Project> | null> {
  const supabase = await createClient();

  // First verify user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("User not authenticated");
    return null;
  }

  const { data, error } = await supabase
    .from("projects")
    .select("*, creators:creator_id(*), images(*), videos(*)")
    .eq("id", projectId)
    .single();

  if (error) {
    console.error("Error fetching project from DB:", error);
    return null;
  }

  // Sanitize project data before returning to client
  return sanitizeProject(data as Project);
}

/**
 * Update project from the server-side
 */
export async function updateProjectServer(
  projectId: string,
  projectData: Partial<
    WithoutEmbedding<Project> & {
      thumbnail_id?: string;
      thumbnail_url?: string;
    }
  >
): Promise<ApiResponse<WithoutEmbedding<Project>>> {
  const response = await serverApiRequest.put<Project>(
    API_ENDPOINTS.getProject(projectId),
    projectData
  );

  if (response.success && response.data) {
    return {
      ...response,
      data: sanitizeProject(response.data),
    };
  }

  return response as ApiResponse<WithoutEmbedding<Project>>;
}

/**
 * Delete project from the server-side
 */
export async function deleteProjectServer(
  projectId: string
): Promise<ApiResponse<void>> {
  // Always attempt cascade delete from the server action
  return serverApiRequest.delete<void>(API_ENDPOINTS.getProject(projectId), {
    cascade: true,
  });
}

/**
 * Get projects by creator username from the server-side
 */
export async function getProjectsByCreatorServer(
  username: string,
  page = 1,
  limit = 10
): Promise<
  ApiResponse<{ projects: WithoutEmbedding<Project>[]; total: number }>
> {
  const response = await serverApiRequest.get<{
    projects: Project[];
    total: number;
  }>(`${API_ENDPOINTS.getCreatorByUsername(username)}/projects`, {
    page,
    limit,
  });

  if (response.success && response.data) {
    // Sanitize projects
    const sanitizedProjects = response.data.projects.map((project) =>
      sanitizeProject(project)
    );

    return {
      ...response,
      data: {
        ...response.data,
        projects: sanitizedProjects,
      },
    };
  }

  return response as ApiResponse<{
    projects: WithoutEmbedding<Project>[];
    total: number;
  }>;
}

/**
 * Get project by title from a specific creator
 */
export async function getProjectByTitleServer(
  username: string,
  projectTitle: string
): Promise<ApiResponse<WithoutEmbedding<Project>>> {
  const response = await serverApiRequest.get<Project>(
    API_ENDPOINTS.getProjectByTitle(username, projectTitle)
  );

  if (response.success && response.data) {
    return {
      ...response,
      data: sanitizeProject(response.data),
    };
  }

  return response as ApiResponse<WithoutEmbedding<Project>>;
}

/**
 * Update project media order from the server-side
 */
export async function updateProjectMediaOrderServer(
  projectId: string,
  mediaUpdates: Array<{ id: string; type: "image" | "video"; order: number }>
): Promise<ApiResponse<void>> {
  const supabase = await createClient();

  try {
    // Update media order
    const updatePromises = mediaUpdates.map(async (update) => {
      const tableName = update.type === "image" ? "images" : "videos";
      return supabase
        .from(tableName)
        .update({ order: update.order })
        .eq("id", update.id)
        .eq("project_id", projectId);
    });

    const results = await Promise.all(updatePromises);

    // Check for errors
    const errors = results.filter((result) => result.error);
    if (errors.length > 0) {
      console.error("Error updating media order:", errors);
      return {
        success: false,
        data: null,
        error: "Failed to update media order",
      };
    }

    return { success: true, data: null };
  } catch (error: any) {
    console.error("Error in updateProjectMediaOrderServer:", error);
    return { success: false, data: null, error: error.message };
  }
}
