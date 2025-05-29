import {
  FaInstagram,
  FaBehance,
  FaDribbble,
  FaVimeo,
  FaLinkedin,
  FaYoutube,
  FaGithub,
  FaTwitter,
  FaFacebook,
  FaTiktok,
  FaMedium,
} from "react-icons/fa";
import { Globe } from "lucide-react";
import { SOCIAL_PLATFORMS } from "@/lib/constants/creator-options";

interface SocialIconProps {
  platform:
    | string
    | { id: string; name: string; placeholder?: string; baseUrl?: string };
  className?: string;
}

// Base icon mapping - can be extended as needed
const BASE_PLATFORM_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  instagram: FaInstagram,
  behance: FaBehance,
  dribbble: FaDribbble,
  vimeo: FaVimeo,
  linkedin: FaLinkedin,
  youtube: FaYoutube,
  github: FaGithub,
  website: Globe,
  // Additional common platforms
  twitter: FaTwitter,
  facebook: FaFacebook,
  tiktok: FaTiktok,
  medium: FaMedium,
};

// Dynamically create icon mapping based on SOCIAL_PLATFORMS and base icons
const PLATFORM_ICONS = (() => {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    ...BASE_PLATFORM_ICONS,
  };

  // Ensure all platforms from creator options have an icon (fallback to Globe if not found)
  SOCIAL_PLATFORMS.forEach((platform) => {
    if (!icons[platform.id]) {
      icons[platform.id] = Globe;
    }
  });

  return icons;
})();

// Helper function to get all supported platform IDs
export const getSupportedPlatforms = () => {
  return SOCIAL_PLATFORMS.map((platform) => platform.id);
};

// Helper function to get platform info by ID
export const getPlatformInfo = (platformId: string) => {
  return SOCIAL_PLATFORMS.find((platform) => platform.id === platformId);
};

export const SocialIcon: React.FC<SocialIconProps> = ({
  platform,
  className,
}) => {
  // Handle both string and object platform props
  const platformId = typeof platform === "string" ? platform : platform.id;
  const Icon = PLATFORM_ICONS[platformId.toLowerCase()] || Globe;
  return <Icon className={className || "h-4 w-4"} />;
};
