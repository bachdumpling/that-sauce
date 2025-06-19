"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserCircle,
  Layers,
  FileText,
  Sparkles,
  CheckSquare,
  ArrowRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepRole } from "./steps/step-role";
import { StepProject } from "./steps/step-project";
import { StepReferences } from "./steps/step-references";
import { StepRefine } from "./steps/step-refine";
import { StepConfirm } from "./steps/step-confirm";
import { StepPlaceholder } from "./steps/step-placeholder";

interface SearchWizardProps {
  talentRoles: string[];
}

const STEPS = [
  { label: "Role", Icon: UserCircle },
  { label: "Project", Icon: Layers },
  { label: "References", Icon: FileText },
  { label: "Refine", Icon: Sparkles },
  { label: "Confirm", Icon: CheckSquare },
];

export function SearchWizard({ talentRoles }: SearchWizardProps) {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [projectDescription, setProjectDescription] = useState<string>("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  const router = useRouter();

  const handleNext = () => {
    if (currentStep === 0 && !selectedRole) return;
    if (currentStep === 1 && !projectDescription.trim()) return;
    // Step 2 (References) is optional, so no validation needed
    // Step 3 (Refine) is optional, so no validation needed
    // Step 4 (Confirm) is the final step

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Handle final submission - navigate to search results
      handleFinalSubmission();
    }
  };

  const handleFinalSubmission = () => {
    // Prepare search parameters
    const params = new URLSearchParams();
    params.set("q", projectDescription);
    params.set("role", selectedRole);

    // Add selected suggestions if any
    if (selectedSuggestions.length > 0) {
      params.set("suggestions", selectedSuggestions.join(","));
    }

    // Add file info if any
    if (uploadedFiles.length > 0) {
      params.set("has_docs", "true");
      params.set("docs_count", uploadedFiles.length.toString());
    }

    params.set("limit", "10");
    params.set("page", "1");

    // Navigate to search results page
    router.push(`/search/results?${params.toString()}`);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    router.push("/");
  };

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
  };

  const handleDescriptionChange = (description: string) => {
    setProjectDescription(description);
  };

  const handleFilesChange = (files: File[]) => {
    setUploadedFiles(files);
  };

  const handleSuggestionsChange = (suggestions: string[]) => {
    setSelectedSuggestions(suggestions);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return !!selectedRole;
      case 1:
        return !!projectDescription.trim();
      case 2:
        return true; // References step is optional
      case 3:
        return true; // Refine step is optional
      case 4:
        return true; // Confirm step - always can proceed to search
      default:
        return false;
    }
  };

  const getNextButtonText = () => {
    switch (currentStep) {
      case 0:
        return "Describe your creator";
      case 1:
        return "Add references";
      case 2:
        return "Refine your search";
      case 3:
        return "Confirm your search";
      case 4:
        return "Start searching";
      default:
        return "Next";
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <StepRole
            talentRoles={talentRoles}
            selectedRole={selectedRole}
            onRoleSelect={handleRoleSelect}
          />
        );

      case 1:
        return (
          <StepProject
            projectDescription={projectDescription}
            onDescriptionChange={handleDescriptionChange}
            selectedRole={selectedRole}
          />
        );

      case 2:
        return (
          <StepReferences
            uploadedFiles={uploadedFiles}
            onFilesChange={handleFilesChange}
          />
        );

      case 3:
        return (
          <StepRefine
            projectDescription={projectDescription}
            selectedRole={selectedRole}
            selectedSuggestions={selectedSuggestions}
            onSuggestionsChange={handleSuggestionsChange}
          />
        );

      case 4:
        return (
          <StepConfirm
            selectedRole={selectedRole}
            projectDescription={projectDescription}
            uploadedFiles={uploadedFiles}
            selectedSuggestions={selectedSuggestions}
          />
        );

      default:
        return (
          <StepPlaceholder
            stepNumber={currentStep + 1}
            stepName="Unknown Step"
          />
        );
    }
  };

  return (
    <div className="w-full flex flex-col gap-20 p-10">
      {/* Header with title and close button */}
      <div className="px-4">
        <h1 className="text-4xl font-bold font-sauce">SEARCH YOUR CREATOR</h1>
      </div>

      {/* Step navigation */}
      <div className="flex items-center justify-center">
        <nav className="flex items-center space-x-8">
          {STEPS.map(({ label, Icon }, index) => (
            <div
              key={label}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${
                index === currentStep ? "bg-black text-white" : "text-gray-400"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{label}</span>
            </div>
          ))}
        </nav>
      </div>

      {/* Main content area - full width grid */}
      <div className="flex-1">
        <div className="h-fit">{renderStepContent()}</div>
      </div>

      {/* Navigation buttons - fixed at bottom */}
      <div className="">
        <div className="flex justify-end gap-4">
          {currentStep > 0 ? (
            <Button
              variant="outline"
              onClick={handleBack}
              className="px-6 py-3"
            >
              Back
            </Button>
          ) : (
            <div />
          )}

          <Button disabled={!canProceed()} onClick={handleNext}>
            {getNextButtonText()}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
