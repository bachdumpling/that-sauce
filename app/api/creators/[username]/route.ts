// app/api/creators/[username]/route.ts
import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/api-utils/response";
import { getOptionalAuth, requireAuth } from "@/lib/api-utils/auth";
import { validateBody, creatorUpdateSchema } from "@/lib/api-utils/validation";

// GET /api/creators/[username]
export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = await params;
    const supabase = await createClient();
    const authContext = await getOptionalAuth(request);

    if (!username) {
      return errorResponse("Username is required", 400);
    }

    // First, fetch creator and their projects (without nested images/videos)
    const { data, error } = await supabase
      .from("creators")
      .select(
        `
        *,
        profile:profile_id (
          first_name,
          last_name
        ),
        projects (
          id,
          title,
          description,
          short_description,
          roles,
          client_ids,
          behance_url,
          featured,
          year,
          thumbnail_url,
          created_at,
          updated_at
        )
        `
      )
      .eq("username", username)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return notFoundResponse("Creator");
      }
      console.error(`Database error for username ${username}:`, error);
      throw error;
    }

    if (!data) {
      return notFoundResponse("Creator");
    }

    // Map the data to include first_name and last_name at the top level
    const creator = {
      ...data,
      first_name: data.profile?.first_name || null,
      last_name: data.profile?.last_name || null,
      // Check if the user is the owner by comparing profile_id with userId
      isOwner: authContext?.user?.id
        ? data.profile_id === authContext.user.id
        : false,
    };

    delete creator.profile; // Remove the nested profile object

    // Fetch organizations, images, and videos for projects
    if (creator.projects && creator.projects.length > 0) {
      // Fetch organizations based on client_ids
      const allClientIds = creator.projects
        .flatMap((project: any) => project.client_ids || [])
        .filter((id: string | null) => id);
      const uniqueClientIds = Array.from(new Set(allClientIds));
      let organizationsMap: Record<string, any> = {};

      if (uniqueClientIds.length > 0) {
        const { data: organizationsData, error: orgsError } = await supabase
          .from("organizations")
          .select("id, name, logo_url, website")
          .in("id", uniqueClientIds);

        if (orgsError) {
          console.error(`Error fetching organizations: ${orgsError.message}`);
          // Continue without organization data
        } else if (organizationsData) {
          organizationsMap = organizationsData.reduce(
            (acc: Record<string, any>, org) => {
              acc[org.id] = org;
              return acc;
            },
            {}
          );
        }
      }

      // Map organizations back to projects
      const projectIds = creator.projects.map((project: any) => project.id);
      creator.projects = creator.projects.map((project: any) => ({
        ...project,
        clients: (project.client_ids || [])
          .map((id: string) => organizationsMap[id])
          .filter((org: any) => org), // Add a 'clients' array
      }));

      // Fetch all images for all projects
      const { data: allImages, error: imagesError } = await supabase
        .from("images")
        .select(
          "id, creator_id, project_id, url, resolutions, created_at, updated_at, order, alt_text"
        )
        .in("project_id", projectIds);

      if (imagesError) {
        console.error(`Error fetching project images: ${imagesError.message}`);
      }

      // Fetch all videos for all projects
      const { data: allVideos, error: videosError } = await supabase
        .from("videos")
        .select(
          "id, creator_id, project_id, title, vimeo_id, youtube_id, url, description, created_at, updated_at"
        )
        .in("project_id", projectIds);

      if (videosError) {
        console.error(`Error fetching project videos: ${videosError.message}`);
      }

      // Group images and videos by project_id
      const imagesByProject: Record<string, any[]> = {};
      const videosByProject: Record<string, any[]> = {};

      if (allImages) {
        allImages.forEach((image: any) => {
          if (!imagesByProject[image.project_id]) {
            imagesByProject[image.project_id] = [];
          }
          imagesByProject[image.project_id].push(image);
        });
      }

      if (allVideos) {
        allVideos.forEach((video: any) => {
          if (!videosByProject[video.project_id]) {
            videosByProject[video.project_id] = [];
          }
          videosByProject[video.project_id].push(video);
        });
      }

      // Assign images and videos to each project
      creator.projects = creator.projects.map((project: any) => ({
        ...project, // Includes 'clients' added in the previous map
        creator_username: username,
        images: imagesByProject[project.id] || [],
        videos: videosByProject[project.id] || [],
      }));
    }

    return successResponse(creator);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

// PUT /api/creators/[username] - Update creator profile
export async function PUT(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = await params;
    const authContext = await requireAuth(request);
    const body = await request.json();

    // Validate the request body
    const validatedData = validateBody(creatorUpdateSchema, body);

    const supabase = await createClient();

    // First, verify the creator exists and belongs to the authenticated user
    const { data: existingCreator, error: fetchError } = await supabase
      .from("creators")
      .select("id, profile_id")
      .eq("username", username)
      .single();

    if (fetchError || !existingCreator) {
      return notFoundResponse("Creator");
    }

    if (existingCreator.profile_id !== authContext.user.id) {
      return unauthorizedResponse();
    }

    // Update creator profile
    const { data: updatedCreator, error: updateError } = await supabase
      .from("creators")
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq("username", username)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return successResponse(
      updatedCreator,
      "Creator profile updated successfully"
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("Validation failed")) {
      return errorResponse(error.message, 422);
    }
    if (error instanceof Error && error.message === "Authentication required") {
      return unauthorizedResponse();
    }
    return serverErrorResponse(error);
  }
}
