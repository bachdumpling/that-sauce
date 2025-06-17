"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, MotionValue } from "motion/react";
// Re-use the sub-components exported from the original macbook-scroll
import {
  Lid as BaseLid,
  Keypad,
  Trackpad,
  SpeakerGrid,
} from "./macbook-scroll";
import ImageCarousel from "../Landing/Slide/Slide";

interface Slide {
  src: string;
  caption: string;
}

interface MacbookScrollV2Props {
  openingTitle?: string | React.ReactNode;
  lidSrc?: string;
  showGradient?: boolean;
}

export const MacbookScrollV2 = ({
  openingTitle,
  lidSrc,
  showGradient = false,
}: MacbookScrollV2Props) => {
  // ===== Phase A / B – Macbook opening & exit =====
  const openingRef = useRef<HTMLDivElement>(null);
  // Track scroll progress of the opening section (0 = section top hits viewport
  // top, 1 = section bottom hits viewport top)
  const { scrollYProgress } = useScroll({
    target: openingRef,
    offset: ["start start", "end start"],
  });

  // Detect small screens once on mount so we can use gentler scaling values.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsMobile(true);
    }
  }, []);

  // Horizontal scale for the lid – gives a gentle zoom-out while opening.
  const scaleX = useTransform(
    scrollYProgress,
    [0, 0.3], // 0-30% of Phase A
    [1.2, isMobile ? 1 : 1.5]
  );
  // Vertical scale (thickness) so the laptop retains correct proportions.
  const scaleY = useTransform(
    scrollYProgress,
    [0, 0.3],
    [0.6, isMobile ? 1 : 1.5]
  );
  // Translate the entire laptop downwards once the lid is flat so it exits the frame.
  const translateY = useTransform(scrollYProgress, [0, 1], [0, 1600]);
  // 3D rotate the lid from -28° (closed) → 0° (flat).
  const rotateX = useTransform(
    scrollYProgress,
    [0.1, 0.12, 0.3],
    [-28, -28, 0]
  );
  // Slide the opening title downward as the user begins to scroll.
  const textTransform = useTransform(scrollYProgress, [0, 0.3], [0, 100]);
  // Fade the title out within the first 20% of the scroll.
  const textOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  // After the laptop is flat we push the LID graphic off screen to the center and zoom in to be full screen.
  const lidShiftX = useTransform(
    scrollYProgress,
    [0, 0.2, 0.4],
    ["0vw", "0vw", "0vw"]
  );
  const lidScale = useTransform(scrollYProgress, [0, 0.4, 0.6], [1, 1.8, 2.2]);
  const lidShiftY = useTransform(
    scrollYProgress,
    [0, 0.2, 0.4],
    ["0vw", "-20vw", "-40vw"]
  );
  // Fade the lid out within the first 40% of the scroll.
  const lidOpacity = useTransform(
    scrollYProgress,
    [0, 0.2, 0.4],
    [0.4, 0.6, 1]
  );

  return (
    <div className="flex flex-col">
      {/* ===== Opening / lid section (min-height 200vh like original) ===== */}
      <div
        ref={openingRef}
        className="flex min-h-[200vh] shrink-0 scale-[0.35] transform flex-col items-center justify-start py-0 [perspective:800px] sm:scale-50 md:scale-100 md:py-80"
      >
        <motion.h2
          style={{ translateY: textTransform, opacity: textOpacity }}
          className="mb-20 text-center text-3xl font-bold text-neutral-800 dark:text-white"
        >
          {openingTitle || (
            <span>
              This Macbook is built with Tailwindcss. <br /> No kidding.
            </span>
          )}
        </motion.h2>

        {/* Lid wrapped with horizontal translate */}
        <motion.div style={{ translateX: lidShiftX, translateY: lidShiftY }}>
          <BaseLid
            src={lidSrc}
            scaleX={scaleX}
            scaleY={scaleY}
            rotate={rotateX}
            translate={translateY as MotionValue<number>}
            lidScale={lidScale}
            lidOpacity={lidOpacity}
          />
        </motion.div>

        {/* Base area */}
        <div className="relative -z-10 h-[22rem] w-[32rem] overflow-hidden rounded-2xl bg-gray-200 dark:bg-[#272729]">
          {/* above keyboard bar */}
          <div className="relative h-10 w-full">
            <div className="absolute inset-x-0 mx-auto h-4 w-[80%] bg-[#050505]" />
          </div>
          <div className="relative flex">
            <div className="mx-auto h-full w-[10%] overflow-hidden">
              <SpeakerGrid />
            </div>
            <div className="mx-auto h-full w-[80%]">
              <Keypad />
            </div>
            <div className="mx-auto h-full w-[10%] overflow-hidden">
              <SpeakerGrid />
            </div>
          </div>
          <Trackpad />
          <div className="absolute inset-x-0 bottom-0 mx-auto h-2 w-20 rounded-tl-3xl rounded-tr-3xl bg-gradient-to-t from-[#272729] to-[#050505]" />
          {showGradient && (
            <div className="absolute inset-x-0 bottom-0 z-50 h-40 w-full bg-gradient-to-t from-white via-white to-transparent dark:from-black dark:via-black"></div>
          )}
        </div>
      </div>
    </div>
  );
};
