"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

interface StepRefineProps {
  projectDescription: string;
  selectedRole: string;
  selectedSuggestions: string[];
  onSuggestionsChange: (suggestions: string[]) => void;
}

// Mock AI suggestions - in real app, these would come from an API
const generateAISuggestions = (role: string, description: string): string[] => {
  // This would normally be an API call to generate suggestions based on the role and description
  return [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  ];
};

export function StepRefine({
  projectDescription,
  selectedRole,
  selectedSuggestions,
  onSuggestionsChange,
}: StepRefineProps) {
  const [suggestions] = useState(() =>
    generateAISuggestions(selectedRole, projectDescription)
  );

  const handleSuggestionToggle = (suggestion: string) => {
    if (selectedSuggestions.includes(suggestion)) {
      onSuggestionsChange(selectedSuggestions.filter((s) => s !== suggestion));
    } else {
      onSuggestionsChange([...selectedSuggestions, suggestion]);
    }
  };

  return (
    <div className="grid grid-cols-5 gap-16 h-full items-center">
      {/* Left side - Illustration and heading (2 columns) */}
      <div className="col-span-2 flex flex-col items-center justify-center h-full">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Add references (optional)</h2>
          <p className="text-gray-600">
            Upload images or brand guidelines to improve search accuracy
          </p>
        </div>
        <img
          src="/search-images/search-4.png"
          alt="Refine search illustration"
          className="max-w-sm w-full h-auto"
        />
      </div>

      {/* Right side - Content (3 columns) */}
      <div className="col-span-3 flex items-start justify-center py-8">
        <div className="w-full max-w-2xl">
          {/* Current project description */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3">
              Your current project description
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 leading-relaxed">
                {projectDescription || "No description provided"}
              </p>
            </div>
          </div>

          {/* AI Suggestions */}
          <div>
            <h3 className="text-lg font-semibold mb-3">AI suggestions:</h3>
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedSuggestions.includes(suggestion)
                      ? "border-black bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => handleSuggestionToggle(suggestion)}
                >
                  <div className="flex-shrink-0 mt-1">
                    <Star
                      className={`h-5 w-5 ${
                        selectedSuggestions.includes(suggestion)
                          ? "fill-black text-black"
                          : "text-gray-400"
                      }`}
                    />
                  </div>
                  <p className="text-gray-700 leading-relaxed">{suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
