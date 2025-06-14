"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Creator } from "@/types";
import { useState, useCallback } from "react";
import { updateCreatorProfileClient } from "@/lib/api/client/creators";
import {
  UsernameInput,
  UsernameFormData,
} from "@/components/shared/username-form";
import { toast } from "sonner";

interface EditUsernameFormProps {
  creator: Creator;
}

export function EditUsernameForm({ creator }: EditUsernameFormProps) {
  const [usernameData, setUsernameData] = useState<UsernameFormData>({
    username: creator.username || "",
    isValid: true,
    isAvailable: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // Memoize the username change handler
  const handleUsernameChange = useCallback(
    (data: UsernameFormData) => {
      setUsernameData(data);
      // Clear success message when user changes username
      if (success) setSuccess(null);
    },
    [success]
  ); // Include success in dependencies since we use it inside

  const handleSave = async () => {
    if (!usernameData.isValid || !usernameData.isAvailable) {
      toast.error("Please provide a valid and available username.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await updateCreatorProfileClient(creator.username, {
        username: usernameData.username,
      });

      if (response.success) {
        setSuccess("Username updated successfully");
        toast.success("Username updated successfully");
      } else {
        toast.error(response.error || "Failed to update username");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-sm h-[500px] flex flex-col justify-between p-4">
      <CardHeader className="flex flex-col justify-center items-center">
        <CardTitle>Claim your username</CardTitle>
        <CardDescription>
          Claim your username before it's taken.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <UsernameInput
          initialUsername={creator.username}
          currentUsername={creator.username}
          onChange={handleUsernameChange}
          disabled={isSubmitting}
          title=""
          description=""
        />

        {success && (
          <p className="mt-2 text-sm text-green-600 text-center">{success}</p>
        )}
      </CardContent>

      <CardFooter>
        <div className="flex flex-col w-full justify-center items-center gap-2">
          <Button
            className="w-full cursor-pointer"
            disabled={
              !usernameData.isValid ||
              !usernameData.isAvailable ||
              isSubmitting ||
              usernameData.username === creator.username
            }
            onClick={handleSave}
          >
            Save
          </Button>
          <Button variant="outline" className="w-full cursor-pointer">
            <Link href={`/${creator.username}`}>Cancel</Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
