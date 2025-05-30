export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export const API_ENDPOINTS = {
  // Search endpoints
  search: "/search",
  searchCreators: "/search/creators",
  enhanceSearchPrompt: "/search/refine",
  searchHistory: "/search/history",
  searchHistoryEntry: (id: string) => `/search/history/${id}`,
  popularSearches: "/search/popular",

  // Onboarding endpoints
  onboarding: {
    status: "/onboarding/status",
    role: "/onboarding/role",
    organization: "/onboarding/organization",
    profileImage: "/onboarding/profile-image",
    profile: "/onboarding/profile",
    socialLinks: "/onboarding/social-links",
    username: "/onboarding/username",
  },

  // Creator endpoints
  getCreatorByUsername: (username: string) => `/creators/${username}`,
  getProjectByTitle: (username: string, projectTitle: string) =>
    `/creators/${username}/projects/${projectTitle}`,
  updateCreatorProfile: (username: string) => `/creators/${username}`,
  uploadCreatorAvatar: (username: string) => `/creators/${username}/avatar`,
  uploadCreatorBanner: (username: string) => `/creators/${username}/banner`,
  getCreatorPortfolio: (username: string) => `/creators/${username}/portfolio`,
  checkUsernameAvailability: (username: string) =>
    `/creators/username-check?username=${encodeURIComponent(username)}`,

  // Organization endpoints
  organizations: "/organizations",
  getOrganization: (orgId: string) => `/organizations/${orgId}`,

  // Project endpoints
  projects: "/projects",
  getProject: (projectId: string) => `/projects/${projectId}`,
  getProjectMedia: (projectId: string) => `/projects/${projectId}/media`,

  // Media endpoints
  media: {
    getMedia: (id: string) => `/media/${id}`,
    updateMediaMetadata: (id: string) => `/media/${id}/metadata`,
    deleteMedia: (id: string) => `/media/${id}`,
    uploadMedia: `/media/upload`,
    batchUploadMedia: `/media/batch-upload`,
    importUrlMedia: `/media/import-url-media`,
    uploadVideoLink: `/media/upload-video-link`,
  },

  // Analysis endpoints
  analysis: {
    // Portfolio analysis
    portfolioCanAnalyze: (portfolioId: string) =>
      `/analysis/portfolios/${portfolioId}/can-analyze`,
    portfolioAnalysis: (portfolioId: string) =>
      `/analysis/portfolios/${portfolioId}`,

    // Project analysis
    projectAnalysis: (projectId: string) => `/analysis/projects/${projectId}`,

    // Analysis jobs
    jobStatus: (jobId: string) => `/analysis/jobs/${jobId}`,
  },

  // Scraper endpoints
  scraper: {
    extractMedia: `/scraper/extract`,
    importMedia: `/media/import-url-media`,
  },

  // Legacy media endpoints (for backward compatibility)
  projectMedia: (projectId: string) => `/projects/${projectId}/media`,
  deleteProjectImage: (projectId: string, imageId: string) =>
    `/creators/projects/${projectId}/images/${imageId}`,
  deleteProjectVideo: (projectId: string, videoId: string) =>
    `/creators/projects/${projectId}/videos/${videoId}`,

  // Admin endpoints
  admin: {
    // Base stats
    stats: "/admin/stats",

    // Creator management
    creators: "/admin/creators",
    creatorStats: "/admin/creators/stats",
    creatorDetails: (username: string) => `/admin/creators/${username}`,
    updateCreator: (username: string) => `/admin/creators/${username}`,
    deleteCreator: (username: string) => `/admin/creators/${username}`,
    updateCreatorStatus: (username: string) =>
      `/admin/creators/${username}/status`,
    rejectCreator: (username: string) => `/admin/creators/${username}/reject`,
    approveCreator: (username: string) => `/admin/creators/${username}/approve`,

    // Project management
    projects: "/admin/projects",
    projectDetails: (projectId: string) => `/admin/projects/${projectId}`,
    updateProject: (projectId: string) => `/admin/projects/${projectId}`,
    deleteProject: (projectId: string) => `/admin/projects/${projectId}`,

    // Media management
    media: "/admin/media",
    deleteMedia: (mediaId: string) => `/admin/media/${mediaId}`,
    deleteProjectImage: (projectId: string, imageId: string) =>
      `/admin/projects/${projectId}/images/${imageId}`,

    // Rejected creators
    rejectedCreators: "/admin/unqualified/creators",
  },
} as const;

// Helper function to build full API URLs
export const buildApiUrl = (
  endpoint: string,
  queryParams?: Record<string, string | number | boolean | undefined>
) => {
  const url = new URL(`${API_BASE_URL}${endpoint}`);

  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
};
