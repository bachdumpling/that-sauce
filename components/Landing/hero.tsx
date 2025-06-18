"use client";
import { Suspense } from "react";
import SplitText from "./SplitText/SplitText";
import { LandingPageData } from "@/types/sanity";
import RotatingCube from "./RotatingCube";
import { MotionValue } from "framer-motion";
import { BackgroundLines } from "@/components/ui/background-lines";
import { Button } from "../ui/button";
import BounceCards from "./BounceCards/BounceCards";

interface HeroProps {
  landingPageData?: LandingPageData;
  heroParallaxY?: MotionValue<string>;
}

const images = [
  "https://mir-s3-cdn-cf.behance.net/project_modules/fs/4cdb1f118388633.60bfb285bd72d.gif",
  "https://mir-s3-cdn-cf.behance.net/project_modules/fs/38a52a178715795.64ee6b9027368.gif",
  "https://mir-s3-cdn-cf.behance.net/project_modules/fs/fd173f115789367.6054e5a24e926.gif",
  "https://mir-s3-cdn-cf.behance.net/project_modules/max_3840/86031f147994763.62f12e6de3096.gif",
  "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/85eeee156666547.636be5b6d40d8.gif",
];

const transformStyles = [
  "rotate(5deg) translate(-400px)",
  "rotate(12deg) translate(-200px)",
  "rotate(3deg)",
  "rotate(-12deg) translate(200px)",
  "rotate(-5deg) translate(400px)",
];

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

  // Split the hero title roughly in half (by words)
  const words = heroTitle.split(" ");
  const midIdx = Math.ceil(words.length / 2);
  const leftTitle = words.slice(0, midIdx).join(" ");
  const rightTitle = words.slice(midIdx).join(" ");

  return (
    <div className="relative flex flex-col items-center justify-center w-full mt-40">
      {/* Background bouncing image cards */}
      <BounceCards
        className="z-0"
        images={images}
        containerWidth={700}
        containerHeight={450}
        animationDelay={1}
        animationStagger={0.08}
        animationDuration={1.2}
        easeType="elastic.out(1, 0.5)"
        transformStyles={transformStyles}
        enableHover={true}
        cardSize={400}
        squareCorners={true}
        imageBrightness={0.6}
      />

      {/* Text & call-to-action overlay */}
      <div className="absolute inset-0 z-10 grid max-w-6xl mx-auto h-full grid-rows-[auto_auto] px-4 pointer-events-none">
        {/* First row – left-aligned */}
        <div className="justify-self-start">
          <SplitText
            text={leftTitle}
            className="text-8xl font-semibold uppercase font-sauce"
            delay={40}
            duration={0.4}
            ease="power3.inOut"
            splitType="words"
            from={{ opacity: 0, y: 40 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.1}
            rootMargin="0px"
            textAlign="left"
          />
        </div>

        {/* Second row – right-aligned */}
        <div className="justify-self-end">
          <SplitText
            text={rightTitle}
            className="text-8xl font-semibold uppercase font-sauce"
            delay={80}
            duration={0.4}
            ease="power3.inOut"
            splitType="words"
            from={{ opacity: 0, y: 40 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.1}
            rootMargin="0px"
            textAlign="right"
          />
        </div>
      </div>
    </div>
  );
}
