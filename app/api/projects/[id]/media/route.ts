import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { ApiResponse } from "@/types";

/**
 * GET /api/projects/[id]/media
 * Get all media (images and videos) for a project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: projectId } = await params;

    // Check if project exists
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, title")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    // Get images for this project
    const { data: images, error: imagesError } = await supabase
      .from("images")
      .select(
        `
        id,
        url,
        alt_text,
        resolutions,
        order,
        created_at,
        updated_at,
        creator:creator_id (
          id,
          username
        )
      `
      )
      .eq("project_id", projectId)
      .order("order", { ascending: true });

    if (imagesError) {
      console.error("Error fetching images:", imagesError);
    }

    // Get videos for this project
    const { data: videos, error: videosError } = await supabase
      .from("videos")
      .select(
        `
        id,
        url,
        title,
        description,
        youtube_id,
        vimeo_id,
        created_at,
        updated_at,
        creator:creator_id (
          id,
          username
        )
      `
      )
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (videosError) {
      console.error("Error fetching videos:", videosError);
    }

    // Format the response
    const formattedImages = (images || []).map((image: any) => ({
      id: image.id,
      type: "image" as const,
      url: image.url,
      alt_text: image.alt_text,
      created_at: image.created_at,
      updated_at: image.updated_at,
      order: image.order,
      thumbnails: image.resolutions || {},
      creator: image.creator
        ? {
            id: image.creator.id,
            username: image.creator.username,
          }
        : undefined,
    }));

    const formattedVideos = (videos || []).map((video: any) => ({
      id: video.id,
      type: "video" as const,
      url: video.url,
      title: video.title,
      description: video.description,
      youtube_id: video.youtube_id,
      vimeo_id: video.vimeo_id,
      created_at: video.created_at,
      updated_at: video.updated_at,

      creator: video.creator
        ? {
            id: video.creator.id,
            username: video.creator.username,
          }
        : undefined,
    }));

    // Combine and sort by order (images) and created_at (videos)
    const allMedia = [...formattedImages, ...formattedVideos].sort((a, b) => {
      // If both have order (images), sort by order
      if ("order" in a && "order" in b) {
        return a.order - b.order;
      }
      // Otherwise sort by created_at
      return (
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });

    const response: ApiResponse = {
      success: true,
      data: {
        project_id: projectId,
        project_title: project.title,
        media: allMedia,
        total: allMedia.length,
        images_count: formattedImages.length,
        videos_count: formattedVideos.length,
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error in GET /api/projects/[id]/media:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/[id]/media
 * Upload media to a project
 */
export async function POST(
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

    // Check if the project exists and belongs to the user
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select(
        `
        *,
        creators!inner (
          id,
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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const altText = formData.get("alt_text") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const order = parseInt(formData.get("order") as string) || 0;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
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
    const isImage = allowedImageTypes.includes(file.type);
    const isVideo = allowedVideoTypes.includes(file.type);

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { success: false, error: "Unsupported file type" },
        { status: 400 }
      );
    }

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "File size exceeds 50MB limit" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop();
    const mediaType = isImage ? "image" : "video";
    const fileName = `${user.id}/${projectId}/${mediaType}-${timestamp}.${fileExtension}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("media")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { success: false, error: "Failed to upload file" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("media")
      .getPublicUrl(fileName);

    // Save media record to database
    let mediaRecord;
    if (isImage) {
      const { data, error } = await supabase
        .from("images")
        .insert({
          project_id: projectId,
          creator_id: (project.creators as any).id,
          url: urlData.publicUrl,
          alt_text: altText || file.name,
          order: order,
          resolutions: {}, // TODO: Generate thumbnails
        })
        .select()
        .single();

      if (error) {
        console.error("Error saving image record:", error);
        // Clean up uploaded file
        await supabase.storage.from("media").remove([fileName]);
        return NextResponse.json(
          { success: false, error: "Failed to save image record" },
          { status: 500 }
        );
      }

      mediaRecord = {
        ...data,
        type: "image",
        thumbnails: data.resolutions || {},
      };
    } else {
      const { data, error } = await supabase
        .from("videos")
        .insert({
          project_id: projectId,
          creator_id: (project.creators as any).id,
          url: urlData.publicUrl,
          title: title || file.name,
          description: description || "",
          order: order,
        })
        .select()
        .single();

      if (error) {
        console.error("Error saving video record:", error);
        // Clean up uploaded file
        await supabase.storage.from("media").remove([fileName]);
        return NextResponse.json(
          { success: false, error: "Failed to save video record" },
          { status: 500 }
        );
      }

      mediaRecord = {
        ...data,
        type: "video",
      };
    }

    const response: ApiResponse = {
      success: true,
      data: mediaRecord,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/projects/[id]/media:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
