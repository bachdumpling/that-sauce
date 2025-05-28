import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";
import { createClient } from "@/utils/supabase/server";

export async function middleware(request: NextRequest) {
  // Update the session first
  const response = await updateSession(request);

  // Get the request URL
  const url = new URL(request.url);
  const path = url.pathname;

  // Skip onboarding check for:
  // - Paths that don't require authentication or onboarding (auth pages, static assets)
  // - Onboarding pages themselves to avoid redirect loops
  // - API routes
  if (
    path.startsWith("/sign-in") ||
    path.startsWith("/sign-up") ||
    path.startsWith("/onboarding") ||
    path.startsWith("/api") ||
    path === "/"
  ) {
    return response;
  }

  try {
    // Create a supabase client for checking onboarding status
    const supabase = await createClient();

    // Check if the user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // User is not authenticated, redirect to sign-in for protected routes
      const redirectUrl = new URL("/sign-in", request.url);
      return NextResponse.redirect(redirectUrl);
    }

    // User is logged in, check onboarding status
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_step, onboarding_completed")
      .eq("id", user.id)
      .single();

    // If profile exists and onboarding is not completed, redirect to onboarding
    if (
      profile &&
      !profile.onboarding_completed &&
      profile.onboarding_step < 5
    ) {
      // Create a redirect response
      const redirectUrl = new URL("/onboarding", request.url);
      return NextResponse.redirect(redirectUrl);
    }
  } catch (error) {
    console.error("Error in middleware onboarding check:", error);
    // Continue on error, don't disrupt normal flow
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
