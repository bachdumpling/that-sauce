import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/api-utils/auth";

/**
 * Get current onboarding status
 * GET /api/onboarding/status
 */
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const authContext = await requireAuth(request);
    const userId = authContext.user.id;
    const supabase = await createClient();

    // Get profile info
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*, organizations(*)")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError.message);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch profile",
        },
        { status: 500 }
      );
    }

    // Get creator info if it exists
    const { data: creator, error: creatorError } = await supabase
      .from("creators")
      .select("*")
      .eq("profile_id", userId)
      .single();

    // It's okay if creator doesn't exist yet
    if (creatorError && creatorError.code !== "PGRST116") {
      console.error("Error fetching creator:", creatorError.message);
    }

    return NextResponse.json({
      success: true,
      data: {
        profile,
        creator,
        onboarding_completed: profile.onboarding_completed,
        current_step: profile.onboarding_step,
        user_role: profile.user_role,
      },
    });
  } catch (error: any) {
    console.error("Error in onboarding status:", error.message);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: error.message === "Authentication required" ? 401 : 500 }
    );
  }
}
