import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, FileText, Globe, Users, BookOpen } from "lucide-react";
import Link from "next/link";

export default function AdminContentPage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Content Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your site content, blog posts, case studies, and marketing
          materials using Sanity Studio.
        </p>
      </div>

      {/* Content Overview Cards */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Marketing Pages
            </CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              Landing pages, about, pricing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blog Posts</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              Articles and insights
            </p>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Case Studies</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Creator spotlights</p>
          </CardContent>
        </Card>
      </div>

      {/* Studio Access Options */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Embedded Studio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Embedded Studio
            </CardTitle>
            <CardDescription>
              Access Sanity Studio directly within the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/25">
              <div className="text-center p-4">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Sanity Studio Iframe
                </p>
                <p className="text-xs text-muted-foreground/75 mt-1">
                  Click "Launch Embedded Studio" to load
                </p>
              </div>
            </div>
            <Button asChild className="w-full">
              <Link href="/admin/content/studio">
                <FileText className="h-4 w-4 mr-2" />
                Launch Embedded Studio
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Full Studio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ExternalLink className="h-5 w-5 mr-2" />
              Full Studio Experience
            </CardTitle>
            <CardDescription>
              Open Sanity Studio in a dedicated tab for the full experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-orange-100 dark:bg-orange-900 rounded flex items-center justify-center">
                    <FileText className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">Full Editor</p>
                    <p className="text-xs text-muted-foreground">
                      Complete studio interface
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="hidden sm:flex">
                  Recommended
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
                    <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">Live Preview</p>
                    <p className="text-xs text-muted-foreground">
                      See changes in real-time
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-green-100 dark:bg-green-900 rounded flex items-center justify-center">
                    <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">Collaboration</p>
                    <p className="text-xs text-muted-foreground">
                      Multi-user editing
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Button variant="outline" asChild className="w-full">
              <Link href="/studio" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Full Studio
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common content management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              asChild
              className="justify-start h-auto p-4"
            >
              <Link href="/studio/structure/post" target="_blank">
                <div className="text-left w-full">
                  <p className="font-medium">New Blog Post</p>
                  <p className="text-xs text-muted-foreground">
                    Create article
                  </p>
                </div>
              </Link>
            </Button>

            <Button
              variant="outline"
              asChild
              className="justify-start h-auto p-4"
            >
              <Link href="/studio/structure/page" target="_blank">
                <div className="text-left w-full">
                  <p className="font-medium">New Page</p>
                  <p className="text-xs text-muted-foreground">
                    Add marketing page
                  </p>
                </div>
              </Link>
            </Button>

            <Button
              variant="outline"
              asChild
              className="justify-start h-auto p-4"
            >
              <Link href="/studio/structure/caseStudy" target="_blank">
                <div className="text-left w-full">
                  <p className="font-medium">Creator Spotlight</p>
                  <p className="text-xs text-muted-foreground">
                    Feature creator
                  </p>
                </div>
              </Link>
            </Button>

            <Button
              variant="outline"
              asChild
              className="justify-start h-auto p-4 sm:col-span-2 lg:col-span-1"
            >
              <Link href="/studio/vision" target="_blank">
                <div className="text-left w-full">
                  <p className="font-medium">Query Data</p>
                  <p className="text-xs text-muted-foreground">GROQ queries</p>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
