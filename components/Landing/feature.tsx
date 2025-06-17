import React from "react";
import ScrollVelocity from "./ScrollVelocity/ScrollVelocity";
import BentoGrid from "./BentoGrid";
import type { BentoCardConfig } from "./BentoGrid";

interface FeatureData {
  title: string;
  subtitle: string;
  video?: {
    asset: {
      _id: string;
      url: string;
      mimeType: string;
      size: number;
    };
  };
}

interface FeatureProps {
  features?: FeatureData[];
}

function Feature({ features }: FeatureProps) {
  // Configure bento cards based on features data
  const bentoCards: BentoCardConfig[] = [
    {
      id: "main-feature",
      title: features?.[0]?.title,
      subtitle: features?.[0]?.subtitle,
      video: features?.[0]?.video,
      colSpan: 2,
      rowSpan: 2,
    },
    {
      id: "card-1",
      title: "2 AI-Powered Portfolio Optimization",
      subtitle:
        "We use AI to analyze your work and optimize your discoverability.",
      video: {
        asset: {
          _id: "qp0vXhSFaJ9AO27AUuyF2LCXDo",
          url: "https://framerusercontent.com/assets/qp0vXhSFaJ9AO27AUuyF2LCXDo.mp4",
          mimeType: "video/mp4",
          size: 1000000,
        },
      },
      colSpan: 1,
      rowSpan: 3,
    },
    {
      id: "card-2",
      title: "3 AI-Powered Portfolio Optimization",
      subtitle:
        "We use AI to analyze your work and optimize your discoverability.",
      video: {
        asset: {
          _id: "qp0vXhSFaJ9AO27AUuyF2LCXDo",
          url: "https://framerusercontent.com/assets/2rcjUcmPp0DzkAkqPeDL53Wzg6Q.mp4",
          mimeType: "video/mp4",
          size: 1000000,
        },
      },
      colSpan: 2,
      rowSpan: 3,
    },
    {
      id: "card-3",
      title: "4 AI-Powered Portfolio Optimization",
      subtitle:
        "We use AI to analyze your work and optimize your discoverability.",
      video: {
        asset: {
          _id: "qp0vXhSFaJ9AO27AUuyF2LCXDo",
          url: "https://framerusercontent.com/assets/x927ySww4cMBMvbkQKmulA4LeM.mp4",
          mimeType: "video/mp4",
          size: 1000000,
        },
      },
      colSpan: 1,
      rowSpan: 2,
    },
  ];

  return (
    <div className="flex flex-col items-center w-full overflow-hidden">
      <div className="z-20 flex flex-col items-center justify-center py-8">
        <ScrollVelocity
          texts={[
            "That Sauce is Built different.",
            "Built for Creatives, by Creatives.",
          ]}
          velocity={50}
          className="text-6xl font-semibold font-sauce"
        />
      </div>

      <div className="flex-1 w-full">
        <BentoGrid cards={bentoCards} />
      </div>
    </div>
  );
}

export default Feature;
