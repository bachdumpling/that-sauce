import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/api-utils/auth";

/**
 * Valid social media platforms for our app
 */
const VALID_PLATFORMS = [
  "website",
  "instagram",
  "linkedin",
  "dribbble",
  "vimeo",
  "twitter",
  "github",
  "behance",
  "medium",
  "youtube",
  "facebook",
  "tiktok",
];

/**
 * Check if a platform is valid
 */
function isValidPlatform(platform: string): boolean {
  return VALID_PLATFORMS.includes(platform);
}

/**
 * Validate that social links meet minimum requirement
 */
function validateMinimumSocialLinks(
  socialLinks: Record<string, string>
): boolean {
  if (!socialLinks || typeof socialLinks !== "object") {
    return false;
  }

  const validLinkCount = Object.entries(socialLinks).filter(
    ([platform, url]) => isValidPlatform(platform) && url && url.trim() !== ""
  ).length;

  return validLinkCount >= 2;
}

/**
 * Format social links to ensure they have proper URLs
 */
function formatSocialLinks(
  socialLinks: Record<string, string>
): Record<string, string> {
  const formattedLinks: Record<string, string> = {};

  Object.entries(socialLinks).forEach(([platform, url]) => {
    if (!url || url.trim() === "") {
      return;
    }

    let formattedUrl = url.trim();

    // Add https:// prefix if missing
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    // Add platform-specific domain if it's just a username
    switch (platform) {
      case "instagram":
        if (!/instagram\.com/i.test(formattedUrl)) {
          formattedUrl = `https://instagram.com/${formattedUrl.replace(/^https?:\/\//i, "").replace(/^@/, "")}`;
        }
        break;
      case "linkedin":
        if (!/linkedin\.com/i.test(formattedUrl)) {
          formattedUrl = `https://linkedin.com/in/${formattedUrl.replace(/^https?:\/\//i, "")}`;
        }
        break;
      case "dribbble":
        if (!/dribbble\.com/i.test(formattedUrl)) {
          formattedUrl = `https://dribbble.com/${formattedUrl.replace(/^https?:\/\//i, "")}`;
        }
        break;
      case "vimeo":
        if (!/vimeo\.com/i.test(formattedUrl)) {
          formattedUrl = `https://vimeo.com/${formattedUrl.replace(/^https?:\/\//i, "")}`;
        }
        break;
      case "twitter":
        if (!/(?:twitter\.com|x\.com)/i.test(formattedUrl)) {
          formattedUrl = `https://twitter.com/${formattedUrl.replace(/^https?:\/\//i, "").replace(/^@/, "")}`;
        }
        break;
      case "github":
        if (!/github\.com/i.test(formattedUrl)) {
          formattedUrl = `https://github.com/${formattedUrl.replace(/^https?:\/\//i, "")}`;
        }
        break;
    }

    formattedLinks[platform] = formattedUrl;
  });

  return formattedLinks;
}

/**
 * Set social links
 * PUT /api/onboarding/social-links
 */
export async function PUT(request: NextRequest) {
  try {
    // Check if user is authenticated
    const authContext = await requireAuth(request);
    const userId = authContext.user.id;
    const supabase = await createClient();

    const body = await request.json();
    const { social_links } = body;

    // Validate social_links
    if (!social_links || typeof social_links !== "object") {
      return NextResponse.json(
        {
          success: false,
          error: "Social links must be an object",
        },
        { status: 400 }
      );
    }

    // Check if there are at least 2 valid social links
    if (!validateMinimumSocialLinks(social_links)) {
      return NextResponse.json(
        {
          success: false,
          error: "At least 2 social links are required",
        },
        { status: 400 }
      );
    }

    // Format social links to ensure they have proper URLs
    const formattedSocialLinks = formatSocialLinks(social_links);

    // Get user profile to determine the next step
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("user_role")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError.message);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch user profile",
        },
        { status: 500 }
      );
    }

    // Get creator record for this user
    const { data: creatorData, error: creatorError } = await supabase
      .from("creators")
      .select("id")
      .eq("profile_id", userId)
      .single();

    if (creatorError || !creatorData) {
      console.error(
        "Error fetching creator profile:",
        creatorError?.message || "Creator not found"
      );
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch creator profile",
        },
        { status: 500 }
      );
    }

    // Update creator with social links
    const { data, error } = await supabase
      .from("creators")
      .update({
        social_links: formattedSocialLinks,
        minimum_social_links_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq("profile_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating social links:", error.message);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update social links",
        },
        { status: 500 }
      );
    }

    // Update profile to move to the username selection step
    const { data: updatedProfile, error: updateProfileError } = await supabase
      .from("profiles")
      .update({
        onboarding_step: 4, // Move to step 4 (username selection)
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (updateProfileError) {
      console.error(
        "Error updating profile onboarding status:",
        updateProfileError.message
      );
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update onboarding status",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Social links updated successfully",
      data: {
        creator: data,
        profile: updatedProfile,
      },
    });
  } catch (error: any) {
    console.error("Error in setSocialLinks:", error.message);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: error.message === "Authentication required" ? 401 : 500 }
    );
  }
}
