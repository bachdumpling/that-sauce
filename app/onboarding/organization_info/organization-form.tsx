"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  setOrganizationInfoAction,
  getOnboardingStatusAction,
} from "@/actions/onboarding-actions";
import { OrganizationData } from "@/types/onboarding";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { OnboardingNavigation } from "../components/onboarding-navigation";

const organizationSchema = z.object({
  name: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(100, "Organization name cannot exceed 100 characters"),
  website: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
});

type OrganizationFormValues = z.infer<typeof organizationSchema> &
  Omit<OrganizationData, keyof z.infer<typeof organizationSchema>>;

interface OrganizationFormProps {
  initialData?: {
    organization: {
      name: string;
      website: string;
    } | null;
    userRole: string;
  };
}

export function OrganizationForm({ initialData }: OrganizationFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: initialData?.organization?.name || "",
      website: initialData?.organization?.website || "",
    },
  });

  // Update profile preview with initial data
  useEffect(() => {
    if (initialData?.organization) {
      const { name, website } = initialData.organization;
      form.setValue("name", name);
      form.setValue("website", website || "");
    }
  }, [initialData, form]);

  // Load existing organization data if not provided from server
  useEffect(() => {
    // Skip fetching if we have initialData
    if (initialData?.organization) {
      return;
    }

    const fetchOrganizationData = async () => {
      try {
        const response = await getOnboardingStatusAction();
        if (response.success && response.data?.profile?.organization) {
          const { name, website } = response.data.profile.organization;

          // Set form values if available
          if (name) {
            form.setValue("name", name);
          }

          if (website) {
            form.setValue("website", website);
          }
        }
      } catch (error) {
        console.error("Error fetching organization data:", error);
      }
    };

    fetchOrganizationData();
  }, [form, initialData]);

  async function onSubmit(values: OrganizationFormValues) {
    setIsSubmitting(true);

    try {
      const response = await setOrganizationInfoAction({
        name: values.name,
        website: values.website || undefined,
      });

      if (response.success) {
        router.push("/onboarding/profile_info");
      } else {
        toast({
          title: "Error",
          description:
            response.error ||
            "There was a problem saving your organization information. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          "There was a problem saving your organization information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization Name*</FormLabel>
              <FormControl>
                <Input placeholder="Your Company, Inc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website (optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://yourcompany.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <OnboardingNavigation
          currentStep="organization_info"
          userRole="employer"
          onSubmit={form.handleSubmit(onSubmit)}
          isSubmitting={isSubmitting}
          nextButtonText="Continue"
        />
      </form>
    </Form>
  );
}
