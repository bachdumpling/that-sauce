import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Plus, Pencil, Share, MapPin } from "lucide-react";
import { Creator } from "@/types";
import { SOCIAL_PLATFORMS } from "@/lib/constants/creator-options";
import { SocialIcon } from "@/components/ui/social-icon";
import Image from "next/image";
import { useProfileEdit } from "@/contexts/ProfileEditContext";

interface ProfileInfoProps {
  creator: Creator;
  username: string;
  showButtons?: boolean;
}

export function ProfileInfo({
  creator,
  username,
  showButtons = true,
}: ProfileInfoProps) {
  const { openProfileDialog } = useProfileEdit();

  return (
    <div className="p-4 flex-col space-y-10">
      <div className="flex flex-row justify-start items-center gap-4">
        <div className="relative w-20 h-20 bg-gray-200 rounded-full overflow-hidden">
          {/* Placeholder avatar */}
          <div className="h-full w-full bg-gray-300 flex items-center justify-center">
            {creator?.avatar_url ? (
              <Image
                src={creator.avatar_url}
                alt="Avatar"
                fill
                className="object-cover"
              />
            ) : (
              <span className="text-gray-600 font-bold text-3xl">
                {creator?.username
                  ? creator.username.charAt(0).toUpperCase()
                  : "C"}
              </span>
            )}
          </div>
        </div>
        {/* Creator name and username */}
        <div>
          <div className="flex flex-row justify-between">
            <h2 className="text-xl md:text-3xl font-medium">
              {creator?.first_name && creator?.last_name
                ? `${creator?.first_name} ${creator?.last_name}`
                : creator?.username
                  ? creator?.username
                  : "Creator"}
            </h2>
          </div>
          <Badge
            variant="outline"
            className="px-3 py-1 text-sm border-2 border-primary text-primary"
          >
            @{username}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-x-20 gap-y-10">
        {/* BIO Section - takes 2/3 width */}
        <div className="col-span-2">
          <h3 className="text-sm font-normal uppercase text-primary mb-2">
            BIO
          </h3>
          <p className="text-base">{creator?.bio || "No bio available"}</p>
        </div>

        {/* LOCATION Section - takes 1/3 width */}
        <div className="col-span-2">
          <h3 className="text-sm font-normal uppercase text-primary mb-2">
            LOCATION
          </h3>
          {creator?.location ? (
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              <span>{creator.location}</span>
            </div>
          ) : (
            <p className="text-base">No location specified</p>
          )}
        </div>

        {/* ROLES Section - takes 2/3 width */}
        <div className="col-span-2">
          <h3 className="text-sm font-normal uppercase text-primary mb-2">
            ROLES
          </h3>
          {creator?.primary_role && creator?.primary_role?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {creator.primary_role.map((role) => (
                <Badge
                  key={role}
                  variant="secondary"
                  className="px-4 py-2 font-medium rounded-full"
                >
                  {typeof role === "string" ? role.replace(/-/g, " ") : role}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-base">No roles specified</p>
          )}
        </div>

        {/* LINKS Section - takes 1/3 width */}
        <div className="col-span-2">
          <h3 className="text-sm font-normal uppercase text-primary mb-2">
            LINKS
          </h3>
          {creator?.social_links &&
          Object.entries(creator.social_links).length > 0 ? (
            <div className="flex gap-4">
              {Object.entries(creator.social_links)
                .filter(([platform]) =>
                  SOCIAL_PLATFORMS.some((p) => p.id === platform)
                )
                .map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full flex items-center justify-center border hover:bg-secondary/50"
                  >
                    <span className="sr-only">{platform}</span>
                    <SocialIcon platform={platform} className="h-4 w-4" />
                  </a>
                ))}
            </div>
          ) : (
            <p className="text-base">No links available</p>
          )}
        </div>
      </div>

      {showButtons &&
        (creator?.isOwner ? (
          <div className="flex flex-row gap-4">
            <Button
              variant="default"
              className="p-6 rounded-full"
              onClick={() => {
                openProfileDialog(username);
              }}
            >
              <Pencil className="h-4 w-4 mr-2 mb-1" />
              Edit profile
            </Button>
            <Button
              variant="outline"
              className="p-6 rounded-full"
              onClick={() => {
                openProfileDialog(username, "share");
              }}
            >
              <Share className="h-4 w-4 mr-2 mb-1" />
              Share profile
            </Button>
          </div>
        ) : (
          <div className="flex flex-row gap-4">
            <Button variant="default" className="p-6 rounded-full">
              <MessageCircle className="h-4 w-4 mr-2 mb-1" />
              Get in touch
            </Button>
            <Button variant="outline" className="p-6 rounded-full">
              <Plus className="h-4 w-4 mr-2 mb-1" />
              Add to projects
            </Button>
          </div>
        ))}
    </div>
  );
}
