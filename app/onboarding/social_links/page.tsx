import { redirect } from "next/navigation";
import { getOnboardingStatusAction } from "@/actions/onboarding-actions";
import { SocialLinksForm } from "./social-links-form";

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
    <div className="max-w-3xl mx-auto">
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Social Media Links
          </h1>
          <p className="text-muted-foreground mt-2">
            Connect your social accounts
          </p>
        </div>

        <SocialLinksForm initialData={initialData} />
      </div>
    </div>
  );
}
