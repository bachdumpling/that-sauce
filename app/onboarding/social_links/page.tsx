import { redirect } from "next/navigation";
import { getOnboardingStatusAction } from "@/actions/onboarding-actions";
import { SocialLinksForm } from "./social-links-form";
import { OnboardingContainer } from "../components/onboarding-container";

export const metadata = {
  title: "Social Media Links | Onboarding",
  description: "Connect your social media accounts",
};

export default async function SocialLinksPage() {
  const response = await getOnboardingStatusAction();
  const onboardingStatus = response.success ? response.data : null;

  const userRole =
    onboardingStatus?.user_role || onboardingStatus?.profile?.user_role;
  const onboardingStep = onboardingStatus?.profile?.onboarding_step || 0;

  // If user role is not set, redirect to role selection
  if (!onboardingStatus || !userRole) {
    redirect("/onboarding/role_selection");
  }

  // If user is employer and organization is not set, redirect to organization info
  if (userRole === "employer" && !onboardingStatus.profile?.organization_id) {
    redirect("/onboarding/organization_info");
  }

  // Only redirect if profile info is not complete (requirement for this step)
  // This ensures forward progress while still allowing back navigation
  if (onboardingStep < 2) {
    redirect("/onboarding/profile_info");
  }

  // Extract social links data
  const socialLinks = onboardingStatus?.creator?.social_links || {};
  const initialData = {
    socialLinks,
    userRole,
  };

  return (
    <OnboardingContainer
      title="Social Media Links"
      description="Connect your social accounts to showcase your work"
    >
      <SocialLinksForm initialData={initialData} />
    </OnboardingContainer>
  );
}
