import {
  getOnboardingStatusAction,
  setUserRoleAction,
  setOrganizationInfoAction,
  uploadProfileImageAction,
  setProfileInfoAction,
  setSocialLinksAction,
  setUsernameAction,
} from "../onboarding-actions";
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
  neq: jest.MockedFunction<any>;
  single: jest.MockedFunction<any>;
  storage: {
    from: jest.MockedFunction<any>;
  };
}

describe("Onboarding Actions", () => {
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
        neq: jest.fn(() => mock),
        single: jest.fn(() => mock),
        storage: {
          from: jest.fn(() => ({
            upload: jest.fn(),
            getPublicUrl: jest.fn(),
          })),
        },
      };
      return mock;
    };

    mockSupabase = createChainableMock();
    mockCreateClient.mockResolvedValue(mockSupabase as any);
  });

  describe("getOnboardingStatusAction", () => {
    const mockUser = { id: "user-1" };
    const mockProfile = {
      id: "user-1",
      first_name: "John",
      last_name: "Doe",
      user_role: "creator",
      onboarding_step: 2,
      onboarding_completed: false,
      organization_id: null,
    };

    it("should successfully get onboarding status", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.single
        .mockResolvedValueOnce({
          data: mockProfile,
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { code: "PGRST116" }, // Creator not found, which is okay
        });

      const result = await getOnboardingStatusAction();

      expect(result.success).toBe(true);
      expect(result.data?.profile).toEqual(mockProfile);
      expect(result.data?.onboarding_completed).toBe(false);
      expect(result.data?.current_step).toBe(2);
      expect(result.data?.user_role).toBe("creator");
    });

    it("should return error when user not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await getOnboardingStatusAction();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Authentication required");
    });

    it("should handle database errors", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      const result = await getOnboardingStatusAction();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to fetch profile");
    });
  });

  describe("setUserRoleAction", () => {
    const mockUser = { id: "user-1" };

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it("should successfully set user role as creator", async () => {
      const updatedProfile = {
        id: "user-1",
        user_role: "creator",
        onboarding_step: 2,
      };

      mockSupabase.single.mockResolvedValue({
        data: updatedProfile,
        error: null,
      });

      const result = await setUserRoleAction("creator");

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedProfile);
      expect(result.message).toBe("User role set successfully");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/onboarding");
    });

    it("should successfully set user role as employer", async () => {
      const updatedProfile = {
        id: "user-1",
        user_role: "employer",
        onboarding_step: 2,
      };

      mockSupabase.single.mockResolvedValue({
        data: updatedProfile,
        error: null,
      });

      const result = await setUserRoleAction("employer");

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedProfile);
    });

    it("should return error for invalid role", async () => {
      const result = await setUserRoleAction("invalid" as any);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Role must be either 'creator' or 'employer'");
    });

    it("should return error when user not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await setUserRoleAction("creator");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Authentication required");
    });
  });

  describe("setOrganizationInfoAction", () => {
    const mockUser = { id: "user-1" };
    const orgData = {
      name: "Test Company",
      website: "https://test.com",
      logo_url: "https://test.com/logo.jpg",
    };

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it("should successfully set organization info for employer", async () => {
      const mockProfileData = { user_role: "employer" };
      const mockOrganization = { id: "org-1", ...orgData };
      const updatedProfile = {
        id: "user-1",
        organization_id: "org-1",
        onboarding_step: 3,
      };

      mockSupabase.single
        .mockResolvedValueOnce({
          data: mockProfileData,
          error: null,
        })
        .mockResolvedValueOnce({
          data: mockOrganization,
          error: null,
        })
        .mockResolvedValueOnce({
          data: updatedProfile,
          error: null,
        });

      const result = await setOrganizationInfoAction(orgData);

      expect(result.success).toBe(true);
      expect(result.data?.organization_id).toBe("org-1");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/onboarding");
    });

    it("should return error when user is not an employer", async () => {
      mockSupabase.single.mockResolvedValue({
        data: { user_role: "creator" },
        error: null,
      });

      const result = await setOrganizationInfoAction(orgData);

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "Only employers can set organization information"
      );
    });
  });

  describe("uploadProfileImageAction", () => {
    const mockUser = { id: "user-1" };

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it("should successfully upload profile image", async () => {
      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const formData = new FormData();
      formData.append("file", mockFile);

      const mockStorageClient = {
        upload: jest.fn().mockResolvedValue({
          data: { path: "user-1/avatar-123456.jpg" },
          error: null,
        }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: "https://storage.com/user-1/avatar-123456.jpg" },
        }),
      };

      mockSupabase.storage.from.mockReturnValue(mockStorageClient);

      const result = await uploadProfileImageAction(formData);

      expect(result.success).toBe(true);
      expect(result.data?.avatar_url).toBe(
        "https://storage.com/user-1/avatar-123456.jpg"
      );
      expect(mockSupabase.storage.from).toHaveBeenCalledWith("media");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/onboarding");
    });

    it("should return error when no file uploaded", async () => {
      const formData = new FormData();

      const result = await uploadProfileImageAction(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("No file was uploaded");
    });

    it("should return error for invalid file type", async () => {
      const mockFile = new File(["test"], "test.txt", { type: "text/plain" });
      const formData = new FormData();
      formData.append("file", mockFile);

      const result = await uploadProfileImageAction(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "Invalid file type. Please upload JPEG, PNG, GIF, or WEBP images."
      );
    });

    it("should return error for file too large", async () => {
      // Create a mock file that's larger than 50MB
      const mockFile = new File(["test"], "test.jpg", {
        type: "image/jpeg",
      });
      Object.defineProperty(mockFile, "size", {
        value: 60 * 1024 * 1024, // 60MB
        writable: false,
      });

      const formData = new FormData();
      formData.append("file", mockFile);

      const result = await uploadProfileImageAction(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("File size must be less than 50MB");
    });
  });

  describe("setProfileInfoAction", () => {
    const mockUser = { id: "user-1" };
    const profileData = {
      first_name: "John",
      last_name: "Doe",
      bio: "Test bio",
      primary_role: ["designer"],
      location: "New York",
      avatar_url: "https://example.com/avatar.jpg",
    };

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it("should successfully set profile info and create new creator", async () => {
      const mockProfile = { user_role: "creator", onboarding_step: 1 };
      const updatedProfile = { id: "user-1", onboarding_step: 3 };
      const newCreator = {
        id: "creator-1",
        profile_id: "user-1",
        username: "john.doe",
        ...profileData,
      };

      mockSupabase.single
        .mockResolvedValueOnce({
          data: mockProfile,
          error: null,
        })
        .mockResolvedValueOnce({
          data: updatedProfile,
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { code: "PGRST116" }, // No existing creator
        })
        .mockResolvedValueOnce({
          data: null,
          error: { code: "PGRST116" }, // Username doesn't exist
        })
        .mockResolvedValueOnce({
          data: newCreator,
          error: null,
        });

      const result = await setProfileInfoAction(profileData);

      expect(result.success).toBe(true);
      expect(result.data?.creator).toEqual(newCreator);
      expect(mockRevalidatePath).toHaveBeenCalledWith("/onboarding");
    });

    it("should return error when required fields are missing", async () => {
      const incompleteData = {
        first_name: "John",
        // Missing required fields
      };

      const result = await setProfileInfoAction(incompleteData as any);

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "First name, last name, location, and profile picture are required"
      );
    });
  });

  describe("setSocialLinksAction", () => {
    const mockUser = { id: "user-1" };
    const socialLinksData = {
      social_links: {
        twitter: "twitter.com/user",
        linkedin: "linkedin.com/in/user",
        github: "github.com/user",
      },
    };

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it("should successfully set social links", async () => {
      const mockCreator = { id: "creator-1" };
      const updatedCreator = {
        id: "creator-1",
        social_links: {
          twitter: "https://twitter.com/user",
          linkedin: "https://linkedin.com/in/user",
          github: "https://github.com/user",
        },
        minimum_social_links_verified: true,
      };
      const updatedProfile = { id: "user-1", onboarding_step: 4 };

      mockSupabase.single
        .mockResolvedValueOnce({
          data: mockCreator,
          error: null,
        })
        .mockResolvedValueOnce({
          data: updatedCreator,
          error: null,
        })
        .mockResolvedValueOnce({
          data: updatedProfile,
          error: null,
        });

      const result = await setSocialLinksAction(socialLinksData);

      expect(result.success).toBe(true);
      expect(result.data?.creator.social_links.twitter).toBe(
        "https://twitter.com/user"
      );
      expect(mockRevalidatePath).toHaveBeenCalledWith("/onboarding");
    });

    it("should return error when less than 2 social links provided", async () => {
      const insufficientLinks = {
        social_links: {
          twitter: "twitter.com/user",
        },
      };

      const result = await setSocialLinksAction(insufficientLinks);

      expect(result.success).toBe(false);
      expect(result.error).toBe("At least 2 social links are required");
    });

    it("should return error when social_links is not an object", async () => {
      const invalidLinks = {
        social_links: "not an object" as any,
      };

      const result = await setSocialLinksAction(invalidLinks);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Social links must be an object");
    });
  });

  describe("setUsernameAction", () => {
    const mockUser = { id: "user-1" };

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it("should successfully set username and complete onboarding", async () => {
      const username = "testuser";
      const updatedCreator = {
        id: "creator-1",
        username: "testuser",
      };
      const updatedProfile = {
        id: "user-1",
        onboarding_completed: true,
        onboarding_step: 5,
      };

      mockSupabase.single
        .mockResolvedValueOnce({
          data: null,
          error: { code: "PGRST116" }, // Username doesn't exist
        })
        .mockResolvedValueOnce({
          data: updatedCreator,
          error: null,
        })
        .mockResolvedValueOnce({
          data: updatedProfile,
          error: null,
        });

      const result = await setUsernameAction(username);

      expect(result.success).toBe(true);
      expect(result.data?.creator.username).toBe("testuser");
      expect(result.data?.profile.onboarding_completed).toBe(true);
      expect(mockRevalidatePath).toHaveBeenCalledWith("/onboarding");
    });

    it("should return error when username is taken", async () => {
      const username = "takenuser";

      mockSupabase.single.mockResolvedValue({
        data: { id: "other-creator" },
        error: null,
      });

      const result = await setUsernameAction(username);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Username is already taken");
    });

    it("should return error for invalid username format", async () => {
      const invalidUsername = "user@invalid";

      const result = await setUsernameAction(invalidUsername);

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "Username can only contain letters, numbers, underscores, and periods"
      );
    });

    it("should return error when username is empty", async () => {
      const result = await setUsernameAction("");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Username is required");
    });
  });

  describe("Error handling", () => {
    const mockUser = { id: "user-1" };

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it("should handle unexpected errors in all actions", async () => {
      mockSupabase.single.mockRejectedValue(new Error("Unexpected error"));

      const statusResult = await getOnboardingStatusAction();
      expect(statusResult.success).toBe(false);
      expect(statusResult.error).toBe("Unexpected error");

      const roleResult = await setUserRoleAction("creator");
      expect(roleResult.success).toBe(false);
      expect(roleResult.error).toBe("Unexpected error");
    });
  });
});
