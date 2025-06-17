"use client";
import React from "react";
import Typewriter from "typewriter-effect";
import { Search } from "lucide-react";
import { Button } from "../ui/button";
import DotGrid from "./DotGrid/DotGrid";

const TypewriterSearch = () => {
  return (
    <div className="w-full flex flex-col gap-10">
      {/* Title */}
      <div className="flex justify-between px-4 gap-10">
        <h1 className="text-8xl font-bold max-w-4xl">
          What if you could just… describe what you need?
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl">
          Our AI doesn't care about follower counts. It reads creative
          DNA—style, technique, vision.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative w-full h-[620px] bg-background bg-opacity-10">
        {/* DotGrid Background - Full Width */}
        <DotGrid
          className="absolute inset-0 w-full h-full"
          dotSize={40}
          gap={50}
          baseColor="#e5e7eb"
          activeColor="#5227FF"
          proximity={200}
        />

        {/* Search Bar - Absolutely Positioned on Top */}
        <div className="absolute inset-0 flex justify-center items-center">
          <div className="relative w-full max-w-xl mx-auto flex items-center bg-white rounded-full border-2 border-black shadow-lg">
            {/* Search Icon */}
            <div className="absolute left-4 flex items-center pointer-events-none">
              <Search className="text-gray-400 w-5 h-5" />
            </div>

            {/* Typewriter Input Area */}
            <div className="flex-1 py-4 pl-12 pr-4 text-black text-lg">
              <Typewriter
                options={{
                  strings: [
                    "Photographer",
                    "Videographer",
                    "UI/UX Designer",
                    "Animator",
                    "Creative Director",
                  ],
                  autoStart: true,
                  loop: true,
                  delay: 75,
                  deleteSpeed: 100,
                  wrapperClassName: "inline",
                  cursorClassName: "inline",
                }}
              />
            </div>

            {/* Search Button */}
            <div className="pr-4">
              <Button variant="secondary" className="rounded-full">
                SEARCH
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypewriterSearch;
