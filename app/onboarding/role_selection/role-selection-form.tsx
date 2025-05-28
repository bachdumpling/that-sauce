"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  setUserRoleAction,
  getOnboardingStatusAction,
} from "@/actions/onboarding-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { OnboardingNavigation } from "../components/onboarding-navigation";

interface RoleSelectionFormProps {
  initialData?: {
    currentRole?: "creator" | "employer";
  };
}

export function RoleSelectionForm({ initialData }: RoleSelectionFormProps) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<
    "creator" | "employer" | undefined
  >(initialData?.currentRole);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing role from database if not provided from server
  useEffect(() => {
    // If initialData currentRole was passed as a prop, we already used it
    if (initialData?.currentRole) {
      return;
    }

    // Otherwise fetch from the database
    const fetchUserRole = async () => {
      try {
        const response = await getOnboardingStatusAction();
        if (response.success && response.data) {
          const role =
            response.data.user_role || response.data.profile?.user_role;
          if (role && (role === "creator" || role === "employer")) {
            setSelectedRole(role);
          }
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };

    fetchUserRole();
  }, [initialData]);

  async function handleSubmit() {
    if (!selectedRole) {
      toast({
        title: "Please select a role",
        description:
          "You need to select either Creator or Employer to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await setUserRoleAction(selectedRole);

      if (response.success) {
        // If role was set successfully, move to the next step
        if (selectedRole === "employer") {
          router.push("/onboarding/organization_info");
        } else {
          router.push("/onboarding/profile_info");
        }
      } else {
        toast({
          title: "Error",
          description:
            response.error ||
            "There was a problem setting your role. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem setting your role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          className={`p-6 cursor-pointer hover:border-primary transition-colors ${
            selectedRole === "creator"
              ? "border-primary ring-2 ring-primary ring-offset-2 dark:ring-offset-background"
              : ""
          }`}
          onClick={() => setSelectedRole("creator")}
        >
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-primary"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m7 11 2-2-2-2" />
                <path d="M11 13h4" />
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-xl">Creator</h3>
              <p className="text-muted-foreground text-sm mt-1">
                I'm a designer, developer, or creator looking to showcase my
                work
              </p>
            </div>
          </div>
        </Card>

        <Card
          className={`p-6 cursor-pointer hover:border-primary transition-colors ${
            selectedRole === "employer"
              ? "border-primary ring-2 ring-primary ring-offset-2 dark:ring-offset-background"
              : ""
          }`}
          onClick={() => setSelectedRole("employer")}
        >
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-primary"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M9 17v-4" />
                <path d="M12 17v-2" />
                <path d="M15 17v-6" />
                <path d="M9 9V7" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-xl">Employer</h3>
              <p className="text-muted-foreground text-sm mt-1">
                I'm looking to find and hire talented creators
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-center mt-8">
        <OnboardingNavigation
          currentStep="role_selection"
          userRole={selectedRole}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          isNextDisabled={!selectedRole}
          nextButtonText="Continue"
        />
      </div>
    </div>
  );
}
