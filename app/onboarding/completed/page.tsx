import { CompletedContent } from "./completed-content";
import { getOnboardingStatusAction } from "@/actions/onboarding-actions";

export const metadata = {
  title: "Onboarding Complete | That Sauce",
  description: "Your profile is all set up and ready to go",
};

export default async function CompletedPage() {
  // Fetch creator data
  const response = await getOnboardingStatusAction();
  const onboardingStatus = response.success ? response.data : null;

  // Get username and combine profile and creator data
  const username =
    onboardingStatus?.profile?.username ||
    onboardingStatus?.creator?.username ||
    "";
  const profileData = {
    ...onboardingStatus?.profile,
    ...onboardingStatus?.creator,
    username,
  };

  return <CompletedContent profileData={profileData} username={username} />;
}
