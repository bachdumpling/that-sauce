import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase.from("creators").select(
      `
        id,
        username,
        location,
        bio,
        primary_role,
        status,
        created_at,
        avatar_url,
        years_of_experience
        `,
      { count: "exact" }
    );

    // Apply status filter
    if (status !== "all") {
      query = query.eq("status", status);
    }

    // Apply search filter
    if (search.trim()) {
      query = query.or(
        `username.ilike.%${search}%,location.ilike.%${search}%,bio.ilike.%${search}%`
      );
    }

    // Apply pagination and ordering
    const {
      data: creators,
      error,
      count,
    } = await query
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching creators:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch creators" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        creators: creators || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: count ? Math.ceil(count / limit) : 0,
        },
      },
    });
  } catch (error) {
    console.error("Admin creators API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
