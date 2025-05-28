"use server";

import { Creator, Project } from "@/types";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

/**
 * Check if a username is available
 */
export async function checkUsernameAvailabilityAction(username: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("creators")
    .select("username")
    .eq("username", username)
    .single();

  if (error && error.code === "PGRST116") {
    // Username is available
    return { success: true, available: true };
  }

  if (error) {
    console.error("Error checking username availability:", error);
    return { success: false, error: "Failed to check username availability" };
  }

  // Username exists
  return { success: true, available: false };
}

/**
 * Get a creator by username - Optimized server action
 */
export async function getCreatorAction(username: string) {
  try {
    const supabase = await createClient();

    // Get current user for ownership check
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!username) {
      return { success: false, error: "Username is required" };
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
        return { success: false, error: "Creator not found" };
      }
      console.error(`Database error for username ${username}:`, error);
      throw error;
    }

    if (!data) {
      return { success: false, error: "Creator not found" };
    }

    // Map the data to include first_name and last_name at the top level
    const creator = {
      ...data,
      first_name: data.profile?.first_name || null,
      last_name: data.profile?.last_name || null,
      // Check if the user is the owner by comparing profile_id with userId
      isOwner: user?.id ? data.profile_id === user.id : false,
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

    return { success: true, data: creator };
  } catch (error: any) {
    console.error("Error in getCreatorAction:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    };
  }
}

/**
 * Get projects for a creator - Optimized server action
 */
export async function getCreatorProjectsAction(
  username: string,
  page = 1,
  limit = 10
) {
  try {
    const supabase = await createClient();

    // First get the creator ID
    const { data: creator, error: creatorError } = await supabase
      .from("creators")
      .select("id")
      .eq("username", username)
      .single();

    if (creatorError || !creator) {
      return { success: false, error: "Creator not found" };
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Get projects with count
    const {
      data: projects,
      error: projectsError,
      count,
    } = await supabase
      .from("projects")
      .select(
        `
        *,
        images (id, url, alt_text, order),
        videos (id, url, youtube_id, vimeo_id)
        `,
        { count: "exact" }
      )
      .eq("creator_id", creator.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (projectsError) {
      console.error("Failed to fetch creator projects:", projectsError);
      return { success: false, error: "Failed to fetch projects" };
    }

    return {
      success: true,
      data: {
        projects: projects || [],
        total: count || 0,
        page,
        limit,
      },
    };
  } catch (error: any) {
    console.error("Error in getCreatorProjectsAction:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    };
  }
}

/**
 * Update a creator's profile - Optimized server action
 */
export async function updateCreatorProfileAction(
  username: string,
  profileData: Partial<Creator>
) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      redirect("/sign-in");
    }

    // First, verify the creator exists and belongs to the authenticated user
    const { data: existingCreator, error: fetchError } = await supabase
      .from("creators")
      .select("id, profile_id")
      .eq("username", username)
      .single();

    if (fetchError || !existingCreator) {
      return { success: false, error: "Creator not found" };
    }

    if (existingCreator.profile_id !== user.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Update creator profile
    const { data: updatedCreator, error: updateError } = await supabase
      .from("creators")
      .update({
        ...profileData,
        updated_at: new Date().toISOString(),
      })
      .eq("username", username)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating creator profile:", updateError);
      return { success: false, error: "Failed to update profile" };
    }

    // Revalidate all possible paths related to this creator
    revalidatePath(`/${username}`, "layout");
    revalidatePath(`/${username}/work`, "page");
    revalidatePath(`/${username}/about`, "page");

    // If username was changed, also revalidate the new path
    if (profileData.username && profileData.username !== username) {
      revalidatePath(`/${profileData.username}`, "layout");
    }

    return {
      success: true,
      message: "Profile updated successfully",
      data: updatedCreator,
    };
  } catch (error: any) {
    console.error("Error in updateCreatorProfileAction:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    };
  }
}

/**
 * Upload a creator's avatar image - Optimized server action
 */
export async function uploadCreatorAvatarAction(username: string, file: File) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      redirect("/sign-in");
    }

    // Verify ownership
    const { data: creator, error: creatorError } = await supabase
      .from("creators")
      .select("id, profile_id")
      .eq("username", username)
      .single();

    if (creatorError || !creator || creator.profile_id !== user.id) {
      return { success: false, error: "Unauthorized or creator not found" };
    }

    // Upload file to Supabase Storage
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("media")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading avatar:", uploadError);
      return { success: false, error: "Failed to upload avatar" };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("media").getPublicUrl(fileName);

    // Update creator with new avatar URL
    const { data: updatedCreator, error: updateError } = await supabase
      .from("creators")
      .update({ avatar_url: publicUrl })
      .eq("username", username)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating creator avatar:", updateError);
      return { success: false, error: "Failed to update creator profile" };
    }

    // Revalidate paths
    revalidatePath(`/${username}`, "layout");
    revalidatePath(`/${username}/work`, "page");
    revalidatePath(`/${username}/about`, "page");

    return {
      success: true,
      message: "Avatar uploaded successfully",
      data: { avatar_url: publicUrl },
    };
  } catch (error: any) {
    console.error("Error in uploadCreatorAvatarAction:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    };
  }
}

/**
 * Upload a creator's banner image - Optimized server action
 */
export async function uploadCreatorBannerAction(username: string, file: File) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      redirect("/sign-in");
    }

    // Verify ownership
    const { data: creator, error: creatorError } = await supabase
      .from("creators")
      .select("id, profile_id")
      .eq("username", username)
      .single();

    if (creatorError || !creator || creator.profile_id !== user.id) {
      return { success: false, error: "Unauthorized or creator not found" };
    }

    // Upload file to Supabase Storage
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/banner-${Date.now()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("media")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading banner:", uploadError);
      return { success: false, error: "Failed to upload banner" };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("media").getPublicUrl(fileName);

    // Update creator with new banner URL
    const { data: updatedCreator, error: updateError } = await supabase
      .from("creators")
      .update({ banner_url: publicUrl })
      .eq("username", username)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating creator banner:", updateError);
      return { success: false, error: "Failed to update creator profile" };
    }

    // Revalidate paths
    revalidatePath(`/${username}`, "layout");
    revalidatePath(`/${username}/work`, "page");
    revalidatePath(`/${username}/about`, "page");

    return {
      success: true,
      message: "Banner uploaded successfully",
      data: { banner_url: publicUrl },
    };
  } catch (error: any) {
    console.error("Error in uploadCreatorBannerAction:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    };
  }
}

/**
 * Check if a creator exists - Use in middleware or layout
 * This throws notFound() if the creator doesn't exist
 */
export async function checkCreatorExistsAction(
  username: string
): Promise<Creator> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("creators")
      .select("*")
      .eq("username", username)
      .single();

    if (error || !data) {
      console.error("Creator not found:", error);
      notFound();
    }

    return data;
  } catch (error) {
    console.error("Error checking if creator exists:", error);
    notFound();
  }
}

// Server-side in-memory cache
interface ServerCache {
  [key: string]: {
    timestamp: number;
    data: any[];
    limit: number;
  };
}

// Global cache object that persists between requests
const SERVER_CACHE: ServerCache = {};

const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

/**
 * Fetches random creators with their latest work
 * Uses server-side in-memory cache to prevent frequent API calls
 * Optimized to use Supabase directly
 */
export async function getRandomCreatorsWithLatestWork(limit: number = 8) {
  // Create a specific cache key for this limit value
  const cacheKey = `random_creators_${limit}`;

  // Check if we have valid cached data
  if (SERVER_CACHE[cacheKey]) {
    const cachedData = SERVER_CACHE[cacheKey];
    const currentTime = Date.now();
    const cacheAge = currentTime - cachedData.timestamp;

    // If cache is still valid (less than 12 hours old)
    if (cacheAge < CACHE_DURATION) {
      return cachedData.data;
    }
  }

  // If no valid cache exists, fetch from Supabase
  try {
    const supabase = await createClient();

    // Fetch approved creators using public data access
    const { data: creators, error: creatorsError } = await supabase
      .from("creators")
      .select(
        `
        id, 
        username,
        primary_role, 
        location, 
        avatar_url
        `
      )
      .order("created_at", { ascending: false })
      .limit(limit + 10);

    if (creatorsError) {
      console.error("[CreatorsCache] Error fetching creators:", creatorsError);
      return [];
    }

    if (!creators || creators.length === 0) {
      return [];
    }

    // Shuffle and limit creators
    const shuffledCreators = creators
      .sort(() => 0.5 - Math.random())
      .slice(0, limit);

    // Fetch latest project for each creator
    const creatorsWithProjects = await Promise.all(
      shuffledCreators.map(async (creator) => {
        try {
          const { data: projects, error: projectsError } = await supabase
            .from("projects")
            .select(
              `
              id, 
              title,
              created_at,
              images:images(id, url)
            `
            )
            .eq("creator_id", creator.id)
            .order("created_at", { ascending: false })
            .limit(1);

          if (projectsError) {
            console.error(
              `[CreatorsCache] Error fetching projects for ${creator.username}:`,
              projectsError
            );
            return { creator, project: null };
          }

          return {
            creator,
            project: projects && projects.length > 0 ? projects[0] : null,
            // Mark some entries as "new" (those created in the last 7 days)
            isNew:
              projects &&
              projects.length > 0 &&
              new Date(projects[0].created_at).getTime() >
                Date.now() - 7 * 24 * 60 * 60 * 1000,
          };
        } catch (error) {
          console.error(
            `[CreatorsCache] Error fetching project for ${creator.username}:`,
            error
          );
          return { creator, project: null };
        }
      })
    );

    // Filter out entries where the project is null
    const result = creatorsWithProjects.filter((item) => item.project !== null);

    // Store in server-side cache
    SERVER_CACHE[cacheKey] = {
      timestamp: Date.now(),
      data: result,
      limit,
    };

    return result;
  } catch (error) {
    console.error(
      "[CreatorsCache] Error fetching creators with projects:",
      error
    );
    return [];
  }
}

/**
 * Get a creator's portfolio - Optimized server action
 */
export async function getCreatorPortfolio(username: string) {
  try {
    const supabase = await createClient();

    // Get creator with their projects and media for portfolio generation
    const { data: creator, error } = await supabase
      .from("creators")
      .select(
        `
        *,
        projects (
          *,
          images (id, url, alt_text, order),
          videos (id, url, youtube_id, vimeo_id)
        )
        `
      )
      .eq("username", username)
      .single();

    if (error || !creator) {
      return { success: false, error: "Creator not found" };
    }

    // TODO: Implement portfolio generation logic here
    // This could include AI-generated insights, categorization, etc.

    return { success: true, data: creator };
  } catch (error: any) {
    console.error("Error fetching creator portfolio:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    };
  }
}
