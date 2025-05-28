import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { MultiSelect, Option } from "@/components/ui/multi-select";
import { Loader2 } from "lucide-react";
import { CREATOR_ROLES } from "@/lib/constants/creator-options";
import { Organization } from "@/types/project";

interface ProjectDetailsStepProps {
  title: string;
  setTitle: (value: string) => void;
  shortDescription: string;
  setShortDescription: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  year: number | undefined;
  setYear: (value: number | undefined) => void;
  selectedRoles: string[];
  setSelectedRoles: (value: string[]) => void;
  selectedClients: string[];
  setSelectedClients: (value: string[]) => void;
  isLoadingOrgs: boolean;
  organizations: Organization[];
  handleGoBackToMedia: () => void;
  handleCreateProject: () => Promise<void>;
  isSubmitting: boolean;
  currentStep: string;
  customButtonText?: string;
  customTitle?: string;
  customDescription?: string;
}

export default function ProjectDetailsStep({
  title,
  setTitle,
  shortDescription,
  setShortDescription,
  description,
  setDescription,
  year,
  setYear,
  selectedRoles,
  setSelectedRoles,
  selectedClients,
  setSelectedClients,
  isLoadingOrgs,
  organizations,
  handleGoBackToMedia,
  handleCreateProject,
  isSubmitting,
  currentStep,
  customButtonText,
  customTitle,
  customDescription,
}: ProjectDetailsStepProps) {
  // Format role options from the constant list
  const roleOptions: Option[] = CREATOR_ROLES.map((role) => ({
    value: role,
    label: role,
  }));

  // Format client options from fetched organizations
  const clientOptions: Option[] = organizations.map((org) => ({
    value: org.id,
    label: org.name,
  }));

  return (
    <div data-testid="project-details-step">
      <Card>
        <CardHeader>
          <CardTitle>{customTitle || "Project Information"}</CardTitle>
          <CardDescription>
            {customDescription || "Enter the details for your new project"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="project-title">Project Title *</Label>
              <Input
                id="project-title"
                placeholder="Enter project title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                data-testid="project-title"
              />
            </div>

            <div>
              <Label htmlFor="project-short-description">
                Short Description *
              </Label>
              <Input
                id="project-short-description"
                placeholder="Brief summary of your project (max 255 characters)"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                maxLength={255}
                required
                data-testid="project-short-description"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {shortDescription.length}/255 characters
              </p>
            </div>

            <div>
              <Label htmlFor="project-description">Full Description</Label>
              <textarea
                id="project-description"
                rows={4}
                className="w-full rounded-md border border-input px-3 py-2 text-sm"
                placeholder="Enter detailed project description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                data-testid="project-description"
              />
            </div>

            <div>
              <Label htmlFor="project-year">Year *</Label>
              <Input
                id="project-year"
                type="number"
                placeholder="Project year"
                min={1990}
                max={new Date().getFullYear() + 1}
                value={year || ""}
                onChange={(e) => {
                  const value = e.target.value
                    ? parseInt(e.target.value)
                    : undefined;
                  setYear(value);
                }}
                required
                data-testid="project-year"
              />
            </div>

            <div>
              <Label htmlFor="project-roles">Project Roles *</Label>
              <MultiSelect
                options={roleOptions}
                selected={selectedRoles}
                onChange={setSelectedRoles}
                placeholder="Select roles involved in this project"
                data-testid="roles-select"
              />
              {selectedRoles.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  At least one role is required
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="project-clients">Clients</Label>
              {isLoadingOrgs ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading clients...
                </div>
              ) : (
                <MultiSelect
                  options={clientOptions}
                  selected={selectedClients}
                  onChange={setSelectedClients}
                  placeholder="Select clients for this project (optional)"
                  emptyMessage="No clients found. Add clients in the admin panel."
                  data-testid="clients-select"
                />
              )}
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={handleGoBackToMedia}
                className="flex-1"
                data-testid="back-to-media"
              >
                Back to Media
              </Button>

              <Button
                onClick={handleCreateProject}
                className="flex-1"
                disabled={
                  isSubmitting ||
                  !title.trim() ||
                  !shortDescription.trim() ||
                  !year ||
                  selectedRoles.length === 0
                }
                data-testid="create-project"
              >
                {isSubmitting ? (
                  <>
                    <Loader2
                      className="mr-2 h-4 w-4 animate-spin"
                      data-testid="loading"
                    />
                    {currentStep || "Creating Project..."}
                  </>
                ) : (
                  customButtonText || "Create Project"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
