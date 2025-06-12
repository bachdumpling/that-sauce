"use client";
import React from "react";
import Typewriter from "typewriter-effect";
import { Search } from "lucide-react";
import ShapeBlur from "./ShapeBlur/ShapeBlur";

const TypewriterSearch = () => {
  return (
    <div className="relative w-full max-w-xl mx-auto mt-8 flex justify-center items-center">
      <div className="absolute inset-0 h-full w-full z-10">
        <ShapeBlur
          variation={0}
          pixelRatioProp={window.devicePixelRatio || 1}
          shapeWidth={20}
          shapeHeight={1.4}
          roundness={1.5}
          borderSize={0.1}
          circleSize={2}
          circleEdge={2}
        />
      </div>
      <div className="relative w-10/12 rounded-full py-3 pl-12 pr-4 text-white text-lg z-10">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
          <Search className="text-gray-400" />
        </div>
        <Typewriter
          options={{
            strings: [
              "Photographer",
              "Videographer",
              "UI/UX Designer",
              "Animator",
              "Creative Director",
            ],
            autoStart: true,
            loop: true,
            delay: 75,
            deleteSpeed: 50,
            wrapperClassName: "inline",
            cursorClassName: "inline",
          }}
        />
      </div>
    </div>
  );
};

export default TypewriterSearch;
