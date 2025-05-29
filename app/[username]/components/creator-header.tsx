"use client";

import { Upload, Camera } from "lucide-react";
import { Creator } from "@/types";
import { usePathname } from "next/navigation";
import LoadingAnimation from "@/components/LoadingAnimation";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { uploadCreatorBannerAction } from "@/actions/creator-actions";
import Image from "next/image";
import { ProfileInfo } from "@/components/shared/ProfileInfo";

interface CreatorHeaderProps {
  creator: Creator;
  username: string;
}

export function CreatorHeader({ creator, username }: CreatorHeaderProps) {
  const pathname = usePathname();
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

  const hasImage =
    creator?.banner_url || creator?.projects?.[0]?.images?.[0]?.url;

  return (
    <div className="flex flex-row items-center justify-evenly p-20">
      <ProfileInfo creator={creator} username={username} />

      <div className="items-center grid place-items-center aspect-[4/3] max-w-[600px] w-full justify-self-center relative">
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleUploadBanner}
          className="hidden"
          accept="image/jpeg,image/png,image/gif,image/webp"
        />

        {/* Header Banner */}
        <div
          className={`relative w-full h-full rounded-[15px] overflow-hidden border border-gray-200 shadow-lg group transition-all duration-300 ${
            creator?.isOwner && !isUploading
              ? "cursor-pointer hover:shadow-2xl hover:scale-[1.02]"
              : ""
          }`}
          onMouseEnter={() => creator?.isOwner && setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onClick={
            creator?.isOwner && !isUploading ? handleBannerClick : undefined
          }
        >
          {/* Background Image or Empty State */}
          {hasImage ? (
            <Image
              src={
                creator?.banner_url ||
                creator?.projects?.[0]?.images?.[0]?.url ||
                ""
              }
              alt="Header Banner"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 600px"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 flex items-center justify-center relative">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3Ccircle cx='37' cy='37' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  }}
                />
              </div>

              <div className="text-center space-y-4 z-10">
                {creator?.isOwner ? (
                  <>
                    <div className="w-20 h-20 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mx-auto">
                      <Upload className="h-10 w-10 text-primary/60" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold text-foreground mb-2">
                        Add a banner image
                      </h3>
                      <p className="text-muted-foreground max-w-sm">
                        Upload a banner to make your portfolio stand out and
                        showcase your creative style.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
                      <Camera className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold text-foreground mb-2">
                        {creator?.first_name || creator?.username}'s Portfolio
                      </h3>
                      <p className="text-muted-foreground">
                        {(creator?.primary_role && creator?.primary_role[0]) ||
                          "Creative Professional"}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Overlay for owner interactions */}
          {creator?.isOwner && (isHovering || isUploading) && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300 flex items-center justify-center z-10">
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-2xl">
                {isUploading ? (
                  <div className="flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/30 border-t-white mb-3"></div>
                    <p className="text-white text-lg font-medium">
                      Uploading...
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200">
                      <Camera className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-white text-xl font-semibold text-center">
                      {hasImage ? "Change Banner" : "Upload Banner"}
                    </p>
                    <p className="text-white/80 text-sm mt-1">
                      {hasImage
                        ? "Click to update your banner image"
                        : "Add a banner to showcase your work"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Text overlay for non-owner when image exists */}
          {!creator?.isOwner && hasImage && (
            <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-transparent">
              <div className="absolute bottom-8 left-8">
                <p className="text-white text-4xl font-bold drop-shadow-lg">
                  {creator?.first_name} {creator?.last_name}
                </p>
                <p className="text-white/90 text-xl font-medium drop-shadow-md">
                  {creator?.primary_role && creator?.primary_role[0]}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
