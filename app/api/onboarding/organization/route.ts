import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/api-utils/auth";

/**
 * Set organization information for employer
 * PUT /api/onboarding/organization
 */
export async function PUT(request: NextRequest) {
  try {
    // Check if user is authenticated
    const authContext = await requireAuth(request);
    const userId = authContext.user.id;
    const supabase = await createClient();

    const body = await request.json();
    const { organization_id, organization_name, website, logo_url } = body;

    // Check if user role is employer
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("user_role")
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

    if (profileData.user_role !== "employer") {
      return NextResponse.json(
        {
          success: false,
          error: "Only employers can set organization information",
        },
        { status: 400 }
      );
    }

    let orgId = organization_id;

    // If organization_id is null and organization_name is provided, create a new organization
    if (!organization_id && organization_name) {
      // Create new organization
      const { data: newOrg, error: createOrgError } = await supabase
        .from("organizations")
        .insert({
          name: organization_name,
          website,
          logo_url,
        })
        .select()
        .single();

      if (createOrgError) {
        console.error("Error creating organization:", createOrgError.message);
        return NextResponse.json(
          {
            success: false,
            error: "Failed to create organization",
          },
          { status: 500 }
        );
      }

      orgId = newOrg.id;
    }

    // Update user profile with the organization_id and move to step 2
    const { data, error } = await supabase
      .from("profiles")
      .update({
        organization_id: orgId,
        onboarding_step: 2, // Move to step 2
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error setting organization:", error.message);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to set organization",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Organization set successfully",
      data: {
        profile: data,
        organization_id: orgId,
      },
    });
  } catch (error: any) {
    console.error("Error in setOrganization:", error.message);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: error.message === "Authentication required" ? 401 : 500 }
    );
  }
}
