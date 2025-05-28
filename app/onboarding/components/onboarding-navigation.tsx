"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// Define the onboarding flow steps in order
export const ONBOARDING_STEPS = [
  "role_selection",
  "organization_info", // Only for employers
  "profile_info",
  "social_links",
  "username_selection",
  "completed",
];

// Determine the previous step based on the current step and user role
export function getPreviousStep(
  currentStep: string,
  userRole?: string
): string {
  const isEmployer = userRole === "employer";

  switch (currentStep) {
    case "completed":
      return "username_selection";
    case "username_selection":
      return "social_links";
    case "social_links":
      return "profile_info";
    case "profile_info":
      return isEmployer ? "organization_info" : "role_selection";
    case "organization_info":
      return "role_selection";
    case "role_selection":
    default:
      return ""; // No previous step for role selection
  }
}

// Determine the next step based on the current step and user role
export function getNextStep(currentStep: string, userRole?: string): string {
  const isEmployer = userRole === "employer";

  switch (currentStep) {
    case "role_selection":
      return isEmployer ? "organization_info" : "profile_info";
    case "organization_info":
      return "profile_info";
    case "profile_info":
      return "social_links";
    case "social_links":
      return "username_selection";
    case "username_selection":
      return "completed";
    case "completed":
    default:
      return ""; // No next step for completed
  }
}

type OnboardingNavigationProps = {
  currentStep: string;
  userRole?: string;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  isNextDisabled?: boolean;
  nextButtonText?: string;
};

export function OnboardingNavigation({
  currentStep,
  userRole,
  onSubmit,
  isSubmitting = false,
  isNextDisabled = false,
  nextButtonText = "Continue",
}: OnboardingNavigationProps) {
  const router = useRouter();
  const previousStep = getPreviousStep(currentStep, userRole);

  const handleBackClick = () => {
    if (previousStep) {
      // Use direct navigation instead of the central routing to avoid potential loops
      window.location.href = `/onboarding/${previousStep}`;
    }
  };

  return (
    <div className="flex justify-end space-x-3 pt-4">
      {/* {previousStep && (
        <Button
          type="button"
          variant="outline"
          onClick={handleBackClick}
          disabled={isSubmitting}
        >
          Back
        </Button>
      )} */}
      <Button
        type={onSubmit ? "button" : "submit"}
        onClick={onSubmit ? onSubmit : undefined}
        disabled={isSubmitting || isNextDisabled}
      >
        {isSubmitting ? "Saving..." : nextButtonText}
      </Button>
    </div>
  );
}
