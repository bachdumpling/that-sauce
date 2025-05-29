"use client";

import { signOutAction } from "@/app/actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDownIcon } from "lucide-react";
import { ThemeSwitcher } from "./theme-switcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  mainRoutes,
  userAuthRoutes,
  adminRoutes,
  creatorRoutes,
  isAdminEmail,
} from "./routes";
import { EditProfileButton } from "@/components/shared/edit-profile-button";
import { DynamicLogo } from "./dynamic-logo";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

interface NavClientProps {
  initialUser: any;
  creatorUsername: string | null;
  profile: any | null;
  layout?: "desktop" | "mobile";
}

export function NavClient({
  initialUser,
  creatorUsername,
  profile,
  layout = "desktop",
}: NavClientProps) {
  const router = useRouter();
  const supabase = createClient();

  // Function to handle sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  // Mobile layout
  if (layout === "mobile") {
    return initialUser ? (
      <div className="flex flex-col gap-2 w-full">
        {/* User Info Section */}
        <div className="flex items-center gap-3 py-2 px-2 bg-muted rounded-lg">
          <Avatar className="w-10 h-10 border-2 border-border">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="text-sm font-medium">
              {profile?.first_name?.charAt(0) ||
                initialUser.user_metadata?.name?.charAt(0) ||
                initialUser.email?.charAt(0) ||
                "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              Hey,{" "}
              {profile?.first_name ||
                initialUser.user_metadata?.name ||
                "there"}
              !
            </span>
            {creatorUsername && (
              <span className="text-xs text-muted-foreground">
                @{creatorUsername}
              </span>
            )}
          </div>
        </div>

        {creatorUsername && (
          <Button
            asChild
            variant="outline"
            className="w-full justify-center py-2"
          >
            <Link href={`/${creatorUsername}`}>Portfolio</Link>
          </Button>
        )}

        <EditProfileButton
          className="w-full justify-center py-2"
          username={creatorUsername || undefined}
        >
          <span>Edit Profile</span>
        </EditProfileButton>

        {mainRoutes
          .filter((route) => route.path !== "/")
          .map((route) => (
            <Button
              key={route.path}
              asChild
              size="sm"
              variant="outline"
              className="w-full justify-center py-2"
            >
              <Link href={route.path}>{route.label}</Link>
            </Button>
          ))}

        {isAdminEmail(initialUser.email) && (
          <Button
            asChild
            size="sm"
            variant="outline"
            className="w-full justify-center py-2"
          >
            <Link href={adminRoutes[0].path}>{adminRoutes[0].label}</Link>
          </Button>
        )}

        <Button
          onClick={handleSignOut}
          variant="destructive"
          size="sm"
          className="w-full justify-center py-2 mt-2"
        >
          Sign out
        </Button>
      </div>
    ) : (
      <div className="flex flex-col gap-2 w-full">
        {userAuthRoutes.map((route) => (
          <Button
            key={route.path}
            asChild
            size="sm"
            variant={route.path === "/sign-up" ? "default" : "outline"}
            className="w-full justify-start"
          >
            <Link href={route.path}>{route.label}</Link>
          </Button>
        ))}

        {mainRoutes
          .filter((route) => route.path.includes("search"))
          .map((route) => (
            <Button
              key={route.path}
              asChild
              size="sm"
              variant="outline"
              className="w-full justify-start"
            >
              <Link href={route.path}>{route.label}</Link>
            </Button>
          ))}
      </div>
    );
  }

  // Desktop layout (default)
  return initialUser ? (
    <div className="flex items-center justify-between gap-4 w-full">
      {/* Left */}
      <div className="flex gap-4 justify-start items-center w-full">
        {mainRoutes.map((route) => (
          <Button
            key={route.path}
            asChild
            size="sm"
            variant="ghost"
            className="p-4 rounded-full"
          >
            <Link href={route.path}>{route.label}</Link>
          </Button>
        ))}

        {/* Portfolio route for creators */}
        {creatorUsername && (
          <Button
            asChild
            size="sm"
            variant="ghost"
            className="p-4 rounded-full"
          >
            <Link href={`/${creatorUsername}`}>Portfolio</Link>
          </Button>
        )}
      </div>

      {/* Middle */}
      <div className="flex gap-4 justify-center items-center font-semibold w-full">
        <Link href={"/"}>
          <DynamicLogo width={200} height={200} priority />
        </Link>
      </div>

      {/* Right */}
      <div className="flex justify-end items-center w-full gap-2">
        {isAdminEmail(initialUser.email) && (
          <Button
            asChild
            size="sm"
            variant="ghost"
            className="p-4 rounded-full"
          >
            <Link href={adminRoutes[0].path}>{adminRoutes[0].label}</Link>
          </Button>
        )}

        {/* User Menu Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div
              className="flex items-center cursor-pointer hover:bg-muted hover:rounded-full p-2 transition-all duration-300"
              data-testid="user-menu"
            >
              <Avatar className="">
                <AvatarImage
                  className="object-cover"
                  src={profile?.avatar_url || undefined}
                />
                <AvatarFallback className="text-xs font-medium">
                  {profile?.first_name?.charAt(0) ||
                    initialUser.user_metadata?.name?.charAt(0) ||
                    initialUser.email?.charAt(0) ||
                    "U"}
                </AvatarFallback>
              </Avatar>
              <ChevronDownIcon className="w-3 h-3 ml-1" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="rounded-2xl p-2 mt-4 border-none bg-card flex flex-col gap-2 w-60"
            align="end"
          >
            <DropdownMenuGroup className="flex flex-col gap-4 bg-muted px-2 py-4 rounded-2xl">
              {/* avatar */}
              <div className="flex flex-col gap-4 mb-4">
                <div className="flex justify-center items-center">
                  <Avatar className="w-16 h-16 border">
                    <AvatarImage
                      className="object-cover"
                      src={profile?.avatar_url || undefined}
                    />
                    <AvatarFallback>
                      {profile?.first_name?.charAt(0) ||
                        initialUser.user_metadata?.name?.charAt(0) ||
                        initialUser.email?.charAt(0) ||
                        "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div>
                  {/* name */}
                  <p className="font-medium text-lg text-center">
                    {profile?.first_name ||
                      initialUser.user_metadata?.name ||
                      creatorUsername}{" "}
                    {profile?.last_name || ""}
                  </p>
                  {creatorUsername && (
                    <p className="text-sm text-muted-foreground text-center">
                      @{creatorUsername}
                    </p>
                  )}
                </div>
              </div>

              {profile && (
                <DropdownMenuItem className="focus:bg-accent rounded-2xl p-4">
                  <EditProfileButton
                    className="w-full flex justify-start p-0 h-auto"
                    username={creatorUsername || undefined}
                  >
                    <span className="text-sm font-medium">Edit Profile</span>
                  </EditProfileButton>
                </DropdownMenuItem>
              )}

              <DropdownMenuItem className="focus:bg-accent rounded-2xl p-4">
                <button
                  onClick={handleSignOut}
                  className="w-full cursor-pointer text-sm font-medium text-left"
                >
                  Sign out
                </button>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuGroup className="flex flex-col gap-4 bg-muted px-2 py-4 rounded-2xl">
              <div className="px-4 flex justify-between items-center">
                <p className="text-sm font-medium">Theme</p>
                <ThemeSwitcher />
              </div>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  ) : (
    <div className="flex items-center justify-between gap-4 w-full">
      {/* Left */}
      <div className="flex gap-4 justify-start items-center w-full">
        {mainRoutes.map((route) => (
          <Button
            key={route.path}
            asChild
            size="sm"
            variant="ghost"
            className="p-4 rounded-full"
          >
            <Link href={route.path}>{route.label}</Link>
          </Button>
        ))}
      </div>

      {/* Middle */}
      <div className="flex gap-4 justify-center items-center font-semibold w-full">
        <Link href={"/"}>
          <DynamicLogo width={200} height={200} priority />
        </Link>
      </div>

      {/* Right */}
      <div className="flex gap-2 justify-end items-center w-full">
        <ThemeSwitcher />
        {userAuthRoutes.map((route) => (
          <Button
            key={route.path}
            asChild
            variant={route.path === "/sign-up" ? "default" : "ghost"}
            className={
              route.path === "/sign-up"
                ? "px-4 py-2 rounded-full"
                : "p-6 rounded-full"
            }
          >
            <Link href={route.path}>{route.label}</Link>
          </Button>
        ))}
      </div>
    </div>
  );
}
