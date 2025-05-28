import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/api-utils/auth";

/**
 * Set user role (creator or employer)
 * PUT /api/onboarding/role
 */
export async function PUT(request: NextRequest) {
  try {
    // Check if user is authenticated
    const authContext = await requireAuth(request);
    const userId = authContext.user.id;
    const supabase = await createClient();

    const body = await request.json();
    const { role } = body;

    // Validate role
    if (!role || !["creator", "employer"].includes(role)) {
      return NextResponse.json(
        {
          success: false,
          error: "Role must be either 'creator' or 'employer'",
        },
        { status: 400 }
      );
    }

    // Update user profile with the selected role
    const { data, error } = await supabase
      .from("profiles")
      .update({
        user_role: role,
        onboarding_step: 1, // Move to step 1
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error setting user role:", error.message);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to set user role",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User role set successfully",
      data,
    });
  } catch (error: any) {
    console.error("Error in setUserRole:", error.message);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: error.message === "Authentication required" ? 401 : 500 }
    );
  }
}
