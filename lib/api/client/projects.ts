import { ApiResponse, Project } from "@/types";
import { API_ENDPOINTS } from "@/lib/api/endpoints/endpoints";

// Base client API request function
async function clientApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(endpoint, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    return data as ApiResponse<T>;
  } catch (error) {
    console.error("Client API Error:", error);
    return {
      success: false,
      data: null as T,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Get projects for the current user
 */
export async function getUserProjectsClient(
  page = 1,
  limit = 10,
  userId?: string
): Promise<ApiResponse<{ projects: Project[]; pagination: any }>> {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (userId) {
    queryParams.append("userId", userId);
  }

  return clientApiRequest<{ projects: Project[]; pagination: any }>(
    `${API_ENDPOINTS.projects}?${queryParams}`
  );
}

/**
 * Get a specific project by ID
 */
export async function getProjectByIdClient(
  projectId: string,
  includeOrganizations = false
): Promise<ApiResponse<Project>> {
  const queryParams = new URLSearchParams();
  if (includeOrganizations) {
    queryParams.append("includeOrganizations", "true");
  }

  const endpoint = `${API_ENDPOINTS.getProject(projectId)}${
    queryParams.toString() ? `?${queryParams}` : ""
  }`;

  return clientApiRequest<Project>(endpoint);
}

/**
 * Create a new project
 */
export async function createProjectClient(projectData: {
  title: string;
  description?: string;
  short_description?: string;
  roles?: string[];
  client_ids?: string[];
  year?: number;
}): Promise<ApiResponse<Project>> {
  return clientApiRequest<Project>(API_ENDPOINTS.projects, {
    method: "POST",
    body: JSON.stringify(projectData),
  });
}

/**
 * Update a project
 */
export async function updateProjectClient(
  projectId: string,
  projectData: Partial<Project>
): Promise<ApiResponse<Project>> {
  return clientApiRequest<Project>(API_ENDPOINTS.getProject(projectId), {
    method: "PUT",
    body: JSON.stringify(projectData),
  });
}

/**
 * Delete a project
 */
export async function deleteProjectClient(
  projectId: string,
  cascade = true
): Promise<ApiResponse<void>> {
  const queryParams = new URLSearchParams();
  if (cascade) {
    queryParams.append("cascade", "true");
  }

  const endpoint = `${API_ENDPOINTS.getProject(projectId)}${
    queryParams.toString() ? `?${queryParams}` : ""
  }`;

  return clientApiRequest<void>(endpoint, {
    method: "DELETE",
  });
}

/**
 * Get project media
 */
export async function getProjectMediaClient(projectId: string): Promise<
  ApiResponse<{
    project_id: string;
    project_title: string;
    media: any[];
    total: number;
    images_count: number;
    videos_count: number;
  }>
> {
  return clientApiRequest<{
    project_id: string;
    project_title: string;
    media: any[];
    total: number;
    images_count: number;
    videos_count: number;
  }>(API_ENDPOINTS.getProjectMedia(projectId));
}

/**
 * Upload media to a project
 */
export async function uploadProjectMediaClient(
  projectId: string,
  formData: FormData
): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(API_ENDPOINTS.getProjectMedia(projectId), {
      method: "POST",
      body: formData, // Don't set Content-Type for FormData
    });

    const data = await response.json();
    return data as ApiResponse<any>;
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Update project media metadata
 */
export async function updateProjectMediaClient(
  mediaId: string,
  mediaType: "image" | "video",
  metadata: {
    alt_text?: string;
    title?: string;
    description?: string;
    order?: number;
  }
): Promise<ApiResponse<any>> {
  return clientApiRequest<any>(
    API_ENDPOINTS.media.updateMediaMetadata(mediaId),
    {
      method: "PUT",
      body: JSON.stringify({ ...metadata, media_type: mediaType }),
    }
  );
}

/**
 * Delete project media
 */
export async function deleteProjectMediaClient(
  mediaId: string,
  mediaType: "image" | "video"
): Promise<ApiResponse<void>> {
  const queryParams = new URLSearchParams({
    type: mediaType,
  });

  return clientApiRequest<void>(
    `${API_ENDPOINTS.media.deleteMedia(mediaId)}?${queryParams}`,
    {
      method: "DELETE",
    }
  );
}

/**
 * Batch upload multiple files
 */
export async function batchUploadProjectMediaClient(
  projectId: string,
  files: File[]
): Promise<ApiResponse<{ uploaded: any[]; errors: any[] }>> {
  try {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files`, file);
    });
    formData.append("project_id", projectId);

    const response = await fetch(API_ENDPOINTS.media.batchUploadMedia, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    return data as ApiResponse<{ uploaded: any[]; errors: any[] }>;
  } catch (error) {
    console.error("Batch upload error:", error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Batch upload failed",
    };
  }
}

/**
 * Upload video link (YouTube/Vimeo)
 */
export async function uploadVideoLinkClient(
  projectId: string,
  videoUrl: string,
  metadata?: {
    title?: string;
    description?: string;
    order?: number;
  }
): Promise<ApiResponse<any>> {
  return clientApiRequest<any>(API_ENDPOINTS.media.uploadVideoLink, {
    method: "POST",
    body: JSON.stringify({
      project_id: projectId,
      url: videoUrl,
      ...metadata,
    }),
  });
}

/**
 * Get project analytics
 */
export async function getProjectAnalyticsClient(projectId: string): Promise<
  ApiResponse<{
    project_id: string;
    title: string;
    created_at: string;
    media_counts: {
      images: number;
      videos: number;
      total: number;
    };
    views: number;
    engagement: number;
    last_updated: string;
  }>
> {
  // This would be implemented when analytics endpoints are created
  // For now, return a placeholder
  return {
    success: true,
    data: {
      project_id: projectId,
      title: "Project Analytics",
      created_at: new Date().toISOString(),
      media_counts: {
        images: 0,
        videos: 0,
        total: 0,
      },
      views: 0,
      engagement: 0,
      last_updated: new Date().toISOString(),
    },
  };
}
