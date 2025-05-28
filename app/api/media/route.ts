import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse, serverErrorResponse } from "@/lib/api-utils/response";

/**
 * GET /api/media?ids=id1,id2&type=image|video
 * Get multiple media items by IDs
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids");
    const typeParam = searchParams.get("type");

    if (!idsParam) {
      return validationErrorResponse("Media IDs are required");
    }

    const mediaIds = idsParam.split(",").filter(Boolean);
    if (mediaIds.length === 0) {
      return validationErrorResponse("At least one media ID is required");
    }

    const results = [];

    // If type is specified, only search in that table
    if (typeParam === "image" || typeParam === "video") {
      const tableName = typeParam === "image" ? "images" : "videos";
      const { data: media, error } = await supabase
        .from(tableName)
        .select(`
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
        `)
        .in("id", mediaIds);

      if (error) {
        return serverErrorResponse(error);
      }

      // Filter to only include media owned by the user
      const ownedMedia = media?.filter(item => 
        item.projects.creators.profile_id === user.id
      ) || [];

      results.push(...ownedMedia.map(item => ({ ...item, type: typeParam })));
    } else {
      // Search in both tables
      const { data: images, error: imagesError } = await supabase
        .from("images")
        .select(`
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
        `)
        .in("id", mediaIds);

      if (!imagesError && images) {
        const ownedImages = images.filter(item => 
          item.projects.creators.profile_id === user.id
        );
        results.push(...ownedImages.map(item => ({ ...item, type: "image" })));
      }

      const { data: videos, error: videosError } = await supabase
        .from("videos")
        .select(`
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
        `)
        .in("id", mediaIds);

      if (!videosError && videos) {
        const ownedVideos = videos.filter(item => 
          item.projects.creators.profile_id === user.id
        );
        results.push(...ownedVideos.map(item => ({ ...item, type: "video" })));
      }
    }

    return successResponse({
      media: results,
      total: results.length,
      requested: mediaIds.length,
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}

/**
 * DELETE /api/media
 * Bulk delete media items
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const { media_ids, project_id } = body;

    if (!media_ids || !Array.isArray(media_ids) || media_ids.length === 0) {
      return validationErrorResponse("Media IDs array is required");
    }

    if (!project_id) {
      return validationErrorResponse("Project ID is required");
    }

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select(`
        id,
        creator_id,
        creators!inner (
          id,
          profile_id
        )
      `)
      .eq("id", project_id)
      .single();

    if (projectError || !project) {
      return errorResponse("Project not found", 404);
    }

    if ((project.creators as any).profile_id !== user.id) {
      return errorResponse("Access denied", 403);
    }

    const results = [];
    const errors = [];

    for (const mediaId of media_ids) {
      try {
        // Try to find in images first
        let media = null;
        let mediaType: "image" | "video" = "image";

        const { data: imageData } = await supabase
          .from("images")
          .select("*")
          .eq("id", mediaId)
          .eq("project_id", project_id)
          .single();

        if (imageData) {
          media = imageData;
          mediaType = "image";
        } else {
          const { data: videoData } = await supabase
            .from("videos")
            .select("*")
            .eq("id", mediaId)
            .eq("project_id", project_id)
            .single();

          if (videoData) {
            media = videoData;
            mediaType = "video";
          }
        }

        if (!media) {
          errors.push({ mediaId, error: "Media not found" });
          continue;
        }

        // Delete from database
        const tableName = mediaType === "image" ? "images" : "videos";
        const { error: deleteError } = await supabase
          .from(tableName)
          .delete()
          .eq("id", mediaId);

        if (deleteError) {
          errors.push({ mediaId, error: "Database deletion failed" });
          continue;
        }

        // Try to delete from storage
        if (media.url && media.url.includes("supabase")) {
          try {
            const urlParts = media.url.split("/");
            const fileName = urlParts.slice(-3).join("/");
            await supabase.storage.from("media").remove([fileName]);
          } catch (storageError) {
            console.warn("Failed to delete file from storage:", storageError);
          }
        }

        results.push({ mediaId, type: mediaType });
      } catch (error: any) {
        errors.push({ mediaId, error: error.message });
      }
    }

    return successResponse({
      deleted: results,
      errors,
      total: media_ids.length,
      successful: results.length,
      failed: errors.length,
    }, `Deleted ${results.length}/${media_ids.length} media items`);
  } catch (error) {
    return serverErrorResponse(error);
  }
} 