import {
  signInWithGoogleAction,
  signInWithOTPAction,
  signUpAction,
} from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function Signup(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  if ("message" in searchParams) {
    return (
      <div className="w-full max-w-sm mx-auto text-center">
        <FormMessage message={searchParams} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Create account</h1>
        <p className="text-muted-foreground">
          Already have an account?{" "}
          <Link
            className="text-primary font-medium underline underline-offset-4 hover:text-primary/80 transition-colors"
            href="/sign-in"
          >
            Sign in
          </Link>
        </p>
      </div>

      {/* Display errors/success messages */}
      {("error" in searchParams || "success" in searchParams) && (
        <FormMessage message={searchParams} />
      )}

      <Tabs defaultValue="email" className="w-full">
        <TabsList className="grid grid-cols-3 w-full h-11">
          <TabsTrigger value="email" className="text-xs">
            Email
          </TabsTrigger>
          <TabsTrigger value="google" className="text-xs">
            Google
          </TabsTrigger>
          <TabsTrigger value="otp" className="text-xs">
            Magic Link
          </TabsTrigger>
        </TabsList>

        {/* Email and password sign up */}
        <TabsContent value="email" className="mt-4">
          <form className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                name="email"
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="h-11"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Input
                name="password"
                id="password"
                type="password"
                placeholder="Create a password (min 6 characters)"
                required
                minLength={6}
                autoComplete="new-password"
                className="h-11"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11"
              formAction={signUpAction}
            >
              Create account
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              You'll receive a confirmation email to verify your account
            </p>
          </form>
        </TabsContent>

        {/* Google sign up */}
        <TabsContent value="google" className="mt-4">
          <div className="space-y-3">
            <form action={signInWithGoogleAction}>
              <Button variant="outline" className="w-full h-11" type="submit">
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>
            </form>
            <p className="text-xs text-muted-foreground text-center">
              You'll be redirected to Google to complete sign-up
            </p>
          </div>
        </TabsContent>

        {/* Email OTP sign up */}
        <TabsContent value="otp" className="mt-4">
          <form className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="magic-email" className="text-sm font-medium">
                Email for magic link
              </Label>
              <Input
                name="email"
                id="magic-email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="h-11"
              />
            </div>
            <Button
              type="submit"
              variant="secondary"
              className="w-full h-11"
              formAction={signInWithOTPAction}
            >
              Send magic link
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              We'll send you a secure signup link
            </p>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
