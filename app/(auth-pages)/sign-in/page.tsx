import {
  signInWithGoogleAction,
  signInWithOTPAction,
  signInAction,
} from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;

  return (
    <div className="flex-1 flex flex-col min-w-80 max-w-md mx-auto">
      <h1 className="text-2xl font-medium">Sign in</h1>
      <p className="text-sm text-foreground mb-6">
        Don't have an account?{" "}
        <Link className="text-foreground font-medium underline" href="/sign-up">
          Sign up
        </Link>
      </p>

      {/* Display errors/success messages at the top */}
      {("error" in searchParams || "success" in searchParams) && (
        <div className="mb-6">
          <FormMessage message={searchParams} />
        </div>
      )}

      {/* Google Sign In */}
      <div className="mb-6">
        <form action={signInWithGoogleAction}>
          <Button className="w-full" type="submit">
            Sign in with Google
          </Button>
        </form>
        <p className="text-xs text-muted-foreground text-center mt-2">
          You will be redirected to Google to complete the sign-in process
        </p>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      {/* Email and Password Sign In */}
      <div className="mb-6">
        <form action={signInAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              name="email"
              id="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              name="password"
              id="password"
              type="password"
              placeholder="Your password"
              required
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="w-full">
            Sign in with Email
          </Button>
        </form>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      {/* Magic Link Sign In */}
      <div>
        <form action={signInWithOTPAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="magic-email">Email</Label>
            <Input
              name="email"
              id="magic-email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>
          <Button type="submit" className="w-full">
            Send Magic Link
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            We'll send you a login link to your email
          </p>
        </form>
      </div>
    </div>
  );
}
