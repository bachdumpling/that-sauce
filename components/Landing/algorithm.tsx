"use client";

import React from "react";
import AnimatedContent from "./AnimatedContent/AnimatedContent";
import DecryptedText from "./DecryptedText/DecryptedText";

function Algorithm() {
  return (
    <>
      <div className="flex flex-col items-center justify-center h-screen w-full text-5xl font-medium">
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

      {/* Circular gallery showcasing sample images */}
      <div className="relative flex items-center justify-center py-20 w-screen">
        {/* Sample grayscale images */}
      </div>
    </>
  );
}

export default Algorithm;
