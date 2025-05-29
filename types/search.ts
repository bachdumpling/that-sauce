export interface SearchQueryParams {
  q: string;
  limit?: number;
  page?: number;
  contentType?: "all" | "videos" | "images";
  role?: string;
  subjects?: string[];
  styles?: string[];
  maxBudget?: number;
  hasDocuments?: boolean;
  documentCount?: number;
}

export interface MediaContent {
  id: string;
  type: "image" | "video";
  url: string;
  title?: string;
  description?: string;
  score?: number;
  project_id: string;
  project_title: string;
  youtube_id?: string;
  vimeo_id?: string;
  alt_text?: string;
  order?: number;
}

export interface ProjectContent {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
  vector_score?: number;
  video_score?: number;
  final_score?: number;
  images: Array<{
    id: string;
    url: string;
    alt_text?: string;
    order?: number;
  }>;
  videos: Array<{
    id: string;
    url: string;
    title?: string;
    description?: string;
    youtube_id?: string;
    vimeo_id?: string;
  }>;
}

export interface CreatorProfile {
  id: string;
  username: string;
  name?: string;
  location?: string;
  bio?: string;
  avatar_url?: string;
  primary_role?: string[];
  social_links?: Record<string, string>;
  work_email?: string;
  verification_status?: string;
}

export interface CreatorWithContent {
  creator: CreatorProfile;
  projects: ProjectContent[];
  total_score?: number;
}

export interface SearchResponse {
  results: CreatorWithContent[];
  page: number;
  limit: number;
  total: number;
  query: string;
  content_type: "all" | "videos" | "images";
  processed_query?: string;
}

export interface RawSearchResult {
  creator_id: string;
  creator_username: string;
  creator_location?: string;
  creator_bio?: string;
  creator_primary_role?: string[];
  creator_social_links?: Record<string, string>;
  creator_work_email?: string;
  creator_score?: number;
  content_id: string;
  content_type: "image" | "video";
  content_url: string;
  content_title?: string;
  content_description?: string;
  content_score?: number;
  project_id: string;
  project_title: string;
  youtube_id?: string;
  vimeo_id?: string;
  total_count?: number;
}

export interface SearchHistoryEntry {
  id: string;
  query: string;
  content_type: string;
  created_at: string;
  results_count: number;
}

export interface PopularSearch {
  query: string;
  count: number;
  similarity?: number;
}

export interface SearchEnhancement {
  original_query: string;
  enhancement: Array<{
    question: string;
    options: string[];
  }>;
}
