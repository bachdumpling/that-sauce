"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  setSocialLinksAction,
  getOnboardingStatusAction,
} from "@/actions/onboarding-actions";
import { checkUsernameAvailabilityAction } from "@/actions/creator-actions";
import { SocialLinks } from "@/types/onboarding";
import { SOCIAL_PLATFORMS } from "@/lib/constants/creator-options";
import { SocialIcon } from "@/components/ui/social-icon";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { X, Globe } from "lucide-react";
import { useProfilePreview } from "../components/profile-preview-context";
import { OnboardingNavigation } from "../components/onboarding-navigation";

// Create platform patterns from SOCIAL_PLATFORMS
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

// Add names for additional platforms
PLATFORM_NAMES.twitter = "Twitter";
PLATFORM_NAMES.medium = "Medium";
PLATFORM_NAMES.facebook = "Facebook";
PLATFORM_NAMES.tiktok = "TikTok";

// Type for detected social media link
type DetectedLink = {
  platform: string;
  username: string;
  url: string;
};

// Form schema for react-hook-form
type FormValues = {
  website: string;
};

interface SocialLinksFormProps {
  initialData?: {
    socialLinks: Record<string, string>;
    userRole: string;
  };
}

export function SocialLinksForm({ initialData }: SocialLinksFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newLink, setNewLink] = useState("");
  const [detectedLinks, setDetectedLinks] = useState<DetectedLink[]>([]);
  const { updateProfileData, profileData, refreshData } = useProfilePreview();

  // Initialize form for website field
  const form = useForm<FormValues>({
    defaultValues: {
      // If website exists in initial social links, use it
      website: initialData?.socialLinks?.website || "",
    },
  });

  const website = form.watch("website");

  // Process initial social links data from server
  useEffect(() => {
    if (initialData?.socialLinks) {
      const socialLinks = { ...initialData.socialLinks } as Record<
        string,
        string
      >;

      // Website is handled by the form field
      if (socialLinks.website) {
        delete socialLinks.website;
      }

      // Convert remaining social links to our detected links format
      const links: DetectedLink[] = Object.entries(socialLinks)
        .filter(([platform, url]: [string, string]) => url && url.trim())
        .map(([platform, url]: [string, string]) => {
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

      // Update profile preview
      updateProfileData({
        social_links: initialData.socialLinks,
        user_role: initialData.userRole,
      });
    }
  }, [initialData, updateProfileData]);

  // Load existing social links data if not provided from server
  useEffect(() => {
    // Skip fetching if we already have data from server
    if (
      initialData?.socialLinks &&
      Object.keys(initialData.socialLinks).length > 0
    ) {
      return;
    }

    const fetchSocialLinksData = async () => {
      try {
        const response = await getOnboardingStatusAction();
        if (response.success) {
          // Social links are now in creator.social_links, not profile.social_links
          const socialLinks = response.data?.creator?.social_links as
            | Record<string, string>
            | undefined;

          if (socialLinks) {
            // Extract website separately
            if (socialLinks.website) {
              form.setValue("website", socialLinks.website);
              delete socialLinks.website;
            }

            // Convert remaining social links to our detected links format
            const links: DetectedLink[] = Object.entries(socialLinks)
              .filter(([platform, url]: [string, string]) => url && url.trim())
              .map(([platform, url]: [string, string]) => {
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

            // Update preview
            updateProfileData({ social_links: socialLinks });
          }
        }
      } catch (error) {
        console.error("Error fetching social links data:", error);
      }
    };

    fetchSocialLinksData();
  }, [form, updateProfileData, initialData]);

  // Update preview whenever links change - wrap in useEffect with proper dependencies
  useEffect(() => {
    // Create a stringified version of the current links to compare
    const socialLinks: Record<string, string> = {};

    if (website) {
      socialLinks.website = website;
    }

    detectedLinks.forEach((link) => {
      socialLinks[link.platform] = link.url;
    });

    // Compare as JSON to avoid unnecessary updates
    const currentLinksJSON = JSON.stringify(socialLinks);
    const prevLinksJSON = JSON.stringify(profileData?.social_links || {});

    // Only update if actually changed
    if (currentLinksJSON !== prevLinksJSON) {
      updateProfileData({ social_links: socialLinks });
    }
  }, [website, detectedLinks, updateProfileData, profileData?.social_links]);

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
        toast.success(
          `Updated your ${PLATFORM_NAMES[detected.platform]} link.`
        );
      } else {
        // Add new link
        setDetectedLinks([...detectedLinks, detected]);
        toast.success(`Added your ${PLATFORM_NAMES[detected.platform]} link.`);
      }

      setNewLink("");
    } else {
      toast.error(
        "We couldn't identify which social platform this link belongs to."
      );
    }
  };

  // Remove a link - modified to use a callback pattern for state updates
  const removeLink = (index: number) => {
    setDetectedLinks((prevLinks) => prevLinks.filter((_, i) => i !== index));
  };

  // Handle form submission
  const handleSubmit = async (values: FormValues) => {
    // Check minimum links requirement (website counts as one)
    const totalLinks = detectedLinks.length + (values.website ? 1 : 0);
    if (totalLinks < 2) {
      toast.error("Minimum links required", {
        description: "Please add at least 2 social media links to continue.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare social links object
      const socialLinks: Record<string, string> = {};

      if (values.website) {
        socialLinks.website = values.website.startsWith("http")
          ? values.website
          : `https://${values.website}`;
      }

      detectedLinks.forEach((link) => {
        socialLinks[link.platform] = link.url;
      });

      const response = await setSocialLinksAction({
        social_links: socialLinks,
      });

      if (response.success) {
        toast.success("Social links saved", {
          description: "Your social media links have been saved.",
        });

        // Refresh the profile data
        await refreshData();

        router.push("/onboarding/username_selection");
      } else {
        toast.error(
          response.error ||
            "There was a problem saving your social links. Please try again."
        );
      }
    } catch (error) {
      toast.error(
        "There was a problem saving your social links. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get total links count
  const totalLinks = detectedLinks.length + (website ? 1 : 0);

  // Get currentStep for navigation
  const currentStep = "social_links";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Social Media Links</h3>
              <div
                className={`text-sm ${totalLinks >= 2 ? "text-green-600" : "text-amber-600"}`}
              >
                {totalLinks}/2 links added
              </div>
            </div>

            <Separator />

            {/* Website field */}
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <SocialIcon platform="website" className="h-4 w-4" />
                    Website
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="example.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    Your portfolio or personal website
                  </FormDescription>
                </FormItem>
              )}
            />

            {/* Added links */}
            {detectedLinks.length > 0 && (
              <div className="space-y-3 mt-4">
                <h4 className="text-sm font-medium">Your Social Links</h4>
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
                            {PLATFORM_NAMES[link.platform] || link.platform}
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
            <div className="space-y-2 mt-4">
              <FormLabel>Add Social Media Link</FormLabel>
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
              <FormDescription>
                Paste your profile URL from{" "}
                {SOCIAL_PLATFORMS.map((p) => p.name)
                  .slice(0, 3)
                  .join(", ")}
                , etc.
              </FormDescription>
            </div>

            {/* Show supported platforms */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Supported Platforms</h4>
              <div className="flex flex-wrap gap-2">
                {SOCIAL_PLATFORMS.map((platform) => (
                  <div
                    key={platform.id}
                    className="flex items-center gap-2 px-3 py-1 bg-secondary rounded-full text-sm"
                  >
                    <SocialIcon platform={platform.id} className="h-3 w-3" />
                    {platform.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <OnboardingNavigation
          currentStep={currentStep}
          userRole={profileData?.user_role}
          onSubmit={form.handleSubmit(handleSubmit)}
          isSubmitting={isSubmitting}
          isNextDisabled={totalLinks < 2}
          nextButtonText="Continue"
        />
      </form>
    </Form>
  );
}
