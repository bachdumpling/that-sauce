import { getOnboardingStatusAction } from "@/actions/onboarding-actions";
import { RoleSelectionForm } from "./role-selection-form";
import { OnboardingContainer } from "../components/onboarding-container";

export const metadata = {
  title: "Choose Your Role | Onboarding",
  description: "Select whether you're a creator or employer",
};

export default async function RoleSelectionPage() {
  // Fetch current role if it exists
  const response = await getOnboardingStatusAction();
  const onboardingStatus = response.success ? response.data : null;

  // Get the current role if it exists
  const currentRole =
    onboardingStatus?.user_role ||
    onboardingStatus?.profile?.user_role ||
    undefined;

  return (
    <OnboardingContainer
      title="Choose Your Role"
      description="Select whether you're a creator or looking to hire"
    >
      <RoleSelectionForm initialData={{ currentRole }} />
    </OnboardingContainer>
  );
}
