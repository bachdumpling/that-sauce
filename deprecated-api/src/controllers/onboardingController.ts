import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/extractUser";
import { supabase } from "../lib/supabase";
import logger from "../config/logger";
import { invalidateCache } from "../lib/cache";
import { SocialLinkService } from "../services/socialLinkService";
import { MediaService } from "../services/mediaService";

/**
 * Controller to manage the onboarding flow
 */
export class OnboardingController {
  private socialLinkService: SocialLinkService;
  private mediaService: MediaService;

  constructor() {
    this.socialLinkService = new SocialLinkService();
    this.mediaService = new MediaService();
  }

  /**
   * Set user role (creator or employer)
   * PUT /api/onboarding/role
   */
  async setUserRole(req: AuthenticatedRequest, res: Response) {
    try {
      // Check if user is authenticated
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        });
      }

      const { role } = req.body;

      // Validate role
      if (!role || !["creator", "employer"].includes(role)) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_ROLE",
            message: "Role must be either 'creator' or 'employer'",
          },
        });
      }

      // Update user profile with the selected role
      const { data, error } = await supabase
        .from("profiles")
        .update({
          user_role: role,
          onboarding_step: 2, // Move to step 2
          updated_at: new Date().toISOString(),
        })
        .eq("id", req.user.id)
        .select()
        .single();

      if (error) {
        logger.error(`Error setting user role: ${error.message}`, { error });
        return res.status(500).json({
          success: false,
          error: {
            code: "DATABASE_ERROR",
            message: "Failed to set user role",
          },
        });
      }

      return res.status(200).json({
        success: true,
        message: "User role set successfully",
        data,
      });
    } catch (error: any) {
      logger.error(`Error in setUserRole: ${error.message}`, { error });
      return res.status(500).json({
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Internal server error",
        },
      });
    }
  }

  /**
   * Set organization information for employer
   * PUT /api/onboarding/organization
   */
  async setOrganization(req: AuthenticatedRequest, res: Response) {
    try {
      // Check if user is authenticated
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        });
      }

      // Check if user role is employer
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("user_role")
        .eq("id", req.user.id)
        .single();

      if (profileError) {
        logger.error(`Error fetching user profile: ${profileError.message}`, {
          error: profileError,
        });
        return res.status(500).json({
          success: false,
          error: {
            code: "DATABASE_ERROR",
            message: "Failed to fetch user profile",
          },
        });
      }

      if (profileData.user_role !== "employer") {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_ROLE",
            message: "Only employers can set organization information",
          },
        });
      }

      const { organization_id, organization_name, website, logo_url } =
        req.body;

      let orgId = organization_id;

      // If organization_id is null and organization_name is provided, create a new organization
      if (!organization_id && organization_name) {
        // Create new organization
        const { data: newOrg, error: createOrgError } = await supabase
          .from("organizations")
          .insert({
            name: organization_name,
            website,
            logo_url,
          })
          .select()
          .single();

        if (createOrgError) {
          logger.error(
            `Error creating organization: ${createOrgError.message}`,
            { error: createOrgError }
          );
          return res.status(500).json({
            success: false,
            error: {
              code: "DATABASE_ERROR",
              message: "Failed to create organization",
            },
          });
        }

        orgId = newOrg.id;
        invalidateCache("organization_list");
      }

      // Update user profile with the organization_id and move to step 3
      const { data, error } = await supabase
        .from("profiles")
        .update({
          organization_id: orgId,
          onboarding_step: 3, // Move to step 3
          updated_at: new Date().toISOString(),
        })
        .eq("id", req.user.id)
        .select()
        .single();

      if (error) {
        logger.error(`Error setting organization: ${error.message}`, { error });
        return res.status(500).json({
          success: false,
          error: {
            code: "DATABASE_ERROR",
            message: "Failed to set organization",
          },
        });
      }

      return res.status(200).json({
        success: true,
        message: "Organization set successfully",
        data: {
          profile: data,
          organization_id: orgId,
        },
      });
    } catch (error: any) {
      logger.error(`Error in setOrganization: ${error.message}`, { error });
      return res.status(500).json({
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Internal server error",
        },
      });
    }
  }

  /**
   * Set user profile information
   * PUT /api/onboarding/profile
   */
  async setProfile(req: AuthenticatedRequest, res: Response) {
    try {
      // Check if user is authenticated
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        });
      }

      const { first_name, last_name, bio, primary_role, location, avatar_url } =
        req.body;

      // Validate required fields
      if (!first_name || !last_name || !location || !avatar_url) {
        return res.status(400).json({
          success: false,
          error: {
            code: "MISSING_REQUIRED_FIELDS",
            message:
              "First name, last name, location, and profile picture are required",
          },
        });
      }

      // Validate primary_role if provided
      if (primary_role && !Array.isArray(primary_role)) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_FORMAT",
            message: "Primary role must be an array",
          },
        });
      }

      // Get user role from profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("user_role, onboarding_step")
        .eq("id", req.user.id)
        .single();

      if (profileError) {
        logger.error(`Error fetching user profile: ${profileError.message}`, {
          error: profileError,
        });
        return res.status(500).json({
          success: false,
          error: {
            code: "DATABASE_ERROR",
            message: "Failed to fetch user profile",
          },
        });
      }

      // Update profile first
      const { data: updatedProfile, error: updateProfileError } = await supabase
        .from("profiles")
        .update({
          first_name,
          last_name,
          onboarding_step: profileData.user_role === "creator" ? 3 : 4, // Next step depends on role
          updated_at: new Date().toISOString(),
        })
        .eq("id", req.user.id)
        .select()
        .single();

      if (updateProfileError) {
        logger.error(`Error updating profile: ${updateProfileError.message}`, {
          error: updateProfileError,
        });
        return res.status(500).json({
          success: false,
          error: {
            code: "DATABASE_ERROR",
            message: "Failed to update profile",
          },
        });
      }

      // Check if there's already a creator record for this user
      const { data: existingCreator } = await supabase
        .from("creators")
        .select("id")
        .eq("profile_id", req.user.id)
        .single();

      // Update or insert creator information
      let creatorResult;

      if (existingCreator) {
        // Update existing creator
        const { data, error } = await supabase
          .from("creators")
          .update({
            bio,
            primary_role,
            location,
            avatar_url,
            updated_at: new Date().toISOString(),
          })
          .eq("profile_id", req.user.id)
          .select()
          .single();

        if (error) {
          logger.error(`Error updating creator: ${error.message}`, { error });
          return res.status(500).json({
            success: false,
            error: {
              code: "DATABASE_ERROR",
              message: "Failed to update creator profile",
            },
          });
        }

        creatorResult = data;
      } else {
        // Generate a username from the user's name
        const username =
          `${first_name.toLowerCase()}.${last_name.toLowerCase()}`.replace(
            /\s/g,
            ""
          );

        // Check if username exists
        const { data: existingUsername } = await supabase
          .from("creators")
          .select("id")
          .eq("username", username)
          .single();

        // If username exists, append a random number
        const finalUsername = existingUsername
          ? `${username}${Math.floor(Math.random() * 1000)}`
          : username;

        // Create new creator
        const { data, error } = await supabase
          .from("creators")
          .insert({
            profile_id: req.user.id,
            username: finalUsername,
            bio,
            primary_role,
            location,
            avatar_url,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          logger.error(`Error creating creator: ${error.message}`, { error });
          return res.status(500).json({
            success: false,
            error: {
              code: "DATABASE_ERROR",
              message: "Failed to create creator profile",
            },
          });
        }

        creatorResult = data;
      }

      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: {
          profile: updatedProfile,
          creator: creatorResult,
        },
      });
    } catch (error: any) {
      logger.error(`Error in setProfile: ${error.message}`, { error });
      return res.status(500).json({
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Internal server error",
        },
      });
    }
  }

  /**
   * Set social links
   * PUT /api/onboarding/social-links
   */
  async setSocialLinks(req: AuthenticatedRequest, res: Response) {
    try {
      // Check if user is authenticated
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        });
      }

      const { social_links } = req.body;

      // Validate social_links
      if (!social_links || typeof social_links !== "object") {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_FORMAT",
            message: "Social links must be an object",
          },
        });
      }

      // Check if there are at least 2 valid social links
      if (!this.socialLinkService.validateMinimumSocialLinks(social_links)) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INSUFFICIENT_LINKS",
            message: "At least 2 social links are required",
          },
        });
      }

      // Format social links to ensure they have proper URLs
      const formattedSocialLinks =
        this.socialLinkService.formatSocialLinks(social_links);

      // Get user profile to determine the next step
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("user_role")
        .eq("id", req.user.id)
        .single();

      if (profileError) {
        logger.error(`Error fetching user profile: ${profileError.message}`, {
          error: profileError,
        });
        return res.status(500).json({
          success: false,
          error: {
            code: "DATABASE_ERROR",
            message: "Failed to fetch user profile",
          },
        });
      }

      // Get creator record for this user
      const { data: creatorData, error: creatorError } = await supabase
        .from("creators")
        .select("id")
        .eq("profile_id", req.user.id)
        .single();

      if (creatorError || !creatorData) {
        logger.error(
          `Error fetching creator profile: ${creatorError?.message || "Creator not found"}`,
          { error: creatorError }
        );
        return res.status(500).json({
          success: false,
          error: {
            code: "DATABASE_ERROR",
            message: "Failed to fetch creator profile",
          },
        });
      }

      // Update creator with social links
      const { data, error } = await supabase
        .from("creators")
        .update({
          social_links: formattedSocialLinks,
          minimum_social_links_verified: true,
          updated_at: new Date().toISOString(),
        })
        .eq("profile_id", req.user.id)
        .select()
        .single();

      if (error) {
        logger.error(`Error updating social links: ${error.message}`, {
          error,
        });
        return res.status(500).json({
          success: false,
          error: {
            code: "DATABASE_ERROR",
            message: "Failed to update social links",
          },
        });
      }

      // Update profile to move to the username selection step instead of completing
      const { data: updatedProfile, error: updateProfileError } = await supabase
        .from("profiles")
        .update({
          onboarding_step: 4, // Move to step 4 (username selection)
          updated_at: new Date().toISOString(),
        })
        .eq("id", req.user.id)
        .select()
        .single();

      if (updateProfileError) {
        logger.error(
          `Error updating profile onboarding status: ${updateProfileError.message}`,
          { error: updateProfileError }
        );
        return res.status(500).json({
          success: false,
          error: {
            code: "DATABASE_ERROR",
            message: "Failed to update onboarding status",
          },
        });
      }

      return res.status(200).json({
        success: true,
        message: "Social links updated successfully",
        data: {
          creator: data,
          profile: updatedProfile,
        },
      });
    } catch (error: any) {
      logger.error(`Error in setSocialLinks: ${error.message}`, { error });
      return res.status(500).json({
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Internal server error",
        },
      });
    }
  }

  /**
   * Set username
   * PUT /api/onboarding/username
   */
  async setUsername(req: AuthenticatedRequest, res: Response) {
    try {
      // Check if user is authenticated
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        });
      }

      const { username } = req.body;

      // Validate username
      if (!username || typeof username !== "string") {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_FORMAT",
            message: "Username is required",
          },
        });
      }

      // Check if username follows the pattern (alphanumeric, underscores, periods)
      const usernameRegex = /^[a-zA-Z0-9_.]+$/;
      if (!usernameRegex.test(username)) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_USERNAME",
            message:
              "Username can only contain letters, numbers, underscores, and periods",
          },
        });
      }

      // Check if username already exists
      const { data: existingUsername, error: usernameCheckError } =
        await supabase
          .from("creators")
          .select("id")
          .eq("username", username)
          .neq("profile_id", req.user.id) // Exclude current user
          .single();

      if (usernameCheckError && usernameCheckError.code !== "PGRST116") {
        logger.error(`Error checking username: ${usernameCheckError.message}`, {
          error: usernameCheckError,
        });
        return res.status(500).json({
          success: false,
          error: {
            code: "DATABASE_ERROR",
            message: "Failed to check username availability",
          },
        });
      }

      if (existingUsername) {
        return res.status(400).json({
          success: false,
          error: {
            code: "USERNAME_TAKEN",
            message: "Username is already taken",
          },
        });
      }

      // Update creator with new username
      const { data, error } = await supabase
        .from("creators")
        .update({
          username,
          updated_at: new Date().toISOString(),
        })
        .eq("profile_id", req.user.id)
        .select()
        .single();

      if (error) {
        logger.error(`Error updating username: ${error.message}`, {
          error,
        });
        return res.status(500).json({
          success: false,
          error: {
            code: "DATABASE_ERROR",
            message: "Failed to update username",
          },
        });
      }

      // Update profile to mark onboarding as completed
      const { data: updatedProfile, error: updateProfileError } = await supabase
        .from("profiles")
        .update({
          onboarding_completed: true,
          onboarding_step: 5, // Set to final step
          updated_at: new Date().toISOString(),
        })
        .eq("id", req.user.id)
        .select()
        .single();

      if (updateProfileError) {
        logger.error(
          `Error updating profile onboarding status: ${updateProfileError.message}`,
          { error: updateProfileError }
        );
        return res.status(500).json({
          success: false,
          error: {
            code: "DATABASE_ERROR",
            message: "Failed to update onboarding status",
          },
        });
      }

      return res.status(200).json({
        success: true,
        message: "Username set and onboarding completed",
        data: {
          creator: data,
          profile: updatedProfile,
        },
      });
    } catch (error: any) {
      logger.error(`Error in setUsername: ${error.message}`, { error });
      return res.status(500).json({
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Internal server error",
        },
      });
    }
  }

  /**
   * Get current onboarding status
   * GET /api/onboarding/status
   */
  async getStatus(req: AuthenticatedRequest, res: Response) {
    try {
      // Check if user is authenticated
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        });
      }

      // Get profile info
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*, organizations(*)")
        .eq("id", req.user.id)
        .single();

      if (profileError) {
        logger.error(`Error fetching profile: ${profileError.message}`, {
          error: profileError,
        });
        return res.status(500).json({
          success: false,
          error: {
            code: "DATABASE_ERROR",
            message: "Failed to fetch profile",
          },
        });
      }

      // Get creator info if it exists
      const { data: creator, error: creatorError } = await supabase
        .from("creators")
        .select("*")
        .eq("profile_id", req.user.id)
        .single();

      // It's okay if creator doesn't exist yet
      if (creatorError && creatorError.code !== "PGRST116") {
        logger.error(`Error fetching creator: ${creatorError.message}`, {
          error: creatorError,
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          profile,
          creator,
          onboarding_completed: profile.onboarding_completed,
          current_step: profile.onboarding_step,
          user_role: profile.user_role,
        },
      });
    } catch (error: any) {
      logger.error(`Error in getStatus: ${error.message}`, { error });
      return res.status(500).json({
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Internal server error",
        },
      });
    }
  }

  /**
   * Upload profile image
   * POST /api/onboarding/profile-image
   */
  async uploadProfileImage(req: AuthenticatedRequest, res: Response) {
    try {
      // Check if user is authenticated
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        });
      }

      if (!req.files || !req.files.file) {
        return res.status(400).json({
          success: false,
          error: {
            code: "MISSING_FILE",
            message: "No file was uploaded",
          },
        });
      }

      // Handle both single file and array of files
      const fileData = Array.isArray(req.files.file)
        ? req.files.file[0]
        : req.files.file;

      // Check if there's already a creator record for this user
      const { data: existingCreator } = await supabase
        .from("creators")
        .select("id")
        .eq("profile_id", req.user.id)
        .single();

      if (!existingCreator) {
        // Create a temporary creator record if it doesn't exist
        const { data: creatorData, error: creatorError } = await supabase
          .from("creators")
          .insert({
            profile_id: req.user.id,
            username: `temp_${req.user.id.substring(0, 8)}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (creatorError) {
          logger.error(
            `Error creating temporary creator record: ${creatorError.message}`,
            { error: creatorError }
          );
          return res.status(500).json({
            success: false,
            error: {
              code: "DATABASE_ERROR",
              message: "Failed to create creator record for image upload",
            },
          });
        }

        // Upload the file to storage using the MediaService
        try {
          const result = await this.mediaService.uploadProfileImage(
            fileData,
            req.user.id,
            creatorData.id,
            "avatar"
          );

          // Update the creator with the new avatar_url
          const { data, error } = await supabase
            .from("creators")
            .update({
              avatar_url: result.url,
              updated_at: new Date().toISOString(),
            })
            .eq("id", creatorData.id)
            .select()
            .single();

          if (error) {
            logger.error(`Error updating avatar URL: ${error.message}`, {
              error,
            });
            return res.status(500).json({
              success: false,
              error: {
                code: "DATABASE_ERROR",
                message: "Failed to update avatar URL",
              },
            });
          }

          return res.status(200).json({
            success: true,
            message: "Profile image uploaded successfully",
            data: {
              avatar_url: result.url,
              creator: data,
            },
          });
        } catch (uploadError: any) {
          logger.error(
            `Error uploading profile image: ${uploadError.message}`,
            { error: uploadError }
          );
          return res.status(500).json({
            success: false,
            error: {
              code: "UPLOAD_FAILED",
              message: "Failed to upload profile image",
            },
          });
        }
      } else {
        // Upload using existing creator record
        try {
          const result = await this.mediaService.uploadProfileImage(
            fileData,
            req.user.id,
            existingCreator.id,
            "avatar"
          );

          // Update the creator with the new avatar_url
          const { data, error } = await supabase
            .from("creators")
            .update({
              avatar_url: result.url,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingCreator.id)
            .select()
            .single();

          if (error) {
            logger.error(`Error updating avatar URL: ${error.message}`, {
              error,
            });
            return res.status(500).json({
              success: false,
              error: {
                code: "DATABASE_ERROR",
                message: "Failed to update avatar URL",
              },
            });
          }

          return res.status(200).json({
            success: true,
            message: "Profile image uploaded and updated successfully",
            data: {
              avatar_url: result.url,
              creator: data,
            },
          });
        } catch (uploadError: any) {
          logger.error(
            `Error uploading profile image: ${uploadError.message}`,
            { error: uploadError }
          );
          return res.status(500).json({
            success: false,
            error: {
              code: "UPLOAD_FAILED",
              message: "Failed to upload profile image",
            },
          });
        }
      }
    } catch (error: any) {
      logger.error(`Error in uploadProfileImage: ${error.message}`, { error });
      return res.status(500).json({
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Internal server error",
        },
      });
    }
  }
}
