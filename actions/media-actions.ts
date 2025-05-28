"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

// Validation schemas
const MediaMetadataSchema = z.object({
  alt_text: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  order: z.number().optional(),
  categories: z.array(z.string()).optional(),
});

const VideoLinkSchema = z.object({
  video_url: z.string().url(),
  title: z.string().optional(),
  description: z.string().optional(),
  order: z.number().optional(),
});

const BulkDeleteSchema = z.object({
  media_ids: z.array(z.string()).min(1),
  media_types: z.array(z.enum(["image", "video"])).optional(),
});

// Helper functions
function extractYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

function extractVimeoId(url: string): string | null {
  // Handle various Vimeo URL formats including https://vimeo.com/1072008273/ecb6710763
  const regExp =
    /(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?))/;
  const match = url.match(regExp);

  if (match) {
    return match[1];
  }

  // Fallback: extract the first number after vimeo.com/
  const simpleMatch = url.match(/vimeo\.com\/(\d+)/);
  return simpleMatch ? simpleMatch[1] : null;
}

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

  if (project.creators.profile_id !== userId) {
    throw new Error("Access denied: You don't own this project");
  }

  return project;
}

/**
 * Get media details by ID
 */
export async function getMediaDetailsAction(
  mediaId: string,
  mediaType: "image" | "video"
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Authentication required" };
    }

    const tableName = mediaType === "image" ? "images" : "videos";
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
      return { success: false, error: "Media not found" };
    }

    // Check if user owns this media
    if (media.projects.creators.profile_id !== user.id) {
      return { success: false, error: "Access denied" };
    }

    return {
      success: true,
      data: {
        ...media,
        type: mediaType,
        project: {
          id: media.projects.id,
          title: media.projects.title,
        },
        creator: {
          id: media.projects.creators.id,
          username: media.projects.creators.username,
        },
      },
    };
  } catch (error: any) {
    console.error("Error in getMediaDetailsAction:", error);
    return {
      success: false,
      error: error.message || "Failed to get media details",
    };
  }
}

/**
 * Upload single media file to a project
 */
export async function uploadMediaAction(
  username: string,
  projectId: string,
  formData: FormData
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Authentication required" };
    }

    // Verify project ownership
    const project = await verifyProjectOwnership(supabase, projectId, user.id);

    // Get file from form data
    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "No file provided" };
    }

    // Validate file
    const validation = validateFileType(file);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return { success: false, error: "File size exceeds 50MB limit" };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop();
    const fileName = `${user.id}/${projectId}/${validation.type}-${timestamp}.${fileExtension}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("media")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return { success: false, error: "Failed to upload file" };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("media")
      .getPublicUrl(fileName);

    // Prepare metadata
    const metadata = {
      alt_text: formData.get("alt_text") as string,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      order: parseInt(formData.get("order") as string) || 0,
    };

    // Save media record to database
    let mediaRecord;
    if (validation.type === "image") {
      const { data, error } = await supabase
        .from("images")
        .insert({
          project_id: projectId,
          creator_id: project.creator_id,
          url: urlData.publicUrl,
          alt_text: metadata.alt_text || file.name,
          order: metadata.order,
          resolutions: {}, // TODO: Generate thumbnails
        })
        .select()
        .single();

      if (error) {
        // Clean up uploaded file
        await supabase.storage.from("media").remove([fileName]);
        return { success: false, error: "Failed to save image record" };
      }

      mediaRecord = { ...data, type: "image" };
    } else {
      const { data, error } = await supabase
        .from("videos")
        .insert({
          project_id: projectId,
          creator_id: project.creator_id,
          url: urlData.publicUrl,
          title: metadata.title || file.name,
          description: metadata.description || "",
          categories: [],
        })
        .select()
        .single();

      if (error) {
        // Clean up uploaded file
        await supabase.storage.from("media").remove([fileName]);
        return { success: false, error: "Failed to save video record" };
      }

      mediaRecord = { ...data, type: "video" };
    }

    // Revalidate paths
    revalidatePath(`/${username}/work/${projectId}`, "page");
    revalidatePath(`/${username}/work`, "page");

    return {
      success: true,
      data: mediaRecord,
      message: "Media uploaded successfully",
    };
  } catch (error: any) {
    console.error("Error in uploadMediaAction:", error);
    return {
      success: false,
      error: error.message || "Failed to upload media",
    };
  }
}

/**
 * Batch upload multiple media files
 */
export async function batchUploadMediaAction(
  username: string,
  projectId: string,
  files: File[]
) {
  console.log("batchUploadMediaAction called with:", {
    username,
    projectId,
    filesCount: files.length,
    fileNames: files.map((f) => f.name),
  });

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error(
        "Authentication failed in batchUploadMediaAction:",
        authError
      );
      return { success: false, error: "Authentication required" };
    }

    console.log("User authenticated:", user.id);

    // Verify project ownership
    const project = await verifyProjectOwnership(supabase, projectId, user.id);
    console.log("Project ownership verified:", project.id);

    const results = [];
    const errors = [];

    for (const file of files) {
      console.log(
        `Processing file: ${file.name}, size: ${file.size}, type: ${file.type}`
      );

      try {
        // Validate file
        const validation = validateFileType(file);
        if (!validation.isValid) {
          console.error(
            `File validation failed for ${file.name}:`,
            validation.error
          );
          errors.push({ file: file.name, error: validation.error });
          continue;
        }

        console.log(`File ${file.name} validated as ${validation.type}`);

        // Check file size
        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
          console.error(
            `File ${file.name} exceeds size limit: ${file.size} > ${maxSize}`
          );
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

        console.log(`Generated filename: ${fileName}`);

        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("media")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error(`Storage upload failed for ${file.name}:`, uploadError);
          errors.push({ file: file.name, error: "Upload failed" });
          continue;
        }

        console.log(`File ${file.name} uploaded successfully to storage`);

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("media")
          .getPublicUrl(fileName);

        console.log(
          `Public URL generated for ${file.name}:`,
          urlData.publicUrl
        );

        // Save to database
        if (validation.type === "image") {
          console.log(`Saving image ${file.name} to database`);
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
            console.error(
              `Database save failed for image ${file.name}:`,
              error
            );
            await supabase.storage.from("media").remove([fileName]);
            errors.push({ file: file.name, error: "Database save failed" });
            continue;
          }

          console.log(`Image ${file.name} saved to database successfully`);
          results.push({
            ...data,
            type: "image",
            metadata: {
              original_filename: file.name,
              file_size: file.size,
              file_type: file.type,
            },
          });
        } else {
          console.log(`Saving video ${file.name} to database`);
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
            console.error(
              `Database save failed for video ${file.name}:`,
              error
            );
            await supabase.storage.from("media").remove([fileName]);
            errors.push({ file: file.name, error: "Database save failed" });
            continue;
          }

          console.log(`Video ${file.name} saved to database successfully`);
          results.push({
            ...data,
            type: "video",
            metadata: {
              original_filename: file.name,
              file_size: file.size,
              file_type: file.type,
            },
          });
        }
      } catch (error: any) {
        console.error(`Error processing file ${file.name}:`, error);
        errors.push({ file: file.name, error: error.message });
      }
    }

    // Revalidate paths
    revalidatePath(`/${username}/work/${projectId}`, "page");
    revalidatePath(`/${username}/work`, "page");

    const response = {
      success: true,
      data: {
        media: results,
        errors,
        total: files.length,
        successful: results.length,
        failed: errors.length,
      },
      message: `Uploaded ${results.length}/${files.length} files successfully`,
    };

    console.log("batchUploadMediaAction response:", response);
    return response;
  } catch (error: any) {
    console.error("Error in batchUploadMediaAction:", error);
    return {
      success: false,
      error: error.message || "Failed to batch upload media",
    };
  }
}

/**
 * Upload video link (YouTube/Vimeo)
 */
export async function uploadVideoLinkAction(
  username: string,
  projectId: string,
  videoData: z.infer<typeof VideoLinkSchema>
) {
  console.log("uploadVideoLinkAction called with:", {
    username,
    projectId,
    videoData,
  });

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error(
        "Authentication failed in uploadVideoLinkAction:",
        authError
      );
      return { success: false, error: "Authentication required" };
    }

    console.log("User authenticated:", user.id);

    // Validate input
    const validatedData = VideoLinkSchema.parse(videoData);
    console.log("Video data validated:", validatedData);

    // Verify project ownership
    const project = await verifyProjectOwnership(supabase, projectId, user.id);
    console.log("Project ownership verified:", project.id);

    // Extract video IDs
    let youtubeId = null;
    let vimeoId = null;

    if (
      validatedData.video_url.includes("youtube.com") ||
      validatedData.video_url.includes("youtu.be")
    ) {
      youtubeId = extractYouTubeId(validatedData.video_url);
      if (!youtubeId) {
        console.error("Invalid YouTube URL:", validatedData.video_url);
        return { success: false, error: "Invalid YouTube URL" };
      }
      console.log("Extracted YouTube ID:", youtubeId);
    } else if (validatedData.video_url.includes("vimeo.com")) {
      vimeoId = extractVimeoId(validatedData.video_url);
      if (!vimeoId) {
        console.error("Invalid Vimeo URL:", validatedData.video_url);
        return { success: false, error: "Invalid Vimeo URL" };
      }
      console.log("Extracted Vimeo ID:", vimeoId);
    } else {
      console.error(
        "URL is not from YouTube or Vimeo:",
        validatedData.video_url
      );
      return { success: false, error: "URL must be from YouTube or Vimeo" };
    }

    // Create video record
    const videoRecord = {
      project_id: projectId,
      creator_id: project.creator_id,
      url: validatedData.video_url,
      title:
        validatedData.title || `Video from ${youtubeId ? "YouTube" : "Vimeo"}`,
      description: validatedData.description || "",
      categories: [],
      youtube_id: youtubeId,
      vimeo_id: vimeoId,
    };

    console.log("Creating video record:", videoRecord);

    const { data: videoRecord_result, error } = await supabase
      .from("videos")
      .insert(videoRecord)
      .select()
      .single();

    if (error) {
      console.error("Failed to save video link to database:", error);
      return { success: false, error: "Failed to save video link" };
    }

    console.log("Video link saved successfully:", videoRecord_result);

    // Revalidate paths
    revalidatePath(`/${username}/work/${projectId}`, "page");
    revalidatePath(`/${username}/work`, "page");

    const response = {
      success: true,
      data: { ...videoRecord_result, type: "video" },
      message: "Video link added successfully",
    };

    console.log("uploadVideoLinkAction response:", response);
    return response;
  } catch (error: any) {
    console.error("Error in uploadVideoLinkAction:", error);
    return {
      success: false,
      error: error.message || "Failed to add video link",
    };
  }
}

/**
 * Delete media item
 */
export async function deleteMediaAction(
  username: string,
  projectId: string,
  mediaId: string,
  mediaType: "image" | "video"
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Authentication required" };
    }

    // Verify project ownership
    await verifyProjectOwnership(supabase, projectId, user.id);

    const tableName = mediaType === "image" ? "images" : "videos";

    // Get media record to check ownership and get file path
    const { data: media, error: fetchError } = await supabase
      .from(tableName)
      .select("*")
      .eq("id", mediaId)
      .eq("project_id", projectId)
      .single();

    if (fetchError || !media) {
      return { success: false, error: "Media not found" };
    }

    // Delete from database first
    const { error: deleteError } = await supabase
      .from(tableName)
      .delete()
      .eq("id", mediaId);

    if (deleteError) {
      return { success: false, error: "Failed to delete media record" };
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

    // Revalidate paths
    revalidatePath(`/${username}/work/${projectId}`, "page");
    revalidatePath(`/${username}/work`, "page");

    return {
      success: true,
      message: "Media deleted successfully",
    };
  } catch (error: any) {
    console.error("Error in deleteMediaAction:", error);
    return {
      success: false,
      error: error.message || "Failed to delete media",
    };
  }
}

/**
 * Bulk delete media items
 */
export async function bulkDeleteMediaAction(
  username: string,
  projectId: string,
  deleteData: z.infer<typeof BulkDeleteSchema>
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Authentication required" };
    }

    // Validate input
    const validatedData = BulkDeleteSchema.parse(deleteData);

    // Verify project ownership
    await verifyProjectOwnership(supabase, projectId, user.id);

    const results = [];
    const errors = [];

    for (const mediaId of validatedData.media_ids) {
      try {
        // Try to find in images first
        let media = null;
        let mediaType: "image" | "video" = "image";

        const { data: imageData } = await supabase
          .from("images")
          .select("*")
          .eq("id", mediaId)
          .eq("project_id", projectId)
          .single();

        if (imageData) {
          media = imageData;
          mediaType = "image";
        } else {
          const { data: videoData } = await supabase
            .from("videos")
            .select("*")
            .eq("id", mediaId)
            .eq("project_id", projectId)
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

    // Revalidate paths
    revalidatePath(`/${username}/work/${projectId}`, "page");
    revalidatePath(`/${username}/work`, "page");

    return {
      success: true,
      data: {
        deleted: results,
        errors,
        total: validatedData.media_ids.length,
        successful: results.length,
        failed: errors.length,
      },
      message: `Deleted ${results.length}/${validatedData.media_ids.length} media items`,
    };
  } catch (error: any) {
    console.error("Error in bulkDeleteMediaAction:", error);
    return {
      success: false,
      error: error.message || "Failed to bulk delete media",
    };
  }
}

/**
 * Update media metadata
 */
export async function updateMediaMetadataAction(
  username: string,
  projectId: string,
  mediaId: string,
  mediaType: "image" | "video",
  metadata: z.infer<typeof MediaMetadataSchema>
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Authentication required" };
    }

    // Validate input
    const validatedMetadata = MediaMetadataSchema.parse(metadata);

    // Verify project ownership
    await verifyProjectOwnership(supabase, projectId, user.id);

    const tableName = mediaType === "image" ? "images" : "videos";

    // Prepare update data based on media type
    let updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (mediaType === "image") {
      if (validatedMetadata.alt_text !== undefined)
        updateData.alt_text = validatedMetadata.alt_text;
      if (validatedMetadata.order !== undefined)
        updateData.order = validatedMetadata.order;
    } else {
      if (validatedMetadata.title !== undefined)
        updateData.title = validatedMetadata.title;
      if (validatedMetadata.description !== undefined)
        updateData.description = validatedMetadata.description;
      if (validatedMetadata.categories !== undefined)
        updateData.categories = validatedMetadata.categories;
    }

    // Update the record
    const { data: updatedMedia, error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq("id", mediaId)
      .eq("project_id", projectId)
      .select()
      .single();

    if (error || !updatedMedia) {
      return { success: false, error: "Failed to update media metadata" };
    }

    // Revalidate paths
    revalidatePath(`/${username}/work/${projectId}`, "page");

    return {
      success: true,
      data: { ...updatedMedia, type: mediaType },
      message: "Media metadata updated successfully",
    };
  } catch (error: any) {
    console.error("Error in updateMediaMetadataAction:", error);
    return {
      success: false,
      error: error.message || "Failed to update media metadata",
    };
  }
}

/**
 * Reorder media items
 */
export async function reorderMediaAction(
  username: string,
  projectId: string,
  mediaOrders: Array<{ id: string; order: number; type: "image" | "video" }>
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Authentication required" };
    }

    // Verify project ownership
    await verifyProjectOwnership(supabase, projectId, user.id);

    const results = [];
    const errors = [];

    for (const item of mediaOrders) {
      try {
        const tableName = item.type === "image" ? "images" : "videos";
        const updateField = item.type === "image" ? "order" : "order"; // Videos might not have order field

        const { data, error } = await supabase
          .from(tableName)
          .update({ [updateField]: item.order })
          .eq("id", item.id)
          .eq("project_id", projectId)
          .select()
          .single();

        if (error) {
          errors.push({ id: item.id, error: error.message });
        } else {
          results.push({ ...data, type: item.type });
        }
      } catch (error: any) {
        errors.push({ id: item.id, error: error.message });
      }
    }

    // Revalidate paths
    revalidatePath(`/${username}/work/${projectId}`, "page");

    return {
      success: true,
      data: {
        updated: results,
        errors,
        total: mediaOrders.length,
        successful: results.length,
        failed: errors.length,
      },
      message: `Reordered ${results.length}/${mediaOrders.length} media items`,
    };
  } catch (error: any) {
    console.error("Error in reorderMediaAction:", error);
    return {
      success: false,
      error: error.message || "Failed to reorder media",
    };
  }
}

/**
 * Get media analytics for a project
 */
export async function getMediaAnalyticsAction(projectId: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Authentication required" };
    }

    // Verify project ownership
    await verifyProjectOwnership(supabase, projectId, user.id);

    // Get image count and analytics
    const { data: images, error: imagesError } = await supabase
      .from("images")
      .select("id, created_at, analysis_status")
      .eq("project_id", projectId);

    if (imagesError) {
      return { success: false, error: "Failed to fetch image analytics" };
    }

    // Get video count and analytics
    const { data: videos, error: videosError } = await supabase
      .from("videos")
      .select("id, created_at, analysis_status")
      .eq("project_id", projectId);

    if (videosError) {
      return { success: false, error: "Failed to fetch video analytics" };
    }

    const analytics = {
      total_media: (images?.length || 0) + (videos?.length || 0),
      images: {
        total: images?.length || 0,
        analyzed:
          images?.filter((img) => img.analysis_status === "success").length ||
          0,
        pending:
          images?.filter((img) => img.analysis_status === "processing")
            .length || 0,
        failed:
          images?.filter((img) => img.analysis_status === "failed").length || 0,
      },
      videos: {
        total: videos?.length || 0,
        analyzed:
          videos?.filter((vid) => vid.analysis_status === "success").length ||
          0,
        pending:
          videos?.filter((vid) => vid.analysis_status === "processing")
            .length || 0,
        failed:
          videos?.filter((vid) => vid.analysis_status === "failed").length || 0,
      },
      recent_uploads: [
        ...(images || []).map((img) => ({ ...img, type: "image" })),
        ...(videos || []).map((vid) => ({ ...vid, type: "video" })),
      ]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, 10),
    };

    return {
      success: true,
      data: analytics,
    };
  } catch (error: any) {
    console.error("Error in getMediaAnalyticsAction:", error);
    return {
      success: false,
      error: error.message || "Failed to get media analytics",
    };
  }
}
