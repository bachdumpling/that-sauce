import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/api-utils/auth";

/**
 * Set user profile information
 * PUT /api/onboarding/profile
 */
export async function PUT(request: NextRequest) {
  try {
    // Check if user is authenticated
    const authContext = await requireAuth(request);
    const userId = authContext.user.id;
    const supabase = await createClient();

    const body = await request.json();
    const { first_name, last_name, bio, primary_role, location, avatar_url } = body;

    // Validate required fields
    if (!first_name || !last_name || !location || !avatar_url) {
      return NextResponse.json(
        {
          success: false,
          error: "First name, last name, location, and profile picture are required",
        },
        { status: 400 }
      );
    }

    // Validate primary_role if provided
    if (primary_role && !Array.isArray(primary_role)) {
      return NextResponse.json(
        {
          success: false,
          error: "Primary role must be an array",
        },
        { status: 400 }
      );
    }

    // Get user role from profile
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("user_role, onboarding_step")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError.message);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch user profile",
        },
        { status: 500 }
      );
    }

    // Update profile first
    const { data: updatedProfile, error: updateProfileError } = await supabase
      .from("profiles")
      .update({
        first_name,
        last_name,
        onboarding_step: profileData.user_role === "creator" ? 3 : 4, // Next step depends on role
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (updateProfileError) {
      console.error("Error updating profile:", updateProfileError.message);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update profile",
        },
        { status: 500 }
      );
    }

    // Check if there's already a creator record for this user
    const { data: existingCreator } = await supabase
      .from("creators")
      .select("id")
      .eq("profile_id", userId)
      .single();

    // Update or insert creator information
    let creatorResult;

    if (existingCreator) {
      // Update existing creator
      const { data, error } = await supabase
        .from("creators")
        .update({
          bio,
          primary_role,
          location,
          avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq("profile_id", userId)
        .select()
        .single();

      if (error) {
        console.error("Error updating creator:", error.message);
        return NextResponse.json(
          {
            success: false,
            error: "Failed to update creator profile",
          },
          { status: 500 }
        );
      }

      creatorResult = data;
    } else {
      // Generate a username from the user's name
      const username = `${first_name.toLowerCase()}.${last_name.toLowerCase()}`.replace(/\s/g, "");

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
          profile_id: userId,
          username: finalUsername,
          bio,
          primary_role,
          location,
          avatar_url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating creator:", error.message);
        return NextResponse.json(
          {
            success: false,
            error: "Failed to create creator profile",
          },
          { status: 500 }
        );
      }

      creatorResult = data;
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        profile: updatedProfile,
        creator: creatorResult,
      },
    });
  } catch (error: any) {
    console.error("Error in setProfile:", error.message);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: error.message === "Authentication required" ? 401 : 500 }
    );
  }
} 