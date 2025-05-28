import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/api-utils/auth";

/**
 * Set username
 * PUT /api/onboarding/username
 */
export async function PUT(request: NextRequest) {
  try {
    // Check if user is authenticated
    const authContext = await requireAuth(request);
    const userId = authContext.user.id;
    const supabase = await createClient();

    const body = await request.json();
    const { username } = body;

    // Validate username
    if (!username || typeof username !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Username is required",
        },
        { status: 400 }
      );
    }

    // Check if username follows the pattern (alphanumeric, underscores, periods)
    const usernameRegex = /^[a-zA-Z0-9_.]+$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Username can only contain letters, numbers, underscores, and periods",
        },
        { status: 400 }
      );
    }

    // Check if username already exists
    const { data: existingUsername, error: usernameCheckError } = await supabase
      .from("creators")
      .select("id")
      .eq("username", username)
      .neq("profile_id", userId) // Exclude current user
      .single();

    if (usernameCheckError && usernameCheckError.code !== "PGRST116") {
      console.error("Error checking username:", usernameCheckError.message);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to check username availability",
        },
        { status: 500 }
      );
    }

    if (existingUsername) {
      return NextResponse.json(
        {
          success: false,
          error: "Username is already taken",
        },
        { status: 400 }
      );
    }

    // Update creator with new username
    const { data, error } = await supabase
      .from("creators")
      .update({
        username,
        updated_at: new Date().toISOString(),
      })
      .eq("profile_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating username:", error.message);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update username",
        },
        { status: 500 }
      );
    }

    // Update profile to mark onboarding as completed
    const { data: updatedProfile, error: updateProfileError } = await supabase
      .from("profiles")
      .update({
        onboarding_completed: true,
        onboarding_step: 5, // Set to final step
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (updateProfileError) {
      console.error(
        "Error updating profile onboarding status:",
        updateProfileError.message
      );
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update onboarding status",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Username set and onboarding completed",
      data: {
        creator: data,
        profile: updatedProfile,
      },
    });
  } catch (error: any) {
    console.error("Error in setUsername:", error.message);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: error.message === "Authentication required" ? 401 : 500 }
    );
  }
}
