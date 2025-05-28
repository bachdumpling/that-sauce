import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  validationErrorResponse,
  serverErrorResponse,
  notFoundResponse,
} from "@/lib/api-utils/response";

/**
 * GET /api/media/[id]?type=image|video
 * Get media details by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: mediaId } = await params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get("type");

    if (!typeParam || (typeParam !== "image" && typeParam !== "video")) {
      return validationErrorResponse("Media type (image|video) is required");
    }

    const tableName = typeParam === "image" ? "images" : "videos";
    const { data: media, error } = await supabase
      .from(tableName)
      .select(
        `
        *,
        projects!inner (
          id,
          title,
          creators!inner (
            id,
            profile_id,
            username
          )
        )
      `
      )
      .eq("id", mediaId)
      .single();

    if (error || !media) {
      return notFoundResponse("Media");
    }

    // Check if user owns this media
    if ((media.projects.creators as any).profile_id !== user.id) {
      return errorResponse("Access denied", 403);
    }

    return successResponse({
      ...media,
      type: typeParam,
      project: {
        id: media.projects.id,
        title: media.projects.title,
      },
      creator: {
        id: (media.projects.creators as any).id,
        username: (media.projects.creators as any).username,
      },
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}

/**
 * PUT /api/media/[id]
 * Update media metadata
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: mediaId } = await params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const { media_type, project_id, ...metadata } = body;

    if (!media_type || (media_type !== "image" && media_type !== "video")) {
      return validationErrorResponse(
        "Valid media type (image|video) is required"
      );
    }

    if (!project_id) {
      return validationErrorResponse("Project ID is required");
    }

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select(
        `
        id,
        creator_id,
        creators!inner (
          id,
          profile_id
        )
      `
      )
      .eq("id", project_id)
      .single();

    if (projectError || !project) {
      return notFoundResponse("Project");
    }

    if ((project.creators as any).profile_id !== user.id) {
      return errorResponse("Access denied", 403);
    }

    const tableName = media_type === "image" ? "images" : "videos";

    // Prepare update data based on media type
    let updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (media_type === "image") {
      if (metadata.alt_text !== undefined)
        updateData.alt_text = metadata.alt_text;
      if (metadata.order !== undefined) updateData.order = metadata.order;
    } else {
      if (metadata.title !== undefined) updateData.title = metadata.title;
      if (metadata.description !== undefined)
        updateData.description = metadata.description;
      if (metadata.categories !== undefined)
        updateData.categories = metadata.categories;
    }

    // Update the record
    const { data: updatedMedia, error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq("id", mediaId)
      .eq("project_id", project_id)
      .select()
      .single();

    if (error || !updatedMedia) {
      return errorResponse("Failed to update media metadata", 500);
    }

    return successResponse(
      { ...updatedMedia, type: media_type },
      "Media metadata updated successfully"
    );
  } catch (error) {
    return serverErrorResponse(error);
  }
}

/**
 * DELETE /api/media/[id]
 * Delete media item
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: mediaId } = await params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get("type");
    const projectId = searchParams.get("project_id");

    if (!typeParam || (typeParam !== "image" && typeParam !== "video")) {
      return validationErrorResponse("Media type (image|video) is required");
    }

    if (!projectId) {
      return validationErrorResponse("Project ID is required");
    }

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select(
        `
        id,
        creator_id,
        creators!inner (
          id,
          profile_id
        )
      `
      )
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return notFoundResponse("Project");
    }

    if ((project.creators as any).profile_id !== user.id) {
      return errorResponse("Access denied", 403);
    }

    const tableName = typeParam === "image" ? "images" : "videos";

    // Get media record to check ownership and get file path
    const { data: media, error: fetchError } = await supabase
      .from(tableName)
      .select("*")
      .eq("id", mediaId)
      .eq("project_id", projectId)
      .single();

    if (fetchError || !media) {
      return notFoundResponse("Media");
    }

    // Delete from database first
    const { error: deleteError } = await supabase
      .from(tableName)
      .delete()
      .eq("id", mediaId);

    if (deleteError) {
      return errorResponse("Failed to delete media record", 500);
    }

    // Try to delete from storage if it's an uploaded file
    if (media.url && media.url.includes("supabase")) {
      try {
        const urlParts = media.url.split("/");
        const fileName = urlParts.slice(-3).join("/"); // Get the file path
        await supabase.storage.from("media").remove([fileName]);
      } catch (storageError) {
        console.warn("Failed to delete file from storage:", storageError);
        // Don't fail the action if storage deletion fails
      }
    }

    return successResponse(
      { id: mediaId, type: typeParam },
      "Media deleted successfully"
    );
  } catch (error) {
    return serverErrorResponse(error);
  }
}
