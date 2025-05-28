"use client";

import React, { memo, useState, useEffect } from "react";

import {
  ProfilePreviewProvider,
  useProfilePreview,
} from "./profile-preview-context";
import { OnboardingPreview } from "./onboarding-preview";

// Component to place the preview in the right column - memoized to prevent unnecessary re-renders
const PreviewPlacement = memo(function PreviewPlacement() {
  const { profileData } = useProfilePreview();
  return <OnboardingPreview profileData={profileData} />;
});

// Wrapper component for the onboarding layout
export function OnboardingPreviewWrapper({
  children,
  initialProfileData,
}: {
  children: React.ReactNode;
  initialProfileData: any;
}) {
  const [isReady, setIsReady] = useState(false);

  // Use effect to ensure hydration is complete before showing content
  useEffect(() => {
    setIsReady(true);
  }, []);

  // Use React's cloneElement to modify DOM after render
  const enhancedChildren = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;

    // Look for the preview-container class and inject the PreviewPlacement there
    if (child.props.className?.includes("preview-container")) {
      return React.cloneElement(child, {
        children: <PreviewPlacement />,
      });
    }

    // Recursively check children
    if (child.props.children) {
      return React.cloneElement(child, {
        children: React.Children.map(child.props.children, (nestedChild) => {
          if (!React.isValidElement(nestedChild)) return nestedChild;

          if (nestedChild.props.className?.includes("preview-container")) {
            return React.cloneElement(nestedChild, {
              children: <PreviewPlacement />,
            });
          }

          return nestedChild;
        }),
      });
    }

    return child;
  });

  return (
    <ProfilePreviewProvider initialProfileData={initialProfileData}>
      <div className={`h-full transition-opacity duration-300 ${isReady ? 'opacity-100' : 'opacity-0'}`}>
        {enhancedChildren}
      </div>
    </ProfilePreviewProvider>
  );
}
