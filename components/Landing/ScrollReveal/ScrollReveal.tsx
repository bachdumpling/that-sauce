"use client";

import { useScroll, useTransform, motion, MotionValue } from "framer-motion";
import React, { useRef } from "react";

// The props for the main ScrollReveal component.
interface ScrollRevealProps {
  // The text content to be animated.
  text: string;
  // Optional CSS classes to apply to the container.
  className?: string;
}

// This is the main component that orchestrates the scroll reveal animation.
const ScrollReveal: React.FC<ScrollRevealProps> = ({ text, className }) => {
  // A ref to the paragraph element that will be the target for scroll tracking.
  const container = useRef<HTMLParagraphElement>(null);

  // useScroll hook from Framer Motion to track the scroll progress of the container.
  // 'target' is the element to track.
  // 'offset' defines the start and end points of the animation based on the container's visibility in the viewport.
  // ["start end"] means the animation starts when the top of the container hits the bottom of the viewport.
  // ["end start"] means the animation ends when the bottom of the container hits the top of the viewport.
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start end", "end start"],
  });

  // Splits the input text into an array of words. The animation will be applied to each word.
  const words = text.split(" ");
  return (
    // The container paragraph for the words. It's important to pass the ref here.
    <p
      ref={container}
      className={`flex flex-wrap text-4xl font-bold ${className}`}
    >
      {/* Map over the words array to render each word with its own animation. */}
      {words.map((word, i) => {
        // Calculate the start and end point of the animation for this specific word.
        // This distributes the animation progress across all the words.
        const start = i / words.length;
        const end = start + 1 / words.length;
        return (
          <Word key={i} progress={scrollYProgress} range={[start, end]}>
            {word}
          </Word>
        );
      })}
    </p>
  );
};

// The props for the Word component.
interface WordProps {
  // The word to be rendered.
  children: string;
  // The scroll progress from the parent component. It's a MotionValue between 0 and 1.
  progress: MotionValue<number>;
  // The start and end range for this word's animation.
  range: [number, number];
}

// This component renders an individual word and applies the color-changing animation.
const Word: React.FC<WordProps> = ({ children, progress, range }) => {
  // useTransform hook maps the scrollYProgress (0 to 1) to a new value based on the word's specific range.
  // When scrollYProgress is within the word's range, 'amount' will go from 0 to 1.
  const amount = useTransform(progress, range, [0, 1]);
  return (
    // A span to wrap each word. 'mr-3' adds margin to the right, and 'mt-2' for top margin.
    <span className="mt-2 mr-3">
      {/* This is the greyed-out (background) version of the word. It's always visible but with low opacity. */}
      <span className="absolute opacity-20">{children}</span>
      {/* This is the white (foreground) version of the word. Its opacity is animated based on the scroll position. */}
      <motion.span style={{ opacity: amount }}>{children}</motion.span>
    </span>
  );
};

export default ScrollReveal;
