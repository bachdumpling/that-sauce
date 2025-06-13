import React from "react";
import { MacbookScrollV2 } from "@/components/ui/macbook-scroll-v2";

function Demo() {
  return (
    <div className="flex flex-col items-center justify-center">
      <MacbookScrollV2
        openingTitle={
          <span>
            Find exactly what you are looking for… <br />
            in minutes, not weeks
          </span>
        }
        lidSrc="/demo-screenshot.png"
        gallery={[
          { src: "/cube-images/cube-1.png", caption: "Concept ideation" },
          { src: "/cube-images/cube-2.png", caption: "Iterative refinement" },
          {
            src: "/cube-images/cube-3.png",
            caption: "Final production\n(ready to ship)",
          },
        ]}
        showGradient={false}
      />
    </div>
  );
}

export default Demo;
