"use client";

interface StepPlaceholderProps {
  stepNumber: number;
  stepName: string;
}

export function StepPlaceholder({
  stepNumber,
  stepName,
}: StepPlaceholderProps) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2 text-gray-400">{stepName}</h2>
        <p className="text-gray-500">Step {stepNumber} coming soon...</p>
      </div>
    </div>
  );
}
