"use client";

import React, { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Link from "next/link";
import Image from "next/image";
import { NavClient } from "./nav-client";
import { ThemeSwitcher } from "./theme-switcher";
import { usePathname } from "next/navigation";
import { adminRoutes } from "./routes";
import { createClient } from "@/utils/supabase/client";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [creatorUsername, setCreatorUsername] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUserData() {
      const supabase = createClient();
      try {
        // Get the user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          // Get creator username
          const { data: creator } = await supabase
            .from("creators")
            .select("username")
            .eq("profile_id", user.id)
            .single();

          if (creator) {
            setCreatorUsername(creator.username);
          }

          // Get user profile
          const { data: userProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (userProfile) {
            setProfile(userProfile);
          } else {
            setProfile({
              first_name: user.user_metadata?.name || "",
              last_name: "",
              avatar_url: user.user_metadata?.avatar_url || "",
            });
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadUserData();
  }, []);

  // Close the mobile menu when a link is clicked
  const handleLinkClick = () => {
    setOpen(false);
  };

  // Check if the current path is admin related
  const isAdmin = pathname?.includes("/admin");

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[350px] sm:w-[400px]">
        <SheetHeader className="mb-8">
          <SheetTitle className="flex items-center justify-center">
            <Link href="/" onClick={handleLinkClick}>
              <Image
                src="/logo.png"
                alt="that sauce"
                width={50}
                height={50}
                priority
                className="transition-transform hover:scale-105"
              />
            </Link>
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4 bg-accent/20 p-4 rounded-lg">
            {isLoading ? (
              <div className="h-9 w-full bg-muted animate-pulse rounded-md"></div>
            ) : (
              <NavClient
                initialUser={user}
                creatorUsername={creatorUsername}
                profile={profile}
                layout="mobile"
              />
            )}

            <div className="flex items-center justify-between mt-1">
              <span className="text-sm font-medium">Theme</span>
              <ThemeSwitcher />
            </div>
          </div>

          <div className="">
            <nav className="flex flex-col">
              {isAdmin && (
                <>
                  <div className="mt-4 mb-2 px-4">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                      Admin
                    </span>
                  </div>
                  {adminRoutes.slice(1).map((route) => (
                    <Link
                      key={route.path}
                      href={route.path}
                      className="px-4 py-3 rounded-md hover:bg-accent transition-colors flex items-center gap-2 font-medium"
                      onClick={handleLinkClick}
                    >
                      {route.label}
                    </Link>
                  ))}
                </>
              )}
            </nav>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
