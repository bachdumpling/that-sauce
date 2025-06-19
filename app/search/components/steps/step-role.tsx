"use client";

import { Button } from "@/components/ui/button";

interface StepRoleProps {
  talentRoles: string[];
  selectedRole: string;
  onRoleSelect: (role: string) => void;
}

export function StepRole({
  talentRoles,
  selectedRole,
  onRoleSelect,
}: StepRoleProps) {
  return (
    <div className="grid grid-cols-5 gap-16 h-full items-center">
      {/* Left side - Illustration and heading (2 columns) */}
      <div className="col-span-2 flex flex-col items-center justify-center h-full">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold mb-2">
            What kind of talent are you looking for?
          </h2>
          <p className="text-gray-600">
            Select the primary role of your project
          </p>
        </div>
        <img
          src="/search-images/search-1.png"
          alt="Search illustration"
          className="max-w-sm w-full h-auto"
        />
      </div>

      {/* Right side - Content (3 columns) */}
      <div className="col-span-3 flex items-center justify-center">
        <div className="w-full max-w-2xl">
          <div className="grid grid-cols-4 gap-3">
            {talentRoles.map((role) => (
              <Button
                key={role}
                variant="outline"
                onClick={() => onRoleSelect(role)}
                className={`h-12 text-sm font-medium border-2 ${
                  selectedRole === role
                    ? "bg-white border-black text-black"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {role}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
