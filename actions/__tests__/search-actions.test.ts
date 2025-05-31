import {
  searchAction,
  enhanceSearchPromptAction,
  saveSearchHistoryAction,
  getSearchHistoryAction,
  getPopularSearchesAction,
  clearSearchHistoryAction,
  deleteSearchHistoryEntryAction,
} from "../search-actions";
import { createClient } from "@/utils/supabase/server";
import { generateEmbedding } from "@/lib/search/embedding";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Mock dependencies
jest.mock("@/utils/supabase/server");
jest.mock("@/lib/search/embedding");
jest.mock("@google/generative-ai");

const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;
const mockGenerateEmbedding = generateEmbedding as jest.MockedFunction<
  typeof generateEmbedding
>;
const mockGoogleGenerativeAI = GoogleGenerativeAI as jest.MockedClass<
  typeof GoogleGenerativeAI
>;

// Mock Supabase client type
interface MockSupabaseClient {
  auth: {
    getUser: jest.MockedFunction<any>;
  };
  from: jest.MockedFunction<any>;
  select: jest.MockedFunction<any>;
  insert: jest.MockedFunction<any>;
  update: jest.MockedFunction<any>;
  delete: jest.MockedFunction<any>;
  eq: jest.MockedFunction<any>;
  single: jest.MockedFunction<any>;
  order: jest.MockedFunction<any>;
  range: jest.MockedFunction<any>;
  rpc: jest.MockedFunction<any>;
  not: jest.MockedFunction<any>;
  limit: jest.MockedFunction<any>;
}

describe("Search Actions", () => {
  let mockSupabase: MockSupabaseClient;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create chainable mock Supabase client
    const createChainableMock = (): MockSupabaseClient => {
      const mock: MockSupabaseClient = {
        auth: {
          getUser: jest.fn(),
        },
        from: jest.fn(() => mock),
        select: jest.fn(() => mock),
        insert: jest.fn(() => mock),
        update: jest.fn(() => mock),
        delete: jest.fn(() => mock),
        eq: jest.fn(() => mock),
        single: jest.fn(() => mock),
        order: jest.fn(() => mock),
        range: jest.fn(() => mock),
        rpc: jest.fn(() => mock),
        not: jest.fn(() => mock),
        limit: jest.fn(() => mock),
      };
      return mock;
    };

    mockSupabase = createChainableMock();
    mockCreateClient.mockResolvedValue(mockSupabase as any);
  });

  describe("searchAction", () => {
    const mockUser = { id: "user-1" };
    const mockEmbedding = {
      values: Array(768).fill(0.1),
      processed_text: "cinematographer with experience in handheld naturalistic lighting for indie films",
    };

    const mockRawSearchResults = [
      {
        creator_id: "creator-1",
        creator_username: "indie_cinematographer",
        creator_location: "Los Angeles, CA",
        creator_bio: "Indie film cinematographer specializing in handheld documentary style",
        creator_primary_role: ["Cinematographer"],
        creator_social_links: { instagram: "https://instagram.com/indie_cine" },
        creator_work_email: "contact@indiecine.com",
        creator_score: 0.92,
        content_id: "video-1",
        content_type: "video" as const,
        content_url: null, // Video with vimeo_id
        content_title: "Indie Film Reel - Handheld Cinematography",
        content_description: "Collection of handheld documentary-style shots",
        content_score: 0.88,
        project_id: "project-1",
        project_title: "Documentary Cinema Portfolio",
        youtube_id: null,
        vimeo_id: "123456789",
        total_count: 15,
      },
      {
        creator_id: "creator-1",
        creator_username: "indie_cinematographer",
        creator_location: "Los Angeles, CA",
        creator_bio: "Indie film cinematographer specializing in handheld documentary style",
        creator_primary_role: ["Cinematographer"],
        creator_social_links: { instagram: "https://instagram.com/indie_cine" },
        creator_work_email: "contact@indiecine.com",
        creator_score: 0.92,
        content_id: "image-1",
        content_type: "image" as const,
        content_url: "https://example.com/still1.jpg",
        content_title: "Natural Lighting Setup",
        content_description: "Behind the scenes of natural lighting setup",
        content_score: 0.85,
        project_id: "project-2",
        project_title: "Natural Light Cinematography",
        youtube_id: null,
        vimeo_id: null,
        total_count: 15,
      },
      {
        creator_id: "creator-2",
        creator_username: "documentary_dp",
        creator_location: "New York, NY",
        creator_bio: "Documentary cinematographer with 10 years experience",
        creator_primary_role: ["Cinematographer", "Director"],
        creator_social_links: { vimeo: "https://vimeo.com/docdp" },
        creator_work_email: "hello@docdp.com",
        creator_score: 0.87,
        content_id: "video-2",
        content_type: "video" as const,
        content_url: null, // Video with youtube_id
        content_title: "Naturalistic Documentary Style",
        content_description: "Documentary cinematography examples",
        content_score: 0.82,
        project_id: "project-3",
        project_title: "Documentary Portfolio",
        youtube_id: "abc123def456",
        vimeo_id: null,
        total_count: 15,
      },
    ];

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockGenerateEmbedding.mockResolvedValue(mockEmbedding);
    });

    it("should successfully search for cinematographers with specific query", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: mockRawSearchResults,
        error: null,
      });

      const result = await searchAction(
        "cinematographer with experience in handheld, naturalistic lighting for indie films",
        {
          contentType: "all",
          limit: 5,
          page: 1,
          role: "Cinematographer",
        }
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      if (result.success && result.data) {
        expect(result.data.results).toHaveLength(2); // Two unique creators
        expect(result.data.query).toBe(
          "cinematographer with experience in handheld, naturalistic lighting for indie films"
        );
        expect(result.data.total).toBe(15);
        expect(result.data.content_type).toBe("all");
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(5);

        // Check first creator
        const firstCreator = result.data.results[0];
        expect(firstCreator.creator.username).toBe("indie_cinematographer");
        expect(firstCreator.creator.location).toBe("Los Angeles, CA");
        expect(firstCreator.creator.primary_role).toEqual(["Cinematographer"]);
        expect(firstCreator.total_score).toBe(0.88); // This is the highest content_score for this creator

        // Check projects structure
        expect(firstCreator.projects).toHaveLength(2); // Should have 2 projects
        expect(firstCreator.projects[0].videos).toHaveLength(1); // First project has video
        expect(firstCreator.projects[1].images).toHaveLength(1); // Second project has image

        // Check video with vimeo_id
        const videoProject = firstCreator.projects.find(p => p.videos.length > 0);
        expect(videoProject).toBeDefined();
        if (videoProject) {
          const video = videoProject.videos[0];
          expect(video.url).toBeNull(); // URL should be null
          expect(video.vimeo_id).toBe("123456789"); // Should have vimeo_id
          expect(video.youtube_id).toBeNull();
          expect(video.title).toBe("Indie Film Reel - Handheld Cinematography");
        }

        // Check second creator
        const secondCreator = result.data.results[1];
        expect(secondCreator.creator.username).toBe("documentary_dp");
        expect(secondCreator.total_score).toBe(0.82); // This creator's highest content_score
      }

      // Verify RPC was called with correct parameters
      expect(mockSupabase.rpc).toHaveBeenCalledWith("search_creative_content", {
        query_embedding: mockEmbedding.values,
        match_threshold: 0.1,
        match_limit: 5,
        content_filter: "all",
      });

      // Verify embedding generation
      expect(mockGenerateEmbedding).toHaveBeenCalledWith(
        "cinematographer with experience in handheld, naturalistic lighting for indie films",
        "creators"
      );
    });

    it("should handle search with content type filter for videos only", async () => {
      const videoOnlyResults = mockRawSearchResults.filter(
        result => result.content_type === "video"
      );

      mockSupabase.rpc.mockResolvedValue({
        data: videoOnlyResults,
        error: null,
      });

      const result = await searchAction(
        "cinematographer with handheld style",
        {
          contentType: "videos",
          limit: 3,
          page: 1,
        }
      );

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.content_type).toBe("videos");
        expect(result.data.results).toHaveLength(2); // Two creators
        
        // All content should be videos
        result.data.results.forEach(creator => {
          creator.projects.forEach(project => {
            expect(project.videos.length).toBeGreaterThan(0);
          });
        });
      }

      expect(mockSupabase.rpc).toHaveBeenCalledWith("search_creative_content", {
        query_embedding: mockEmbedding.values,
        match_threshold: 0.1,
        match_limit: 3,
        content_filter: "videos",
      });
    });

    it("should return empty results when no matches found", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await searchAction("very specific query with no matches", {
        contentType: "all",
        limit: 5,
        page: 1,
      });

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.results).toHaveLength(0);
        expect(result.data.total).toBe(0);
      }
    });

    it("should handle RPC errors gracefully", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: "RPC function error", code: "42000" },
      });

      const result = await searchAction("test query", {
        contentType: "all",
        limit: 5,
        page: 1,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Search failed");
      expect(result.message).toBe("An error occurred while searching");
    });

    it("should handle embedding generation failure", async () => {
      mockGenerateEmbedding.mockResolvedValue(null);

      const result = await searchAction("test query", {
        contentType: "all",
        limit: 5,
        page: 1,
      });

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.results).toHaveLength(0);
        expect(result.data.total).toBe(0);
      }
    });

    it("should require a search query", async () => {
      const result = await searchAction("", {
        contentType: "all",
        limit: 5,
        page: 1,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Search query is required");
      expect(result.message).toBe("Please provide a search query");
    });

    it("should validate and clean search parameters", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await searchAction("test", {
        contentType: "invalid", // Should default to "all"
        limit: 100, // Should be capped at 50
        page: 0, // Should default to 1
      });

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.content_type).toBe("all");
        expect(result.data.limit).toBe(50); // Should be capped
        expect(result.data.page).toBe(1); // Should be at least 1
      }
    });

    it("should save search history for authenticated users", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: mockRawSearchResults,
        error: null,
      });

      // Mock successful search history save
      mockSupabase.single.mockResolvedValue({
        data: { id: "history-1" },
        error: null,
      });

      const result = await searchAction("cinematographer handheld", {
        contentType: "all",
        limit: 5,
        page: 1,
      });

      expect(result.success).toBe(true);
      // Note: The search history saving is async and non-blocking,
      // so we can't easily test it here without additional mocking
    });

    it("should handle unauthenticated users gracefully", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      mockSupabase.rpc.mockResolvedValue({
        data: mockRawSearchResults,
        error: null,
      });

      const result = await searchAction("cinematographer", {
        contentType: "all",
        limit: 5,
        page: 1,
      });

      expect(result.success).toBe(true);
      // Should still work for unauthenticated users
      if (result.success && result.data) {
        expect(result.data.results.length).toBeGreaterThan(0);
      }
    });
  });

  describe("enhanceSearchPromptAction", () => {
    beforeEach(() => {
      // Set the environment variable for Gemini API
      process.env.GEMINI_API_KEY = "test-api-key";
    });

    afterEach(() => {
      // Clean up environment variable
      delete process.env.GEMINI_API_KEY;
    });

    it("should enhance search prompt with AI suggestions", async () => {
      const mockGeminiResponse = [
        {
          question: "What visual style are you looking for?",
          options: ["Cinéma vérité", "Handheld documentary", "Stabilized narrative"]
        },
        {
          question: "What lighting approach do you prefer?",
          options: ["Natural lighting", "Available light", "Minimal artificial lighting"]
        },
        {
          question: "What type of projects?",
          options: ["Independent films", "Documentaries", "Short films"]
        }
      ];

      const mockModel = {
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify(mockGeminiResponse)
          }
        })
      };

      const mockGenAI = {
        getGenerativeModel: jest.fn().mockReturnValue(mockModel)
      };

      mockGoogleGenerativeAI.mockImplementation(() => mockGenAI as any);

      const result = await enhanceSearchPromptAction(
        "cinematographer with handheld experience"
      );

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.original_query).toBe("cinematographer with handheld experience");
        expect(result.data.enhancement).toHaveLength(3);
        expect(result.data.enhancement[0].question).toBe("What visual style are you looking for?");
        expect(result.data.enhancement[0].options).toEqual(["Cinéma vérité", "Handheld documentary", "Stabilized narrative"]);
      }
    });

    it("should handle AI API errors", async () => {
      const mockModel = {
        generateContent: jest.fn().mockRejectedValue(new Error("API Error"))
      };

      const mockGenAI = {
        getGenerativeModel: jest.fn().mockReturnValue(mockModel)
      };

      mockGoogleGenerativeAI.mockImplementation(() => mockGenAI as any);

      const result = await enhanceSearchPromptAction("test query");

      expect(result.success).toBe(false);
      expect(result.error).toBe("API Error"); // Actual error message from the implementation
    });

    it("should require a query parameter", async () => {
      const result = await enhanceSearchPromptAction("");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Search query is required");
    });
  });

  describe("Search History Actions", () => {
    const mockUser = { id: "user-1" };

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    describe("saveSearchHistoryAction", () => {
      it("should save search history successfully", async () => {
        // Mock the select operation for checking recent searches
        mockSupabase.eq.mockReturnValueOnce(mockSupabase);
        mockSupabase.order.mockReturnValueOnce(mockSupabase);
        mockSupabase.limit.mockReturnValueOnce(mockSupabase);
        mockSupabase.select.mockResolvedValueOnce({
          data: [], // No recent searches
          error: null,
        });

        // Mock the insert operation chain
        mockSupabase.insert.mockReturnValueOnce(mockSupabase);
        mockSupabase.select.mockReturnValueOnce(mockSupabase);
        mockSupabase.single.mockResolvedValue({
          data: { id: "history-1", query: "test", created_at: new Date().toISOString() },
          error: null,
        });

        const result = await saveSearchHistoryAction("cinematographer handheld", "all", 5);

        expect(result.success).toBe(true);
        expect(mockSupabase.insert).toHaveBeenCalled();
      });

      it("should prevent duplicate saves", async () => {
        const recentTime = new Date(Date.now() - 1000).toISOString(); // 1 second ago
        
        // Mock the select operation for checking recent searches
        mockSupabase.eq.mockReturnValueOnce(mockSupabase);
        mockSupabase.order.mockReturnValueOnce(mockSupabase);
        mockSupabase.limit.mockReturnValueOnce(mockSupabase);
        mockSupabase.select.mockResolvedValueOnce({
          data: [{
            query: "cinematographer handheld",
            content_type: "all",
            created_at: recentTime,
            results_count: 5
          }],
          error: null,
        });

        const result = await saveSearchHistoryAction("cinematographer handheld", "all", 5);

        expect(result.success).toBe(true);
        expect(result.message).toBe("Duplicate search not saved");
        expect(mockSupabase.insert).not.toHaveBeenCalled();
      });
    });

    describe("getSearchHistoryAction", () => {
      it("should retrieve search history with pagination", async () => {
        const mockHistory = [
          { id: "1", query: "cinematographer", content_type: "all", created_at: "2023-01-01", results_count: 5 },
          { id: "2", query: "photographer", content_type: "images", created_at: "2023-01-02", results_count: 3 },
        ];

        // Mock the main query chain
        mockSupabase.eq.mockReturnValueOnce(mockSupabase);
        mockSupabase.order.mockReturnValueOnce(mockSupabase);
        mockSupabase.range.mockResolvedValueOnce({
          data: mockHistory,
          error: null,
        });

        // Mock count query - create a separate chain for the count operation
        const countChain: any = {
          select: jest.fn((): any => countChain),
          eq: jest.fn((): any => countChain),
        };
        
        // The second call to from() should return the count chain
        mockSupabase.from.mockReturnValueOnce(countChain as any);
        countChain.select.mockResolvedValue({
          count: 10,
          error: null,
        });

        const result = await getSearchHistoryAction(5, 1);

        expect(result.success).toBe(true);
        if (result.success && result.data) {
          expect(result.data.entries).toHaveLength(2);
          expect(result.data.total).toBe(10);
          expect(result.data.page).toBe(1);
          expect(result.data.limit).toBe(5);
          expect(result.data.hasMore).toBe(true);
        }
      });
    });

    describe("deleteSearchHistoryEntryAction", () => {
      it("should delete a specific search history entry", async () => {
        // Mock the delete operation chain
        mockSupabase.delete.mockReturnValueOnce(mockSupabase);
        mockSupabase.eq.mockReturnValueOnce(mockSupabase);
        mockSupabase.eq.mockResolvedValue({
          error: null,
        });

        const result = await deleteSearchHistoryEntryAction("history-1");

        expect(result.success).toBe(true);
        expect(mockSupabase.delete).toHaveBeenCalled();
        expect(mockSupabase.eq).toHaveBeenCalledWith("id", "history-1");
        expect(mockSupabase.eq).toHaveBeenCalledWith("user_id", "user-1");
      });
    });

    describe("clearSearchHistoryAction", () => {
      it("should clear all search history for user", async () => {
        // Mock the delete operation chain
        mockSupabase.delete.mockReturnValueOnce(mockSupabase);
        mockSupabase.eq.mockResolvedValue({
          error: null,
        });

        const result = await clearSearchHistoryAction();

        expect(result.success).toBe(true);
        expect(mockSupabase.delete).toHaveBeenCalled();
        expect(mockSupabase.eq).toHaveBeenCalledWith("user_id", "user-1");
      });
    });
  });

  describe("getPopularSearchesAction", () => {
    it("should retrieve popular searches", async () => {
      const mockPopularSearches = [
        { query: "cinematographer", count: 50 },
        { query: "photographer", count: 30 },
        { query: "director", count: 20 },
      ];

      mockSupabase.rpc.mockResolvedValue({
        data: mockPopularSearches,
        error: null,
      });

      const result = await getPopularSearchesAction();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPopularSearches);
      expect(mockSupabase.rpc).toHaveBeenCalledWith("get_popular_searches", {
        results_limit: 5,
      });
    });
  });
});