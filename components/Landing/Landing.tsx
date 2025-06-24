"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Hero from "./hero";
import { LandingPageData } from "@/types/sanity";
import {
  DraggableCardContainer,
  DraggableCardBody,
} from "@/components/ui/draggable-card";
import Image from "next/image";
import Demo from "./demo";
import TypewriterSearch from "./TypewriterSearch";
import { cn } from "@/lib/utils";
import Feature from "./feature";
import Algorithm from "./algorithm";
import Problem from "./problem";

function Landing({ landingPageData }: { landingPageData?: LandingPageData }) {
  const items = [
    {
      title: "This",
      image: "/problem-images/image-1.png",
      className: "col-start-1 row-start-1",
    },
    {
      title: "is",
      image: "/problem-images/image-2.png",
      className: "col-start-1 row-start-1",
    },
    {
      title: "how",
      image: "/problem-images/image-3.png",
      className: "col-start-1 row-start-1",
    },
    {
      title: "we",
      image: "/problem-images/image-4.png",
      className: "col-start-1 row-start-1",
    },
    {
      title: "stop",
      image: "/problem-images/image-5.png",
      className: "col-start-1 row-start-1",
    },
    {
      title: "the",
      image: "/problem-images/image-6.png",
      className: "col-start-1 row-start-1",
    },
    {
      title: "scrolling",
      image: "/problem-images/image-7.png",
      className: "col-start-1 row-start-1",
    },
  ];

  const sortedItems = [...items];

  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start start", "end end"],
  });

  const { scrollYProgress: heroScrollYProgress } = useScroll();
  const heroParallaxY = useTransform(
    heroScrollYProgress,
    [0, 1],
    ["0%", "50%"]
  );

  const numCards = items.length;
  const animationStart = 0.1;
  const animationEnd = 0.9;
  const animationRange = animationEnd - animationStart;
  const cardAnimationStep = animationRange / numCards;
  const textOpacity = useTransform(
    scrollYProgress,
    [animationEnd - cardAnimationStep, animationEnd],
    [0, 1]
  );

  return (
    <div className="flex flex-col gap-20 relative pb-20">
      <div
        className={cn(
          "absolute inset-0 -z-10",
          "[background-size:30px_30px]",
          "[background-image:radial-gradient(#d4d4d4_1px,transparent_1px)]",
          "dark:[background-image:radial-gradient(#404040_1px,transparent_1px)]"
        )}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_60%,black)] dark:bg-black"></div>
      <div className="flex flex-col items-center justify-center">
        <Image
          src="/logo-dark.png"
          alt="Background"
          width={400}
          height={400}
          className="object-cover pt-10 z-50"
        />

        <div className="h-screen w-full">
          {/* Hero Section */}
          <Hero
            landingPageData={landingPageData}
            heroParallaxY={heroParallaxY}
          />
        </div>
      </div>

      {/* Algorithm Section */}
      <div className="flex h-screen w-full flex-col items-center justify-center">
        <Algorithm />
      </div>

      {/* Problem Section */}
      <Problem />

      {/* Demo Section */}
      <Demo />

      <div className="h-full w-full flex flex-col items-start justify-start">
        <Feature features={landingPageData?.features} />
      </div>

      <div className="h-screen w-full flex flex-col items-center justify-center">
        <h1 className="text-8xl font-sauce text-center px-4">
          Stop settling.
          <br />
          Start creating.
        </h1>
      </div>
    </div>
  );
}

export default Landing;
