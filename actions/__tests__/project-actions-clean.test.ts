import {
  getProjectByIdAction,
  createProjectAction,
  updateProjectAction,
  deleteProjectAction,
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
  storage: {
    from: jest.MockedFunction<any>;
  };
}

describe("Project Actions - Core Functionality", () => {
  let mockSupabase: MockSupabaseClient;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create chainable mock Supabase client
    const createChainableMock = (): any => {
      const mock = {
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
        storage: {
          from: jest.fn(() => ({
            remove: jest.fn(),
          })),
        },
      };
      return mock;
    };

    mockSupabase = createChainableMock();
    mockCreateClient.mockResolvedValue(mockSupabase as any);
  });

  describe("getProjectByIdAction", () => {
    const mockProject = {
      id: "project-1",
      title: "Test Project",
      description: "Test Description",
      creators: {
        id: "creator-1",
        username: "testuser",
        profile_id: "user-1",
      },
      images: [
        { id: "img-1", url: "test.jpg", order: 1 },
        { id: "img-2", url: "test2.jpg", order: 0 },
      ],
      videos: [
        { id: "vid-1", url: "test.mp4", created_at: "2023-01-01" },
        { id: "vid-2", url: "test2.mp4", created_at: "2023-01-02" },
      ],
      embedding: "sensitive-data",
    };

    it("should successfully fetch a project by ID", async () => {
      mockSupabase.single.mockResolvedValue({
        data: mockProject,
        error: null,
      });

      const result = await getProjectByIdAction("project-1");

      expect(result.success).toBe(true);

      // Type-safe way to check result data
      if (result.success && result.data) {
        expect(result.data.id).toBe("project-1");
        expect(result.data.title).toBe("Test Project");
        expect((result.data as any).embedding).toBeUndefined(); // Should be removed
        expect(result.data.images).toHaveLength(2);
        expect(result.data.videos).toHaveLength(2);

        // Check sorting
        expect(result.data.images[0].order).toBe(0); // Should be sorted by order
        expect(result.data.images[1].order).toBe(1);
      } else {
        fail("Expected successful result with data");
      }
    });

    it("should return error when project not found", async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: "Project not found" },
      });

      const result = await getProjectByIdAction("nonexistent");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Project not found");
    });

    it("should handle unexpected errors", async () => {
      mockSupabase.single.mockRejectedValue(new Error("Database error"));

      const result = await getProjectByIdAction("project-1");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database error");
    });
  });

  describe("createProjectAction", () => {
    const mockUser = { id: "user-1" };
    const mockCreator = { id: "creator-1" };
    const mockPortfolio = { id: "portfolio-1" };
    const projectData = {
      title: "New Project",
      description: "Project description",
    };

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it("should successfully create a project", async () => {
      // Mock creator lookup
      mockSupabase.single
        .mockResolvedValueOnce({
          data: mockCreator,
          error: null,
        })
        // Mock portfolio lookup
        .mockResolvedValueOnce({
          data: mockPortfolio,
          error: null,
        })
        // Mock project creation
        .mockResolvedValueOnce({
          data: { id: "new-project", ...projectData },
          error: null,
        });

      const result = await createProjectAction("testuser", projectData);

      expect(result.success).toBe(true);

      if (result.success && result.data) {
        expect(result.data.title).toBe("New Project");
        expect(result.data.id).toBe("new-project");
      } else {
        fail("Expected successful result with data");
      }

      expect(mockRevalidatePath).toHaveBeenCalledWith("/testuser", "layout");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/testuser/work", "page");
    });

    it("should return error when user not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await createProjectAction("testuser", projectData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Authentication required");
    });

    it("should return error when creator not found", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await createProjectAction("testuser", projectData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Creator profile not found");
      if (!result.success) {
        expect(result.redirectTo).toBe("/onboarding");
      }
    });

    it("should return error when title is missing", async () => {
      const result = await createProjectAction("testuser", {
        description: "No title",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Project title is required");
    });
  });

  describe("updateProjectAction", () => {
    const mockUser = { id: "user-1" };
    const mockProject = {
      id: "project-1",
      creators: { profile_id: "user-1" },
    };
    const updateData = {
      title: "Updated Title",
      description: "Updated description",
    };

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it("should successfully update a project", async () => {
      // Mock ownership verification
      mockSupabase.single
        .mockResolvedValueOnce({
          data: mockProject,
          error: null,
        })
        // Mock update operation
        .mockResolvedValueOnce({
          data: { ...mockProject, ...updateData },
          error: null,
        });

      const result = await updateProjectAction(
        "testuser",
        "project-1",
        updateData
      );

      expect(result.success).toBe(true);

      if (result.success && result.data) {
        expect(result.data.title).toBe("Updated Title");
      } else {
        fail("Expected successful result with data");
      }

      expect(mockRevalidatePath).toHaveBeenCalledWith("/testuser", "layout");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/testuser/work", "page");
      expect(mockRevalidatePath).toHaveBeenCalledWith(
        "/testuser/work/project-1",
        "page"
      );
    });

    it("should return error when user not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await updateProjectAction(
        "testuser",
        "project-1",
        updateData
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Authentication required");
    });

    it("should return error when user does not own project", async () => {
      mockSupabase.single.mockResolvedValue({
        data: { ...mockProject, creators: { profile_id: "different-user" } },
        error: null,
      });

      const result = await updateProjectAction(
        "testuser",
        "project-1",
        updateData
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Project not found or access denied");
    });

    it("should return error when no fields to update", async () => {
      mockSupabase.single.mockResolvedValue({
        data: mockProject,
        error: null,
      });

      const result = await updateProjectAction("testuser", "project-1", {});

      expect(result.success).toBe(false);
      expect(result.error).toBe("No fields to update");
    });
  });

  describe("deleteProjectAction", () => {
    const mockUser = { id: "user-1" };
    const mockProject = {
      id: "project-1",
      title: "Test Project",
      creators: { profile_id: "user-1" },
    };

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it("should successfully delete a project with cascade", async () => {
      // Mock ownership verification
      mockSupabase.single.mockResolvedValue({
        data: mockProject,
        error: null,
      });

      // Mock media queries for cascade delete
      mockSupabase.select
        .mockResolvedValueOnce({
          data: [{ url: "https://example.com/storage/media/image1.jpg" }],
          error: null,
        })
        .mockResolvedValueOnce({
          data: [{ url: "https://example.com/storage/media/video1.mp4" }],
          error: null,
        });

      // Mock storage removal
      mockSupabase.storage.from().remove.mockResolvedValue({ error: null });

      // Mock media deletion
      mockSupabase.delete.mockResolvedValue({ error: null });

      const result = await deleteProjectAction("testuser", "project-1", true);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.message).toBe("Project deleted successfully");
      }

      expect(mockRevalidatePath).toHaveBeenCalledWith("/testuser", "layout");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/testuser/work", "page");
    });

    it("should return error when user not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await deleteProjectAction("testuser", "project-1");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Authentication required");
    });

    it("should return error when user does not own project", async () => {
      mockSupabase.single.mockResolvedValue({
        data: { ...mockProject, creators: { profile_id: "different-user" } },
        error: null,
      });

      const result = await deleteProjectAction("testuser", "project-1");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Project not found or access denied");
    });
  });
});
