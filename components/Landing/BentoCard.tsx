import React, { useRef, useCallback } from "react";

interface MediaAsset {
  _id: string;
  url: string;
  mimeType: string;
  size: number;
}

interface BentoCardProps {
  title?: string;
  subtitle?: string;
  video?: {
    asset: MediaAsset;
  };
  image?: {
    asset: MediaAsset;
    alt?: string;
  };
  backgroundColor?: string;
  colSpan?: number;
  rowSpan?: number;
  className?: string;
  children?: React.ReactNode;
}

function BentoCard({
  title,
  subtitle,
  video,
  image,
  backgroundColor = "bg-gray-500",
  colSpan = 1,
  rowSpan = 1,
  className = "",
  children,
}: BentoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
  }, []);

  return (
    <div
      className={`shadow-2xl h-full rounded-2xl relative group overflow-hidden ${backgroundColor} ${className}`}
      style={{
        gridColumn: `span ${colSpan}`,
        gridRow: `span ${rowSpan}`,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Video background */}
      {video?.asset?.url && (
        <video
          ref={videoRef}
          src={video.asset.url}
          loop
          muted
          className="absolute inset-0 object-cover w-full h-full rounded-2xl"
        />
      )}

      {/* Image background */}
      {image?.asset?.url && !video && (
        <img
          src={image.asset.url}
          alt={image.alt || title || ""}
          className="absolute inset-0 object-cover w-full h-full rounded-2xl"
        />
      )}

      {/* Gradient overlay for text readability (only when there's media) */}
      {(video?.asset?.url || image?.asset?.url) && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent rounded-2xl"></div>
      )}

      {/* Custom children content */}
      {children}

      {/* Text content (only if title or subtitle provided) */}
      {(title || subtitle) && (
        <div className="absolute left-0 bottom-0 w-full p-4 z-10">
          {title && (
            <h2 className="text-2xl font-semibold text-white transition-all duration-500 ease-in-out">
              {title}
            </h2>
          )}
          {subtitle && (
            <div className="max-h-0 group-hover:max-h-40 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-in-out overflow-hidden">
              <p className="text-md text-white/90 pt-1">{subtitle}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BentoCard;
