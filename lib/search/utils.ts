import {
  RawSearchResult,
  CreatorWithContent,
  ProjectContent,
  CreatorProfile,
} from "@/types/search";

/**
 * Validate search query parameters
 */
export function validateSearchParams(params: {
  query?: string;
  contentType?: string;
  limit?: number;
  page?: number;
}): {
  query: string;
  contentType: "all" | "images" | "videos";
  limit: number;
  page: number;
} {
  const { query = "", contentType = "all", limit = 10, page = 1 } = params;

  // Validate contentType
  const validContentType =
    contentType === "images" || contentType === "videos" ? contentType : "all";

  // Validate limit (between 1 and 50)
  const validLimit = Math.max(1, Math.min(50, Number(limit) || 10));

  // Validate page (at least 1)
  const validPage = Math.max(1, Number(page) || 1);

  return {
    query: query.trim(),
    contentType: validContentType,
    limit: validLimit,
    page: validPage,
  };
}

/**
 * Group search results by creator, matching the old API structure
 */
export function groupSearchResultsByCreator(
  results: RawSearchResult[]
): CreatorWithContent[] {
  const grouped = new Map<string, CreatorWithContent>();

  for (const result of results) {
    const creatorId = result.creator_id;

    if (!grouped.has(creatorId)) {
      // Create new creator entry
      const creatorProfile: CreatorProfile = {
        id: creatorId,
        username: result.creator_username,
        name: undefined, // Not available in raw results
        avatar_url: undefined, // Not available in raw results
        bio: result.creator_bio,
        location: result.creator_location,
        verification_status: undefined, // Not available in raw results
        primary_role: result.creator_primary_role,
        social_links: result.creator_social_links,
        work_email: result.creator_work_email,
      };

      grouped.set(creatorId, {
        creator: creatorProfile,
        projects: [],
        total_score: 0,
      });
    }

    const groupedResult = grouped.get(creatorId)!;

    // Find or create project - use result.project_id as the project ID
    let project = groupedResult.projects.find(
      (p) => p.id === result.project_id
    );
    if (!project) {
      project = {
        id: result.project_id, // Use project_id from raw results
        title: result.project_title, // Use project_title from raw results
        description: undefined, // Not available in current raw results
        created_at: "", // Not available in current raw results
        updated_at: "", // Not available in current raw results
        vector_score: undefined, // Not available in current raw results
        video_score: undefined, // Not available in current raw results
        final_score: result.content_score, // Use content_score as final_score
        images: [],
        videos: [],
      };
      groupedResult.projects.push(project);
    }

    // Add image if present
    if (
      result.content_type === "image" &&
      result.content_id &&
      result.content_url
    ) {
      const existingImage = project.images.find(
        (img) => img.id === result.content_id
      );
      if (!existingImage) {
        project.images.push({
          id: result.content_id,
          url: result.content_url,
          alt_text: result.content_title, // Use content_title as alt_text
          order: undefined, // Not available in current raw results
        });
      }
    }

    // Add video if present - videos may have null url but have vimeo_id/youtube_id
    if (
      result.content_type === "video" &&
      result.content_id
    ) {
      const existingVideo = project.videos.find(
        (vid) => vid.id === result.content_id
      );
      if (!existingVideo) {
        project.videos.push({
          id: result.content_id,
          url: result.content_url, // Can be null for videos with vimeo_id/youtube_id
          title: result.content_title,
          description: result.content_description,
          youtube_id: result.youtube_id,
          vimeo_id: result.vimeo_id,
        });
      }
    }

    // Update total score (use highest content score for creator)
    if (
      result.content_score &&
      (!groupedResult.total_score ||
        result.content_score > groupedResult.total_score)
    ) {
      groupedResult.total_score = result.content_score;
    }
  }

  // Sort projects within each creator by score
  Array.from(grouped.values()).forEach((group: CreatorWithContent) => {
    group.projects.sort((a, b) => (b.final_score || 0) - (a.final_score || 0));

    // Sort images by order (though order is not available, this maintains structure)
    group.projects.forEach((project) => {
      project.images.sort((a, b) => (a.order || 0) - (b.order || 0));
    });
  });

  // Convert to array and sort by total score
  return Array.from(grouped.values()).sort(
    (a: CreatorWithContent, b: CreatorWithContent) =>
      (b.total_score || 0) - (a.total_score || 0)
  );
}

// Re-export the GroupedSearchResult type for backwards compatibility
export type GroupedSearchResult = CreatorWithContent;
