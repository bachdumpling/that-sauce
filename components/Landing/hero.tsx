"use client";
import { Suspense } from "react";
import SplitText from "./SplitText/SplitText";
import { LandingPageData } from "@/types/sanity";
import RotatingCube from "./RotatingCube";
import { MotionValue } from "framer-motion";
import { BackgroundLines } from "@/components/ui/background-lines";
import { Button } from "../ui/button";

interface HeroProps {
  landingPageData?: LandingPageData;
  heroParallaxY?: MotionValue<string>;
}

export default function Hero({
  landingPageData,
  heroParallaxY,
}: HeroProps = {}) {
  // Fallback values
  const data = landingPageData;
  const heroTitle = data?.hero?.title || "Where Real Talent Gets Found";
  const heroSubtitle =
    data?.hero?.subtitle ||
    "The best creatives aren't always the loudest. They're just the best";

  return (
    <BackgroundLines className="w-full h-screen relative bg-transparent">
      <Suspense fallback={null}>
        <RotatingCube heroParallaxY={heroParallaxY} />
      </Suspense>

      {/* Text Content Overlay */}
      <div className="absolute top-52 left-0 right-0 z-0 flex flex-col items-center justify-center px-4">
        <SplitText
          text={heroTitle}
          className="text-8xl font-semibold text-center uppercase font-sauce"
          delay={40}
          duration={0.4}
          ease="power3.inOut"
          splitType="chars"
          from={{ opacity: 0, y: 40 }}
          to={{ opacity: 1, y: 0 }}
          threshold={0.1}
          rootMargin="0px"
          textAlign="center"
        />

        {/* <p className={`text-xl mb-8 max-w-2xl text-center`}>{heroSubtitle}</p> */}
      </div>

      {/* Waitlist Button */}
      <div className="absolute bottom-40 left-0 right-0 z-10 flex justify-center">
        <Button className="">Join Waitlist</Button>
      </div>
    </BackgroundLines>
  );
}
