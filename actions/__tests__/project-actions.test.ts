import {
  getProjectByIdAction,
  getProjectWithMediaAction,
  getProjectMediaAction,
  createProjectAction,
  updateProjectAction,
  deleteProjectAction,
  updateProjectMediaOrderAction,
  getProjectAnalyticsAction,
  checkProjectExistsAction,
  getUserProjectsAction,
} from "../project-actions";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";

// Mock Supabase client
jest.mock("@/utils/supabase/server");
jest.mock("next/cache");
jest.mock("next/navigation");

const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<
  typeof revalidatePath
>;
const mockNotFound = notFound as jest.MockedFunction<typeof notFound>;

describe("Project Actions", () => {
  let mockSupabase: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock Supabase client
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(() => mockSupabase),
      select: jest.fn(() => mockSupabase),
      insert: jest.fn(() => mockSupabase),
      update: jest.fn(() => mockSupabase),
      delete: jest.fn(() => mockSupabase),
      eq: jest.fn(() => mockSupabase),
      single: jest.fn(() => mockSupabase),
      order: jest.fn(() => mockSupabase),
      range: jest.fn(() => mockSupabase),
      storage: {
        from: jest.fn(() => ({
          remove: jest.fn(),
        })),
      },
    };

    mockCreateClient.mockResolvedValue(mockSupabase);
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
      if (result.success && result.data) {
        expect(result.data.id).toBe("project-1");
        expect(result.data.embedding).toBeUndefined(); // Should be removed
        expect(result.data.images).toHaveLength(2);
        expect(result.data.images[0].order).toBe(0); // Should be sorted by order
        expect(result.data.videos).toHaveLength(2);
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

  describe("getProjectWithMediaAction", () => {
    const mockUser = { id: "user-1" };
    const mockProject = {
      id: "project-1",
      title: "Test Project",
      creators: { profile_id: "user-1" },
      images: [],
      videos: [],
    };

    it("should fetch project with ownership check", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      mockSupabase.single.mockResolvedValue({
        data: mockProject,
        error: null,
      });

      const result = await getProjectWithMediaAction("project-1");

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.isOwner).toBe(true);
      }
    });

    it("should mark as not owner for different user", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "different-user" } },
        error: null,
      });
      mockSupabase.single.mockResolvedValue({
        data: mockProject,
        error: null,
      });

      const result = await getProjectWithMediaAction("project-1");

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.isOwner).toBe(false);
      }
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
      expect(result.redirectTo).toBe("/onboarding");
    });

    it("should return error when title is missing", async () => {
      const result = await createProjectAction("testuser", {
        description: "No title",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Project title is required");
    });

    it("should handle database errors during creation", async () => {
      mockSupabase.single
        .mockResolvedValueOnce({ data: mockCreator, error: null })
        .mockResolvedValueOnce({ data: mockPortfolio, error: null })
        .mockResolvedValueOnce({
          data: null,
          error: { message: "Database constraint violation" },
        });

      const result = await createProjectAction("testuser", projectData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to create project");
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

    it("should handle database errors during update", async () => {
      mockSupabase.single
        .mockResolvedValueOnce({ data: mockProject, error: null })
        .mockResolvedValueOnce({
          data: null,
          error: { message: "Update failed" },
        });

      const result = await updateProjectAction(
        "testuser",
        "project-1",
        updateData
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Update failed");
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
      expect(result.message).toBe("Project deleted successfully");
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

    it("should handle database errors during deletion", async () => {
      mockSupabase.single.mockResolvedValue({
        data: mockProject,
        error: null,
      });

      mockSupabase.delete.mockResolvedValue({
        error: { message: "Delete failed" },
      });

      const result = await deleteProjectAction("testuser", "project-1", false);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Delete failed");
    });
  });

  describe("updateProjectMediaOrderAction", () => {
    const mockUser = { id: "user-1" };
    const mockProject = {
      id: "project-1",
      creators: { profile_id: "user-1" },
    };
    const mediaUpdates = [
      { id: "img-1", type: "image" as const, order: 1 },
      { id: "img-2", type: "image" as const, order: 0 },
      { id: "vid-1", type: "video" as const, order: 0 }, // Should be filtered out
    ];

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it("should successfully update media order for images only", async () => {
      mockSupabase.single.mockResolvedValue({
        data: mockProject,
        error: null,
      });

      mockSupabase.update.mockResolvedValue({ error: null });

      const result = await updateProjectMediaOrderAction(
        "testuser",
        "project-1",
        mediaUpdates
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe("Media order updated successfully");
      expect(mockSupabase.update).toHaveBeenCalledTimes(2); // Only for images
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

      const result = await updateProjectMediaOrderAction(
        "testuser",
        "project-1",
        mediaUpdates
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Authentication required");
    });

    it("should handle update errors", async () => {
      mockSupabase.single.mockResolvedValue({
        data: mockProject,
        error: null,
      });

      mockSupabase.update.mockResolvedValue({
        error: { message: "Update failed" },
      });

      const result = await updateProjectMediaOrderAction(
        "testuser",
        "project-1",
        mediaUpdates
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to update media order");
    });
  });

  describe("getProjectAnalyticsAction", () => {
    const mockUser = { id: "user-1" };
    const mockProject = {
      id: "project-1",
      title: "Test Project",
      created_at: "2023-01-01",
      creators: { profile_id: "user-1" },
    };

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it("should successfully get project analytics", async () => {
      mockSupabase.single.mockResolvedValue({
        data: mockProject,
        error: null,
      });

      mockSupabase.select
        .mockResolvedValueOnce({
          data: [{ id: "img-1" }, { id: "img-2" }],
          error: null,
        })
        .mockResolvedValueOnce({
          data: [{ id: "vid-1" }],
          error: null,
        });

      const result = await getProjectAnalyticsAction("project-1");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.media_counts.images).toBe(2);
        expect(result.data.media_counts.videos).toBe(1);
        expect(result.data.media_counts.total).toBe(3);
      }
    });

    it("should return error when user not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await getProjectAnalyticsAction("project-1");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Authentication required");
    });
  });

  describe("checkProjectExistsAction", () => {
    it("should return project when it exists", async () => {
      const mockProject = { id: "project-1", title: "Test Project" };
      mockSupabase.single.mockResolvedValue({
        data: mockProject,
        error: null,
      });

      const result = await checkProjectExistsAction("project-1");

      expect(result).toEqual(mockProject);
    });

    it("should call notFound when project does not exist", async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: "Not found" },
      });

      await expect(checkProjectExistsAction("nonexistent")).rejects.toThrow(
        "Not Found"
      );
      expect(mockNotFound).toHaveBeenCalled();
    });
  });

  describe("getUserProjectsAction", () => {
    const mockUser = { id: "user-1" };
    const mockCreator = { id: "creator-1" };
    const mockProjects = [
      { id: "project-1", title: "Project 1", images: [], videos: [] },
      { id: "project-2", title: "Project 2", images: [], videos: [] },
    ];

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it("should successfully get user projects with pagination", async () => {
      mockSupabase.single.mockResolvedValue({
        data: mockCreator,
        error: null,
      });

      mockSupabase.range.mockResolvedValue({
        data: mockProjects,
        error: null,
        count: 10,
      });

      const result = await getUserProjectsAction(undefined, 1, 5);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.projects).toHaveLength(2);
        expect(result.data.total).toBe(10);
        expect(result.data.totalPages).toBe(2);
      }
    });

    it("should return error when user not authenticated and no userId provided", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await getUserProjectsAction();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Authentication required");
    });

    it("should return error when creator not found", async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await getUserProjectsAction();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Creator profile not found");
    });
  });
});
