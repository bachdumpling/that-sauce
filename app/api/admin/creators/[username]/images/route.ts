import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(
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
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "5");

    // Get creator ID first
    const { data: creator, error: creatorError } = await supabase
      .from("creators")
      .select("id")
      .eq("username", username)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json(
        { success: false, error: "Creator not found" },
        { status: 404 }
      );
    }

    // Get random images for this creator
    const { data: images, error: imagesError } = await supabase
      .from("images")
      .select(
        `
        id,
        url,
        alt_text,
        resolutions,
        projects!inner(
          id,
          title,
          creator_id
        )
      `
      )
      .eq("creator_id", creator.id)
      .limit(limit * 2) // Get more than needed to have variety
      .order("created_at", { ascending: false });

    if (imagesError) {
      console.error("Error fetching creator images:", imagesError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch images" },
        { status: 500 }
      );
    }

    // Shuffle and limit the results
    const shuffledImages = (images || [])
      .sort(() => 0.5 - Math.random())
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      data: shuffledImages,
    });
  } catch (error) {
    console.error("Admin creator images API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
