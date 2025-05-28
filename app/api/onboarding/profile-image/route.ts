import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/api-utils/auth";

/**
 * Upload profile image
 * POST /api/onboarding/profile-image
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const authContext = await requireAuth(request);
    const userId = authContext.user.id;
    const supabase = await createClient();

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: "No file was uploaded",
        },
        { status: 400 }
      );
    }

    // Validate file type (only images allowed for profile pictures)
    const allowedImageTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedImageTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported file type: ${file.type}. Supported types: ${allowedImageTypes.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Check file size (10MB limit for profile images)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: "File size exceeds 10MB limit",
        },
        { status: 400 }
      );
    }

    // Generate unique filename that matches storage RLS policy
    // The policy requires the first folder to be the user ID
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop();
    const fileName = `${userId}/avatars/${timestamp}.${fileExtension}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("media")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true, // Allow overwriting existing files
      });
    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to upload profile image",
        },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("media")
      .getPublicUrl(fileName);

    const avatarUrl = urlData.publicUrl;

    // Try to update existing creator record first, or create if it doesn't exist
    // This approach avoids the RLS issues with checking existence first
    let creatorUpdateResult;

    // First, try to update an existing creator record
    const { data: updatedCreator, error: updateError } = await supabase
      .from("creators")
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("profile_id", userId)
      .select()
      .single();

    if (updatedCreator) {
      // Successfully updated existing creator
      creatorUpdateResult = updatedCreator;
    } else if (updateError && updateError.code === "PGRST116") {
      // No existing creator found, create a new one
      const tempUsername = `temp_${userId.substring(0, 8)}_${timestamp}`;

      const { data: newCreator, error: createError } = await supabase
        .from("creators")
        .insert({
          profile_id: userId,
          username: tempUsername,
          avatar_url: avatarUrl,
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating creator record:", createError.message);
        // Return success with just the avatar URL
        return NextResponse.json({
          success: true,
          message: "Profile image uploaded successfully",
          data: {
            avatar_url: avatarUrl,
            creator: null,
          },
        });
      }

      creatorUpdateResult = newCreator;
    } else {
      // Some other error occurred
      console.error("Error updating creator:", updateError?.message);
      return NextResponse.json({
        success: true,
        message: "Profile image uploaded successfully",
        data: {
          avatar_url: avatarUrl,
          creator: null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Profile image uploaded successfully",
      data: {
        avatar_url: avatarUrl,
        creator: creatorUpdateResult,
      },
    });
  } catch (error: any) {
    console.error("Error in uploadProfileImage:", error.message);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: error.message === "Authentication required" ? 401 : 500 }
    );
  }
}
