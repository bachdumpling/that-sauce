"use client";

import React from "react";
import { motion, useScroll, useTransform } from "motion/react";
import GridMotion from "./GridMotion/GridMotion";
import ScrollFloat from "./ScrollFloat/ScrollFloat";
import ScrollReveal from "./ScrollReveal/ScrollReveal";

function Problem() {
  const { scrollYProgress } = useScroll();

  // Transform scroll progress for blur effect on GridMotion
  // Blur should be active when textOpacity is 1 (scrollYProgress between 0.3 and 0.7)
  // We'll add a slight ramp-up and ramp-down to the blur effect.
  const blur = useTransform(
    scrollYProgress,
    // Input scrollYProgress points
    [0, 0.1, 0.3, 0.5, 0.7, 0.8, 0.9, 1],
    // Output blur values (in pixels)
    [0, 0.05, 0.1, 2, 8, 2, 1, 0]
  );

  // Transform scroll progress for text opacity - shows in the middle
  const textOpacity = useTransform(
    scrollYProgress,
    [0, 0.3, 0.7, 1],
    [0, 1, 1, 0]
  );

  // Transform scroll progress for background opacity - darkens when text is visible
  const backgroundOpacity = useTransform(
    scrollYProgress,
    // Input scrollYProgress points (similar to textOpacity for synchronization)
    [0, 0.1, 0.3, 0.5, 0.7, 0.8, 0.9, 1],
    // Output opacity values (0 is fully transparent, 0.8 is darkish)
    [0, 0.2, 0.4, 0.6, 0.8, 0.6, 0.4, 0]
  );

  // Transform scroll progress for text scale
  const textScale = useTransform(
    scrollYProgress,
    [0, 0.3, 0.7, 1],
    [0.8, 1, 1, 0.8]
  );

  return (
    <div className="w-full h-[200vh] relative flex flex-col items-center justify-center">
      {/* Grid Motion with blur animation */}
      <motion.div
        className="absolute top-0 left-0 w-full h-full"
        style={{
          filter: useTransform(blur, (value) => `blur(${value}px)`),
        }}
      >
        <div className="w-full h-full">
          <GridMotion />
        </div>
      </motion.div>

      {/* Background darken overlay */}
      <motion.div
        className="absolute top-0 left-0 w-full h-full bg-black"
        style={{
          opacity: backgroundOpacity,
        }}
      />

      {/* Text content with opacity and scale animation */}
      <motion.div
        className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center text-4xl font-extrabold uppercase z-10 text-white text-center px-20"
        style={{
          opacity: textOpacity,
          scale: textScale,
        }}
      >
        <ScrollFloat
          animationDuration={1}
          ease="back.inOut(2)"
          scrollStart="center bottom+=40%"
          scrollEnd="bottom bottom-=80%"
          stagger={0.03}
        >
          the endless scroll is over
        </ScrollFloat>
      </motion.div>
    </div>
  );
}

export default Problem;
