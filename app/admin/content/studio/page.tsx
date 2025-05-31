"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Loader2, RefreshCw, Maximize2 } from "lucide-react";
import Link from "next/link";

export default function EmbeddedStudioPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [key, setKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    setKey((prev) => prev + 1);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        {/* Fullscreen Header */}
        <div className="absolute top-0 left-0 right-0 bg-background/95 backdrop-blur border-b z-50 p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
            <div>
              <h1 className="text-lg font-bold">Sanity Studio</h1>
              <p className="text-sm text-muted-foreground">Full-screen mode</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button variant="outline" size="sm" onClick={toggleFullscreen}>
                <Maximize2 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Exit Fullscreen</span>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/studio" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">New Tab</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Fullscreen Studio */}
        <div className="pt-24 sm:pt-20 h-full">
          <div className="relative h-full">
            {isLoading && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-muted-foreground">
                    Loading Sanity Studio...
                  </span>
                </div>
              </div>
            )}

            <iframe
              key={key}
              src="/studio"
              className="w-full h-full border-0"
              title="Sanity Studio"
              onLoad={() => setIsLoading(false)}
              allow="camera; microphone; fullscreen"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Sanity Studio
          </h1>
          <p className="text-muted-foreground mt-2">
            Embedded content management interface
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} size="sm">
            <RefreshCw className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button variant="outline" onClick={toggleFullscreen} size="sm">
            <Maximize2 className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Fullscreen</span>
          </Button>
          <Button variant="outline" asChild size="sm">
            <Link href="/studio" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Full Studio</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Embedded Studio */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-muted-foreground">
                    Loading Sanity Studio...
                  </span>
                </div>
              </div>
            )}

            <iframe
              key={key}
              src="/studio"
              className="w-full h-[calc(100vh-240px)] min-h-[600px] border-0"
              title="Sanity Studio"
              onLoad={() => setIsLoading(false)}
              allow="camera; microphone; fullscreen"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Tips for Using Embedded Studio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              Use the "Fullscreen" button for a better embedded experience
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              The embedded studio is great for quick edits and content updates
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              For the best experience, use "Full Studio" to open in a new tab
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
