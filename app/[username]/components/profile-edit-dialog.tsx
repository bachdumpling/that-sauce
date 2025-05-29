import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogClose,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Mail,
  Briefcase,
  Share2,
  LogOut,
  User,
  Pencil,
  Loader2,
  Link as LinkIcon,
  X,
} from "lucide-react";
import {
  CREATOR_ROLES,
  SOCIAL_PLATFORMS,
} from "@/lib/constants/creator-options";
import { MultiSelect, Option } from "@/components/ui/multi-select";
import Link from "next/link";
import { SocialIcon } from "@/components/ui/social-icon";
import { toast } from "sonner";
import { uploadCreatorAvatarAction } from "@/actions/creator-actions";
import Image from "next/image";
import CreatorBadge from "./creator-badge";

// Map CREATOR_ROLES to the format required by MultiSelect
const ROLE_OPTIONS = CREATOR_ROLES.map((role) => ({
  value: role,
  label: role,
}));

// Create platform patterns for link detection
const PLATFORM_PATTERNS: Record<string, RegExp> = {};
const PLATFORM_NAMES: Record<string, string> = {};

// Build patterns and names from SOCIAL_PLATFORMS
SOCIAL_PLATFORMS.forEach((platform) => {
  PLATFORM_NAMES[platform.id] = platform.name;

  // Create pattern from baseUrl if available
  if (platform.baseUrl && platform.id !== "website") {
    const domain = platform.baseUrl
      .replace(/https?:\/\//, "")
      .replace(/\/$/, "");
    PLATFORM_PATTERNS[platform.id] = new RegExp(
      `${domain.replace(".", "\\.")}\\/([^/?]+)`,
      "i"
    );
  }

  // Use existing pattern if provided
  if (platform.pattern) {
    PLATFORM_PATTERNS[platform.id] = platform.pattern;
  }
});

// Add some additional patterns for common variations
PLATFORM_PATTERNS.twitter = /(?:twitter\.com|x\.com)\/([^/?]+)/i;
PLATFORM_PATTERNS.medium = /medium\.com\/@?([^/?]+)/i;
PLATFORM_PATTERNS.facebook = /facebook\.com\/([^/?]+)/i;
PLATFORM_PATTERNS.tiktok = /tiktok\.com\/@?([^/?]+)/i;

// Type for detected social media link
type DetectedLink = {
  platform: string;
  username: string;
  url: string;
};

interface ProfileEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  profileForm: any;
  handleFormChange: (e: any) => void;
  handlePrimaryRoleChange: (roles: string[]) => void;
  handleProfileUpdate: () => void;
  isSubmitting: boolean;
  initialTab?: string;
}

export default function ProfileEditDialog({
  isOpen,
  onClose,
  profileForm,
  handleFormChange,
  handlePrimaryRoleChange,
  handleProfileUpdate,
  isSubmitting,
  initialTab = "profile",
}: ProfileEditDialogProps) {
  const bioLength = profileForm.bio?.length || 0;
  const [activeTab, setActiveTab] = useState(initialTab);
  const [roleSelectError, setRoleSelectError] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [newLink, setNewLink] = useState("");
  const [detectedLinks, setDetectedLinks] = useState<DetectedLink[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize detected links from profileForm.social_links
  React.useEffect(() => {
    if (profileForm.social_links) {
      const links: DetectedLink[] = Object.entries(profileForm.social_links)
        .filter((entry): entry is [string, string] => {
          const [platform, url] = entry;
          return (
            typeof url === "string" &&
            url.trim() !== "" &&
            platform !== "website"
          );
        })
        .map(([platform, url]) => {
          let username = url;

          // Extract username from URL if it's a full URL
          if (url.includes("://")) {
            const match = PLATFORM_PATTERNS[platform]?.exec(url);
            if (match && match[1]) {
              username = match[1];
            }
          }

          return {
            platform,
            username,
            url,
          };
        });

      setDetectedLinks(links);
    }
  }, [profileForm.social_links]);

  // Function to detect platform from URL
  const detectPlatform = (url: string): DetectedLink | null => {
    if (!url) return null;

    // Ensure URL has protocol
    let fullUrl = url;
    if (!url.match(/^https?:\/\//i)) {
      fullUrl = `https://${url}`;
    }

    try {
      const urlObj = new URL(fullUrl);
      const hostname = urlObj.hostname.toLowerCase();

      for (const [platform, pattern] of Object.entries(PLATFORM_PATTERNS)) {
        const match = pattern.exec(fullUrl);
        if (match && match[1]) {
          return {
            platform,
            username: match[1],
            url: fullUrl,
          };
        }
      }

      // If no specific pattern matches but domain contains a platform name
      for (const platform of Object.keys(PLATFORM_PATTERNS)) {
        if (hostname.includes(platform.toLowerCase())) {
          return {
            platform,
            username: hostname.split(".")[0],
            url: fullUrl,
          };
        }
      }
    } catch (e) {
      console.error("Invalid URL:", e);
    }

    return null;
  };

  // Handle adding a new link
  const handleAddLink = () => {
    if (!newLink) return;

    const detected = detectPlatform(newLink);
    if (detected) {
      // Check if this platform already exists
      const existingIndex = detectedLinks.findIndex(
        (l) => l.platform === detected.platform
      );

      if (existingIndex >= 0) {
        // Replace existing link for this platform
        const updatedLinks = [...detectedLinks];
        updatedLinks[existingIndex] = detected;
        setDetectedLinks(updatedLinks);

        // Update profileForm
        const updatedSocialLinks = { ...profileForm.social_links };
        updatedSocialLinks[detected.platform] = detected.url;
        handleFormChange({
          target: {
            name: "social_links",
            value: updatedSocialLinks,
          },
        });

        toast.success(
          `Updated your ${PLATFORM_NAMES[detected.platform]} link.`
        );
      } else {
        // Add new link
        const updatedLinks = [...detectedLinks, detected];
        setDetectedLinks(updatedLinks);

        // Update profileForm
        const updatedSocialLinks = { ...profileForm.social_links };
        updatedSocialLinks[detected.platform] = detected.url;
        handleFormChange({
          target: {
            name: "social_links",
            value: updatedSocialLinks,
          },
        });

        toast.success(`Added your ${PLATFORM_NAMES[detected.platform]} link.`);
      }

      setNewLink("");
    } else {
      toast.error(
        "We couldn't identify which social platform this link belongs to."
      );
    }
  };

  // Remove a link
  const removeLink = (index: number) => {
    const linkToRemove = detectedLinks[index];
    const updatedLinks = detectedLinks.filter((_, i) => i !== index);
    setDetectedLinks(updatedLinks);

    // Update profileForm
    const updatedSocialLinks = { ...profileForm.social_links };
    delete updatedSocialLinks[linkToRemove.platform];
    handleFormChange({
      target: {
        name: "social_links",
        value: updatedSocialLinks,
      },
    });
  };

  // Wrapper for handlePrimaryRoleChange to add validation
  const handleRoleChange = (selectedRoles: string[]) => {
    if (selectedRoles.length > 3) {
      setRoleSelectError("You can select a maximum of 3 roles");
      return;
    }

    setRoleSelectError("");
    handlePrimaryRoleChange(selectedRoles);
  };

  // Wrapper for handleProfileUpdate to clear errors before submission
  const handleSubmit = () => {
    setRoleSelectError("");
    handleProfileUpdate();
  };

  // Social links handler - creates controlled inputs for all social platforms
  const handleSocialLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFormChange(e);
  };

  // Avatar upload handler
  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setIsUploadingAvatar(true);

    try {
      const result = await uploadCreatorAvatarAction(
        profileForm.username,
        file
      );

      if (result.success && result.data) {
        // Update the form with the new avatar URL
        handleFormChange({
          target: {
            name: "avatar_url",
            value: result.data.avatar_url,
          },
        });

        toast.success("Profile picture updated successfully");
      } else {
        throw new Error(result.message || "Failed to upload profile picture");
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to upload profile picture"
      );
    } finally {
      setIsUploadingAvatar(false);

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Update activeTab when initialTab changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full mx-2 sm:mx-4 p-0 overflow-hidden max-h-[85vh] sm:max-h-[80vh]">
        <DialogHeader className="sr-only">
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Edit your profile information and settings
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col md:flex-row h-[70vh] sm:h-[60vh] overflow-hidden">
          {/* Mobile Navigation - Top tabs */}
          <div className="md:hidden border-b bg-muted/30 p-4">
            <div className="flex space-x-1 overflow-x-auto">
              <Button
                variant="ghost"
                size="sm"
                className={`flex-shrink-0 ${
                  activeTab === "profile"
                    ? "bg-background shadow-sm border"
                    : "hover:bg-background/50"
                }`}
                onClick={() => setActiveTab("profile")}
              >
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className={`flex-shrink-0 ${
                  activeTab === "social"
                    ? "bg-background shadow-sm border"
                    : "hover:bg-background/50"
                }`}
                onClick={() => setActiveTab("social")}
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                Social
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className={`flex-shrink-0 ${
                  activeTab === "share"
                    ? "bg-background shadow-sm border"
                    : "hover:bg-background/50"
                }`}
                onClick={() => setActiveTab("share")}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Badge
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className={`flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10 ${
                  activeTab === "logout" ? "bg-destructive/10" : ""
                }`}
                onClick={() => setActiveTab("logout")}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          {/* Desktop Left sidebar - Navigation */}
          <div className="hidden md:flex w-64 min-w-64 border-r bg-muted/30 flex-col">
            {/* User Avatar Section */}
            <div className="p-6 border-b">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleAvatarChange}
                  />
                  <div className="h-20 w-20 rounded-full bg-muted overflow-hidden ring-2 ring-border">
                    {profileForm.avatar_url ? (
                      <Image
                        src={profileForm.avatar_url}
                        alt="Profile"
                        width={80}
                        height={80}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-primary/10">
                        <User className="h-8 w-8 text-primary/60" />
                      </div>
                    )}
                  </div>
                  <button
                    className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shadow-sm"
                    onClick={handleAvatarClick}
                    disabled={isUploadingAvatar}
                    type="button"
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Pencil className="h-3 w-3" />
                    )}
                  </button>
                </div>
                <div className="text-center">
                  <p className="font-medium text-sm">
                    {profileForm.first_name || profileForm.last_name
                      ? `${profileForm.first_name || ""} ${profileForm.last_name || ""}`.trim()
                      : profileForm.username}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    @{profileForm.username}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex-1 p-4 space-y-2">
              <Button
                variant="ghost"
                className={`w-full justify-start h-11 ${
                  activeTab === "profile"
                    ? "bg-background shadow-sm border"
                    : "hover:bg-background/50"
                }`}
                onClick={() => setActiveTab("profile")}
              >
                <User className="h-4 w-4 mr-3" />
                Profile Info
              </Button>

              <Button
                variant="ghost"
                className={`w-full justify-start h-11 ${
                  activeTab === "social"
                    ? "bg-background shadow-sm border"
                    : "hover:bg-background/50"
                }`}
                onClick={() => setActiveTab("social")}
              >
                <LinkIcon className="h-4 w-4 mr-3" />
                Social Links
              </Button>

              <Button
                variant="ghost"
                className={`w-full justify-start h-11 ${
                  activeTab === "share"
                    ? "bg-background shadow-sm border"
                    : "hover:bg-background/50"
                }`}
                onClick={() => setActiveTab("share")}
              >
                <Share2 className="h-4 w-4 mr-3" />
                Share Badge
              </Button>

              <div className="pt-4 border-t">
                <Button
                  variant="ghost"
                  className={`w-full justify-start h-11 text-destructive hover:text-destructive hover:bg-destructive/10 ${
                    activeTab === "logout" ? "bg-destructive/10" : ""
                  }`}
                  onClick={() => setActiveTab("logout")}
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Log Out
                </Button>
              </div>
            </div>
          </div>

          {/* Right content area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-hidden overflow-x-hidden">
              <div className="p-4 sm:p-6">
                {activeTab === "profile" && (
                  <div className="space-y-6 md:space-y-0 max-w-2xl mx-auto">
                    {/* Mobile Avatar Section */}
                    <div className="md:hidden flex flex-col items-center space-y-4 pb-6 border-b">
                      <div className="relative">
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          onChange={handleAvatarChange}
                        />
                        <div className="h-20 w-20 rounded-full bg-muted overflow-hidden ring-2 ring-border">
                          {profileForm.avatar_url ? (
                            <Image
                              src={profileForm.avatar_url}
                              alt="Profile"
                              width={80}
                              height={80}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-primary/10">
                              <User className="h-8 w-8 text-primary/60" />
                            </div>
                          )}
                        </div>
                        <button
                          className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shadow-sm"
                          onClick={handleAvatarClick}
                          disabled={isUploadingAvatar}
                          type="button"
                        >
                          {isUploadingAvatar ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Pencil className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-sm">
                          {profileForm.first_name || profileForm.last_name
                            ? `${profileForm.first_name || ""} ${profileForm.last_name || ""}`.trim()
                            : profileForm.username}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          @{profileForm.username}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h2 className="text-xl sm:text-2xl font-semibold">
                        Profile Information
                      </h2>

                      <Card className="p-4">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <div className="relative">
                              <Input
                                id="username"
                                name="username"
                                value={profileForm.username}
                                className="pr-10"
                                placeholder="@username"
                                disabled
                              />
                              <Link href={`/edit-username`}>
                                <button
                                  type="button"
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                              </Link>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="first_name">First name</Label>
                              <Input
                                id="first_name"
                                name="first_name"
                                value={profileForm.first_name}
                                onChange={handleFormChange}
                                placeholder="First name"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="last_name">Last name</Label>
                              <Input
                                id="last_name"
                                name="last_name"
                                value={profileForm.last_name}
                                onChange={handleFormChange}
                                placeholder="Last name"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <div className="relative">
                              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <Input
                                id="location"
                                name="location"
                                value={profileForm.location}
                                onChange={handleFormChange}
                                className="pl-10"
                                placeholder="e.g. San Francisco, CA"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="work_email">Work Email</Label>
                            <div className="relative">
                              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <Input
                                id="work_email"
                                name="work_email"
                                type="email"
                                value={profileForm.work_email}
                                onChange={handleFormChange}
                                className="pl-10"
                                placeholder="your@workemail.com"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <Label htmlFor="primary_role">
                                Primary Roles
                              </Label>
                              {roleSelectError ? (
                                <p className="text-xs text-destructive">
                                  {roleSelectError}
                                </p>
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  Select up to 3 roles
                                </p>
                              )}
                            </div>
                            <MultiSelect
                              className="h-fit"
                              options={ROLE_OPTIONS}
                              selected={profileForm.primary_role}
                              onChange={handleRoleChange}
                              placeholder="Select your roles"
                            />
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <Label htmlFor="bio">Bio</Label>
                              <span className="text-xs text-muted-foreground">
                                {bioLength}/68
                              </span>
                            </div>
                            <Textarea
                              id="bio"
                              name="bio"
                              value={profileForm.bio}
                              onChange={handleFormChange}
                              maxLength={68}
                              rows={3}
                              placeholder="Tell us about yourself..."
                              className="resize-none"
                            />
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>
                )}

                {activeTab === "social" && (
                  <div className="space-y-6 max-w-2xl mx-auto">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-semibold">
                        Social Links
                      </h2>
                    </div>

                    <Card className="p-4">
                      <div className="space-y-4">
                        {/* Website field */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="website"
                            className="flex items-center gap-2"
                          >
                            <SocialIcon
                              platform="website"
                              className="h-4 w-4"
                            />
                            Website
                          </Label>
                          <Input
                            id="website"
                            name="social_website"
                            value={profileForm.social_links?.website || ""}
                            onChange={handleSocialLinkChange}
                            placeholder="example.com"
                          />
                        </div>

                        <Separator />

                        {/* Added links */}
                        {detectedLinks.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium">
                              Your Social Links
                            </h4>
                            <div className="space-y-2">
                              {detectedLinks.map((link, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 bg-muted rounded-md"
                                >
                                  <div className="flex items-center gap-3">
                                    <SocialIcon
                                      platform={link.platform}
                                      className="h-5 w-5"
                                    />
                                    <div>
                                      <div className="font-medium">
                                        {PLATFORM_NAMES[link.platform] ||
                                          link.platform}
                                      </div>
                                      <div className="text-sm text-muted-foreground truncate max-w-[200px] md:max-w-[300px]">
                                        {link.username}
                                      </div>
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeLink(index)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Add new link */}
                        <div className="space-y-2">
                          <div className="flex space-x-2">
                            <Input
                              placeholder="Paste your social media link"
                              value={newLink}
                              onChange={(e) => setNewLink(e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              onClick={handleAddLink}
                              disabled={!newLink}
                            >
                              Add Link
                            </Button>
                          </div>
                        </div>

                        {/* Show supported platforms */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">
                            Supported Platforms
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {SOCIAL_PLATFORMS.map((platform) => (
                              <div
                                key={platform.id}
                                className="flex items-center gap-2 px-3 py-1 bg-secondary rounded-full text-sm"
                              >
                                <SocialIcon
                                  platform={platform.id}
                                  className="h-3 w-3"
                                />
                                {platform.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}

                {activeTab === "share" && (
                  <div className="flex flex-col h-full">
                    <div className="text-center mb-8">
                      <h2 className="text-xl sm:text-2xl font-semibold">
                        Share Your Badge
                      </h2>
                    </div>

                    <Card className="p-4">
                      <div className="flex-1 flex justify-center items-center">
                        <div className="w-full max-w-md">
                          <CreatorBadge creator={profileForm} />
                        </div>
                      </div>
                    </Card>
                  </div>
                )}

                {activeTab === "logout" && (
                  <div className="flex flex-col items-center justify-center text-center py-8 sm:py-16 max-w-md mx-auto">
                    <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
                      <LogOut className="h-8 w-8 text-destructive" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-2">
                      Log Out
                    </h3>

                    <Card className="p-4">
                      <div className="space-y-4">
                        <p className="text-muted-foreground text-sm sm:text-base">
                          Are you sure you want to log out? You'll need to sign
                          in again to access your account.
                        </p>
                        <Button
                          variant="destructive"
                          className="w-full max-w-xs"
                        >
                          Log Out
                        </Button>
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            </div>

            {/* Footer with action buttons */}
            {(activeTab === "profile" || activeTab === "social") && (
              <div className="border-t bg-background p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-end gap-3">
                  <DialogClose asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
