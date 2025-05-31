"use server";

import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/api-utils/auth";
import { Creator } from "@/types";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Validation schemas
const profileUpdateSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(50).optional(),
  last_name: z.string().min(1, "Last name is required").max(50).optional(),
  bio: z.string().max(500, "Bio cannot exceed 500 characters").optional(),
  location: z
    .string()
    .max(100, "Location cannot exceed 100 characters")
    .optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  avatar_url: z.string().url("Invalid avatar URL").optional().or(z.literal("")),
  banner_url: z.string().url("Invalid banner URL").optional().or(z.literal("")),
});

const creatorProfileUpdateSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30)
    .optional(),
  bio: z.string().max(500, "Bio cannot exceed 500 characters").optional(),
  location: z
    .string()
    .max(100, "Location cannot exceed 100 characters")
    .optional(),
  primary_role: z.array(z.string()).optional(),
  avatar_url: z.string().url("Invalid avatar URL").optional().or(z.literal("")),
  banner_url: z.string().url("Invalid banner URL").optional().or(z.literal("")),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  twitter: z.string().optional(),
  instagram: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
  dribbble: z.string().optional(),
  behance: z.string().optional(),
  medium: z.string().optional(),
  youtube: z.string().optional(),
});

/**
 * Get user profile by ID
 */
export async function getUserProfileAction(userId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error);
      return {
        success: false,
        error: "Profile not found",
        message: "Failed to fetch user profile",
      };
    }

    return {
      success: true,
      data,
      message: "Profile retrieved successfully",
    };
  } catch (error: any) {
    console.error("Error in getUserProfileAction:", error);
    return {
      success: false,
      error: error.message,
      message: "An unexpected error occurred",
    };
  }
}

/**
 * Update user profile information
 */
export async function updateUserProfileAction(
  profileData: z.infer<typeof profileUpdateSchema>
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
        message: "You must be logged in to update your profile",
      };
    }

    // Validate input data
    const validatedData = profileUpdateSchema.parse(profileData);

    // Update profile
    const { data, error } = await supabase
      .from("profiles")
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating profile:", error);
      return {
        success: false,
        error: "Failed to update profile",
        message: "An error occurred while updating your profile",
      };
    }

    // Revalidate relevant paths
    revalidatePath("/profile", "page");

    return {
      success: true,
      data,
      message: "Profile updated successfully",
    };
  } catch (error: any) {
    console.error("Error in updateUserProfileAction:", error);

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
 * Update creator profile information
 */
export async function updateCreatorProfileAction(
  username: string,
  profileData: z.infer<typeof creatorProfileUpdateSchema>
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
        message: "You must be logged in to update your profile",
      };
    }

    // Validate input data
    const validatedData = creatorProfileUpdateSchema.parse(profileData);

    // Get creator by username and verify ownership
    const { data: creator, error: creatorError } = await supabase
      .from("creators")
      .select("id, profile_id")
      .eq("username", username)
      .single();

    if (creatorError || !creator) {
      return {
        success: false,
        error: "Creator not found",
        message: "Creator profile not found",
      };
    }

    // Verify ownership OR admin access
    let isAuthorized = creator.profile_id === user.id;
    
    if (!isAuthorized) {
      // Check if user is an admin
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profileError && profile?.role === "admin") {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return {
        success: false,
        error: "Unauthorized",
        message: "You can only update your own profile",
      };
    }

    // If username is being changed, check availability
    if (validatedData.username && validatedData.username !== username) {
      const { data: existingCreator } = await supabase
        .from("creators")
        .select("id")
        .eq("username", validatedData.username)
        .single();

      if (existingCreator) {
        return {
          success: false,
          error: "Username already taken",
          message: "This username is already in use",
        };
      }
    }

    // Update creator profile
    const { data, error } = await supabase
      .from("creators")
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", creator.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating creator profile:", error);
      return {
        success: false,
        error: "Failed to update profile",
        message: "An error occurred while updating your profile",
      };
    }

    // Revalidate relevant paths
    revalidatePath(`/${username}`, "layout");
    revalidatePath(`/${username}`);

    // If username was changed, also revalidate the new path
    if (validatedData.username && validatedData.username !== username) {
      revalidatePath(`/${validatedData.username}`, "layout");
      revalidatePath(`/${validatedData.username}`);
    }

    return {
      success: true,
      data,
      message: "Profile updated successfully",
    };
  } catch (error: any) {
    console.error("Error in updateCreatorProfileAction:", error);

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
 * Upload profile avatar
 */
export async function uploadProfileAvatarAction(file: File, username?: string) {
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
        message: "You must be logged in to upload an avatar",
      };
    }

    // Validate file
    if (!file) {
      return {
        success: false,
        error: "No file provided",
        message: "Please select a file to upload",
      };
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return {
        success: false,
        error: "File too large",
        message: "File size must be less than 10MB",
      };
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      return {
        success: false,
        error: "Invalid file type",
        message: "Only image files are allowed",
      };
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("media")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading avatar:", uploadError);
      return {
        success: false,
        error: "Upload failed",
        message: "Failed to upload avatar",
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("media")
      .getPublicUrl(filePath);

    const avatarUrl = urlData.publicUrl;

    // Update profile or creator record
    if (username) {
      // Update creator avatar
      const { data: creator, error: creatorError } = await supabase
        .from("creators")
        .select("id, profile_id")
        .eq("username", username)
        .single();

      if (creatorError || !creator) {
        // Clean up uploaded file
        await supabase.storage.from("media").remove([filePath]);
        return {
          success: false,
          error: "Creator not found",
          message: "Creator profile not found",
        };
      }

      // Check if user is the owner OR an admin
      let isAuthorized = creator.profile_id === user.id;
      
      if (!isAuthorized) {
        // Check if user is an admin
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (!profileError && profile?.role === "admin") {
          isAuthorized = true;
        }
      }

      if (!isAuthorized) {
        // Clean up uploaded file
        await supabase.storage.from("media").remove([filePath]);
        return {
          success: false,
          error: "Unauthorized",
          message: "You can only update your own avatar",
        };
      }

      const { error: updateError } = await supabase
        .from("creators")
        .update({
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", creator.id);

      if (updateError) {
        console.error("Error updating creator avatar:", updateError);
        // Clean up uploaded file
        await supabase.storage.from("media").remove([filePath]);
        return {
          success: false,
          error: "Failed to update avatar",
          message: "An error occurred while updating your avatar",
        };
      }

      // Revalidate creator paths
      revalidatePath(`/${username}`, "layout");
      revalidatePath(`/${username}`);
    } else {
      // Update user profile avatar
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("Error updating profile avatar:", updateError);
        // Clean up uploaded file
        await supabase.storage.from("media").remove([filePath]);
        return {
          success: false,
          error: "Failed to update avatar",
          message: "An error occurred while updating your avatar",
        };
      }

      // Revalidate profile paths
      revalidatePath("/profile", "page");
    }

    return {
      success: true,
      data: { avatar_url: avatarUrl },
      message: "Avatar updated successfully",
    };
  } catch (error: any) {
    console.error("Error in uploadProfileAvatarAction:", error);
    return {
      success: false,
      error: error.message,
      message: "An unexpected error occurred",
    };
  }
}

/**
 * Upload profile banner
 */
export async function uploadProfileBannerAction(file: File, username?: string) {
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
        message: "You must be logged in to upload a banner",
      };
    }

    // Validate file
    if (!file) {
      return {
        success: false,
        error: "No file provided",
        message: "Please select a file to upload",
      };
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return {
        success: false,
        error: "File too large",
        message: "File size must be less than 10MB",
      };
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      return {
        success: false,
        error: "Invalid file type",
        message: "Only image files are allowed",
      };
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}-banner-${Date.now()}.${fileExt}`;
    const filePath = `banners/${fileName}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("media")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading banner:", uploadError);
      return {
        success: false,
        error: "Upload failed",
        message: "Failed to upload banner",
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("media")
      .getPublicUrl(filePath);

    const bannerUrl = urlData.publicUrl;

    // Update profile or creator record
    if (username) {
      // Update creator banner
      const { data: creator, error: creatorError } = await supabase
        .from("creators")
        .select("id, profile_id")
        .eq("username", username)
        .single();

      if (creatorError || !creator || creator.profile_id !== user.id) {
        // Clean up uploaded file
        await supabase.storage.from("media").remove([filePath]);
        return {
          success: false,
          error: "Unauthorized",
          message: "You can only update your own banner",
        };
      }

      const { error: updateError } = await supabase
        .from("creators")
        .update({
          banner_url: bannerUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", creator.id);

      if (updateError) {
        console.error("Error updating creator banner:", updateError);
        // Clean up uploaded file
        await supabase.storage.from("media").remove([filePath]);
        return {
          success: false,
          error: "Failed to update banner",
          message: "An error occurred while updating your banner",
        };
      }

      // Revalidate creator paths
      revalidatePath(`/${username}`, "layout");
      revalidatePath(`/${username}`);
    } else {
      // Update user profile banner
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          banner_url: bannerUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("Error updating profile banner:", updateError);
        // Clean up uploaded file
        await supabase.storage.from("media").remove([filePath]);
        return {
          success: false,
          error: "Failed to update banner",
          message: "An error occurred while updating your banner",
        };
      }

      // Revalidate profile paths
      revalidatePath("/profile", "page");
    }

    return {
      success: true,
      data: { banner_url: bannerUrl },
      message: "Banner updated successfully",
    };
  } catch (error: any) {
    console.error("Error in uploadProfileBannerAction:", error);
    return {
      success: false,
      error: error.message,
      message: "An unexpected error occurred",
    };
  }
}

/**
 * Delete user account and all associated data
 */
export async function deleteUserAccountAction() {
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
        message: "You must be logged in to delete your account",
      };
    }

    // Get creator data if exists
    const { data: creator } = await supabase
      .from("creators")
      .select("id, username")
      .eq("profile_id", user.id)
      .single();

    // Delete all user data (RLS policies will handle cascade)
    // This will trigger cascade deletions for projects, media, etc.
    const { error: deleteError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", user.id);

    if (deleteError) {
      console.error("Error deleting user account:", deleteError);
      return {
        success: false,
        error: "Failed to delete account",
        message: "An error occurred while deleting your account",
      };
    }

    // Revalidate paths if creator existed
    if (creator) {
      revalidatePath(`/${creator.username}`, "layout");
    }

    return {
      success: true,
      message: "Account deleted successfully",
    };
  } catch (error: any) {
    console.error("Error in deleteUserAccountAction:", error);
    return {
      success: false,
      error: error.message,
      message: "An unexpected error occurred",
    };
  }
}
