'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

interface FooterBottleLogoProps {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export default function FooterBottleLogo({ src, alt, width, height }: FooterBottleLogoProps) {
  return (
    <motion.div
      initial={{ y: 120, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 120, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      className="p-2 rounded-2xl bg-muted/50"
    >
      <Image src={src} alt={alt} width={width} height={height} className="object-contain" />
    </motion.div>
  );
} 