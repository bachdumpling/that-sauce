"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { urlFor } from "@/sanity/lib/image";

interface DynamicLogoProps {
  width: number;
  height: number;
  priority?: boolean;
  // Sanity logo sources
  logoLight?: SanityImageSource & { alt: string };
  logoDark?: SanityImageSource & { alt: string };
  logoDefault?: SanityImageSource & { alt: string };
  brandName?: string;
}

export function DynamicLogo({
  width,
  height,
  priority = false,
  logoLight,
  logoDark,
  logoDefault,
  brandName = "that sauce",
}: DynamicLogoProps) {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get the appropriate logo source
  const getLogoSrc = () => {
    // If we have Sanity logos, use them first
    if (theme === "dark" && logoDark) {
      return urlFor(logoDark).width(width).height(height).url();
    }
    if (theme === "light" && logoLight) {
      return urlFor(logoLight).width(width).height(height).url();
    }
    if (logoDefault) {
      return urlFor(logoDefault).width(width).height(height).url();
    }

    // Fallback to local logos
    return theme === "light"
      ? "/thatsaucelogoheader-black.svg"
      : "/thatsaucelogoheader-white.svg";
  };

  if (!mounted) {
    // Return white logo for server-side rendering since default theme is now dark
    const fallbackSrc = logoDefault 
      ? urlFor(logoDefault).width(width).height(height).url()
      : "/thatsaucelogoheader-white.svg";
    
    return (
      <Image
        src={fallbackSrc}
        alt={brandName}
        width={width}
        height={height}
        priority={priority}
      />
    );
  }

  const logoSrc = getLogoSrc();

  return (
    <Image
      src={logoSrc}
      alt={brandName}
      width={width}
      height={height}
      priority={priority}
    />
  );
}
