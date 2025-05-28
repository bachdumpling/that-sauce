import { ApiResponse, Creator, Project } from "@/types";
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
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Client-side API functions for use in client components
 * These make HTTP requests to the API routes
 */

export async function getCreatorByUsernameClient(
  username: string
): Promise<ApiResponse<Creator>> {
  return clientApiRequest<Creator>(
    API_ENDPOINTS.getCreatorByUsername(username)
  );
}

export async function updateCreatorProfileClient(
  username: string,
  profileData: Partial<Creator>
): Promise<ApiResponse<Creator>> {
  return clientApiRequest<Creator>(
    API_ENDPOINTS.updateCreatorProfile(username),
    {
      method: "PUT",
      body: JSON.stringify(profileData),
    }
  );
}

export async function uploadCreatorAvatarClient(
  username: string,
  file: File
): Promise<ApiResponse<{ avatar_url: string }>> {
  const formData = new FormData();
  formData.append("file", file);

  return clientApiRequest<{ avatar_url: string }>(
    API_ENDPOINTS.uploadCreatorAvatar(username),
    {
      method: "POST",
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    }
  );
}

export async function uploadCreatorBannerClient(
  username: string,
  file: File
): Promise<ApiResponse<{ banner_url: string }>> {
  const formData = new FormData();
  formData.append("file", file);

  return clientApiRequest<{ banner_url: string }>(
    API_ENDPOINTS.uploadCreatorBanner(username),
    {
      method: "POST",
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    }
  );
}

export async function checkUsernameAvailabilityClient(
  username: string
): Promise<ApiResponse<{ available: boolean }>> {
  return clientApiRequest<{ available: boolean }>(
    API_ENDPOINTS.checkUsernameAvailability(username)
  );
}

export async function getCreatorProjectsClient(
  username: string,
  page = 1,
  limit = 10
): Promise<ApiResponse<{ projects: Project[]; total: number; page: number; limit: number }>> {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  return clientApiRequest<{ projects: Project[]; total: number; page: number; limit: number }>(
    `${API_ENDPOINTS.getCreatorByUsername(username)}/projects?${queryParams}`
  );
}

export async function getCreatorPortfolioClient(
  username: string
): Promise<ApiResponse<any>> {
  return clientApiRequest<any>(
    API_ENDPOINTS.getCreatorPortfolio(username)
  );
} 