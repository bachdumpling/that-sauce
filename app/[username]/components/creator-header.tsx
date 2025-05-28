"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  Plus,
  Pencil,
  Share,
  MapPin,
  Upload,
  Camera,
} from "lucide-react";
import TiltedCard from "@/components/ui/tilted-card";
import { Creator } from "@/types";
import { usePathname } from "next/navigation";
import { SOCIAL_PLATFORMS } from "@/lib/constants/creator-options";
import { SocialIcon } from "@/components/ui/social-icon";
import LoadingAnimation from "@/components/LoadingAnimation";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { uploadCreatorBannerAction } from "@/actions/creator-actions";
import Image from "next/image";
import { useProfileEdit } from "@/contexts/ProfileEditContext";
import { ProfileInfo } from "@/components/shared/ProfileInfo";

interface CreatorHeaderProps {
  creator: Creator;
  username: string;
}

export function CreatorHeader({ creator, username }: CreatorHeaderProps) {
  const pathname = usePathname();
  const { openProfileDialog } = useProfileEdit();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Check if we're on a project detail page - matches pattern /username/work/project-id
  const isProjectDetailPage =
    pathname.match(new RegExp(`/${username}/work/[^/]+$`)) !== null;

  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setIsUploading(true);

    try {
      const result = await uploadCreatorBannerAction(username, file);

      if (result.success) {
        toast.success("Banner uploaded successfully");
        // No need to refresh page, Next.js will revalidate
      } else {
        throw new Error(result.message || "Failed to upload banner");
      }
    } catch (error) {
      console.error("Error uploading banner:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload banner"
      );
    } finally {
      setIsUploading(false);

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleBannerClick = () => {
    if (creator?.isOwner && !isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  if (isProjectDetailPage) {
    return null;
  }

  if (!creator) {
    return <LoadingAnimation />;
  }


  return (
    <div className="flex flex-row items-center justify-evenly gap-10 p-8">
      <ProfileInfo creator={creator} username={username} />

      <div
        className="items-center grid place-items-center aspect-[4/3] max-w-[600px] w-full justify-self-center relative"
        onMouseEnter={() => creator?.isOwner && setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleUploadBanner}
          className="hidden"
          accept="image/jpeg,image/png,image/gif,image/webp"
        />

        {/* Header Banner */}
        <TiltedCard
          imageSrc={
            creator?.banner_url || creator?.projects?.[0]?.images?.[0]?.url
          }
          altText="Header Banner"
          captionText={
            creator?.isOwner ? "Click to upload banner" : "Header Banner"
          }
          fullSize={true}
          rotateAmplitude={12}
          scaleOnHover={1.1}
          showMobileWarning={false}
          showTooltip={creator?.isOwner}
          displayOverlayContent={creator?.isOwner && isHovering}
          overlayContent={
            creator?.isOwner ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="bg-black/70 dark:bg-black/80 p-4 rounded-lg">
                  {isUploading ? (
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
                      <p className="text-white text-lg">Uploading...</p>
                    </div>
                  ) : (
                    <>
                      <Camera className="h-12 w-12 text-white mb-2 mx-auto" />
                      <p className="text-white text-xl font-semibold text-center">
                        Upload Banner
                      </p>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="gap-2 w-full h-full">
                <p className="text-white text-4xl font-bold">
                  {creator?.first_name} {creator?.last_name}
                </p>
                <p className="text-white text-xl font-bold">
                  {creator?.primary_role && creator?.primary_role[0]}
                </p>
              </div>
            )
          }
          className={creator?.isOwner && !isUploading ? "cursor-pointer" : ""}
          onClick={
            creator?.isOwner && !isUploading ? handleBannerClick : undefined
          }
        />
      </div>
    </div>
  );
}
