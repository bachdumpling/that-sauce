"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { checkUsernameAvailabilityAction } from "@/actions/creator-actions";

// Simple debounce function
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export interface UsernameFormData {
  username: string;
  isValid: boolean;
  isAvailable: boolean;
}

interface UsernameInputProps {
  initialUsername?: string;
  currentUsername?: string; // For existing users
  onChange: (data: UsernameFormData) => void;
  disabled?: boolean;
  title?: string;
  description?: string;
}

export function UsernameInput({
  initialUsername = "",
  currentUsername = "",
  onChange,
  disabled = false,
  title = "Choose your username",
  description = "Your username will be your unique URL on That Sauce.",
}: UsernameInputProps) {
  const [username, setUsername] = useState(initialUsername);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(
    initialUsername === currentUsername ? true : null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasTyped, setHasTyped] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Track previous values to avoid unnecessary updates
  const prevUsernameRef = useRef(username);
  const prevIsAvailableRef = useRef(isAvailable);

  const debouncedUsername = useDebounce(username, 600);

  // Username validation
  const validateUsername = (
    value: string
  ): { isValid: boolean; error: string | null } => {
    // Check for empty username
    if (!value) {
      return { isValid: false, error: "Username cannot be empty" };
    }

    // Check length
    if (value.length < 3) {
      return {
        isValid: false,
        error: "Username must be at least 3 characters",
      };
    }

    if (value.length > 30) {
      return {
        isValid: false,
        error: "Username must be less than 30 characters",
      };
    }

    // Check allowed characters (letters, numbers, underscores)
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      return {
        isValid: false,
        error: "Username can only contain letters, numbers, and underscores",
      };
    }

    return { isValid: true, error: null };
  };

  // Check if username is available
  const checkUsername = useCallback(
    async (usernameToCheck: string) => {
      // If checking current username, it's always available to the user
      if (usernameToCheck === currentUsername) {
        setIsAvailable(true);
        setError(null);
        setValidationError(null);
        return;
      }

      if (!usernameToCheck) {
        setIsAvailable(false);
        setError(null);
        setValidationError(null);
        return;
      }

      // Validate username first
      const validation = validateUsername(usernameToCheck);
      if (!validation.isValid) {
        setValidationError(validation.error);
        setIsAvailable(false);
        return;
      } else {
        setValidationError(null);
      }

      setIsLoading(true);
      setError(null);

      try {
        // Use the existing action to check username availability
        const response = await checkUsernameAvailabilityAction(usernameToCheck);
        setIsAvailable(response.success ? response.data.available : false);
        if (!response.success) {
          setError(response.error || "Failed to check username availability");
        }
      } catch (error) {
        console.error("Error checking username:", error);
        setError("Failed to check availability. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [currentUsername]
  );

  // Effect for checking username when debounced value changes
  useEffect(() => {
    if (hasTyped && debouncedUsername) {
      checkUsername(debouncedUsername);
    }
  }, [debouncedUsername, checkUsername, hasTyped]);

  // Notify parent of changes - only when values actually change
  useEffect(() => {
    // Skip notification during initial render and if values haven't changed
    if (
      username === prevUsernameRef.current &&
      isAvailable === prevIsAvailableRef.current
    ) {
      return;
    }

    // Update refs for next comparison
    prevUsernameRef.current = username;
    prevIsAvailableRef.current = isAvailable;

    // Calculate validity and notify parent
    const isValid = validateUsername(username).isValid && isAvailable === true;

    onChange({
      username,
      isValid,
      isAvailable: !!isAvailable,
    });
  }, [username, isAvailable, onChange, validateUsername]);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    setUsername(newUsername);
    setHasTyped(true);
  };

  return (
    <Card className="p-6">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="relative">
          <div className="flex items-center">
            <div className="text-sm text-muted-foreground mr-2">
              that-sauce.com/
            </div>
            <div className="relative flex-1">
              <Input
                type="text"
                value={username}
                placeholder="username"
                onChange={handleUsernameChange}
                disabled={isLoading || disabled}
                className="pr-10"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {isLoading && (
                  <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                )}
                {isAvailable === true && !isLoading && hasTyped && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {isAvailable === false && !isLoading && hasTyped && (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="min-h-[40px] mt-2">
          {validationError && (
            <p className="text-sm text-red-500">{validationError}</p>
          )}
          {!validationError && error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          {!validationError && !error && isAvailable && hasTyped && (
            <p className="text-sm text-green-500">Username is available!</p>
          )}
          {!validationError &&
            !error &&
            isAvailable === false &&
            hasTyped &&
            !isLoading && (
              <p className="text-sm text-red-500">Username is already taken.</p>
            )}
          {!hasTyped && (
            <p className="text-sm text-muted-foreground">
              Username must be at least 3 characters and can only contain
              letters, numbers, and underscores.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
