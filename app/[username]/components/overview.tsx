"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Plus } from "lucide-react";
import { Creator, Project } from "@/types";

// Define local types that aren't in main types
interface Image {
  id: string;
  url: string;
  alt_text?: string;
  resolutions?: {
    high_res?: string;
    low_res?: string;
  };
}

interface Video {
  id: string;
  title?: string;
  vimeo_id?: string;
  youtube_id?: string;
  url?: string;
  description?: string;
}

interface OverviewProps {
  creator: Creator & {
    projects?: Array<
      Project & {
        images?: Image[];
        videos?: Video[];
      }
    >;
    isOwner?: boolean;
  };
}

// Helper function to shuffle an array (Fisher-Yates shuffle)
const shuffleArray = <T,>(array: T[]): T[] => {
  if (!array) return [];
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap elements
  }
  return shuffled;
};

export function Overview({ creator }: OverviewProps) {
  return (
    <div className="w-full space-y-8">
      {/* Projects Masonry Grid */}
      {creator.projects && creator.projects.length > 0 ? (
        <div className="mt-8">
          <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
            {creator.projects.map((project) => {
              // Filter images with a valid URL and shuffle them
              const availableImages: Image[] =
                project.images?.filter(
                  (img: Image) =>
                    img.url ||
                    img.resolutions?.high_res ||
                    img.resolutions?.low_res
                ) || [];
              // Select up to 3 random images
              const selectedImages = shuffleArray(availableImages).slice(0, 3);

              return (
                <div key={project.id}>
                  {selectedImages.length > 0 ? (
                    // Map over the selected images and render them
                    selectedImages.map((image: Image, index: number) => (
                      <div
                        key={image.id || index}
                        className="overflow-hidden rounded-lg bg-gray-100 break-inside-avoid mb-4 relative block"
                      >
                        {" "}
                        {/* Use block to stack images */}
                        <Image
                          src={
                            image.url ||
                            image.resolutions?.high_res ||
                            image.resolutions?.low_res ||
                            ""
                          }
                          alt={
                            image.alt_text ||
                            project.title ||
                            `Project image ${index + 1}`
                          }
                          width={500}
                          height={300}
                          className="w-full h-auto transition-transform duration-300 hover:scale-105 block"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          style={{ objectFit: "cover" }}
                          priority={index === 0}
                        />
                      </div>
                    ))
                  ) : (
                    // Fallback if no images are available
                    <div className="flex items-center justify-center h-48 bg-gray-200 rounded-lg">
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 space-y-6">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-semibold text-foreground">
              {creator.isOwner
                ? "Welcome to your portfolio!"
                : "No work to show yet"}
            </h3>
            <p className="text-muted-foreground max-w-lg">
              {creator.isOwner
                ? "This is where your creative work will shine. Start by adding your first project to build an amazing portfolio."
                : `${creator.first_name || creator.username} is working on some amazing projects. Check back soon!`}
            </p>
          </div>
          {creator.isOwner && (
            <Button asChild size="lg" className="mt-4">
              <Link href="/project/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Project
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
