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

function validateFileType(file: File): {
  isValid: boolean;
  type: "image" | "video" | null;
  error?: string;
} {
  const allowedImageTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  const allowedVideoTypes = [
    "video/mp4",
    "video/mov",
    "video/avi",
    "video/wmv",
    "video/webm",
  ];

  if (allowedImageTypes.includes(file.type)) {
    return { isValid: true, type: "image" };
  }

  if (allowedVideoTypes.includes(file.type)) {
    return { isValid: true, type: "video" };
  }

  return {
    isValid: false,
    type: null,
    error: `Unsupported file type: ${file.type}. Supported types: ${[...allowedImageTypes, ...allowedVideoTypes].join(", ")}`,
  };
}

async function verifyProjectOwnership(
  supabase: any,
  projectId: string,
  userId: string
) {
  const { data: project, error } = await supabase
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

  if (error || !project) {
    throw new Error("Project not found");
  }

  // Check if user is the owner
  if ((project.creators as any).profile_id === userId) {
    return project;
  }

  // If not the owner, check if user is an admin
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (!profileError && profile?.role === "admin") {
    return project; // Admin has access
  }

  throw new Error("Access denied: You don't own this project");
}

/**
 * POST /api/media/batch
 * Batch upload multiple media files
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return unauthorizedResponse();
    }

    const formData = await request.formData();
    const projectId = formData.get("project_id") as string;

    if (!projectId) {
      return validationErrorResponse("Project ID is required");
    }

    // Verify project ownership
    const project = await verifyProjectOwnership(supabase, projectId, user.id);

    // Get all files from form data
    const files: File[] = [];
    const entries = Array.from(formData.entries());
    for (const [key, value] of entries) {
      if (key === "files" && value instanceof File) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return validationErrorResponse("No files provided");
    }

    const results = [];
    const errors = [];

    for (const file of files) {
      try {
        // Validate file
        const validation = validateFileType(file);
        if (!validation.isValid) {
          errors.push({ file: file.name, error: validation.error });
          continue;
        }

        // Check file size
        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
          errors.push({
            file: file.name,
            error: "File size exceeds 50MB limit",
          });
          continue;
        }

        // Generate unique filename
        const timestamp = Date.now() + Math.random();
        const fileExtension = file.name.split(".").pop();
        const fileName = `${user.id}/${projectId}/${validation.type}-${timestamp}.${fileExtension}`;

        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("media")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          errors.push({ file: file.name, error: "Upload failed" });
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("media")
          .getPublicUrl(fileName);

        // Save to database
        if (validation.type === "image") {
          const { data, error } = await supabase
            .from("images")
            .insert({
              project_id: projectId,
              creator_id: project.creator_id,
              url: urlData.publicUrl,
              alt_text: file.name,
              order: 0,
              resolutions: {},
            })
            .select()
            .single();

          if (error) {
            await supabase.storage.from("media").remove([fileName]);
            errors.push({ file: file.name, error: "Database save failed" });
            continue;
          }

          results.push({ ...data, type: "image" });
        } else {
          const { data, error } = await supabase
            .from("videos")
            .insert({
              project_id: projectId,
              creator_id: project.creator_id,
              url: urlData.publicUrl,
              title: file.name,
              description: "",
              categories: [],
            })
            .select()
            .single();

          if (error) {
            await supabase.storage.from("media").remove([fileName]);
            errors.push({ file: file.name, error: "Database save failed" });
            continue;
          }

          results.push({ ...data, type: "video" });
        }
      } catch (error: any) {
        errors.push({ file: file.name, error: error.message });
      }
    }

    return successResponse(
      {
        uploaded: results,
        errors,
        total: files.length,
        successful: results.length,
        failed: errors.length,
      },
      `Uploaded ${results.length}/${files.length} files successfully`
    );
  } catch (error: any) {
    if (error.message.includes("Project not found")) {
      return notFoundResponse("Project");
    }
    if (error.message.includes("Access denied")) {
      return errorResponse("Access denied", 403);
    }
    return serverErrorResponse(error);
  }
}

/**
 * DELETE /api/media/batch
 * Batch delete multiple media items
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
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
    const project = await verifyProjectOwnership(supabase, project_id, user.id);

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

    return successResponse(
      {
        deleted: results,
        errors,
        total: media_ids.length,
        successful: results.length,
        failed: errors.length,
      },
      `Deleted ${results.length}/${media_ids.length} media items`
    );
  } catch (error: any) {
    if (error.message.includes("Project not found")) {
      return notFoundResponse("Project");
    }
    if (error.message.includes("Access denied")) {
      return errorResponse("Access denied", 403);
    }
    return serverErrorResponse(error);
  }
}
