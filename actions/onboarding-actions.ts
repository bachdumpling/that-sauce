"use server";

import { revalidatePath } from "next/cache";
import {
  getOnboardingStatus,
  setUserRole,
  setOrganizationInfo,
  uploadProfileImage,
  setProfileInfo,
  setSocialLinks,
  setUsername,
} from "@/lib/api/server/onboarding";
import { OnboardingStatus, ProfileData, OrganizationData, SocialLinks } from "@/types/onboarding";

/**
 * Server action to get the current onboarding status
 */
export async function getOnboardingStatusAction() {
  try {
    const response = await getOnboardingStatus();
    return response;
  } catch (error) {
    console.error("Error getting onboarding status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get onboarding status",
      data: null
    };
  }
}

/**
 * Server action to set the user's role
 */
export async function setUserRoleAction(role: "creator" | "employer") {
  try {
    const response = await setUserRole(role);
    revalidatePath("/onboarding");
    return response;
  } catch (error) {
    console.error("Error setting user role:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to set user role",
      data: null
    };
  }
}

/**
 * Server action to set organization information for employers
 */
export async function setOrganizationInfoAction(orgData: OrganizationData) {
  try {
    const response = await setOrganizationInfo(orgData);
    revalidatePath("/onboarding");
    return response;
  } catch (error) {
    console.error("Error setting organization info:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to set organization info",
      data: null
    };
  }
}

/**
 * Server action to upload a profile image
 */
export async function uploadProfileImageAction(formData: FormData) {
  try {
    const response = await uploadProfileImage(formData);
    revalidatePath("/onboarding");
    return response;
  } catch (error) {
    console.error("Error uploading profile image:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
      data: null
    };
  }
}

/**
 * Server action to set profile information
 */
export async function setProfileInfoAction(profileData: ProfileData) {
  try {
    const response = await setProfileInfo(profileData);
    revalidatePath("/onboarding");
    return response;
  } catch (error) {
    console.error("Error setting profile info:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to set profile info",
      data: null
    };
  }
}

/**
 * Server action to set social media links
 */
export async function setSocialLinksAction(links: { social_links: Record<string, string> }) {
  try {
    const response = await setSocialLinks(links);
    revalidatePath("/onboarding");
    return response;
  } catch (error) {
    console.error("Error setting social links:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to set social links",
      data: null
    };
  }
}

/**
 * Server action to set username (final step of onboarding)
 */
export async function setUsernameAction(username: string) {
  try {
    const response = await setUsername(username);
    revalidatePath("/onboarding");
    return response;
  } catch (error) {
    console.error("Error setting username:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to set username",
      data: null
    };
  }
}
