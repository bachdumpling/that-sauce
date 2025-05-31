import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const supabase = await createClient();

    // Check auth and admin role
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check admin role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const { username } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !["approved", "rejected", "pending"].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Valid status (approved/rejected/pending) is required",
        },
        { status: 400 }
      );
    }

    // Get the creator
    const { data: creator, error: creatorError } = await supabase
      .from("creators")
      .select("*")
      .eq("username", username)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json(
        { success: false, error: "Creator not found" },
        { status: 404 }
      );
    }

    if (status === "approved") {
      // Update creator status to approved
      const { error: updateError } = await supabase
        .from("creators")
        .update({ status: "approved" })
        .eq("username", username);

      if (updateError) {
        console.error("Error approving creator:", updateError);
        return NextResponse.json(
          { success: false, error: "Failed to approve creator" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Creator ${username} approved successfully`,
      });
    } else if (status === "rejected") {
      // Delete creator and cascade delete all related data
      const { error: deleteError } = await supabase
        .from("creators")
        .delete()
        .eq("username", username);

      if (deleteError) {
        console.error("Error rejecting creator:", deleteError);
        return NextResponse.json(
          { success: false, error: "Failed to reject creator" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Creator ${username} rejected and all data deleted successfully`,
      });
    } else {
      // Set to pending
      const { error: updateError } = await supabase
        .from("creators")
        .update({ status: "pending" })
        .eq("username", username);

      if (updateError) {
        console.error("Error updating creator status:", updateError);
        return NextResponse.json(
          { success: false, error: "Failed to update creator status" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Creator ${username} status set to pending`,
      });
    }
  } catch (error) {
    console.error("Admin creator status API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
