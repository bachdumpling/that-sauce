import { redirect } from "next/navigation";
import { getOnboardingStatusAction } from "@/actions/onboarding-actions";
import { ProfileForm } from "./profile-form";

export const metadata = {
  title: "Profile Information | Onboarding",
  description: "Complete your profile information",
};

export default async function ProfileInfoPage() {
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

  // Only redirect forward if the user hasn't completed ANY steps yet
  // This allows users to navigate back to this page from later steps
  if (onboardingStep === 0) {
    redirect("/onboarding/role_selection");
  }

  // Extract profile data from response
  const { profile, creator } = onboardingStatus;
  
  // Prepare initial form data
  const initialData = {
    profileData: {
      first_name: profile?.first_name || "",
      last_name: profile?.last_name || "",
    },
    creatorData: creator ? {
      bio: creator.bio || "",
      location: creator.location || "",
      primary_role: creator.primary_role || [],
      avatar_url: creator.avatar_url || "",
    } : null,
    userRole
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Build your profile
          </h1>
          <p className="text-muted-foreground mt-2">Tell us about yourself</p>
        </div>

        <ProfileForm initialData={initialData} />
      </div>
    </div>
  );
}
