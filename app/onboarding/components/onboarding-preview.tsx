"use client";

import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { useState, useEffect, memo, useMemo } from "react";
import Image from "next/image";
import BadgeLanyard from "@/components/Lanyard/BadgeLanyard";
import Aurora from "@/components/Lanyard/AuroraBg";
import Waves from "@/components/Lanyard/WavesBg";
// Sauce colors
const SAUCE_RED = "#e21313";
const SAUCE_YELLOW = "#ff9d00";
const SAUCE_GREEN = "#1fe55c";

// Dynamically import the CreatorBadge component to avoid SSR issues
const CreatorBadge = dynamic(
  () => import("@/app/[username]/components/creator-badge"),
  { ssr: false }
);

// Steps that should show the badge
const PREVIEW_STEPS = [
  "profile_info",
  "social_links",
  "username_selection",
  "completed",
];

// Create a memoized component to reduce unnecessary re-renders
const Badge = memo(({ creator }: { creator: any }) => {
  return <CreatorBadge creator={creator} />;
});

// Create separate components for the different backgrounds to avoid hook inconsistency
const CompletedBackground = () => (
  <Aurora colorStops={[SAUCE_RED, SAUCE_YELLOW]} amplitude={0.9} blend={0.7} />
);

const DefaultBackground = () => (
  <Waves
    lineColor="#1fe55c"
    waveSpeedX={0.02}
    waveSpeedY={0.01}
    waveAmpX={40}
    waveAmpY={20}
    friction={0.9}
    tension={0.01}
    maxCursorMove={120}
    xGap={12}
    yGap={36}
  />
);

export function OnboardingPreview({ profileData }) {
  const pathname = usePathname();
  const [shouldShowPreview, setShouldShowPreview] = useState(false);
  const [currentStep, setCurrentStep] = useState("");

  // Extract the current step from the URL - only recalculate when pathname changes
  useEffect(() => {
    const path = pathname.split("/").pop() || "";
    const showPreview = PREVIEW_STEPS.includes(path);

    setCurrentStep(path);

    // Only update state if value is different
    if (showPreview !== shouldShowPreview) {
      setShouldShowPreview(showPreview);
    }
  }, [pathname, shouldShowPreview]);

  const emptyPreview = useMemo(
    () => (
      <div className="flex items-center justify-center h-full w-full relative">
        <Image
          src="/onboarding.jpg"
          alt="Onboarding Preview"
          fill
          className="object-cover opacity-90 dark:opacity-70"
        />
      </div>
    ),
    []
  );

  // Move the conditional logic outside the render function to avoid hook issues
  const isCompleted = currentStep === "completed";

  const fullPreview = useMemo(
    () => (
      <div className="flex flex-col items-center justify-center h-full relative">
        <div className="absolute inset-0 z-10">
          {isCompleted ? <CompletedBackground /> : <DefaultBackground />}
        </div>
        <div className="relative h-full w-full z-20 flex items-center justify-center">
          {isCompleted ? (
            <BadgeLanyard creator={profileData} />
          ) : (
            <Badge creator={profileData} />
          )}
        </div>
      </div>
    ),
    [profileData, isCompleted]
  );

  return (
    <div className="h-full w-full">
      {shouldShowPreview ? fullPreview : emptyPreview}
    </div>
  );
}
