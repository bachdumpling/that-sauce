import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const origin = requestUrl.origin;
  const redirectTo = requestUrl.searchParams.get("redirect_to")?.toString();

  if (token_hash && type) {
    const supabase = await createClient();

    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as any,
      });

      if (error) {
        console.error("Error confirming email:", error);
        // Redirect to an error page or sign-in with error message
        return NextResponse.redirect(
          `${origin}/sign-in?error=confirmation_failed`
        );
      }
    } catch (error) {
      console.error("Error during email confirmation:", error);
      return NextResponse.redirect(
        `${origin}/sign-in?error=confirmation_failed`
      );
    }
  }

  if (redirectTo) {
    return NextResponse.redirect(`${origin}${redirectTo}`);
  }

  // URL to redirect to after successful email confirmation
  return NextResponse.redirect(`${origin}/profile`);
}
