"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Building2, User, Plus } from "lucide-react";
import {
  setOrganizationChoiceAction,
  getOnboardingStatusAction,
} from "@/actions/onboarding-actions";
import { searchOrganizationsAction } from "@/actions/organization-actions";
import { OrganizationChoiceType } from "@/types/onboarding";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { OnboardingNavigation } from "../components/onboarding-navigation";

const organizationFormSchema = z.discriminatedUnion("choice_type", [
  z.object({
    choice_type: z.literal("existing"),
    selected_organization_id: z
      .string()
      .min(1, "Please select an organization"),
  }),
  z.object({
    choice_type: z.literal("new"),
    new_organization: z.object({
      name: z
        .string()
        .min(2, "Organization name must be at least 2 characters")
        .max(100, "Organization name cannot exceed 100 characters"),
      website: z
        .string()
        .url("Please enter a valid URL")
        .optional()
        .or(z.literal("")),
      logo_url: z
        .string()
        .url("Please enter a valid URL")
        .optional()
        .or(z.literal("")),
    }),
  }),
  z.object({
    choice_type: z.literal("individual"),
  }),
]);

type OrganizationFormData = z.infer<typeof organizationFormSchema>;

// Type for search results from the API
interface OrganizationSearchResult {
  id: string;
  name: string;
  logo_url?: string;
  website?: string;
}

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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    OrganizationSearchResult[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedOrg, setSelectedOrg] =
    useState<OrganizationSearchResult | null>(null);

  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      choice_type: "new",
      selected_organization_id: undefined,
      new_organization: {
        name: initialData?.organization?.name || "",
        website: initialData?.organization?.website || "",
        logo_url: "",
      },
    } as OrganizationFormData,
  });

  const choiceType = form.watch("choice_type");

  // Search organizations when user types
  useEffect(() => {
    const searchOrganizations = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await searchOrganizationsAction(searchQuery, 10);
        if (response.success) {
          setSearchResults(response.data || []);
        }
      } catch (error) {
        console.error("Error searching organizations:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchOrganizations, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Handle organization selection
  const handleOrganizationSelect = (org: OrganizationSearchResult) => {
    setSelectedOrg(org);
    form.setValue("selected_organization_id", org.id);
    setSearchQuery(org.name);
    setSearchResults([]);
  };

  async function onSubmit(values: OrganizationFormData) {
    setIsSubmitting(true);

    try {
      let organizationChoice;

      switch (values.choice_type) {
        case "existing":
          organizationChoice = {
            type: "existing" as OrganizationChoiceType,
            organization_id: values.selected_organization_id,
          };
          break;
        case "new":
          organizationChoice = {
            type: "new" as OrganizationChoiceType,
            organization_data: values.new_organization,
          };
          break;
        case "individual":
          organizationChoice = {
            type: "individual" as OrganizationChoiceType,
          };
          break;
        default:
          throw new Error("Invalid choice type");
      }

      const response = await setOrganizationChoiceAction(organizationChoice);

      if (response.success) {
        router.push("/onboarding/profile_info");
      } else {
        toast.error(
          response.error ||
            "There was a problem saving your organization information. Please try again."
        );
      }
    } catch (error) {
      toast.error(
        "There was a problem saving your organization information. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="choice_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>How would you like to proceed?</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-1 gap-4"
                >
                  <Card className="border-2 hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="existing" id="existing" />
                        <Label
                          htmlFor="existing"
                          className="flex items-center gap-2 cursor-pointer flex-1"
                        >
                          <Building2 className="h-5 w-5" />
                          <div>
                            <div className="font-medium">
                              Select existing organization
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Choose from organizations already on the platform
                            </div>
                          </div>
                        </Label>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="new" id="new" />
                        <Label
                          htmlFor="new"
                          className="flex items-center gap-2 cursor-pointer flex-1"
                        >
                          <Plus className="h-5 w-5" />
                          <div>
                            <div className="font-medium">
                              Create new organization
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Add your organization to the platform
                            </div>
                          </div>
                        </Label>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="individual" id="individual" />
                        <Label
                          htmlFor="individual"
                          className="flex items-center gap-2 cursor-pointer flex-1"
                        >
                          <User className="h-5 w-5" />
                          <div>
                            <div className="font-medium">
                              Hire as an individual
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Proceed without representing an organization
                            </div>
                          </div>
                        </Label>
                      </div>
                    </CardContent>
                  </Card>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Existing Organization Search */}
        {choiceType === "existing" && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="selected_organization_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Search organizations</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Type to search organizations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="border rounded-md max-h-60 overflow-y-auto">
                      {searchResults.map((org) => (
                        <div
                          key={org.id}
                          onClick={() => handleOrganizationSelect(org)}
                          className="p-3 hover:bg-accent cursor-pointer border-b last:border-b-0"
                        >
                          <div className="font-medium">{org.name}</div>
                          {org.website && (
                            <div className="text-sm text-muted-foreground">
                              {org.website}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Selected Organization */}
                  {selectedOrg && (
                    <Card>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">
                              {selectedOrg.name}
                            </div>
                            {selectedOrg.website && (
                              <div className="text-sm text-muted-foreground">
                                {selectedOrg.website}
                              </div>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedOrg(null);
                              setSearchQuery("");
                              form.setValue("selected_organization_id", "");
                            }}
                          >
                            Clear
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {isSearching && (
                    <div className="text-sm text-muted-foreground">
                      Searching...
                    </div>
                  )}
                </FormItem>
              )}
            />
          </div>
        )}

        {/* New Organization Form */}
        {choiceType === "new" && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="new_organization.name"
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
              name="new_organization.website"
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

            <FormField
              control={form.control}
              name="new_organization.logo_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://yourcompany.com/logo.png"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    You can add a logo URL or upload one later
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Individual Hiring Confirmation */}
        {choiceType === "individual" && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-5 w-5" />
                <span>
                  You'll be able to hire creators as an individual without
                  representing any organization.
                </span>
              </div>
            </CardContent>
          </Card>
        )}

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
