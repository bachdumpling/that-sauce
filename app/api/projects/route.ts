import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { ApiResponse } from "@/types";

/**
 * GET /api/projects
 * Get projects for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const userId = searchParams.get("userId") || user.id;

    // Get creator ID
    const { data: creator, error: creatorError } = await supabase
      .from("creators")
      .select("id")
      .eq("profile_id", userId)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json(
        { success: false, error: "Creator profile not found" },
        { status: 404 }
      );
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Get projects with count
    const {
      data: projects,
      error,
      count,
    } = await supabase
      .from("projects")
      .select(
        `
        *,
        images (id, url, alt_text, order),
        videos (id, url, title, order)
      `,
        { count: "exact" }
      )
      .eq("creator_id", creator.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Failed to fetch projects:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch projects" },
        { status: 500 }
      );
    }

    const response: ApiResponse = {
      success: true,
      data: {
        projects: projects || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error in GET /api/projects:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects
 * Create a new project
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
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

    // Parse request body
    const body = await request.json();
    const { title, description, short_description, roles, client_ids, year } =
      body;

    // Validate required fields
    if (!title || title.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      );
    }

    // Get creator info
    const { data: creator, error: creatorError } = await supabase
      .from("creators")
      .select("id, portfolio_id")
      .eq("profile_id", user.id)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json(
        { success: false, error: "Creator profile not found" },
        { status: 404 }
      );
    }

    // Create project
    const { data: project, error: createError } = await supabase
      .from("projects")
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        short_description: short_description?.trim() || null,
        roles: roles || [],
        client_ids: client_ids || [],
        year: year || null,
        creator_id: creator.id,
        portfolio_id: creator.portfolio_id,
        featured: false,
        order: 0,
      })
      .select()
      .single();

    if (createError) {
      console.error("Failed to create project:", createError);
      return NextResponse.json(
        { success: false, error: "Failed to create project" },
        { status: 500 }
      );
    }

    const response: ApiResponse = {
      success: true,
      data: project,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/projects:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
