"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Organization type definition
export interface Organization {
  id: string;
  name: string;
  logo_url?: string;
  website?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// Validation schemas
const organizationCreateSchema = z.object({
  name: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(100),
  logo_url: z.string().url("Invalid logo URL").optional().or(z.literal("")),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
});

const organizationUpdateSchema = z.object({
  name: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(100)
    .optional(),
  logo_url: z.string().url("Invalid logo URL").optional().or(z.literal("")),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
});

/**
 * Get all organizations with optional pagination and search
 */
export async function getOrganizationsAction(options?: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "name" | "created_at";
  sortOrder?: "asc" | "desc";
}) {
  try {
    const supabase = await createClient();
    const {
      page = 1,
      limit = 50,
      search,
      sortBy = "name",
      sortOrder = "asc",
    } = options || {};

    let query = supabase.from("organizations").select("*", { count: "exact" });

    // Add search filter
    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    // Add sorting
    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    // Add pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching organizations:", error);
      return {
        success: false,
        error: "Failed to fetch organizations",
        message: "An error occurred while retrieving organizations",
      };
    }

    return {
      success: true,
      data: {
        organizations: data,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      },
      message: "Organizations retrieved successfully",
    };
  } catch (error: any) {
    console.error("Error in getOrganizationsAction:", error);
    return {
      success: false,
      error: error.message,
      message: "An unexpected error occurred",
    };
  }
}

/**
 * Get organization by ID
 */
export async function getOrganizationAction(orgId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", orgId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return {
          success: false,
          error: "Organization not found",
          message: "The requested organization does not exist",
        };
      }

      console.error("Error fetching organization:", error);
      return {
        success: false,
        error: "Failed to fetch organization",
        message: "An error occurred while retrieving the organization",
      };
    }

    return {
      success: true,
      data,
      message: "Organization retrieved successfully",
    };
  } catch (error: any) {
    console.error("Error in getOrganizationAction:", error);
    return {
      success: false,
      error: error.message,
      message: "An unexpected error occurred",
    };
  }
}

/**
 * Get organization with projects
 */
export async function getOrganizationWithProjectsAction(orgId: string) {
  try {
    const supabase = await createClient();

    // Get organization details
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", orgId)
      .single();

    if (orgError) {
      if (orgError.code === "PGRST116") {
        return {
          success: false,
          error: "Organization not found",
          message: "The requested organization does not exist",
        };
      }

      console.error("Error fetching organization:", orgError);
      return {
        success: false,
        error: "Failed to fetch organization",
        message: "An error occurred while retrieving the organization",
      };
    }

    // Get projects associated with this organization
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select(
        `
        id,
        title,
        description,
        short_description,
        year,
        featured,
        thumbnail_url,
        created_at,
        creators (
          id,
          username,
          avatar_url
        )
      `
      )
      .contains("client_ids", [orgId])
      .order("created_at", { ascending: false });

    if (projectsError) {
      console.error("Error fetching organization projects:", projectsError);
      return {
        success: false,
        error: "Failed to fetch organization projects",
        message: "An error occurred while retrieving organization projects",
      };
    }

    return {
      success: true,
      data: {
        ...organization,
        projects: projects || [],
      },
      message: "Organization with projects retrieved successfully",
    };
  } catch (error: any) {
    console.error("Error in getOrganizationWithProjectsAction:", error);
    return {
      success: false,
      error: error.message,
      message: "An unexpected error occurred",
    };
  }
}

/**
 * Create a new organization
 */
export async function createOrganizationAction(
  orgData: z.infer<typeof organizationCreateSchema>
) {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "Authentication required",
        message: "You must be logged in to create an organization",
      };
    }

    // Validate input data
    const validatedData = organizationCreateSchema.parse(orgData);

    // Check if organization name already exists
    const { data: existingOrg } = await supabase
      .from("organizations")
      .select("id")
      .eq("name", validatedData.name)
      .single();

    if (existingOrg) {
      return {
        success: false,
        error: "Organization name already exists",
        message: "An organization with this name already exists",
      };
    }

    // Create organization
    const { data, error } = await supabase
      .from("organizations")
      .insert([validatedData])
      .select()
      .single();

    if (error) {
      console.error("Error creating organization:", error);
      return {
        success: false,
        error: "Failed to create organization",
        message: "An error occurred while creating the organization",
      };
    }

    // Revalidate organizations list
    revalidatePath("/organizations", "page");

    return {
      success: true,
      data,
      message: "Organization created successfully",
    };
  } catch (error: any) {
    console.error("Error in createOrganizationAction:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation failed",
        message: error.errors.map((e) => e.message).join(", "),
      };
    }

    return {
      success: false,
      error: error.message,
      message: "An unexpected error occurred",
    };
  }
}

/**
 * Update an organization
 */
export async function updateOrganizationAction(
  orgId: string,
  orgData: z.infer<typeof organizationUpdateSchema>
) {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "Authentication required",
        message: "You must be logged in to update an organization",
      };
    }

    // Validate input data
    const validatedData = organizationUpdateSchema.parse(orgData);

    // Check if organization exists
    const { data: existingOrg, error: checkError } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("id", orgId)
      .single();

    if (checkError || !existingOrg) {
      return {
        success: false,
        error: "Organization not found",
        message: "The organization you're trying to update does not exist",
      };
    }

    // If name is being changed, check if new name already exists
    if (validatedData.name && validatedData.name !== existingOrg.name) {
      const { data: nameExists } = await supabase
        .from("organizations")
        .select("id")
        .eq("name", validatedData.name)
        .neq("id", orgId)
        .single();

      if (nameExists) {
        return {
          success: false,
          error: "Organization name already exists",
          message: "An organization with this name already exists",
        };
      }
    }

    // Update organization
    const { data, error } = await supabase
      .from("organizations")
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orgId)
      .select()
      .single();

    if (error) {
      console.error("Error updating organization:", error);
      return {
        success: false,
        error: "Failed to update organization",
        message: "An error occurred while updating the organization",
      };
    }

    // Revalidate organization pages
    revalidatePath(`/organization/${orgId}`, "layout");
    revalidatePath("/organizations", "page");

    return {
      success: true,
      data,
      message: "Organization updated successfully",
    };
  } catch (error: any) {
    console.error("Error in updateOrganizationAction:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation failed",
        message: error.errors.map((e) => e.message).join(", "),
      };
    }

    return {
      success: false,
      error: error.message,
      message: "An unexpected error occurred",
    };
  }
}

/**
 * Delete an organization
 */
export async function deleteOrganizationAction(orgId: string) {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "Authentication required",
        message: "You must be logged in to delete an organization",
      };
    }

    // Check if organization exists
    const { data: existingOrg, error: checkError } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("id", orgId)
      .single();

    if (checkError || !existingOrg) {
      return {
        success: false,
        error: "Organization not found",
        message: "The organization you're trying to delete does not exist",
      };
    }

    // Check if this organization is used in any projects
    const { count, error: countError } = await supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .contains("client_ids", [orgId]);

    if (countError) {
      console.error("Error checking organization references:", countError);
      return {
        success: false,
        error: "Failed to check organization references",
        message: "An error occurred while checking organization usage",
      };
    }

    if (count && count > 0) {
      return {
        success: false,
        error: "Organization is in use",
        message: `Cannot delete organization "${existingOrg.name}" because it is referenced by ${count} project(s)`,
      };
    }

    // Check if this organization is used in any user profiles
    const { count: profileCount, error: profileCountError } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId);

    if (profileCountError) {
      console.error(
        "Error checking organization profile references:",
        profileCountError
      );
      return {
        success: false,
        error: "Failed to check organization references",
        message: "An error occurred while checking organization usage",
      };
    }

    if (profileCount && profileCount > 0) {
      return {
        success: false,
        error: "Organization is in use",
        message: `Cannot delete organization "${existingOrg.name}" because it is referenced by ${profileCount} user profile(s)`,
      };
    }

    // Delete organization
    const { error } = await supabase
      .from("organizations")
      .delete()
      .eq("id", orgId);

    if (error) {
      console.error("Error deleting organization:", error);
      return {
        success: false,
        error: "Failed to delete organization",
        message: "An error occurred while deleting the organization",
      };
    }

    // Revalidate organizations list
    revalidatePath("/organizations", "page");

    return {
      success: true,
      message: `Organization "${existingOrg.name}" deleted successfully`,
    };
  } catch (error: any) {
    console.error("Error in deleteOrganizationAction:", error);
    return {
      success: false,
      error: error.message,
      message: "An unexpected error occurred",
    };
  }
}

/**
 * Search organizations by name
 */
export async function searchOrganizationsAction(
  query: string,
  limit: number = 10
) {
  try {
    const supabase = await createClient();

    if (!query.trim()) {
      return {
        success: true,
        data: [],
        message: "No search query provided",
      };
    }

    const { data, error } = await supabase
      .from("organizations")
      .select("id, name, logo_url, website")
      .ilike("name", `%${query.trim()}%`)
      .order("name", { ascending: true })
      .limit(limit);

    if (error) {
      console.error("Error searching organizations:", error);
      return {
        success: false,
        error: "Failed to search organizations",
        message: "An error occurred while searching organizations",
      };
    }

    return {
      success: true,
      data,
      message: `Found ${data.length} organization(s)`,
    };
  } catch (error: any) {
    console.error("Error in searchOrganizationsAction:", error);
    return {
      success: false,
      error: error.message,
      message: "An unexpected error occurred",
    };
  }
}

/**
 * Get organization analytics
 */
export async function getOrganizationAnalyticsAction(orgId: string) {
  try {
    const supabase = await createClient();

    // Check if organization exists
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("id", orgId)
      .single();

    if (orgError || !organization) {
      return {
        success: false,
        error: "Organization not found",
        message: "The requested organization does not exist",
      };
    }

    // Get project count
    const { count: projectCount, error: projectCountError } = await supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .contains("client_ids", [orgId]);

    if (projectCountError) {
      console.error("Error counting projects:", projectCountError);
      return {
        success: false,
        error: "Failed to get analytics",
        message: "An error occurred while retrieving analytics",
      };
    }

    // Get unique creators count
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("creator_id")
      .contains("client_ids", [orgId]);

    if (projectsError) {
      console.error("Error fetching project creators:", projectsError);
      return {
        success: false,
        error: "Failed to get analytics",
        message: "An error occurred while retrieving analytics",
      };
    }

    const uniqueCreators = new Set(projects?.map((p) => p.creator_id) || [])
      .size;

    // Get recent projects
    const { data: recentProjects, error: recentProjectsError } = await supabase
      .from("projects")
      .select(
        `
        id,
        title,
        created_at,
        creators (
          username,
          avatar_url
        )
      `
      )
      .contains("client_ids", [orgId])
      .order("created_at", { ascending: false })
      .limit(5);

    if (recentProjectsError) {
      console.error("Error fetching recent projects:", recentProjectsError);
      return {
        success: false,
        error: "Failed to get analytics",
        message: "An error occurred while retrieving analytics",
      };
    }

    return {
      success: true,
      data: {
        organization,
        analytics: {
          totalProjects: projectCount || 0,
          uniqueCreators,
          recentProjects: recentProjects || [],
        },
      },
      message: "Organization analytics retrieved successfully",
    };
  } catch (error: any) {
    console.error("Error in getOrganizationAnalyticsAction:", error);
    return {
      success: false,
      error: error.message,
      message: "An unexpected error occurred",
    };
  }
}
