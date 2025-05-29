"use client";

import { Creator } from "@/types";
import { Overview } from "./overview";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ImageIcon, Plus } from "lucide-react";

interface CreatorClientProps {
  creator: Creator;
  username: string;
}

export function CreatorClient({ creator, username }: CreatorClientProps) {
  const pathname = usePathname();

  // Determine active tab based on current path
  const getActiveTab = () => {
    if (pathname.endsWith(`/${username}`)) return "overview";
    if (pathname.includes(`/${username}/work`)) return "work";
    if (pathname.includes(`/${username}/about`)) return "about";
    return "overview";
  };

  const activeTab = getActiveTab();

  return (
    <>
      {/* Main content area based on active tab */}
      {activeTab === "overview" && <Overview creator={creator} />}

      {activeTab === "work" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {creator.projects && creator.projects.length > 0 ? (
            <>
              {creator.isOwner && (
                <div className="group hover:opacity-90 transition-opacity">
                  <div className="overflow-hidden">
                    <div className="w-full h-72 object-cover rounded-[16px] border border-gray-200 grid place-items-center bg-muted/50 hover:bg-muted/70 transition-colors">
                      <Link
                        href="/project/new"
                        className="flex flex-col items-center justify-center space-y-2"
                      >
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Plus className="h-6 w-6 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">
                          Add Project
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
              {creator.projects.map((project) => (
                <Link
                  href={`/${username}/work/${project.id}`}
                  key={project.id}
                  className="group hover:opacity-90 transition-opacity"
                >
                  <div className="overflow-hidden">
                    {project.images && project.images.length > 0 ? (
                      <img
                        src={project.images[0].url}
                        alt={project.title}
                        className="w-full h-72 object-cover rounded-[16px] border border-gray-200"
                      />
                    ) : (
                      <div className="w-full h-72 bg-muted flex items-center justify-center rounded-[16px] border border-gray-200">
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="pt-4">
                      <h3 className="font-medium text-lg">{project.title}</h3>
                      {project.description && (
                        <p className="text-muted-foreground text-sm line-clamp-2 mt-1">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </>
          ) : (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 flex flex-col items-center justify-center py-16 space-y-6">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-semibold text-foreground">
                  {creator.isOwner
                    ? "Ready to showcase your work?"
                    : "No projects yet"}
                </h3>
                <p className="text-muted-foreground max-w-md">
                  {creator.isOwner
                    ? "Start building your portfolio by adding your first project. Show the world what you can create."
                    : `${creator.first_name || creator.username} hasn't shared any projects yet.`}
                </p>
              </div>
              {creator.isOwner && (
                <Button asChild size="lg" className="mt-4">
                  <Link href="/project/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Project
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "about" && (
        <div className="prose dark:prose-invert max-w-none">
          <h2>About {creator.first_name || creator.username}</h2>
          {creator.bio ? (
            <p>{creator.bio}</p>
          ) : (
            <p className="text-muted-foreground">No bio available.</p>
          )}

          {creator.location && (
            <div className="mt-6">
              <h3>Location</h3>
              <p>{creator.location}</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
