"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProfileInfo } from "@/components/shared/ProfileInfo";

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
    <div className="max-w-3xl mx-auto">
      <div className="space-y-6">
        <div className="mb-6 flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-center">
            Welcome to That Sauce!
          </h1>
        </div>

        <div className="w-full max-w-md bg-secondary/10 dark:bg-secondary/20 rounded-lg p-4 shadow-sm border">
          <ProfileInfo
            creator={profileData}
            username={username}
            showButtons={false}
          />
        </div>

        <div className="w-full flex flex-col items-end justify-end">
          <Button asChild size="lg">
            <Link href="/profile">Add Portfolio</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
