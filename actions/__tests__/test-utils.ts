import { createClient } from "@/utils/supabase/server";

// Type-safe assertion helper for test results
export function assertSuccessResult<T>(result: {
  success: boolean;
  data?: T;
  error?: string;
}): asserts result is { success: true; data: T } {
  expect(result.success).toBe(true);
  expect(result.data).toBeDefined();
}

export function assertErrorResult(result: {
  success: boolean;
  data?: any;
  error?: string;
}): asserts result is { success: false; error: string } {
  expect(result.success).toBe(false);
  expect(result.error).toBeDefined();
}

// Mock Supabase client factory
export function createMockSupabaseClient() {
  const mockSupabase = {
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

  return mockSupabase;
}

// Common mock data
export const mockUser = { id: "user-1" };
export const mockCreator = { id: "creator-1" };
export const mockPortfolio = { id: "portfolio-1" };

export const mockProject = {
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

// Setup helper for authenticated user
export function setupAuthenticatedUser(mockSupabase: any, user = mockUser) {
  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user },
    error: null,
  });
}

// Setup helper for unauthenticated user
export function setupUnauthenticatedUser(mockSupabase: any) {
  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user: null },
    error: null,
  });
}
