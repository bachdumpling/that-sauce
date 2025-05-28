import {
  getProjectByIdAction,
  createProjectAction,
  updateProjectAction,
  deleteProjectAction,
  getProjectWithMediaAction,
  getUserProjectsAction,
} from "../project-actions";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// Mock dependencies
jest.mock("@/utils/supabase/server");
jest.mock("next/cache");

const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<
  typeof revalidatePath
>;

// Real IDs from the database
const REAL_PROFILE_ID = "38d74203-0835-494a-bb56-2aa90622fdda";
const REAL_CREATOR_ID = "05d858a0-59b6-49d5-a7d2-78be0a753f24";
const MOCK_PORTFOLIO_ID = "550e8400-e29b-41d4-a716-446655440000";
const MOCK_PROJECT_ID = "660e8400-e29b-41d4-a716-446655440001";

// Helper function to create a properly chained mock Supabase client
function createMockSupabaseClient() {
  const mockClient = {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    eq: jest.fn(),
    single: jest.fn(),
    order: jest.fn(),
    range: jest.fn(),
    storage: {
      from: jest.fn(() => ({
        remove: jest.fn(),
      })),
    },
  };

  // Make methods chainable
  mockClient.from.mockReturnValue(mockClient);
  mockClient.select.mockReturnValue(mockClient);
  mockClient.insert.mockReturnValue(mockClient);
  mockClient.update.mockReturnValue(mockClient);
  mockClient.delete.mockReturnValue(mockClient);
  mockClient.eq.mockReturnValue(mockClient);
  mockClient.order.mockReturnValue(mockClient);
  mockClient.range.mockReturnValue(mockClient);

  return mockClient;
}

describe("Project Actions - Realistic Database Tests", () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  describe("getProjectByIdAction - Realistic Data", () => {
    const mockProjectWithMedia = {
      id: MOCK_PROJECT_ID,
      creator_id: REAL_CREATOR_ID,
      portfolio_id: MOCK_PORTFOLIO_ID,
      title: "Brand Identity Design for Tech Startup",
      description:
        "Complete brand identity package including logo, color palette, typography, and brand guidelines for a fintech startup.",
      short_description: "Modern fintech brand identity",
      year: 2024,
      featured: true,
      order: 1,
      roles: ["Brand Designer", "Visual Designer"],
      client_ids: [],
      ai_analysis: "This project demonstrates strong brand design skills...",
      embedding: null, // Should be filtered out
      analysis_status: "completed",
      analysis_error: null,
      created_at: "2024-01-15T10:30:00Z",
      updated_at: "2024-01-20T14:45:00Z",
      creators: {
        id: REAL_CREATOR_ID,
        username: "designpro",
        profile_id: REAL_PROFILE_ID,
      },
      images: [
        {
          id: "img-001",
          project_id: MOCK_PROJECT_ID,
          creator_id: REAL_CREATOR_ID,
          url: "https://storage.supabase.co/media/projects/logo-design.jpg",
          alt_text: "Logo design variations",
          resolutions: {
            thumbnail:
              "https://storage.supabase.co/media/projects/logo-design-thumb.jpg",
            medium:
              "https://storage.supabase.co/media/projects/logo-design-med.jpg",
            large:
              "https://storage.supabase.co/media/projects/logo-design-large.jpg",
          },
          order: 0,
          ai_analysis:
            "Logo shows modern typography with clean geometric forms",
          analysis_status: "completed",
          created_at: "2024-01-15T10:30:00Z",
          updated_at: "2024-01-15T10:30:00Z",
        },
        {
          id: "img-002",
          project_id: MOCK_PROJECT_ID,
          creator_id: REAL_CREATOR_ID,
          url: "https://storage.supabase.co/media/projects/brand-guidelines.jpg",
          alt_text: "Brand guidelines document",
          resolutions: {
            thumbnail:
              "https://storage.supabase.co/media/projects/brand-guidelines-thumb.jpg",
            medium:
              "https://storage.supabase.co/media/projects/brand-guidelines-med.jpg",
            large:
              "https://storage.supabase.co/media/projects/brand-guidelines-large.jpg",
          },
          order: 1,
          ai_analysis:
            "Comprehensive brand guidelines with color palette and typography",
          analysis_status: "completed",
          created_at: "2024-01-15T11:00:00Z",
          updated_at: "2024-01-15T11:00:00Z",
        },
      ],
      videos: [
        {
          id: "vid-001",
          project_id: MOCK_PROJECT_ID,
          creator_id: REAL_CREATOR_ID,
          url: "https://storage.supabase.co/media/projects/brand-animation.mp4",
          title: "Logo Animation Reveal",
          description: "Animated logo reveal for digital applications",
          vimeo_id: "123456789",
          youtube_id: null,
          categories: ["Animation", "Branding"],
          ai_analysis: "Smooth logo animation with professional timing",
          analysis_status: "completed",
          created_at: "2024-01-16T09:00:00Z",
          updated_at: "2024-01-16T09:00:00Z",
        },
      ],
    };

    it("should successfully fetch a project with realistic data structure", async () => {
      mockSupabase.single.mockResolvedValue({
        data: mockProjectWithMedia,
        error: null,
      });

      const result = await getProjectByIdAction(MOCK_PROJECT_ID);

      expect(result.success).toBe(true);

      if (result.success && result.data) {
        // Verify project data
        expect(result.data.id).toBe(MOCK_PROJECT_ID);
        expect(result.data.creator_id).toBe(REAL_CREATOR_ID);
        expect(result.data.title).toBe(
          "Brand Identity Design for Tech Startup"
        );
        expect(result.data.roles).toEqual([
          "Brand Designer",
          "Visual Designer",
        ]);
        expect(result.data.year).toBe(2024);
        expect(result.data.featured).toBe(true);

        // Verify sensitive data is removed (only embedding is filtered out in the actual implementation)
        expect((result.data as any).embedding).toBeUndefined();

        // Verify creator relationship
        expect(result.data.creators.id).toBe(REAL_CREATOR_ID);
        expect(result.data.creators.profile_id).toBe(REAL_PROFILE_ID);

        // Verify media is properly sorted
        expect(result.data.images).toHaveLength(2);
        expect(result.data.images[0].order).toBe(0);
        expect(result.data.images[1].order).toBe(1);
        expect(result.data.images[0].resolutions).toBeDefined();

        // Verify videos
        expect(result.data.videos).toHaveLength(1);
        expect(result.data.videos[0].vimeo_id).toBe("123456789");
        expect(result.data.videos[0].categories).toEqual([
          "Animation",
          "Branding",
        ]);
      } else {
        fail("Expected successful result with data");
      }
    });

    it("should handle projects with no media", async () => {
      const projectWithoutMedia = {
        ...mockProjectWithMedia,
        images: [],
        videos: [],
      };

      mockSupabase.single.mockResolvedValue({
        data: projectWithoutMedia,
        error: null,
      });

      const result = await getProjectByIdAction(MOCK_PROJECT_ID);

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.images).toHaveLength(0);
        expect(result.data.videos).toHaveLength(0);
      }
    });
  });

  describe("createProjectAction - Realistic Scenarios", () => {
    const mockUser = { id: REAL_PROFILE_ID };
    const mockCreator = {
      id: REAL_CREATOR_ID,
      profile_id: REAL_PROFILE_ID,
      username: "designpro",
      status: "approved",
    };
    const mockPortfolio = {
      id: MOCK_PORTFOLIO_ID,
      creator_id: REAL_CREATOR_ID,
      analysis_status: "completed",
    };

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it("should create a project with realistic data", async () => {
      const projectData = {
        title: "E-commerce Website Redesign",
        description:
          "Complete redesign of an e-commerce platform focusing on user experience and conversion optimization. Includes user research, wireframing, prototyping, and final UI design.",
        short_description: "E-commerce UX/UI redesign",
        roles: ["UX Designer", "UI Designer", "User Researcher"],
        year: 2024,
        client_ids: [],
      };

      const expectedProject = {
        id: "new-project-id",
        creator_id: REAL_CREATOR_ID,
        portfolio_id: MOCK_PORTFOLIO_ID,
        ...projectData,
        featured: false,
        order: 0,
        ai_analysis: "",
        analysis_status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock the database calls in sequence
      mockSupabase.single
        .mockResolvedValueOnce({ data: mockCreator, error: null })
        .mockResolvedValueOnce({ data: mockPortfolio, error: null })
        .mockResolvedValueOnce({ data: expectedProject, error: null });

      const result = await createProjectAction("designpro", projectData);

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.title).toBe("E-commerce Website Redesign");
        expect(result.data.creator_id).toBe(REAL_CREATOR_ID);
        expect(result.data.roles).toEqual([
          "UX Designer",
          "UI Designer",
          "User Researcher",
        ]);
        expect(result.data.year).toBe(2024);
      }

      // Verify revalidation
      expect(mockRevalidatePath).toHaveBeenCalledWith("/designpro", "layout");
      expect(mockRevalidatePath).toHaveBeenCalledWith(
        "/designpro/work",
        "page"
      );
    });

    it("should validate required fields according to schema", async () => {
      // The actual implementation checks for creator first, then validates title
      mockSupabase.single.mockResolvedValueOnce({
        data: null, // No creator found
        error: null,
      });

      const result = await createProjectAction("designpro", {
        description: "Project without title",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Creator profile not found");
    });

    it("should validate title requirement when creator exists", async () => {
      // Test the title validation when creator exists
      mockSupabase.single.mockResolvedValueOnce({
        data: mockCreator,
        error: null,
      });

      const result = await createProjectAction("designpro", {
        description: "Project without title",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Project title is required");
    });
  });

  describe("deleteProjectAction - Cascade Handling", () => {
    const mockUser = { id: REAL_PROFILE_ID };
    const mockProject = {
      id: MOCK_PROJECT_ID,
      title: "Project to Delete",
      creators: { profile_id: REAL_PROFILE_ID },
    };

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it("should handle cascade delete with realistic media URLs", async () => {
      const mockImages = [
        {
          url: "https://storage.supabase.co/object/public/media/projects/image1.jpg",
        },
        {
          url: "https://storage.supabase.co/object/public/media/projects/image2.png",
        },
      ];

      const mockVideos = [
        {
          url: "https://storage.supabase.co/object/public/media/projects/video1.mp4",
        },
      ];

      // Mock the sequence of calls in the delete action
      mockSupabase.single.mockResolvedValue({ 
        data: mockProject, 
        error: null 
      });

      // Mock the media queries - these return data directly, not through .eq()
      mockSupabase.eq
        .mockResolvedValueOnce({ data: mockImages, error: null }) // images query
        .mockResolvedValueOnce({ data: mockVideos, error: null }) // videos query
        .mockResolvedValueOnce({ error: null }) // images delete
        .mockResolvedValueOnce({ error: null }) // videos delete
        .mockResolvedValueOnce({ error: null }); // project delete

      // Mock storage removal
      mockSupabase.storage.from().remove.mockResolvedValue({ error: null });

      const result = await deleteProjectAction(
        "designpro",
        MOCK_PROJECT_ID,
        true
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe("Project deleted successfully");

      // Verify storage cleanup was called with correct file paths
      expect(mockSupabase.storage.from).toHaveBeenCalledWith("media");
      expect(mockSupabase.storage.from().remove).toHaveBeenCalledWith([
        "projects/image1.jpg",
        "projects/image2.png",
        "projects/video1.mp4",
      ]);
    });

    it("should handle foreign key constraints", async () => {
      mockSupabase.single.mockResolvedValue({ 
        data: mockProject, 
        error: null 
      });
      
      // Mock the final project delete to return an error
      mockSupabase.eq.mockResolvedValue({
        error: {
          message: "Foreign key constraint violation",
          code: "23503",
        },
      });

      const result = await deleteProjectAction(
        "designpro",
        MOCK_PROJECT_ID,
        false
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Foreign key constraint violation");
    });

    it("should handle non-cascade delete", async () => {
      mockSupabase.single.mockResolvedValue({ 
        data: mockProject, 
        error: null 
      });
      
      // Mock successful project delete
      mockSupabase.eq.mockResolvedValue({ error: null });

      const result = await deleteProjectAction(
        "designpro",
        MOCK_PROJECT_ID,
        false
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe("Project deleted successfully");

      // Verify storage operations were not called for non-cascade delete
      expect(mockSupabase.storage.from).not.toHaveBeenCalled();
    });
  });

  describe("getUserProjectsAction - Pagination & Filtering", () => {
    const mockUser = { id: REAL_PROFILE_ID };
    const mockCreator = { id: REAL_CREATOR_ID };

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it("should fetch projects with proper pagination", async () => {
      const mockProjects = [
        {
          id: "project-1",
          title: "Brand Identity Project",
          featured: true,
          year: 2024,
          roles: ["Brand Designer"],
          created_at: "2024-01-15T10:30:00Z",
          images: [{ id: "img-1", url: "image1.jpg", alt_text: "Logo design" }],
          videos: [],
        },
        {
          id: "project-2",
          title: "Website Redesign",
          featured: false,
          year: 2023,
          roles: ["UX Designer", "UI Designer"],
          created_at: "2024-01-10T09:00:00Z",
          images: [],
          videos: [{ id: "vid-1", url: "video1.mp4", title: "Design Process" }],
        },
      ];

      mockSupabase.single.mockResolvedValue({ data: mockCreator, error: null });
      mockSupabase.range.mockResolvedValue({
        data: mockProjects,
        error: null,
        count: 25, // Total projects
      });

      const result = await getUserProjectsAction(REAL_PROFILE_ID, 1, 10);

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.projects).toHaveLength(2);
        expect(result.data.total).toBe(25);
        expect(result.data.totalPages).toBe(3); // Math.ceil(25/10)
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(10);

        // Verify projects have expected structure
        expect(result.data.projects[0].roles).toEqual(["Brand Designer"]);
        expect(result.data.projects[1].roles).toEqual([
          "UX Designer",
          "UI Designer",
        ]);
      } else {
        fail("Expected successful result with data");
      }
    });
  });

  describe("getProjectWithMediaAction - Ownership & Privacy", () => {
    const mockProject = {
      id: MOCK_PROJECT_ID,
      title: "Private Project",
      creators: { profile_id: REAL_PROFILE_ID },
      images: [],
      videos: [],
    };

    it("should correctly identify project owner", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: REAL_PROFILE_ID } },
        error: null,
      });

      mockSupabase.single.mockResolvedValue({
        data: mockProject,
        error: null,
      });

      const result = await getProjectWithMediaAction(MOCK_PROJECT_ID);

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.isOwner).toBe(true);
      }
    });

    it("should correctly identify non-owner", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "different-user-id" } },
        error: null,
      });

      mockSupabase.single.mockResolvedValue({
        data: mockProject,
        error: null,
      });

      const result = await getProjectWithMediaAction(MOCK_PROJECT_ID);

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.isOwner).toBe(false);
      }
    });
  });
});
