import { redirect } from "next/navigation";
import { getOnboardingStatusAction } from "@/actions/onboarding-actions";
import { OrganizationForm } from "./organization-form";
import { OnboardingContainer } from "../components/onboarding-container";

export const metadata = {
  title: "Organization Information | Onboarding",
  description: "Complete your organization information",
};

export default async function OrganizationInfoPage() {
  const response = await getOnboardingStatusAction();
  const onboardingStatus = response.success ? response.data : null;

  const userRole =
    onboardingStatus?.user_role || onboardingStatus?.profile?.user_role;

  // If user role is not set, redirect to role selection
  if (!onboardingStatus || !userRole) {
    redirect("/onboarding/role_selection");
  }

  // If user is not an employer, redirect to appropriate step
  if (userRole !== "employer") {
    redirect("/onboarding/profile_info");
  }

  // If organization is already set, redirect to profile info
  if (onboardingStatus?.profile?.organization_id) {
    redirect("/onboarding/profile_info");
  }

  // Extract organization data
  const organizationData = onboardingStatus?.profile?.organization || null;
  const initialData = {
    organization: organizationData
      ? {
          name: organizationData.name || "",
          website: organizationData.website || "",
        }
      : null,
    userRole,
  };

  return (
    <OnboardingContainer
      title="Organization Information"
      description="Tell us about your organization or choose to hire as an individual"
    >
      <OrganizationForm initialData={initialData} />
    </OnboardingContainer>
  );
}
