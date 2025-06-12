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
import { NavigationContent } from "@/types/sanity";
import { urlFor } from "@/sanity/lib/image";
import { useTheme } from "next-themes";

interface NavClientProps {
  initialUser: any;
  creatorUsername: string | null;
  profile: any | null;
  layout?: "desktop" | "mobile";
  navigationContent?: NavigationContent | null;
}

export function NavClient({
  initialUser,
  creatorUsername,
  profile,
  layout = "desktop",
  navigationContent,
}: NavClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const { theme } = useTheme();
  // Function to handle sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  // Get content with fallbacks
  const getContent = () => {
    if (!navigationContent) {
      // Fallback to existing hardcoded values
      return {
        mainNavigation: mainRoutes,
        authNavigation: {
          signInText: "Log in",
          signInUrl: "/sign-in",
          signUpText: "Sign up",
          signUpUrl: "/sign-up",
          signOutText: "Sign out",
        },
        creatorNavigation: {
          portfolioText: "Portfolio",
          myPortfolioText: "My Portfolio",
          editProfileText: "Edit Profile",
        },
        adminNavigation: adminRoutes,
        userGreeting: {
          greetingPrefix: "Hey,",
          fallbackGreeting: "there",
        },
        brand: {
          logoLight: null,
          logoDark: null,
          logoDefault: null,
          logoWidth: 200,
          logoHeight: 200,
          brandName: "that sauce",
          homeUrl: "/",
          showBrandName: false,
          logoPosition: "center",
        },
      };
    }

    return {
      mainNavigation:
        navigationContent.mainNavigation &&
        Array.isArray(navigationContent.mainNavigation)
          ? navigationContent.mainNavigation.filter((link) => link.isVisible)
          : mainRoutes,
      authNavigation: navigationContent.authNavigation || {
        signInText: "Log in",
        signInUrl: "/sign-in",
        signUpText: "Sign up",
        signUpUrl: "/sign-up",
        signOutText: "Sign out",
      },
      creatorNavigation: navigationContent.creatorNavigation || {
        portfolioText: "Portfolio",
        myPortfolioText: "My Portfolio",
        editProfileText: "Edit Profile",
      },
      adminNavigation:
        navigationContent.adminNavigation &&
        Array.isArray(navigationContent.adminNavigation)
          ? navigationContent.adminNavigation.filter((link) => link.isVisible)
          : adminRoutes,
      userGreeting: navigationContent.userGreeting || {
        greetingPrefix: "Hey,",
        fallbackGreeting: "there",
      },
      brand: navigationContent.brand || {
        logoLight: null,
        logoDark: null,
        logoDefault: null,
        logoWidth: 200,
        logoHeight: 200,
        brandName: "that sauce",
        homeUrl: "/",
        showBrandName: false,
        logoPosition: "center",
      },
    };
  };

  const content = getContent();

  // Get the appropriate logo based on theme
  const getCurrentLogo = () => {
    const { logoLight, logoDark, logoDefault } = content.brand;

    if (theme === "dark" && logoDark) {
      return urlFor(logoDark)
        .width(content.brand.logoWidth || 200)
        .height(content.brand.logoHeight || 200)
        .url();
    }
    if (theme === "light" && logoLight) {
      return urlFor(logoLight)
        .width(content.brand.logoWidth || 200)
        .height(content.brand.logoHeight || 200)
        .url();
    }
    if (logoDefault) {
      return urlFor(logoDefault)
        .width(content.brand.logoWidth || 200)
        .height(content.brand.logoHeight || 200)
        .url();
    }

    // Fallback to existing logo
    return null;
  };

  const logoSrc = getCurrentLogo();

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
              {content.userGreeting.greetingPrefix}{" "}
              {profile?.first_name ||
                initialUser.user_metadata?.name ||
                content.userGreeting.fallbackGreeting}
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
            <Link href={`/${creatorUsername}`}>
              {content.creatorNavigation.portfolioText}
            </Link>
          </Button>
        )}

        <EditProfileButton
          className="w-full justify-center py-2"
          username={creatorUsername || undefined}
        >
          <span>{content.creatorNavigation.editProfileText}</span>
        </EditProfileButton>

        {content.mainNavigation
          .filter((route) => route.path !== "/")
          .map((route) => (
            <Button
              key={route.path}
              asChild
              size="sm"
              variant="outline"
              className="w-full justify-center py-2"
            >
              <Link
                href={route.path}
                target={
                  "openInNewTab" in route && route.openInNewTab
                    ? "_blank"
                    : undefined
                }
                rel={
                  "openInNewTab" in route && route.openInNewTab
                    ? "noopener noreferrer"
                    : undefined
                }
              >
                {route.label}
              </Link>
            </Button>
          ))}

        {isAdminEmail(initialUser.email) &&
          content.adminNavigation.length > 0 && (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="w-full justify-center py-2"
            >
              <Link href={content.adminNavigation[0].path}>
                {content.adminNavigation[0].label}
              </Link>
            </Button>
          )}

        <Button
          onClick={handleSignOut}
          variant="destructive"
          size="sm"
          className="w-full justify-center py-2 mt-2"
        >
          {content.authNavigation.signOutText}
        </Button>
      </div>
    ) : (
      <div className="flex flex-col gap-2 w-full">
        <Button
          asChild
          size="sm"
          variant="outline"
          className="w-full justify-start"
        >
          <Link href={content.authNavigation.signInUrl}>
            {content.authNavigation.signInText}
          </Link>
        </Button>
        <Button
          asChild
          size="sm"
          variant="default"
          className="w-full justify-start"
        >
          <Link href={content.authNavigation.signUpUrl}>
            {content.authNavigation.signUpText}
          </Link>
        </Button>

        {content.mainNavigation
          .filter((route) => route.path.includes("search"))
          .map((route) => (
            <Button
              key={route.path}
              asChild
              size="sm"
              variant="outline"
              className="w-full justify-start"
            >
              <Link
                href={route.path}
                target={
                  "openInNewTab" in route && route.openInNewTab
                    ? "_blank"
                    : undefined
                }
                rel={
                  "openInNewTab" in route && route.openInNewTab
                    ? "noopener noreferrer"
                    : undefined
                }
              >
                {route.label}
              </Link>
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
        {content.mainNavigation.map((route) => (
          <Button
            key={route.path}
            asChild
            size="sm"
            variant="ghost"
            className="p-4 rounded-full"
          >
            <Link
              href={route.path}
              target={
                "openInNewTab" in route && route.openInNewTab
                  ? "_blank"
                  : undefined
              }
              rel={
                "openInNewTab" in route && route.openInNewTab
                  ? "noopener noreferrer"
                  : undefined
              }
            >
              {route.label}
            </Link>
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
            <Link href={`/${creatorUsername}`}>
              {content.creatorNavigation.portfolioText}
            </Link>
          </Button>
        )}
      </div>

      {/* Middle */}
      <div className="flex gap-4 justify-center items-center font-semibold w-full">
        <Link href={content.brand.homeUrl || "/"}>
          {logoSrc ? (
            <Image
              src={logoSrc}
              alt={content.brand.brandName || "Logo"}
              width={content.brand.logoWidth || 200}
              height={content.brand.logoHeight || 200}
              priority
              className="transition-transform hover:scale-105"
            />
          ) : (
            <DynamicLogo
              width={content.brand.logoWidth || 200}
              height={content.brand.logoHeight || 200}
              priority
              logoLight={content.brand.logoLight || undefined}
              logoDark={content.brand.logoDark || undefined}
              logoDefault={content.brand.logoDefault || undefined}
              brandName={content.brand.brandName}
            />
          )}
        </Link>
        {content.brand.showBrandName && content.brand.brandName && (
          <span className="font-sauce text-lg tracking-wide uppercase">
            {content.brand.brandName}
          </span>
        )}
      </div>

      {/* Right */}
      <div className="flex justify-end items-center w-full gap-2">
        {isAdminEmail(initialUser.email) &&
          content.adminNavigation.length > 0 && (
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="p-4 rounded-full"
            >
              <Link href={content.adminNavigation[0].path}>
                {content.adminNavigation[0].label}
              </Link>
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

                {/* email */}
                <p className="text-xs text-muted-foreground text-center">
                  {initialUser.email}
                </p>
              </div>

              {/* Portfolio link for creators */}
              {creatorUsername && (
                <DropdownMenuItem className="focus:bg-accent rounded-2xl p-4">
                  <Link
                    href={`/${creatorUsername}`}
                    className="w-full text-sm font-medium text-left"
                  >
                    {content.creatorNavigation.myPortfolioText}
                  </Link>
                </DropdownMenuItem>
              )}

              {profile && (
                <DropdownMenuItem className="focus:bg-accent rounded-2xl p-4">
                  <EditProfileButton
                    className="w-full flex justify-start p-0 h-auto"
                    username={creatorUsername || undefined}
                  >
                    <span className="text-sm font-medium">
                      {content.creatorNavigation.editProfileText}
                    </span>
                  </EditProfileButton>
                </DropdownMenuItem>
              )}

              {/* Admin links */}
              {isAdminEmail(initialUser.email) &&
                content.adminNavigation.length > 0 && (
                  <>
                    {content.adminNavigation.map((route) => (
                      <DropdownMenuItem
                        key={route.path}
                        className="focus:bg-accent rounded-2xl p-4"
                      >
                        <Link
                          href={route.path}
                          className="w-full text-sm font-medium text-left"
                        >
                          {route.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </>
                )}

              <DropdownMenuItem className="focus:bg-accent rounded-2xl p-4">
                <button
                  onClick={handleSignOut}
                  className="w-full cursor-pointer text-sm font-medium text-left"
                >
                  {content.authNavigation.signOutText}
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
      {/* Left - Empty or Logo */}
      <div className="flex gap-4 justify-start items-center w-full">
        {/* You could add some non-auth nav items here if needed */}
      </div>

      {/* Middle - Logo */}
      <div className="flex gap-4 justify-center items-center font-semibold w-full">
        <Link href={content.brand.homeUrl || "/"}>
          {logoSrc ? (
            <Image
              src={logoSrc}
              alt={content.brand.brandName || "Logo"}
              width={content.brand.logoWidth || 200}
              height={content.brand.logoHeight || 200}
              priority
              className="transition-transform hover:scale-105"
            />
          ) : (
            <DynamicLogo
              width={content.brand.logoWidth || 200}
              height={content.brand.logoHeight || 200}
              priority
              logoLight={content.brand.logoLight || undefined}
              logoDark={content.brand.logoDark || undefined}
              logoDefault={content.brand.logoDefault || undefined}
              brandName={content.brand.brandName}
            />
          )}
        </Link>
        {content.brand.showBrandName && content.brand.brandName && (
          <span className="font-sauce text-lg tracking-wide uppercase">
            {content.brand.brandName}
          </span>
        )}
      </div>

      {/* Right - Auth buttons */}
      <div className="flex justify-end items-center w-full gap-2">
        <Button asChild size="sm" variant="ghost" className="p-4 rounded-full">
          <Link href={content.authNavigation.signInUrl}>
            {content.authNavigation.signInText}
          </Link>
        </Button>
        <Button asChild size="sm" className="p-4 rounded-full">
          <Link href={content.authNavigation.signUpUrl}>
            {content.authNavigation.signUpText}
          </Link>
        </Button>
        {/* <ThemeSwitcher /> */}
      </div>
    </div>
  );
}
