import { redirect } from "next/navigation";
import { getOnboardingStatusAction } from "@/actions/onboarding-actions";
import { OnboardingPreviewWrapper } from "./components/onboarding-preview-wrapper";
import Image from "next/image";
import { Suspense } from "react";
import OnboardingLoading from "./loading";
import Aurora from "@/components/Lanyard/AuroraBg";

// Sauce colors
const SAUCE_RED = "#e21313";
const SAUCE_YELLOW = "#ff9d00";

export const metadata = {
  title: "Onboarding | That Sauce",
  description: "Complete your profile setup to get started with That Sauce",
};

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if the user has completed onboarding
  const response = await getOnboardingStatusAction();
  const onboardingStatus = response.success ? response.data : null;

  return (
    <Suspense fallback={<OnboardingLoading />}>
      <div className="absolute inset-0 bg-background rounded-lg shadow-sm">
        <OnboardingPreviewWrapper
          initialProfileData={onboardingStatus?.profile || {}}
        >
          <Image
            src="/thatsaucelogoheader-black.svg"
            alt="Onboarding Preview"
            width={300}
            height={300}
            className="absolute top-0 left-0 dark:invert"
            priority
          />
          <div className="grid grid-cols-2 h-full">
            {/* Fixed-width content area */}
            <div className="flex flex-col justify-center items-center p-8 overflow-y-auto">
              <div className="w-full max-w-2xl">{children}</div>
            </div>
            {/* This div has a designated slot for the preview component */}
            <div className="relative overflow-hidden bg-that-sauce-black m-6 rounded-[16px] shadow-lg preview-container" />
          </div>
        </OnboardingPreviewWrapper>
      </div>
    </Suspense>
  );
}
