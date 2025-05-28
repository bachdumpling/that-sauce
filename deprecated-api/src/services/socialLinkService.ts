import logger from "../config/logger";

/**
 * Valid social media platforms for our app
 */
export enum SocialPlatform {
  WEBSITE = "website",
  INSTAGRAM = "instagram",
  LINKEDIN = "linkedin",
  DRIBBBLE = "dribbble",
  VIMEO = "vimeo"
}

/**
 * Service for social links validation and processing
 */
export class SocialLinkService {
  /**
   * Get the list of valid social platforms
   */
  getValidPlatforms(): string[] {
    return Object.values(SocialPlatform);
  }

  /**
   * Check if a platform is valid
   */
  isValidPlatform(platform: string): boolean {
    return Object.values(SocialPlatform).includes(platform as SocialPlatform);
  }

  /**
   * Validate that social links meet minimum requirement
   */
  validateMinimumSocialLinks(socialLinks: Record<string, string>): boolean {
    if (!socialLinks || typeof socialLinks !== "object") {
      return false;
    }

    const validLinkCount = Object.entries(socialLinks)
      .filter(([platform, url]) => 
        this.isValidPlatform(platform) && 
        url && 
        url.trim() !== ""
      ).length;

    return validLinkCount >= 2;
  }

  /**
   * Format social links to ensure they have proper URLs
   */
  formatSocialLinks(socialLinks: Record<string, string>): Record<string, string> {
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
      switch (platform as SocialPlatform) {
        case SocialPlatform.INSTAGRAM:
          if (!/instagram\.com/i.test(formattedUrl)) {
            formattedUrl = `https://instagram.com/${formattedUrl.replace(/^https?:\/\//i, "").replace(/^@/, "")}`;
          }
          break;
        case SocialPlatform.LINKEDIN:
          if (!/linkedin\.com/i.test(formattedUrl)) {
            formattedUrl = `https://linkedin.com/in/${formattedUrl.replace(/^https?:\/\//i, "")}`;
          }
          break;
        case SocialPlatform.DRIBBBLE:
          if (!/dribbble\.com/i.test(formattedUrl)) {
            formattedUrl = `https://dribbble.com/${formattedUrl.replace(/^https?:\/\//i, "")}`;
          }
          break;
        case SocialPlatform.VIMEO:
          if (!/vimeo\.com/i.test(formattedUrl)) {
            formattedUrl = `https://vimeo.com/${formattedUrl.replace(/^https?:\/\//i, "")}`;
          }
          break;
      }

      formattedLinks[platform] = formattedUrl;
    });

    return formattedLinks;
  }
} 