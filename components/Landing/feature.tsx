import React from "react";
import ScrollVelocity from "./ScrollVelocity/ScrollVelocity";

function Feature() {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="z-20 flex flex-col items-center justify-center">
        <h1 className="text-8xl font-bold font-sauce">Hello</h1>
        <ScrollVelocity
          texts={[
            "That Sauce is Built different",
            "That Sauce is Built different",
          ]}
          velocity={50}
          className="text-5xl font-semibold"
        />
      </div>
    </div>
  );
}

export default Feature;
