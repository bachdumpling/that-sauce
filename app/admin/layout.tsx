import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users,
  BarChart3,
  Settings,
  Shield,
  Home,
  FileText,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/sign-in");
  }

  // Check admin role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, first_name, last_name")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    redirect("/");
  }

  const NavigationContent = () => (
    <nav className="space-y-2">
      <Link href="/admin">
        <Button
          variant="ghost"
          className="w-full justify-start text-left"
        >
          <BarChart3 className="h-4 w-4 mr-3" />
          Dashboard
        </Button>
      </Link>
      <Link href="/admin/creators">
        <Button
          variant="ghost"
          className="w-full justify-start text-left"
        >
          <Users className="h-4 w-4 mr-3" />
          Creators
        </Button>
      </Link>
      <Link href="/admin/content">
        <Button
          variant="ghost"
          className="w-full justify-start text-left"
        >
          <FileText className="h-4 w-4 mr-3" />
          Content Studio
        </Button>
      </Link>
      <Link href="/admin/settings">
        <Button
          variant="ghost"
          className="w-full justify-start text-left"
        >
          <Settings className="h-4 w-4 mr-3" />
          Settings
        </Button>
      </Link>
      
      <Separator className="my-6" />

      <div className="space-y-3">
        <div className="text-sm font-medium">Admin Tools</div>
        <div className="text-xs text-muted-foreground leading-relaxed">
          Manage platform content, review creator applications, and
          monitor system health.
        </div>

        <div className="pt-3">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="w-full"
          >
            <Link
              href="/studio"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FileText className="h-4 w-4 mr-2" />
              Open Sanity Studio
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Mobile Menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] sm:w-[320px]">
                  <div className="px-2 py-4">
                    <div className="flex items-center space-x-2 mb-6">
                      <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
                      <span className="text-xl font-bold">Admin Dashboard</span>
                    </div>
                    <NavigationContent />
                  </div>
                </SheetContent>
              </Sheet>

              <Link href="/admin" className="flex items-center space-x-2">
                <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
                <span className="hidden sm:block text-xl font-bold">Admin Dashboard</span>
                <span className="block sm:hidden text-lg font-bold">Admin</span>
              </Link>
              <Badge variant="secondary" className="hidden sm:block text-xs">
                That Sauce
              </Badge>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden md:block text-sm text-muted-foreground">
                Welcome back, {profile.first_name}
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/">
                  <Home className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Back to Site</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Desktop Sidebar Navigation */}
          <div className="hidden lg:block lg:col-span-1">
            <Card className="p-6">
              <NavigationContent />
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-4">
            <Card className="p-4 sm:p-6 lg:p-8">{children}</Card>
          </div>
        </div>
      </div>
    </div>
  );
}
