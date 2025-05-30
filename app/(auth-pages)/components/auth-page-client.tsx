"use client";

import TextPressure from "@/components/shared/TextPressure";

export function AuthPageClient() {
  return (
    <div className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none">
      <div className="relative w-full h-full flex items-center justify-center">
        <TextPressure
          text="Welcome"
          flex={true}
          alpha={false}
          stroke={false}
          width={true}
          weight={true}
          italic={true}
          textColor="#e21313"
          strokeColor="#ffffff"
          minFontSize={100}
          className="pointer-events-auto"
        />
      </div>
    </div>
  );
}
