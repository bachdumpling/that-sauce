"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  getOnboardingStatusAction,
  setUsernameAction,
} from "@/actions/onboarding-actions";
import { useProfilePreview } from "../components/profile-preview-context";
import { OnboardingNavigation } from "../components/onboarding-navigation";
import {
  UsernameInput,
  UsernameFormData,
} from "@/components/shared/username-form";

interface UsernameFormProps {
  initialData?: {
    username: string;
    userRole: string;
  };
}

export function UsernameForm({ initialData }: UsernameFormProps) {
  const router = useRouter();
  const [usernameData, setUsernameData] = useState<UsernameFormData>({
    username: initialData?.username || "",
    isValid: false,
    isAvailable: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dataInitialized, setDataInitialized] = useState(
    !!initialData?.username
  );
  const { updateProfileData } = useProfilePreview();

  // Update profile preview with initial data only once on mount
  useEffect(() => {
    if (initialData && !dataInitialized) {
      updateProfileData({
        username: initialData.username,
        user_role: initialData.userRole,
      });
      setDataInitialized(true);
    }
  }, [initialData, updateProfileData, dataInitialized]);

  // Load existing username if not provided from server
  useEffect(() => {
    // Skip fetching if we already have data from server
    if (dataInitialized) {
      return;
    }

    const fetchUsernameData = async () => {
      try {
        const response = await getOnboardingStatusAction();
        // Username is now in creator.username, not profile.username
        if (response.success && response.data?.creator?.username) {
          const fetchedUsername = response.data.creator.username;
          setUsernameData((prev) => ({
            ...prev,
            username: fetchedUsername,
          }));
          updateProfileData({ username: fetchedUsername });
          setDataInitialized(true);
        }
      } catch (error) {
        console.error("Error fetching username data:", error);
      }
    };

    fetchUsernameData();
  }, [updateProfileData, dataInitialized]);

  // Update the preview whenever username changes
  useEffect(() => {
    if (dataInitialized && usernameData.username) {
      updateProfileData({ username: usernameData.username });
    }
  }, [usernameData.username, updateProfileData, dataInitialized]);

  // Memoize the username change handler
  const handleUsernameChange = useCallback((data: UsernameFormData) => {
    setUsernameData(data);
  }, []);

  // Submit the form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!usernameData.isValid || !usernameData.isAvailable) {
      toast.error("Please provide a valid and available username.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await setUsernameAction(usernameData.username);

      if (response.success) {
        toast.success("Your username has been set successfully.");

        // Update the profile data in the context with the completed username and flag
        updateProfileData({
          username: usernameData.username,
          onboarding_step: 4,
          onboarding_completed: true,
        });

        // Use a small timeout to ensure state is updated before navigation
        setTimeout(() => {
          router.push("/onboarding/completed");
        }, 500);
      } else {
        toast.error(
          response.error || "Failed to save username. Please try again."
        );
      }
    } catch (error) {
      console.error("Error saving username:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <UsernameInput
        initialUsername={initialData?.username || ""}
        currentUsername={initialData?.username || ""}
        onChange={handleUsernameChange}
        disabled={isSubmitting}
      />

      <OnboardingNavigation
        currentStep="username_selection"
        userRole={initialData?.userRole || null}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        isNextDisabled={!usernameData.isValid || !usernameData.isAvailable}
        nextButtonText="Continue"
      />
    </form>
  );
}
