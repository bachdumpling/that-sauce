"use client";

import { cn } from "@/lib/utils";
import { OnboardingStep } from "@/types/onboarding";

type StepInfo = {
  label: string;
  description: string;
};

const STEPS: Record<OnboardingStep, StepInfo> = {
  role_selection: {
    label: "Choose Role",
    description: "Select your account type",
  },
  organization_info: {
    label: "Organization",
    description: "Add your company details",
  },
  profile_info: {
    label: "Profile",
    description: "Complete your profile",
  },
  social_links: {
    label: "Social Media",
    description: "Connect your accounts",
  },
  completed: {
    label: "Complete",
    description: "All done!",
  },
};

interface OnboardingProgressProps {
  currentStep: OnboardingStep;
  userRole?: "creator" | "employer";
}

export function OnboardingProgress({
  currentStep,
  userRole,
}: OnboardingProgressProps) {
  // Get all possible steps
  const allSteps = Object.keys(STEPS) as OnboardingStep[];

  // Filter steps based on user role
  const relevantSteps = allSteps.filter((step) => {
    // Skip organization step if role is creator
    if (step === "organization_info" && userRole === "creator") {
      return false;
    }
    return true;
  });

  return (
    <div className="pb-8">
      <div className="flex justify-between">
        {relevantSteps.map((step, index) => {
          // Skip "completed" in the progress bar
          if (step === "completed") return null;

          const stepInfo = STEPS[step];
          const isCurrent = step === currentStep;
          const isCompleted = getStepIndex(step) < getStepIndex(currentStep);

          return (
            <div key={step} className="flex flex-col items-center w-full">
              <div className="flex items-center w-full">
                <div
                  className={cn(
                    "relative flex items-center justify-center w-8 h-8 rounded-full text-sm border transition-colors",
                    isCurrent &&
                      "border-primary bg-primary text-primary-foreground",
                    isCompleted &&
                      "border-primary bg-primary text-primary-foreground",
                    !isCurrent &&
                      !isCompleted &&
                      "border-muted-foreground text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-check"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                {index < relevantSteps.length - 2 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5",
                      isCompleted ? "bg-primary" : "bg-muted-foreground/30"
                    )}
                  />
                )}
              </div>
              <div className="mt-2 text-center">
                <p
                  className={cn(
                    "text-sm font-medium",
                    isCurrent ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {stepInfo.label}
                </p>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {stepInfo.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Helper function to get the index of a step
function getStepIndex(step: OnboardingStep): number {
  const steps: OnboardingStep[] = [
    "role_selection",
    "organization_info",
    "profile_info",
    "social_links",
    "completed",
  ];
  return steps.indexOf(step);
}
