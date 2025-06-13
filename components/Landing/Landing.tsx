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
import Demo from "./demo";
import TypewriterSearch from "./TypewriterSearch";

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
    <div className="flex flex-col gap-20 relative">
      <div className="flex flex-col items-center justify-center">
        <Image
          src="/logo-dark.png"
          alt="Background"
          width={400}
          height={400}
          className="object-cover pt-10 "
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

      {/* Algorithm Section */}
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

      {/* Problem Section */}
      <div ref={scrollRef} className="relative h-[500vh]">
        <DraggableCardContainer className="sticky top-0 grid h-screen w-full place-items-center overflow-clip">
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
              [0, (Math.floor(i / 2) * 600 + 800) * side]
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
                className={`${item.className} h-[50vh] w-[50vh] aspect-[4/3] rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg`}
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
                  className="pointer-events-none relative z-10 object-cover"
                />
                <h3 className="mt-4 text-center text-2xl font-bold text-neutral-700 dark:text-neutral-300">
                  {item.title}
                </h3>
              </DraggableCardBody>
            );
          })}
        </DraggableCardContainer>
      </div>

      {/* Demo Section */}
      <div className="flex flex-col items-center justify-center">
        <TypewriterSearch />
      </div>

      <div className="flex flex-col items-center justify-center">
        <Demo />
      </div>
    </div>
  );
}

export default Landing;
