import { API_ENDPOINTS } from "@/lib/api/endpoints/endpoints";
import { ApiResponse } from "@/types";
import { OnboardingStatus } from "@/types/onboarding";
import { serverApiRequest } from "./apiServer";

/**
 * Get the user's current onboarding status
 */
export const getOnboardingStatus = async (): Promise<
  ApiResponse<OnboardingStatus>
> => {
  return await serverApiRequest.get<OnboardingStatus>(
    API_ENDPOINTS.onboarding.status,
    undefined,
    true
  );
};

/**
 * Set the user's role (creator/employer)
 */
export const setUserRole = async (
  role: "creator" | "employer"
): Promise<ApiResponse<{ success: boolean }>> => {
  return await serverApiRequest.put<{ success: boolean }>(
    API_ENDPOINTS.onboarding.role,
    { role },
    true
  );
};

/**
 * Set the organization information for employer users
 */
export const setOrganizationInfo = async (orgData: {
  name: string;
  website?: string;
  logo_url?: string;
}): Promise<ApiResponse<{ success: boolean }>> => {
  return await serverApiRequest.put<{ success: boolean }>(
    API_ENDPOINTS.onboarding.organization,
    orgData,
    true
  );
};

/**
 * Upload a profile image for the user
 */
export const uploadProfileImage = async (
  formData: FormData
): Promise<ApiResponse<{ avatar_url: string }>> => {
  return await serverApiRequest.postFormData<{ avatar_url: string }>(
    API_ENDPOINTS.onboarding.profileImage,
    formData,
    true
  );
};

/**
 * Set the user's profile information
 */
export const setProfileInfo = async (profileData: {
  first_name: string;
  last_name: string;
  bio: string;
  primary_role?: string[];
  location?: string;
  avatar_url?: string;
}): Promise<ApiResponse<{ success: boolean }>> => {
  return await serverApiRequest.put<{ success: boolean }>(
    API_ENDPOINTS.onboarding.profile,
    profileData,
    true
  );
};

/**
 * Set the user's social media links
 */
export const setSocialLinks = async (links: {
  social_links: Record<string, string>;
}): Promise<ApiResponse<{ success: boolean }>> => {
  return await serverApiRequest.put<{ success: boolean }>(
    API_ENDPOINTS.onboarding.socialLinks,
    links,
    true
  );
};

/**
 * Set the user's username (final step of onboarding)
 */
export const setUsername = async (username: string): Promise<ApiResponse<{ success: boolean }>> => {
  return await serverApiRequest.put<{ success: boolean }>(
    API_ENDPOINTS.onboarding.username,
    { username },
    true
  );
};
