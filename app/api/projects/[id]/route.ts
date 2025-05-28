import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { ApiResponse } from "@/types";

/**
 * GET /api/projects/[id]
 * Get a specific project by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: projectId } = await params;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const includeOrganizations =
      searchParams.get("includeOrganizations") === "true";

    // Get project with related data
    let selectQuery = `
      *,
      creators!inner (
        id,
        username,
        profile_id
      ),
      images (
        id,
        url,
        alt_text,
        resolutions,
        order,
        created_at,
        updated_at
      ),
      videos (
        id,
        url,
        title,
        description,
        youtube_id,
        vimeo_id,
        created_at,
        updated_at
      )
    `;

    const { data: project, error } = await supabase
      .from("projects")
      .select(selectQuery)
      .eq("id", projectId)
      .single();

    if (error) {
      console.error("Failed to fetch project:", error);
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    // Get organizations if requested
    if (includeOrganizations && (project as any).client_ids?.length > 0) {
      const { data: organizations } = await supabase
        .from("organizations")
        .select("id, name, logo_url, website")
        .in("id", (project as any).client_ids);

      (project as any).organizations = organizations || [];
    }

    // Sort media by order (images) and created_at (videos)
    if ((project as any).images) {
      (project as any).images.sort((a: any, b: any) => a.order - b.order);
    }
    if ((project as any).videos) {
      (project as any).videos.sort((a: any, b: any) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    }

    // Remove sensitive fields
    const { embedding, ...sanitizedProject } = project as any;

    const response: ApiResponse = {
      success: true,
      data: sanitizedProject,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error in GET /api/projects/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/projects/[id]
 * Update a specific project
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: projectId } = await params;

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
    const {
      title,
      description,
      short_description,
      roles,
      client_ids,
      year,
      thumbnail_url,
      featured,
    } = body;

    // Verify ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select(
        `
        id,
        creators!inner (
          profile_id
        )
      `
      )
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    if ((project.creators as any).profile_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (title !== undefined && title.trim() !== "") {
      updateData.title = title.trim();
    }
    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }
    if (short_description !== undefined) {
      updateData.short_description = short_description?.trim() || null;
    }
    if (roles !== undefined) {
      updateData.roles = roles;
    }
    if (client_ids !== undefined) {
      updateData.client_ids = client_ids;
    }
    if (year !== undefined) {
      updateData.year = year;
    }
    if (thumbnail_url !== undefined) {
      updateData.thumbnail_url = thumbnail_url;
    }
    if (featured !== undefined) {
      updateData.featured = featured;
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 }
      );
    }

    updateData.updated_at = new Date().toISOString();

    // Update project
    const { data: updatedProject, error: updateError } = await supabase
      .from("projects")
      .update(updateData)
      .eq("id", projectId)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to update project:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to update project" },
        { status: 500 }
      );
    }

    // Remove sensitive fields
    const { embedding, ...sanitizedProject } = updatedProject;

    const response: ApiResponse = {
      success: true,
      data: sanitizedProject,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error in PUT /api/projects/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id]
 * Delete a specific project
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: projectId } = await params;

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
    const cascade = searchParams.get("cascade") === "true";

    // Verify ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select(
        `
        id,
        title,
        creators!inner (
          profile_id,
          username
        )
      `
      )
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    if ((project.creators as any).profile_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    // If cascade delete, remove all associated media first
    if (cascade) {
      // Get all media files to delete from storage
      const { data: images } = await supabase
        .from("images")
        .select("url")
        .eq("project_id", projectId);

      const { data: videos } = await supabase
        .from("videos")
        .select("url")
        .eq("project_id", projectId);

      // Extract file paths and delete from storage
      const filePaths: string[] = [];

      if (images) {
        images.forEach((image: any) => {
          try {
            const url = new URL(image.url);
            const pathParts = url.pathname.split("/");
            const filePath = pathParts
              .slice(pathParts.indexOf("media") + 1)
              .join("/");
            if (filePath) filePaths.push(filePath);
          } catch (error) {
            console.error("Error parsing image URL:", error);
          }
        });
      }

      if (videos) {
        videos.forEach((video: any) => {
          try {
            const url = new URL(video.url);
            const pathParts = url.pathname.split("/");
            const filePath = pathParts
              .slice(pathParts.indexOf("media") + 1)
              .join("/");
            if (filePath) filePaths.push(filePath);
          } catch (error) {
            console.error("Error parsing video URL:", error);
          }
        });
      }

      // Delete files from storage
      if (filePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from("media")
          .remove(filePaths);

        if (storageError) {
          console.error("Error deleting files from storage:", storageError);
          // Continue with project deletion even if storage cleanup fails
        }
      }

      // Delete media records (this should cascade due to foreign key constraints)
      await supabase.from("images").delete().eq("project_id", projectId);
      await supabase.from("videos").delete().eq("project_id", projectId);
    }

    // Delete the project
    const { error: deleteError } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (deleteError) {
      console.error("Failed to delete project:", deleteError);
      return NextResponse.json(
        { success: false, error: "Failed to delete project" },
        { status: 500 }
      );
    }

    const response: ApiResponse = {
      success: true,
      data: null,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error in DELETE /api/projects/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
