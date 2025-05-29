"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProfileInfo } from "@/components/shared/ProfileInfo";
import { OnboardingContainer } from "../components/onboarding-container";

interface CompletedContentProps {
  profileData: any;
  username: string;
}

export function CompletedContent({
  profileData,
  username,
}: CompletedContentProps) {
  const userRole = profileData?.user_role || "creator";
  const displayName =
    profileData?.first_name && profileData?.last_name
      ? `${profileData.first_name} ${profileData.last_name}`
      : username;

  return (
    <OnboardingContainer
      title="Welcome to That Sauce!"
      description="Your profile is ready! Let's build your portfolio."
    >
      <div className="w-full max-w-md mx-auto bg-secondary/10 dark:bg-secondary/20 rounded-lg p-4 shadow-sm border">
        <ProfileInfo
          creator={profileData}
          username={username}
          showButtons={false}
        />
      </div>

      <div className="w-full flex flex-col items-center justify-center">
        <Button asChild size="lg">
          <Link href="/profile">Add Portfolio</Link>
        </Button>
      </div>
    </OnboardingContainer>
  );
}
