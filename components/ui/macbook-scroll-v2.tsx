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

interface Slide {
  src: string;
  caption: string;
}

interface MacbookScrollV2Props {
  openingTitle?: string | React.ReactNode;
  lidSrc?: string;
  gallery: Slide[];
  showGradient?: boolean;
}

export const MacbookScrollV2 = ({
  openingTitle,
  lidSrc,
  gallery,
  showGradient = false,
}: MacbookScrollV2Props) => {
  // ===== Phase A / B – Macbook opening & exit =====
  const openingRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: openingRef,
    offset: ["start start", "end start"],
  });

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsMobile(true);
    }
  }, []);

  // Original transforms
  const scaleX = useTransform(
    scrollYProgress,
    [0, 0.3],
    [1.2, isMobile ? 1 : 1.5]
  );
  const scaleY = useTransform(
    scrollYProgress,
    [0, 0.3],
    [0.6, isMobile ? 1 : 1.5]
  );
  const translateY = useTransform(scrollYProgress, [0, 1], [0, 1600]);
  const rotateX = useTransform(
    scrollYProgress,
    [0.1, 0.12, 0.3],
    [-28, -28, 0]
  );
  const textTransform = useTransform(scrollYProgress, [0, 0.3], [0, 100]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  // New horizontal shift for the lid – 0.30 → 0.45 progress
  const lidShiftX = useTransform(
    scrollYProgress,
    [0.4, 0.65],
    ["0vw", "-100vw"]
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
        <motion.div style={{ translateX: lidShiftX }}>
          <BaseLid
            src={lidSrc}
            scaleX={scaleX}
            scaleY={scaleY}
            rotate={rotateX}
            translate={translateY as MotionValue<number>}
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

      {/* ===== Phase C – Horizontal gallery ===== */}
      <HorizontalGallery slides={gallery} />
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                              HorizontalGallery                             */
/* -------------------------------------------------------------------------- */

const HorizontalGallery = ({ slides }: { slides: Slide[] }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  // Total scroll distance = (slides.length) * 100vh
  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ["start start", "end start"],
  });

  // Optional fade out at the very end (last 10% of the section)
  const opacity = useTransform(scrollYProgress, [0.9, 1], [1, 0]);

  return (
    <div
      ref={wrapperRef}
      className="relative w-full"
      style={{ height: `${slides.length * 100}vh` }}
    >
      <motion.div
        style={{ opacity }}
        className="sticky top-0 h-screen w-screen"
      >
        {slides.map((slide, idx) => (
          <GallerySlide
            key={idx}
            slide={slide}
            index={idx}
            total={slides.length}
            progress={scrollYProgress}
          />
        ))}
      </motion.div>
    </div>
  );
};

interface GallerySlideProps {
  slide: Slide;
  index: number;
  total: number;
  progress: MotionValue<number>;
}

const GallerySlide = ({ slide, index, total, progress }: GallerySlideProps) => {
  const slice = 1 / total;
  // Ultra-compressed timeline within each slice
  const entryStart = index * slice; // immediately on slice start
  const center = index * slice + slice * 0.15; // centre early
  const exitEnd = index * slice + slice * 0.3; // exit by 30% of slice

  // X position: 100vw -> 0 -> -100vw during its active window
  const translateX = useTransform(
    progress,
    [entryStart, center, exitEnd],
    ["100vw", "0vw", "-100vw"]
  );
  // Parallax Y and scale relative to translateX (optional)
  const translateY = useTransform(progress, [entryStart, exitEnd], [20, -20]);
  const scale = useTransform(progress, [entryStart, exitEnd], [1, 1.05]);
  // Caption opacity peaks when centered
  const captionOpacity = useTransform(
    progress,
    [entryStart, center, exitEnd],
    [0, 1, 0]
  );

  return (
    <motion.div
      style={{ translateX, zIndex: total - index }}
      className="absolute inset-0 flex flex-col items-center justify-center"
    >
      <motion.img
        src={slide.src}
        alt={slide.caption}
        style={{ translateY, scale }}
        className="max-h-[70vh] w-auto object-contain"
      />
      <motion.p
        style={{ opacity: captionOpacity }}
        className="mt-8 text-center text-xl font-semibold text-neutral-800 dark:text-white whitespace-pre-wrap"
      >
        {slide.caption}
      </motion.p>
    </motion.div>
  );
};
