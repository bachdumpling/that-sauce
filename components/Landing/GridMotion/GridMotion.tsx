import { useEffect, useRef, FC } from "react";
import { gsap } from "gsap";
import { useScroll, useTransform, motion } from "motion/react";

interface GridMotionProps {
  items?: string[];
  gradientColor?: string;
}

const GridMotion: FC<GridMotionProps> = ({
  items = [],
  gradientColor = "black",
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const { scrollYProgress } = useScroll();

  // Images from problem-images folder
  const problemImages = [
    "/problem-images/image-1.png",
    "/problem-images/image-2.png",
    "/problem-images/image-3.png",
    "/problem-images/image-4.png",
    "/problem-images/image-5.png",
    "/problem-images/image-6.png",
    "/problem-images/image-7.png",
    "/problem-images/image-8.png",
    "/problem-images/image-9.png",
    "/problem-images/image-10.png",
  ];

  // Ensure the grid has 28 items (4 rows x 7 columns) by looping through images
  const totalItems = 28;
  const combinedItems = Array.from({ length: totalItems }, (_, index) => 
    problemImages[index % problemImages.length]
  );

  // Transform scroll progress to movement values for different rows
  const row1Transform = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const row2Transform = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const row3Transform = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const row4Transform = useTransform(scrollYProgress, [0, 1], [0, -180]);

  const rowTransforms = [row1Transform, row2Transform, row3Transform, row4Transform];

  return (
    <div ref={gridRef} className="h-full w-full overflow-hidden">
      <section
        className="w-full h-full overflow-hidden relative flex items-center justify-center"
        style={{
          background: `radial-gradient(circle, ${gradientColor} 0%, transparent 100%)`,
        }}
      >
        {/* Noise overlay */}
        <div className="absolute inset-0 pointer-events-none z-[4]"></div>
        <div className="gap-4 flex-none relative w-[150vw] h-[150vh] grid grid-rows-4 grid-cols-1 rotate-[-15deg] origin-center z-[2]">
          {Array.from({ length: 4 }, (_, rowIndex) => (
            <motion.div
              key={rowIndex}
              className="grid gap-4 grid-cols-7"
              style={{ 
                willChange: "transform, filter",
                x: rowTransforms[rowIndex]
              }}
              ref={(el) => {
                rowRefs.current[rowIndex] = el;
              }}
            >
              {Array.from({ length: 7 }, (_, itemIndex) => {
                const imageUrl = combinedItems[rowIndex * 7 + itemIndex];
                return (
                  <div key={itemIndex} className="relative">
                    <div className="relative w-full h-full overflow-hidden rounded-[10px] bg-[#111] flex items-center justify-center">
                      <img
                        src={imageUrl}
                        alt={`Problem image ${(rowIndex * 7 + itemIndex) % problemImages.length + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </div>
                );
              })}
            </motion.div>
          ))}
        </div>
        <div className="relative w-full h-full top-0 left-0 pointer-events-none"></div>
      </section>
    </div>
  );
};

export default GridMotion;
