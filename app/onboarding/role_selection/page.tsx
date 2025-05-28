import { getOnboardingStatusAction } from "@/actions/onboarding-actions";
import { RoleSelectionForm } from "./role-selection-form";

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
    <div className="max-w-3xl mx-auto">
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Choose Your Role
          </h1>
          <p className="text-muted-foreground mt-2">
            Select whether you're a creator or looking to hire
          </p>
        </div>

        <RoleSelectionForm initialData={{ currentRole }} />
      </div>
    </div>
  );
}
