import { redirect } from "next/navigation";
import { getOnboardingStatusAction } from "@/actions/onboarding-actions";
import { UsernameForm } from "./username-form";
import { OnboardingContainer } from "../components/onboarding-container";

export const metadata = {
  title: "Choose Your Username | Onboarding",
  description: "Select a unique username for your profile",
};

export default async function UsernameSelectionPage() {
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

  // If user hasn't completed profile info (first requirement), redirect there
  if (onboardingStep < 2) {
    redirect("/onboarding/profile_info");
  }

  // If user hasn't added any social links yet, redirect there
  if (onboardingStep < 3) {
    redirect("/onboarding/social_links");
  }

  // If username is already set and onboarding is completed, and user isn't explicitly returning to this page
  if (
    onboardingStatus.profile?.username &&
    onboardingStatus.profile?.onboarding_completed &&
    !onboardingStatus.profile?.onboarding_in_progress
  ) {
    redirect("/onboarding/completed");
  }

  // Extract username data
  const username = onboardingStatus?.creator?.username || "";
  const initialData = {
    username,
    userRole,
  };

  return (
    <OnboardingContainer
      title="Choose Your Username"
      description="Pick a unique username for your creative profile"
    >
      <UsernameForm initialData={initialData} />
    </OnboardingContainer>
  );
}
