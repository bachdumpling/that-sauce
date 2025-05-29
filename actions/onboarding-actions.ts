"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  OnboardingStatus,
  ProfileData,
  OrganizationData,
  SocialLinks,
  OrganizationChoice,
} from "@/types/onboarding";

/**
 * Server action to get the current onboarding status
 */
export async function getOnboardingStatusAction() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "Authentication required",
        data: null,
      };
    }

    // Get profile info
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*, organizations(*)")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return {
        success: false,
        error: "Failed to fetch profile",
        data: null,
      };
    }

    // Get creator info if it exists
    const { data: creator, error: creatorError } = await supabase
      .from("creators")
      .select("*")
      .eq("profile_id", user.id)
      .single();

    // It's okay if creator doesn't exist yet
    if (creatorError && creatorError.code !== "PGRST116") {
      console.error("Error fetching creator:", creatorError);
    }

    return {
      success: true,
      data: {
        profile,
        creator,
        onboarding_completed: profile.onboarding_completed,
        current_step: profile.onboarding_step,
        user_role: profile.user_role,
      },
    };
  } catch (error) {
    console.error("Error getting onboarding status:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get onboarding status",
      data: null,
    };
  }
}

/**
 * Server action to set the user's role
 */
export async function setUserRoleAction(role: "creator" | "employer") {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "Authentication required",
        data: null,
      };
    }

    // Validate role
    if (!role || !["creator", "employer"].includes(role)) {
      return {
        success: false,
        error: "Role must be either 'creator' or 'employer'",
        data: null,
      };
    }

    // Update user profile with the selected role
    const { data, error } = await supabase
      .from("profiles")
      .update({
        user_role: role,
        onboarding_step: 2, // Move to step 2
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error setting user role:", error);
      return {
        success: false,
        error: "Failed to set user role",
        data: null,
      };
    }

    revalidatePath("/onboarding");
    return {
      success: true,
      message: "User role set successfully",
      data,
    };
  } catch (error) {
    console.error("Error setting user role:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to set user role",
      data: null,
    };
  }
}

/**
 * Server action to set organization information for employers
 */
export async function setOrganizationInfoAction(orgData: OrganizationData) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "Authentication required",
        data: null,
      };
    }

    // Check if user role is employer
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("user_role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      return {
        success: false,
        error: "Failed to fetch user profile",
        data: null,
      };
    }

    if (profileData.user_role !== "employer") {
      return {
        success: false,
        error: "Only employers can set organization information",
        data: null,
      };
    }

    let orgId: string;

    // Create new organization
    const { data: newOrg, error: createOrgError } = await supabase
      .from("organizations")
      .insert({
        name: orgData.name,
        website: orgData.website,
        logo_url: orgData.logo_url,
      })
      .select()
      .single();

    if (createOrgError) {
      console.error("Error creating organization:", createOrgError);
      return {
        success: false,
        error: "Failed to create organization",
        data: null,
      };
    }

    orgId = newOrg.id;

    // Update user profile with the organization_id and move to step 3
    const { data, error } = await supabase
      .from("profiles")
      .update({
        organization_id: orgId,
        onboarding_step: 3, // Move to step 3
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error setting organization:", error);
      return {
        success: false,
        error: "Failed to set organization",
        data: null,
      };
    }

    revalidatePath("/onboarding");
    return {
      success: true,
      message: "Organization set successfully",
      data: {
        profile: data,
        organization_id: orgId,
      },
    };
  } catch (error) {
    console.error("Error setting organization info:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to set organization info",
      data: null,
    };
  }
}

/**
 * Server action to set organization choice for employers
 */
export async function setOrganizationChoiceAction(choice: OrganizationChoice) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "Authentication required",
        data: null,
      };
    }

    // Check if user role is employer
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("user_role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      return {
        success: false,
        error: "Failed to fetch user profile",
        data: null,
      };
    }

    if (profileData.user_role !== "employer") {
      return {
        success: false,
        error: "Only employers can set organization information",
        data: null,
      };
    }

    let orgId: string | null = null;

    switch (choice.type) {
      case "existing":
        if (!choice.organization_id) {
          return {
            success: false,
            error: "Organization ID is required for existing organization",
            data: null,
          };
        }
        orgId = choice.organization_id;
        break;

      case "new":
        if (!choice.organization_data) {
          return {
            success: false,
            error: "Organization data is required for new organization",
            data: null,
          };
        }

        // Create new organization
        const { data: newOrg, error: createOrgError } = await supabase
          .from("organizations")
          .insert({
            name: choice.organization_data.name,
            website: choice.organization_data.website,
            logo_url: choice.organization_data.logo_url,
          })
          .select()
          .single();

        if (createOrgError) {
          console.error("Error creating organization:", createOrgError);
          return {
            success: false,
            error: "Failed to create organization",
            data: null,
          };
        }

        orgId = newOrg.id;
        break;

      case "individual":
        orgId = null; // Hiring as individual
        break;

      default:
        return {
          success: false,
          error: "Invalid organization choice type",
          data: null,
        };
    }

    // Update user profile with the organization choice and move to step 3
    const { data, error } = await supabase
      .from("profiles")
      .update({
        organization_id: orgId,
        onboarding_step: 3, // Move to step 3
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error setting organization choice:", error);
      return {
        success: false,
        error: "Failed to set organization choice",
        data: null,
      };
    }

    revalidatePath("/onboarding");
    return {
      success: true,
      message: "Organization choice set successfully",
      data: {
        profile: data,
        organization_id: orgId,
        choice_type: choice.type,
      },
    };
  } catch (error) {
    console.error("Error setting organization choice:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to set organization choice",
      data: null,
    };
  }
}

/**
 * Server action to upload a profile image
 */
export async function uploadProfileImageAction(formData: FormData) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "Authentication required",
        data: null,
      };
    }

    const file = formData.get("file") as File;
    if (!file) {
      return {
        success: false,
        error: "No file was uploaded",
        data: null,
      };
    }

    // Check file type and size
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error:
          "Invalid file type. Please upload JPEG, PNG, GIF, or WEBP images.",
        data: null,
      };
    }

    if (file.size > 50 * 1024 * 1024) {
      // 50MB
      return {
        success: false,
        error: "File size must be less than 50MB",
        data: null,
      };
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("media")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      return {
        success: false,
        error: "Failed to upload profile image",
        data: null,
      };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("media").getPublicUrl(fileName);

    revalidatePath("/onboarding");
    return {
      success: true,
      message: "Profile image uploaded successfully",
      data: {
        avatar_url: publicUrl,
      },
    };
  } catch (error) {
    console.error("Error uploading profile image:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
      data: null,
    };
  }
}

/**
 * Server action to set profile information
 */
export async function setProfileInfoAction(profileData: ProfileData) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "Authentication required",
        data: null,
      };
    }

    // Validate required fields
    if (
      !profileData.first_name ||
      !profileData.last_name ||
      !profileData.location ||
      !profileData.avatar_url
    ) {
      return {
        success: false,
        error:
          "First name, last name, location, and profile picture are required",
        data: null,
      };
    }

    // Get user role from profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("user_role, onboarding_step")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      return {
        success: false,
        error: "Failed to fetch user profile",
        data: null,
      };
    }

    // Update profile first
    const { data: updatedProfile, error: updateProfileError } = await supabase
      .from("profiles")
      .update({
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        onboarding_step: profile.user_role === "creator" ? 3 : 4, // Next step depends on role
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single();

    if (updateProfileError) {
      console.error("Error updating profile:", updateProfileError);
      return {
        success: false,
        error: "Failed to update profile",
        data: null,
      };
    }

    // Check if there's already a creator record for this user
    const { data: existingCreator } = await supabase
      .from("creators")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    // Update or insert creator information
    let creatorResult;

    if (existingCreator) {
      // Update existing creator
      const { data, error } = await supabase
        .from("creators")
        .update({
          bio: profileData.bio,
          primary_role: profileData.primary_role,
          location: profileData.location,
          avatar_url: profileData.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq("profile_id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating creator:", error);
        return {
          success: false,
          error: "Failed to update creator profile",
          data: null,
        };
      }

      creatorResult = data;
    } else {
      // Generate a username from the user's name
      const username =
        `${profileData.first_name.toLowerCase()}.${profileData.last_name.toLowerCase()}`.replace(
          /\s/g,
          ""
        );

      // Check if username exists
      const { data: existingUsername } = await supabase
        .from("creators")
        .select("id")
        .eq("username", username)
        .single();

      // If username exists, append a random number
      const finalUsername = existingUsername
        ? `${username}${Math.floor(Math.random() * 1000)}`
        : username;

      // Create new creator
      const { data, error } = await supabase
        .from("creators")
        .insert({
          profile_id: user.id,
          username: finalUsername,
          bio: profileData.bio,
          primary_role: profileData.primary_role,
          location: profileData.location,
          avatar_url: profileData.avatar_url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating creator:", error);
        return {
          success: false,
          error: "Failed to create creator profile",
          data: null,
        };
      }

      creatorResult = data;
    }

    revalidatePath("/onboarding");
    return {
      success: true,
      message: "Profile updated successfully",
      data: {
        profile: updatedProfile,
        creator: creatorResult,
      },
    };
  } catch (error) {
    console.error("Error setting profile info:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to set profile info",
      data: null,
    };
  }
}

/**
 * Server action to set social media links
 */
export async function setSocialLinksAction(links: {
  social_links: Record<string, string>;
}) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "Authentication required",
        data: null,
      };
    }

    const { social_links } = links;

    // Validate social_links
    if (!social_links || typeof social_links !== "object") {
      return {
        success: false,
        error: "Social links must be an object",
        data: null,
      };
    }

    // Check if there are at least 2 valid social links
    const validLinks = Object.values(social_links).filter(
      (link) => link && link.trim() !== ""
    );
    if (validLinks.length < 2) {
      return {
        success: false,
        error: "At least 2 social links are required",
        data: null,
      };
    }

    // Format social links to ensure they have proper URLs
    const formattedSocialLinks: Record<string, string> = {};
    Object.entries(social_links).forEach(([platform, url]) => {
      if (url && url.trim()) {
        // Add https:// if not present
        const formattedUrl = url.startsWith("http") ? url : `https://${url}`;
        formattedSocialLinks[platform] = formattedUrl;
      }
    });

    // Get creator record for this user
    const { data: creatorData, error: creatorError } = await supabase
      .from("creators")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (creatorError || !creatorData) {
      console.error("Error fetching creator profile:", creatorError);
      return {
        success: false,
        error: "Failed to fetch creator profile",
        data: null,
      };
    }

    // Update creator with social links
    const { data, error } = await supabase
      .from("creators")
      .update({
        social_links: formattedSocialLinks,
        minimum_social_links_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq("profile_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating social links:", error);
      return {
        success: false,
        error: "Failed to update social links",
        data: null,
      };
    }

    // Update profile to move to the username selection step
    const { data: updatedProfile, error: updateProfileError } = await supabase
      .from("profiles")
      .update({
        onboarding_step: 4, // Move to step 4 (username selection)
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single();

    if (updateProfileError) {
      console.error(
        "Error updating profile onboarding status:",
        updateProfileError
      );
      return {
        success: false,
        error: "Failed to update onboarding status",
        data: null,
      };
    }

    revalidatePath("/onboarding");
    return {
      success: true,
      message: "Social links updated successfully",
      data: {
        creator: data,
        profile: updatedProfile,
      },
    };
  } catch (error) {
    console.error("Error setting social links:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to set social links",
      data: null,
    };
  }
}

/**
 * Server action to set username (final step of onboarding)
 */
export async function setUsernameAction(username: string) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "Authentication required",
        data: null,
      };
    }

    // Validate username
    if (!username || typeof username !== "string") {
      return {
        success: false,
        error: "Username is required",
        data: null,
      };
    }

    // Check if username follows the pattern (alphanumeric, underscores, periods)
    const usernameRegex = /^[a-zA-Z0-9_.]+$/;
    if (!usernameRegex.test(username)) {
      return {
        success: false,
        error:
          "Username can only contain letters, numbers, underscores, and periods",
        data: null,
      };
    }

    // Check if username already exists
    const { data: existingUsername, error: usernameCheckError } = await supabase
      .from("creators")
      .select("id")
      .eq("username", username)
      .neq("profile_id", user.id) // Exclude current user
      .single();

    if (usernameCheckError && usernameCheckError.code !== "PGRST116") {
      console.error("Error checking username:", usernameCheckError);
      return {
        success: false,
        error: "Failed to check username availability",
        data: null,
      };
    }

    if (existingUsername) {
      return {
        success: false,
        error: "Username is already taken",
        data: null,
      };
    }

    // Update creator with new username
    const { data, error } = await supabase
      .from("creators")
      .update({
        username,
        updated_at: new Date().toISOString(),
      })
      .eq("profile_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating username:", error);
      return {
        success: false,
        error: "Failed to update username",
        data: null,
      };
    }

    // Update profile to mark onboarding as completed
    const { data: updatedProfile, error: updateProfileError } = await supabase
      .from("profiles")
      .update({
        onboarding_completed: true,
        onboarding_step: 5, // Set to final step
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single();

    if (updateProfileError) {
      console.error(
        "Error updating profile onboarding status:",
        updateProfileError
      );
      return {
        success: false,
        error: "Failed to update onboarding status",
        data: null,
      };
    }

    revalidatePath("/onboarding");
    return {
      success: true,
      message: "Username set and onboarding completed",
      data: {
        creator: data,
        profile: updatedProfile,
      },
    };
  } catch (error) {
    console.error("Error setting username:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to set username",
      data: null,
    };
  }
}
