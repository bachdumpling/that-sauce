"use client";

import { useState } from "react";
import Link from "next/link";
import { Home, Users, Settings, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function StudioNavigation() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Card className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border shadow-lg">
        <div className="p-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs font-medium">
                That Sauce
              </Badge>
              <span className="text-xs text-muted-foreground">Studio</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
          </div>

          {/* Always visible quick actions */}
          <div className="flex space-x-1">
            <Button variant="outline" size="sm" asChild>
              <Link href="/" className="flex items-center space-x-1">
                <Home className="h-3 w-3" />
                <span className="text-xs">Site</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin" className="flex items-center space-x-1">
                <Users className="h-3 w-3" />
                <span className="text-xs">Admin</span>
              </Link>
            </Button>
          </div>

          {/* Expanded navigation */}
          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-border space-y-2">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Quick Access
              </div>

              <div className="grid grid-cols-1 gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="justify-start h-8"
                >
                  <Link href="/admin/creators">
                    <Users className="h-3 w-3 mr-2" />
                    <span className="text-xs">Creators</span>
                  </Link>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="justify-start h-8"
                >
                  <Link href="/admin/content">
                    <Settings className="h-3 w-3 mr-2" />
                    <span className="text-xs">Content</span>
                  </Link>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="justify-start h-8"
                >
                  <Link href="/search">
                    <Settings className="h-3 w-3 mr-2" />
                    <span className="text-xs">Search</span>
                  </Link>
                </Button>
              </div>

              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Full-screen Sanity Studio
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
