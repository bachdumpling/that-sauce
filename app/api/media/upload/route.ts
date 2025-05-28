import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse, serverErrorResponse, notFoundResponse } from "@/lib/api-utils/response";

// Helper functions
function extractYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

function extractVimeoId(url: string): string | null {
  const regExp = /(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?))/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

function validateFileType(file: File): { isValid: boolean; type: "image" | "video" | null; error?: string } {
  const allowedImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  const allowedVideoTypes = ["video/mp4", "video/mov", "video/avi", "video/wmv", "video/webm"];
  
  if (allowedImageTypes.includes(file.type)) {
    return { isValid: true, type: "image" };
  }
  
  if (allowedVideoTypes.includes(file.type)) {
    return { isValid: true, type: "video" };
  }
  
  return { 
    isValid: false, 
    type: null, 
    error: `Unsupported file type: ${file.type}. Supported types: ${[...allowedImageTypes, ...allowedVideoTypes].join(", ")}` 
  };
}

async function verifyProjectOwnership(supabase: any, projectId: string, userId: string) {
  const { data: project, error } = await supabase
    .from("projects")
    .select(`
      id,
      creator_id,
      creators!inner (
        id,
        profile_id
      )
    `)
    .eq("id", projectId)
    .single();

  if (error || !project) {
    throw new Error("Project not found");
  }

  if ((project.creators as any).profile_id !== userId) {
    throw new Error("Access denied: You don't own this project");
  }

  return project;
}

/**
 * POST /api/media/upload
 * Upload single media file or video link
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return unauthorizedResponse();
    }

    const contentType = request.headers.get("content-type");

    // Handle video link upload (JSON)
    if (contentType?.includes("application/json")) {
      const body = await request.json();
      const { project_id, video_url, title, description, order } = body;

      if (!project_id) {
        return validationErrorResponse("Project ID is required");
      }

      if (!video_url) {
        return validationErrorResponse("Video URL is required");
      }

      // Verify project ownership
      const project = await verifyProjectOwnership(supabase, project_id, user.id);

      // Extract video IDs
      let youtubeId = null;
      let vimeoId = null;

      if (video_url.includes("youtube.com") || video_url.includes("youtu.be")) {
        youtubeId = extractYouTubeId(video_url);
        if (!youtubeId) {
          return validationErrorResponse("Invalid YouTube URL");
        }
      } else if (video_url.includes("vimeo.com")) {
        vimeoId = extractVimeoId(video_url);
        if (!vimeoId) {
          return validationErrorResponse("Invalid Vimeo URL");
        }
      } else {
        return validationErrorResponse("URL must be from YouTube or Vimeo");
      }

      // Create video record
      const { data: videoRecord, error } = await supabase
        .from("videos")
        .insert({
          project_id: project_id,
          creator_id: project.creator_id,
          url: video_url,
          title: title || `Video from ${youtubeId ? "YouTube" : "Vimeo"}`,
          description: description || "",
          categories: [],
          youtube_id: youtubeId,
          vimeo_id: vimeoId,
        })
        .select()
        .single();

      if (error) {
        return errorResponse("Failed to save video link", 500);
      }

      return successResponse(
        { ...videoRecord, type: "video" },
        "Video link added successfully"
      );
    }

    // Handle file upload (FormData)
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const projectId = formData.get("project_id") as string;

    if (!projectId) {
      return validationErrorResponse("Project ID is required");
    }

    if (!file) {
      return validationErrorResponse("No file provided");
    }

    // Verify project ownership
    const project = await verifyProjectOwnership(supabase, projectId, user.id);

    // Validate file
    const validation = validateFileType(file);
    if (!validation.isValid) {
      return validationErrorResponse(validation.error || "Invalid file type");
    }

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return validationErrorResponse("File size exceeds 50MB limit");
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
      return errorResponse("Failed to upload file", 500);
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
        return errorResponse("Failed to save image record", 500);
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
        return errorResponse("Failed to save video record", 500);
      }

      mediaRecord = { ...data, type: "video" };
    }

    return successResponse(
      mediaRecord,
      "Media uploaded successfully"
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