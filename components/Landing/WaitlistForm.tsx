"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WaitlistFormProps {
  className?: string;
}

export default function WaitlistForm({ className }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const formBody = `email=${encodeURIComponent(email)}&userGroup=${encodeURIComponent("Waitlist")}`;

      const response = await fetch(
        "https://app.loops.so/api/newsletter-form/cmbdwznbd0bch2c0iazi7xiv3",
        {
          method: "POST",
          body: formBody,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setIsSuccess(true);
        setEmail("");
      } else {
        setError(data.message || "Something went wrong. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={`text-center p-6 ${className}`}>
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium mb-2">You're on the waitlist!</h3>
        <p className="text-muted-foreground">
          Thanks for signing up. We'll notify you when we launch.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !email}>
              {isLoading ? "Signing up..." : "Join Waitlist"}
            </Button>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
