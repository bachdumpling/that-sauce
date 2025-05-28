"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  setProfileInfoAction,
  uploadProfileImageAction,
  getOnboardingStatusAction,
} from "@/actions/onboarding-actions";
import { ProfileData } from "@/types/onboarding";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useProfilePreview } from "../components/profile-preview-context";
import { User } from "lucide-react";
import { MultiSelect } from "@/components/ui/multi-select";
import { CREATOR_ROLES, US_LOCATIONS } from "@/lib/constants/creator-options";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OnboardingNavigation } from "../components/onboarding-navigation";

// Map CREATOR_ROLES to the format required by MultiSelect
const ROLE_OPTIONS = CREATOR_ROLES.map((role) => ({
  value: role,
  label: role,
}));

const profileSchema = z.object({
  first_name: z
    .string()
    .min(1, "First name must be provided")
    .max(50, "First name cannot exceed 50 characters"),
  last_name: z
    .string()
    .min(1, "Last name must be provided")
    .max(50, "Last name cannot exceed 50 characters"),
  bio: z
    .string()
    .min(10, "Bio must be at least 10 characters")
    .max(300, "Bio cannot exceed 300 characters"),
  location: z
    .string()
    .min(1, "Location must be provided")
    .max(100, "Location cannot exceed 100 characters"),
  avatar_url: z.string().min(1, "Profile image is required"),
  primary_role: z.array(z.string()).min(1, "At least one role is required"),
});

// Use the shared ProfileData type with our form
type ProfileFormValues = z.infer<typeof profileSchema> &
  Omit<ProfileData, keyof z.infer<typeof profileSchema>>;

// Define props interface
interface ProfileFormProps {
  initialData?: {
    profileData: {
      first_name: string;
      last_name: string;
    };
    creatorData: {
      bio: string;
      location: string;
      primary_role: string[];
      avatar_url: string;
    } | null;
    userRole: string;
  };
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    initialData?.creatorData?.avatar_url || null
  );
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { profileData, updateProfileData } = useProfilePreview();
  const [selectedRoles, setSelectedRoles] = useState<string[]>(
    initialData?.creatorData?.primary_role || []
  );
  const [roleSelectError, setRoleSelectError] = useState("");
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: initialData?.profileData?.first_name || "",
      last_name: initialData?.profileData?.last_name || "",
      bio: initialData?.creatorData?.bio || "",
      location: initialData?.creatorData?.location || "",
      avatar_url: initialData?.creatorData?.avatar_url || "",
      primary_role: initialData?.creatorData?.primary_role || [],
    },
  });

  // Update profile preview with initial data - only once
  useEffect(() => {
    if (initialData && !initialDataLoaded) {
      updateProfileData({
        ...initialData.profileData,
        ...initialData.creatorData,
        user_role: initialData.userRole,
      });
      setInitialDataLoaded(true);
    }
  }, [initialData, updateProfileData, initialDataLoaded]);

  // Fetch any missing data or refresh if no initial data provided
  useEffect(() => {
    // Skip fetching if we have initialData and already loaded it
    if (
      initialData &&
      initialData.creatorData?.avatar_url &&
      initialDataLoaded
    ) {
      return;
    }

    const fetchProfileData = async () => {
      try {
        const response = await getOnboardingStatusAction();
        if (response.success && response.data) {
          // Get user role first (from either place it could be stored)
          const userRole =
            response.data.user_role || response.data.profile?.user_role;

          // Update profile preview context with the role
          if (userRole) {
            updateProfileData({ user_role: userRole });
          }

          // Get base profile data
          if (response.data.profile) {
            const { first_name, last_name } = response.data.profile;

            // Set name values
            form.setValue("first_name", first_name || "");
            form.setValue("last_name", last_name || "");
          }

          // Get creator-specific data
          if (response.data.creator) {
            const { location, bio, primary_role, avatar_url } =
              response.data.creator;

            // Set creator field values
            form.setValue("bio", bio || "");
            form.setValue("location", location || "");
            form.setValue("avatar_url", avatar_url || "");

            // Set role values if available
            if (primary_role && Array.isArray(primary_role)) {
              form.setValue("primary_role", primary_role);
              setSelectedRoles(primary_role);
            }

            // Set avatar preview if available
            if (avatar_url) {
              setAvatarPreview(avatar_url);
            }
          }

          setInitialDataLoaded(true);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    };

    fetchProfileData();
  }, [form, updateProfileData, initialData, initialDataLoaded]);

  // Handle role selection change - wrapped in useCallback
  const handleRoleChange = useCallback(
    (roles: string[]) => {
      if (roles.length > 3) {
        setRoleSelectError("You can select a maximum of 3 roles");
        return;
      }

      if (roles.length === 0) {
        setRoleSelectError("Please select at least one role");
        return;
      }

      setRoleSelectError("");
      setSelectedRoles(roles);
      form.setValue("primary_role", roles);

      // Update the preview with just the first role
      const previewRoles = roles.length > 0 ? [roles[0]] : [];
      updateProfileData({ primary_role: previewRoles });
    },
    [form, updateProfileData]
  );

  // Update preview in real-time as user types - with debounce effect
  const watchedFields = form.watch();
  useEffect(() => {
    // Avoid unnecessary updates during initial load
    if (!initialDataLoaded) return;

    const timeoutId = setTimeout(() => {
      // Create a copy of the watched fields but ensure we only send the first role to preview
      const previewData = { ...watchedFields };
      if (watchedFields.primary_role && watchedFields.primary_role.length > 0) {
        previewData.primary_role = [watchedFields.primary_role[0]];
      }
      updateProfileData(previewData);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [watchedFields, updateProfileData, initialDataLoaded]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Set uploading state
    setIsAvatarUploading(true);

    // Preview the selected image
    const reader = new FileReader();
    reader.onload = (event) => {
      const preview = event.target?.result as string;
      setAvatarPreview(preview);
      updateProfileData({ avatar_url: preview }); // Update preview immediately
    };
    reader.readAsDataURL(file);

    // Upload the image
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await uploadProfileImageAction(formData);

      if (response.success && response.data?.avatar_url) {
        form.setValue("avatar_url", response.data.avatar_url);
        updateProfileData({ avatar_url: response.data.avatar_url });
        toast({
          title: "Success",
          description: "Profile image uploaded successfully",
        });
      } else {
        toast({
          title: "Error",
          description:
            response.error ||
            "Failed to upload profile image. Please try again.",
          variant: "destructive",
        });
        // Clear the avatar preview if upload failed
        setAvatarPreview(null);
        form.setValue("avatar_url", "");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload profile image. Please try again.",
        variant: "destructive",
      });
      // Clear the avatar preview if upload failed
      setAvatarPreview(null);
      form.setValue("avatar_url", "");
    } finally {
      setIsAvatarUploading(false);
    }
  };

  // For form submission validation
  async function onSubmit(values: ProfileFormValues) {
    // Validate avatar is present
    if (!values.avatar_url) {
      form.setError("avatar_url", {
        type: "manual",
        message: "Profile image is required",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await setProfileInfoAction({
        first_name: values.first_name,
        last_name: values.last_name,
        bio: values.bio,
        location: values.location,
        avatar_url: values.avatar_url,
        primary_role: values.primary_role || [], // Use selected roles
      });

      if (response.success) {
        router.push("/onboarding/social_links");
      } else {
        toast({
          title: "Error",
          description:
            response.error ||
            "There was a problem saving your profile information. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          "There was a problem saving your profile information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="">
        <div className="flex flex-col items-center justify-center w-full space-y-4">
          <div className="flex flex-col items-center justify-center w-full">
            {/* Avatar */}
            <Avatar
              className={`cursor-pointer hover:border-primary transition-colors h-20 w-20 ${isAvatarUploading ? "opacity-70" : ""}`}
              onClick={handleImageClick}
            >
              {isAvatarUploading ? (
                <div className="h-full w-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : avatarPreview ? (
                <AvatarImage className="object-cover" src={avatarPreview} />
              ) : (
                <AvatarFallback>
                  <User />
                </AvatarFallback>
              )}

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isAvatarUploading}
              />

              <input type="hidden" {...form.register("avatar_url")} />
            </Avatar>
            {form.formState.errors.avatar_url && (
              <p className="text-sm font-medium text-destructive text-center mt-2">
                {form.formState.errors.avatar_url.message}
              </p>
            )}
            {isAvatarUploading && (
              <p className="text-sm text-primary mt-2">Uploading image...</p>
            )}
          </div>
          <div className="space-y-6">
            <div className="flex flex-col gap-1">
              {/* Name */}
              <div>
                <h4 className="text-sm font-medium">My name is</h4>
              </div>
              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="hidden">First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="First Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="hidden">Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Last Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Location */}
            <div className="flex flex-col gap-1">
              <div>
                <h4 className="text-sm font-medium">I'm based in</h4>
              </div>

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="hidden">Location</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Don't call updateProfileData here, it will be caught by form.watch useEffect
                        }}
                        value={field.value || undefined}
                        defaultValue={field.value || undefined}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a location" />
                        </SelectTrigger>
                        <SelectContent>
                          {US_LOCATIONS.map((location) => (
                            <SelectItem key={location} value={location}>
                              {location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Primary Roles */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">I work as</h4>
                {roleSelectError ? (
                  <h4 className="text-sm font-normal text-red-500">
                    {roleSelectError}
                  </h4>
                ) : (
                  <h4 className="text-sm font-normal text-muted-foreground">
                    Select at least 1 role (max 3)
                  </h4>
                )}
              </div>
              <MultiSelect
                options={ROLE_OPTIONS}
                selected={selectedRoles}
                onChange={handleRoleChange}
                placeholder="Select primary role"
              />
              <input
                type="hidden"
                {...form.register("primary_role")}
                value={selectedRoles.join(",")}
              />
              {form.formState.errors.primary_role && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.primary_role.message}
                </p>
              )}
            </div>
            {/* Bio */}
            <div className="flex flex-col gap-1">
              <h4 className="text-sm font-medium">
                When I'm not around, people say I am ...
              </h4>
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="hidden">Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Very short bio..."
                        {...field}
                        className="resize-none"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        <OnboardingNavigation
          currentStep="profile_info"
          userRole={profileData?.user_role}
          onSubmit={form.handleSubmit(onSubmit)}
          isSubmitting={isSubmitting}
        />
      </form>
    </Form>
  );
}
