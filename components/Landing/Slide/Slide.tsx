"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import ScrollReveal from "../ScrollReveal/ScrollReveal";

function SlideItem({ i }: { i: number }) {
  // The first slide is always visible and doesn't animate
  if (i === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center p-4">
        <div className="h-full max-w-2xl rounded-2xl flex items-center justify-center text-start">
          <ScrollReveal
            text="Find perfect creatives in minutes, not weeks. The best matches for your team, every time."
            className="text-4xl font-bold text-center"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center py-4 px-2">
      <div className="h-full w-full rounded-2xl">
        <img
          src={`/cube-images/cube-${i}.png`}
          alt="Slide"
          className="h-full w-full object-cover rounded-2xl"
        />
      </div>
    </div>
  );
}

export default function Slide() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const x = useTransform(scrollYProgress, [0, 1], ["0vw", `-300vw`]);

  return (
    <section
      ref={containerRef}
      style={{ height: `300vh` }}
      className="relative bg-transparent"
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        <motion.div className="flex h-full items-center" style={{ x }}>
          {[1, 2, 3, 4].map((_, i) => (
            <div key={i} className="h-full w-screen flex-shrink-0">
              <SlideItem i={i} />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
