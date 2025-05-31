"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Eye,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Creator {
  id: string;
  username: string;
  location?: string;
  bio?: string;
  primary_role?: string[];
  status: string;
  created_at: string;
  avatar_url?: string;
  years_of_experience?: number;
}

interface CreatorImage {
  id: string;
  url: string;
  alt_text?: string;
}

interface AdminCreatorCardProps {
  creator: Creator;
  onUpdate: () => void;
}

export function AdminCreatorCard({ creator, onUpdate }: AdminCreatorCardProps) {
  const [images, setImages] = useState<CreatorImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: "approve" | "reject";
    title: string;
    description: string;
  }>({
    open: false,
    action: "approve",
    title: "",
    description: "",
  });

  // Fetch creator images
  useEffect(() => {
    const fetchCreatorImages = async () => {
      try {
        const response = await fetch(
          `/api/admin/creators/${creator.username}/images`
        );
        const data = await response.json();
        if (data.success) {
          setImages(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching creator images:", error);
      }
    };

    fetchCreatorImages();
  }, [creator.username]);

  const handleStatusUpdate = async (status: "approved" | "rejected") => {
    setIsProcessing(true);
    try {
      const response = await fetch(
        `/api/admin/creators/${creator.username}/status`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        onUpdate();
      } else {
        toast.error(data.error || "Failed to update creator status");
      }
    } catch (error) {
      console.error("Error updating creator status:", error);
      toast.error("Failed to update creator status");
    } finally {
      setIsProcessing(false);
      setConfirmDialog((prev) => ({ ...prev, open: false }));
    }
  };

  const openConfirmDialog = (action: "approve" | "reject") => {
    setConfirmDialog({
      open: true,
      action,
      title: action === "approve" ? "Approve Creator" : "Reject Creator",
      description:
        action === "approve"
          ? `Are you sure you want to approve ${creator.username}? They will be able to access all creator features.`
          : `Are you sure you want to reject ${creator.username}? This action will remove their creator access.`,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-900">
            Approved
          </Badge>
        );
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage
                  src={creator.avatar_url}
                  alt={creator.username}
                  className="object-cover"
                />
                <AvatarFallback className="text-lg">
                  {creator.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center space-x-2 flex-wrap">
                  <CardTitle className="text-lg sm:text-xl break-all">
                    @{creator.username}
                  </CardTitle>
                  {getStatusBadge(creator.status)}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-sm text-muted-foreground">
                  {creator.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{creator.location}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(creator.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {creator.primary_role && creator.primary_role.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {creator.primary_role.slice(0, 3).map((role, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {role}
                      </Badge>
                    ))}
                    {creator.primary_role.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{creator.primary_role.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="flex-1 sm:flex-none"
              >
                <Link href={`/${creator.username}`}>
                  <Eye className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">View</span>
                </Link>
              </Button>

              {creator.status === "pending" && (
                <>
                  <Button
                    size="sm"
                    onClick={() => openConfirmDialog("approve")}
                    disabled={isProcessing}
                    className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 flex-1 sm:flex-none"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Approve</span>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => openConfirmDialog("reject")}
                    disabled={isProcessing}
                    className="flex-1 sm:flex-none"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Reject</span>
                  </Button>
                </>
              )}

              {creator.status === "approved" && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => openConfirmDialog("reject")}
                  disabled={isProcessing}
                  className="flex-1 sm:flex-none"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Revoke</span>
                </Button>
              )}

              {creator.status === "rejected" && (
                <Button
                  size="sm"
                  onClick={() => openConfirmDialog("approve")}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 flex-1 sm:flex-none"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Approve</span>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Bio */}
          {creator.bio && (
            <div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {creator.bio}
              </p>
            </div>
          )}

          {/* Experience */}
          {creator.years_of_experience && (
            <div className="text-sm">
              <span className="font-medium">Experience:</span>{" "}
              <span className="text-muted-foreground">
                {creator.years_of_experience} year
                {creator.years_of_experience !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* Sample Images */}
          {images.length > 0 ? (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center">
                <ImageIcon className="h-4 w-4 mr-1" />
                Sample Work ({images.length} image
                {images.length !== 1 ? "s" : ""})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {images.slice(0, 6).map((image, index) => (
                  <div
                    key={image.id}
                    className="relative aspect-square bg-muted rounded-md overflow-hidden"
                  >
                    <Image
                      src={image.url}
                      alt={image.alt_text || `Work sample ${index + 1}`}
                      fill
                      className="object-cover hover:scale-105 transition-transform"
                    />
                  </div>
                ))}
              </div>
              {images.length > 6 && (
                <p className="text-xs text-muted-foreground mt-2">
                  +{images.length - 6} more images
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No sample work available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogDescription>{confirmDialog.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() =>
                setConfirmDialog((prev) => ({ ...prev, open: false }))
              }
              disabled={isProcessing}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              variant={
                confirmDialog.action === "approve" ? "default" : "destructive"
              }
              onClick={() => {
                if (confirmDialog.action === "approve") {
                  handleStatusUpdate("approved");
                } else if (confirmDialog.action === "reject") {
                  handleStatusUpdate("rejected");
                }
              }}
              disabled={isProcessing}
              className="flex-1 sm:flex-none"
            >
              {isProcessing
                ? "Processing..."
                : confirmDialog.action === "approve"
                  ? "Approve"
                  : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
