import { ApiResponse } from "@/types";
import { MediaUploadResponse, MediaBatchUploadResponse } from "@/types/media";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

// Helper function to build API URLs
function buildApiUrl(endpoint: string): string {
  return `${API_BASE_URL}/api${endpoint}`;
}

// Helper function for API requests
async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API request failed:", error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Helper function for FormData requests
async function apiFormDataRequest<T>(
  url: string,
  formData: FormData,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API FormData request failed:", error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get media details by ID
 */
export async function getMediaDetails(
  mediaId: string,
  mediaType: "image" | "video"
): Promise<ApiResponse<any>> {
  return apiRequest(`/media/${mediaId}?type=${mediaType}`);
}

/**
 * Get multiple media items by IDs
 */
export async function getMultipleMedia(
  mediaIds: string[],
  mediaType?: "image" | "video"
): Promise<ApiResponse<{ media: any[]; total: number; requested: number }>> {
  const idsParam = mediaIds.join(",");
  const typeParam = mediaType ? `&type=${mediaType}` : "";
  return apiRequest(`/media?ids=${idsParam}${typeParam}`);
}

/**
 * Upload single media file
 */
export async function uploadMedia(
  projectId: string,
  file: File,
  metadata?: {
    alt_text?: string;
    title?: string;
    description?: string;
    order?: number;
  }
): Promise<ApiResponse<MediaUploadResponse>> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("project_id", projectId);

  if (metadata?.alt_text) formData.append("alt_text", metadata.alt_text);
  if (metadata?.title) formData.append("title", metadata.title);
  if (metadata?.description)
    formData.append("description", metadata.description);
  if (metadata?.order !== undefined)
    formData.append("order", metadata.order.toString());

  return apiFormDataRequest<MediaUploadResponse>(
    buildApiUrl("/media/upload"),
    formData
  );
}

/**
 * Upload video link (YouTube/Vimeo)
 */
export async function uploadVideoLink(
  projectId: string,
  videoUrl: string,
  metadata?: {
    title?: string;
    description?: string;
    order?: number;
  }
): Promise<ApiResponse<MediaUploadResponse>> {
  return apiRequest<MediaUploadResponse>(buildApiUrl("/media/upload"), {
    method: "POST",
    body: JSON.stringify({
      project_id: projectId,
      video_url: videoUrl,
      ...metadata,
    }),
  });
}

/**
 * Batch upload multiple media files
 */
export async function batchUploadMedia(
  projectId: string,
  files: File[]
): Promise<ApiResponse<MediaBatchUploadResponse>> {
  const formData = new FormData();
  formData.append("project_id", projectId);

  files.forEach((file) => {
    formData.append("files", file);
  });

  return apiFormDataRequest<MediaBatchUploadResponse>(
    buildApiUrl("/media/batch"),
    formData
  );
}

/**
 * Update media metadata
 */
export async function updateMediaMetadata(
  mediaId: string,
  mediaType: "image" | "video",
  projectId: string,
  metadata: {
    alt_text?: string;
    title?: string;
    description?: string;
    order?: number;
    categories?: string[];
  }
): Promise<ApiResponse<any>> {
  return apiRequest(`/media/${mediaId}`, {
    method: "PUT",
    body: JSON.stringify({
      media_type: mediaType,
      project_id: projectId,
      ...metadata,
    }),
  });
}

/**
 * Delete single media item
 */
export async function deleteMedia(
  mediaId: string,
  mediaType: "image" | "video",
  projectId: string
): Promise<ApiResponse<{ id: string; type: string }>> {
  return apiRequest(
    `/media/${mediaId}?type=${mediaType}&project_id=${projectId}`,
    {
      method: "DELETE",
    }
  );
}

/**
 * Bulk delete media items
 */
export async function bulkDeleteMedia(
  mediaIds: string[],
  projectId: string
): Promise<
  ApiResponse<{
    deleted: Array<{ mediaId: string; type: string }>;
    errors: Array<{ mediaId: string; error: string }>;
    total: number;
    successful: number;
    failed: number;
  }>
> {
  return apiRequest(buildApiUrl("/media/batch"), {
    method: "DELETE",
    body: JSON.stringify({
      media_ids: mediaIds,
      project_id: projectId,
    }),
  });
}

/**
 * Reorder media items
 */
export async function reorderMedia(
  projectId: string,
  mediaOrders: Array<{ id: string; order: number; type: "image" | "video" }>
): Promise<
  ApiResponse<{
    updated: any[];
    errors: Array<{ id: string; error: string }>;
    total: number;
    successful: number;
    failed: number;
  }>
> {
  // This would typically be handled by updating each item individually
  // or through a dedicated reorder endpoint
  const results = [];
  const errors = [];

  for (const item of mediaOrders) {
    try {
      const result = await updateMediaMetadata(item.id, item.type, projectId, {
        order: item.order,
      });

      if (result.success) {
        results.push(result.data);
      } else {
        errors.push({ id: item.id, error: result.error || "Update failed" });
      }
    } catch (error) {
      errors.push({
        id: item.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return {
    success: true,
    data: {
      updated: results,
      errors,
      total: mediaOrders.length,
      successful: results.length,
      failed: errors.length,
    },
  };
}

/**
 * Get media analytics for a project
 */
export async function getMediaAnalytics(projectId: string): Promise<
  ApiResponse<{
    total_media: number;
    images: {
      total: number;
      analyzed: number;
      pending: number;
      failed: number;
    };
    videos: {
      total: number;
      analyzed: number;
      pending: number;
      failed: number;
    };
    recent_uploads: Array<{
      id: string;
      type: string;
      created_at: string;
      analysis_status?: string;
    }>;
  }>
> {
  return apiRequest(`/projects/${projectId}/analytics/media`);
}

/**
 * Import media from URLs
 */
export async function importUrlMedia(
  projectId: string,
  urls: Array<{
    url: string;
    type?: "image" | "video";
    alt_text?: string;
    order?: number;
  }>
): Promise<
  ApiResponse<{
    imported: any[];
    errors: Array<{ url: string; error: string }>;
    total: number;
    successful: number;
    failed: number;
  }>
> {
  return apiRequest(buildApiUrl("/media/import"), {
    method: "POST",
    body: JSON.stringify({
      project_id: projectId,
      urls,
    }),
  });
}

/**
 * Generate thumbnails for media
 */
export async function generateThumbnails(
  mediaIds: string[],
  mediaType: "image" | "video"
): Promise<
  ApiResponse<{
    processed: Array<{ mediaId: string; thumbnails: Record<string, string> }>;
    errors: Array<{ mediaId: string; error: string }>;
  }>
> {
  return apiRequest(buildApiUrl("/media/thumbnails"), {
    method: "POST",
    body: JSON.stringify({
      media_ids: mediaIds,
      media_type: mediaType,
    }),
  });
}

/**
 * Get media processing status
 */
export async function getMediaProcessingStatus(mediaIds: string[]): Promise<
  ApiResponse<{
    media: Array<{
      id: string;
      type: string;
      analysis_status: string;
      analysis_error?: string;
      processing_progress?: number;
    }>;
  }>
> {
  const idsParam = mediaIds.join(",");
  return apiRequest(`/media/status?ids=${idsParam}`);
}

/**
 * Optimize media (compress, resize, etc.)
 */
export async function optimizeMedia(
  mediaIds: string[],
  options?: {
    quality?: number;
    maxWidth?: number;
    maxHeight?: number;
    format?: string;
  }
): Promise<
  ApiResponse<{
    optimized: Array<{
      mediaId: string;
      originalSize: number;
      newSize: number;
      savings: number;
    }>;
    errors: Array<{ mediaId: string; error: string }>;
  }>
> {
  return apiRequest(buildApiUrl("/media/optimize"), {
    method: "POST",
    body: JSON.stringify({
      media_ids: mediaIds,
      options,
    }),
  });
}

/**
 * Search media within a project
 */
export async function searchProjectMedia(
  projectId: string,
  query: string,
  filters?: {
    type?: "image" | "video";
    dateFrom?: string;
    dateTo?: string;
    hasAnalysis?: boolean;
  }
): Promise<
  ApiResponse<{
    media: any[];
    total: number;
    query: string;
    filters: any;
  }>
> {
  const searchParams = new URLSearchParams({
    q: query,
    ...(filters?.type && { type: filters.type }),
    ...(filters?.dateFrom && { date_from: filters.dateFrom }),
    ...(filters?.dateTo && { date_to: filters.dateTo }),
    ...(filters?.hasAnalysis !== undefined && {
      has_analysis: filters.hasAnalysis.toString(),
    }),
  });

  return apiRequest(
    `/projects/${projectId}/media/search?${searchParams.toString()}`
  );
}
