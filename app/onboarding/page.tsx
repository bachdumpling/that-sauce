import { redirect } from "next/navigation";
import { getOnboardingStatusAction } from "@/actions/onboarding-actions";
import { OnboardingStep } from "@/types/onboarding";

export default async function OnboardingPage() {
  const response = await getOnboardingStatusAction();
  const onboardingStatus = response.success ? response.data : null;

  console.log("onboardingStatus", onboardingStatus);

  // Default to the first step if no status is found
  let nextStep: OnboardingStep = "role_selection";

  if (onboardingStatus) {
    // Get onboarding step from profile
    const onboardingStep = onboardingStatus.profile?.onboarding_step || 0;
    const userRole =
      onboardingStatus.user_role || onboardingStatus.profile?.user_role;

    console.log("Current onboarding step:", onboardingStep);
    console.log("User role:", userRole);

    // Map numeric steps to our onboarding flow
    // Step 0: No role selected
    // Step 1: Role selected (employer needs organization info)
    // Step 2: Profile info completed
    // Step 3: Social links added
    // Step 4: Username selected
    // Step 5: Onboarding completed
    if (!userRole) {
      nextStep = "role_selection"; // Step 0
    } else if (
      userRole === "employer" &&
      !onboardingStatus.profile?.organization_id
    ) {
      nextStep = "organization_info"; // Step 1 for employers
    } else if (onboardingStep < 2) {
      nextStep = "profile_info"; // Step 1 for creators or Step 2 for employers
    } else if (onboardingStep < 3) {
      nextStep = "social_links"; // Step 2 or 3
    } else if (onboardingStep < 4) {
      nextStep = "username_selection"; // Step 3 or 4
    } else if (
      onboardingStep >= 4 ||
      onboardingStatus.profile?.onboarding_completed
    ) {
      nextStep = "completed"; // Final step
    } else {
      // This should never be reached now, but keeping as fallback
      console.log("Reached default username selection case");
      // nextStep = "username_selection";
      nextStep = "username_selection";
    }
  }

  console.log("Redirecting to:", nextStep);

  // Redirect to the appropriate step
  redirect(`/onboarding/${nextStep}`);
}
