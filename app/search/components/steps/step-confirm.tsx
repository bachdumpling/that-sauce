"use client";

import { Button } from "@/components/ui/button";

interface StepConfirmProps {
  selectedRole: string;
  projectDescription: string;
  uploadedFiles: File[];
  selectedSuggestions: string[];
}

export function StepConfirm({
  selectedRole,
  projectDescription,
  uploadedFiles,
  selectedSuggestions,
}: StepConfirmProps) {
  // Get related roles based on selected role (mock data for now)
  const getRelatedRoles = (role: string): string[] => {
    const roleGroups: Record<string, string[]> = {
      "Graphic Designer": ["Illustrator", "Video Editor", "UI/UX Designer"],
      "Photographer": ["Director", "Cinematographer", "Video Editor"],
      "Director": ["Cinematographer", "Video Editor", "Photographer"],
      "Motion Designer": ["Video Editor", "3D Artist", "Animator"],
      "Illustrator": ["Graphic Designer", "Art Director", "Motion Designer"],
    };
    
    return roleGroups[role] || ["Graphic Designer", "Illustrator", "Video Editor"];
  };

  const relatedRoles = getRelatedRoles(selectedRole);

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
          src="/search-images/search-5.png"
          alt="Confirm search illustration"
          className="max-w-sm w-full h-auto"
        />
      </div>

      {/* Right side - Content (3 columns) */}
      <div className="col-span-3 flex items-start justify-center py-8">
        <div className="w-full max-w-2xl space-y-8">
          {/* Roles Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Roles</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="bg-black text-white border-black hover:bg-gray-800"
              >
                {selectedRole}
              </Button>
              {relatedRoles.map((role) => (
                <Button
                  key={role}
                  variant="outline"
                  className="border-gray-300 text-gray-600 hover:border-gray-400"
                >
                  {role}
                </Button>
              ))}
            </div>
          </div>

          {/* Project Description Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Your current project description</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 leading-relaxed">
                {projectDescription || "No description provided"}
              </p>
            </div>
          </div>

          {/* References Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3">References</h3>
            {uploadedFiles.length > 0 ? (
              <div className="grid grid-cols-4 gap-3">
                {uploadedFiles.slice(0, 4).map((file, index) => (
                  <div
                    key={index}
                    className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center"
                  >
                    {file.type.startsWith("image/") ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-2xl">📄</div>
                    )}
                  </div>
                ))}
                {uploadedFiles.length > 4 && (
                  <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm text-gray-500">
                      +{uploadedFiles.length - 4} more
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="aspect-square bg-gray-200 rounded-lg"
                  />
                ))}
              </div>
            )}
          </div>

          {/* AI Suggestions Section */}
          {selectedSuggestions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Selected AI suggestions</h3>
              <div className="space-y-2">
                {selectedSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="bg-blue-50 border border-blue-200 rounded-lg p-3"
                  >
                    <p className="text-sm text-blue-800">{suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 