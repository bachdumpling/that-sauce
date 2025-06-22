"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

function Problem() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const images = [
    {
      src: "/landing-images/cinematographer-1.gif",
      alt: "Cinematographer work 1",
      className: "w-36 md:w-96 aspect-video",
      position: "top-[10%] left-[38%]",
      animation: "float-1",
    },
    {
      src: "/landing-images/cinematographer-2.gif",
      alt: "Cinematographer work 2",
      className: "w-36 md:w-64 aspect-video",
      position: "bottom-[20%] left-[42%]",
      animation: "float-2",
    },
    {
      src: "/landing-images/cinematographer-3.gif",
      alt: "Cinematographer work 3",
      className: "w-36 md:w-40 aspect-[9/16] z-[1]",
      position: "bottom-[44%] left-[36%]",
      animation: "float-3",
    },
    {
      src: "/landing-images/fashion-1.png",
      alt: "Fashion work 1",
      className: "w-28 md:w-44 aspect-[3/4]",
      position: "bottom-[45%] right-[24%]",
      animation: "float-4",
    },
    {
      src: "/landing-images/fashion-2.png",
      alt: "Fashion work 2",
      className: "w-28 md:w-36 aspect-[3/4]",
      position: "bottom-[45%] left-[24%]",
      animation: "float-5",
    },
    {
      // center
      src: "/landing-images/fashion-3.png",
      alt: "Fashion work 3",
      className: "w-32 md:w-48 aspect-[3/4]",
      position: "bottom-[40%] right-[36%]",
      animation: "float-6",
    },
    {
      src: "/landing-images/food-commercial-1.gif",
      alt: "Food commercial 1",
      className: "w-30 md:w-64 aspect-video",
      position: "top-[20%] left-[6%]",
      animation: "float-1",
    },
    {
      src: "/landing-images/food-commercial-2.gif",
      alt: "Food commercial 2",
      className: "w-28 md:w-56 aspect-video",
      position: "top-[20%] right-[14%]",
      animation: "float-2",
    },
    {
      src: "/landing-images/food-commercial-3.gif",
      alt: "Food commercial 3",
      className: "w-34 md:w-64 aspect-video",
      position: "bottom-[20%] right-[10%]",
      animation: "float-3",
    },
    {
      src: "/landing-images/illustrator-1.png",
      alt: "Illustrator work 1",
      className: "w-32 md:w-40 aspect-[3/4]",
      position: "bottom-[40%] right-[10%]",
      animation: "float-4",
    },
    {
      src: "/landing-images/illustrator-2.png",
      alt: "Illustrator work 2",
      className: "w-32 md:w-48 aspect-square",
      position: "top-[16%] left-[22%]",
      animation: "float-5",
    },
    {
      src: "/landing-images/illustrator-3.png",
      alt: "Illustrator work 3",
      className: "w-28 md:w-40 aspect-[3/4]",
      position: "bottom-[20%] left-[14%]",
      animation: "float-6",
    },
    {
      src: "/landing-images/photographer-1.png",
      alt: "Photographer work 1",
      className: "w-36 md:w-44 aspect-[3/4]",
      position: "bottom-[40%] left-[10%]",
      animation: "float-1",
    },
    {
      src: "/landing-images/photographer-2.png",
      alt: "Photographer work 2",
      className: "w-28 md:w-40 aspect-[3/4]",
      position: "bottom-[26%] left-[30%]",
      animation: "float-2",
    },
    {
      src: "/landing-images/photographer-3.png",
      alt: "Photographer work 3",
      className: "w-28 md:w-36 aspect-[3/4]",
      position: "bottom-[25%] right-[30%]",
      animation: "float-3",
    },
  ];

  if (!mounted) {
    return (
      <div className="relative min-h-screen w-full">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden border-2 border-red-500">
      <style jsx>{`
        @keyframes float-1 {
          0%,
          100% {
            transform: translateY(0px) translateX(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-8px) translateX(3px) rotate(1deg);
          }
          50% {
            transform: translateY(-4px) translateX(-2px) rotate(-0.5deg);
          }
          75% {
            transform: translateY(-12px) translateX(1px) rotate(0.5deg);
          }
        }

        @keyframes float-2 {
          0%,
          100% {
            transform: translateY(0px) translateX(0px) rotate(0deg);
          }
          33% {
            transform: translateY(-6px) translateX(-4px) rotate(-1deg);
          }
          66% {
            transform: translateY(-10px) translateX(2px) rotate(0.8deg);
          }
        }

        @keyframes float-3 {
          0%,
          100% {
            transform: translateY(0px) translateX(0px) rotate(0deg);
          }
          20% {
            transform: translateY(-5px) translateX(2px) rotate(0.3deg);
          }
          40% {
            transform: translateY(-8px) translateX(-1px) rotate(-0.7deg);
          }
          60% {
            transform: translateY(-3px) translateX(3px) rotate(0.4deg);
          }
          80% {
            transform: translateY(-9px) translateX(-2px) rotate(-0.2deg);
          }
        }

        @keyframes float-4 {
          0%,
          100% {
            transform: translateY(0px) translateX(0px) rotate(0deg);
          }
          30% {
            transform: translateY(-7px) translateX(1px) rotate(0.6deg);
          }
          70% {
            transform: translateY(-11px) translateX(-3px) rotate(-0.4deg);
          }
        }

        @keyframes float-5 {
          0%,
          100% {
            transform: translateY(0px) translateX(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-4px) translateX(-2px) rotate(-0.8deg);
          }
          50% {
            transform: translateY(-9px) translateX(4px) rotate(0.9deg);
          }
          75% {
            transform: translateY(-6px) translateX(-1px) rotate(-0.3deg);
          }
        }

        @keyframes float-6 {
          0%,
          100% {
            transform: translateY(0px) translateX(0px) rotate(0deg);
          }
          40% {
            transform: translateY(-10px) translateX(2px) rotate(0.7deg);
          }
          80% {
            transform: translateY(-5px) translateX(-3px) rotate(-0.6deg);
          }
        }

        .animate-float-1 {
          animation: float-1 6s ease-in-out infinite;
        }
        .animate-float-2 {
          animation: float-2 7s ease-in-out infinite 0.5s;
        }
        .animate-float-3 {
          animation: float-3 8s ease-in-out infinite 1s;
        }
        .animate-float-4 {
          animation: float-4 6.5s ease-in-out infinite 1.5s;
        }
        .animate-float-5 {
          animation: float-5 7.5s ease-in-out infinite 2s;
        }
        .animate-float-6 {
          animation: float-6 5.5s ease-in-out infinite 2.5s;
        }
      `}</style>

      {images.map((image, index) => (
        <div
          key={index}
          className={`absolute ${image.position} transform-gpu`}
          style={{
            zIndex: Math.floor(Math.random() * 10) + 1,
          }}
        >
          <div
            className={`animate-${image.animation} hover:scale-105 transition-transform duration-300`}
          >
            <Image
              src={image.src}
              alt={image.alt}
              width={200}
              height={200}
              className={`${image.className} shadow-lg hover:shadow-xl transition-shadow duration-300 object-cover`}
              priority={index < 5}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default Problem;
