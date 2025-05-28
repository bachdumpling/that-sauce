/**
 * Onboarding related type definitions
 */

/**
 * Represents the current status of a user's onboarding process
 */
export interface OnboardingStatus {
  /** The current onboarding step the user is on */
  current_step: string;

  /** Whether the user has completed the onboarding process */
  onboarding_completed: boolean;

  /** The selected user role (creator or employer) */
  user_role?: "creator" | "employer";

  /** Organization ID for employer users */
  organization_id?: string;

  /** Organization name for employer users */
  organization_name?: string;

  /** Whether profile information has been completed */
  profile_completed?: boolean;

  /** Whether social links have been verified (minimum required) */
  social_links_verified?: boolean;

  /** Profile data from the profiles table */
  profile?: {
    id: string;
    first_name?: string;
    last_name?: string;
    user_role?: "creator" | "employer";
    onboarding_step?: number;
    onboarding_completed?: boolean;
    organization_id?: string;
    username?: string;
    [key: string]: any;
  };

  /** Creator data from the creators table */
  creator?: {
    id: string;
    profile_id: string;
    username?: string;
    bio?: string;
    location?: string;
    primary_role?: string[];
    avatar_url?: string;
    [key: string]: any;
  };
}

/**
 * Steps in the onboarding flow
 */
export type OnboardingStep =
  | "role_selection"
  | "organization_info"
  | "profile_info"
  | "social_links"
  | "username_selection"
  | "completed";

/**
 * User profile data for onboarding
 */
export interface ProfileData {
  first_name: string;
  last_name: string;
  bio: string;
  primary_role?: string[];
  location?: string;
  avatar_url?: string;
}

/**
 * Organization data for employer onboarding
 */
export interface OrganizationData {
  name: string;
  website?: string;
  logo_url?: string;
}

/**
 * Social media links for user profiles
 */
export interface SocialLinks {
  website?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  github?: string;
  dribbble?: string;
  behance?: string;
  medium?: string;
  youtube?: string;
  [key: string]: string | undefined;
}
