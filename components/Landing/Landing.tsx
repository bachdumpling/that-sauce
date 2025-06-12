"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Hero from "./hero";
import { LandingPageData } from "@/types/sanity";
import Particles from "./Particles/Particles";
import ScrollReveal from "./ScrollReveal/ScrollReveal";
import DecryptedText from "./DecryptedText/DecryptedText";
import AnimatedContent from "./AnimatedContent/AnimatedContent";
import {
  DraggableCardContainer,
  DraggableCardBody,
} from "@/components/ui/draggable-card";
import Image from "next/image";

function Landing({ landingPageData }: { landingPageData?: LandingPageData }) {
  const items = [
    {
      title: "Dribbble",
      image: "/problem-images/image-1.png",
      className: "absolute top-10 left-[20%] rotate-[-5deg]",
      top: 10,
    },
    {
      title: "Behance",
      image: "/problem-images/image-2.png",
      className: "absolute top-40 left-[25%] rotate-[-7deg]",
      top: 40,
    },
    {
      title: "Instagram",
      image: "/problem-images/image-3.png",
      className: "absolute top-5 left-[40%] rotate-[8deg]",
      top: 5,
    },
    {
      title: "LinkedIn",
      image: "/problem-images/image-4.png",
      className: "absolute top-32 left-[55%] rotate-[10deg]",
      top: 32,
    },
    {
      title: "Figma",
      image: "/problem-images/image-5.png",
      className: "absolute top-20 right-[35%] rotate-[2deg]",
      top: 20,
    },
    {
      title: "Upwork",
      image: "/problem-images/image-6.png",
      className: "absolute top-24 left-[45%] rotate-[-7deg]",
      top: 24,
    },
    {
      title: "Fiverr",
      image: "/problem-images/image-7.png",
      className: "absolute top-8 left-[30%] rotate-[4deg]",
      top: 8,
    },
  ];

  const sortedItems = [...items].sort((a, b) => a.top - b.top);

  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start start", "end end"],
  });

  const { scrollYProgress: heroScrollYProgress } = useScroll();
  const heroParallaxY = useTransform(heroScrollYProgress, [0, 1], ["0%", "50%"]);

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
    <div className="relative">
      <div className="flex flex-col items-center justify-center mt-10">
        <Image
          src="/logo-dark.png"
          alt="Background"
          width={400}
          height={400}
          className="object-cover"
        />
        {/* <div style={{ width: "100%", height: "100%", position: "absolute" }}>
        <Particles
          particleColors={["#e21313", "#ff9d00", "#1fe55c"]}
          particleCount={200}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover={true}
          alphaParticles={false}
          disableRotation={false}
        />
      </div> */}

        <div className="flex flex-col items-center justify-center mt-10"></div>
        <div className="h-screen w-full">
          {/* Hero Section */}
          <Hero
            landingPageData={landingPageData}
            heroParallaxY={heroParallaxY}
          />
        </div>
      </div>

      <div className="flex h-screen w-full flex-col items-center justify-center gap-20 text-5xl font-medium">
        {/* <ScrollReveal
          baseOpacity={0}
          enableBlur={true}
          baseRotation={5}
          blurStrength={10}
        >
          Hit it hard
        </ScrollReveal> */}
        <AnimatedContent
          distance={100}
          direction="vertical"
          reverse={false}
          duration={1.2}
          ease="power3.inOut"
          initialOpacity={0}
          animateOpacity
          scale={1.1}
          threshold={0.2}
          delay={0}
        >
          <DecryptedText
            text="Stop getting lost in the noise"
            speed={80}
            maxIterations={20}
            parentClassName="text-5xl font-medium"
            encryptedClassName="text-5xl font-medium"
            animateOn="view"
            revealDirection="center"
          />
        </AnimatedContent>
      </div>
      <div ref={scrollRef} className="relative h-[500vh]">
        <DraggableCardContainer className="sticky top-0 flex h-screen w-full items-center justify-center overflow-clip">
          <motion.p
            style={{ opacity: textOpacity }}
            className="absolute top-1/2 mx-auto max-w-sm -translate-y-3/4 text-center text-2xl font-black text-neutral-400 md:text-4xl dark:text-neutral-800"
          >
            No more endless scrolling through portfolios
          </motion.p>
          {sortedItems.map((item, i) => {
            const side = i % 2 === 0 ? -1 : 1;
            const cardStart = animationStart + i * cardAnimationStep;
            const cardEnd = animationStart + (i + 1) * cardAnimationStep;

            const x = useTransform(
              scrollYProgress,
              [cardStart, cardEnd],
              [0, (Math.floor(i / 2) * 350 + 500) * side]
            );
            const rotate = useTransform(
              scrollYProgress,
              [cardStart, cardEnd],
              [0, side * 20]
            );
            const y = useTransform(
              scrollYProgress,
              [cardStart, cardEnd],
              [0, -i * 20]
            );
            const zIndex = numCards - i;

            return (
              <DraggableCardBody
                key={item.title}
                className={item.className}
                style={{
                  x,
                  y,
                  rotate,
                  zIndex,
                }}
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="pointer-events-none relative z-10 h-80 w-80 object-cover"
                />
                <h3 className="mt-4 text-center text-2xl font-bold text-neutral-700 dark:text-neutral-300">
                  {item.title}
                </h3>
              </DraggableCardBody>
            );
          })}
        </DraggableCardContainer>
      </div>
    </div>
  );
}

export default Landing;
