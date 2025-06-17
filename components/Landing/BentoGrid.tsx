import React from "react";
import BentoCard from "./BentoCard";

interface MediaAsset {
  _id: string;
  url: string;
  mimeType: string;
  size: number;
}

export interface BentoCardConfig {
  id: string;
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

interface BentoGridProps {
  cards: BentoCardConfig[];
  className?: string;
  gridCols?: "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10";
  gap?: "2" | "4" | "6" | "8";
}

function BentoGrid({ 
  cards, 
  className = "", 
  gridCols = "3",
  gap = "4"
}: BentoGridProps) {
  const gridClasses = `grid-cols-1 md:grid-cols-${gridCols}`;
  const gapClasses = `gap-${gap}`;
  
  // Calculate the maximum rowSpan to ensure enough rows are created
  const maxRowSpan = Math.max(...cards.map(card => card.rowSpan || 1));
  const totalRows = Math.max(Math.ceil(cards.length / parseInt(gridCols)), maxRowSpan);
  
  return (
    <div 
      className={`grid ${gridClasses} ${gapClasses} w-full h-full p-4 ${className}`} 
      style={{ 
        gridAutoRows: 'minmax(200px, 1fr)',
        gridTemplateRows: `repeat(${totalRows}, minmax(200px, 1fr))`
      }}
    >
      {cards.map((card) => (
        <BentoCard
          key={card.id}
          title={card.title}
          subtitle={card.subtitle}
          video={card.video}
          image={card.image}
          backgroundColor={card.backgroundColor}
          colSpan={card.colSpan}
          rowSpan={card.rowSpan}
          className={card.className}
        >
          {card.children}
        </BentoCard>
      ))}
    </div>
  );
}

export default BentoGrid; 