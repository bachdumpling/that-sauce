"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { VimeoEmbed, YouTubeEmbed } from "@/components/ui/vimeo-embed";
import { MultiSelect, Option } from "@/components/ui/multi-select";
import { ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
// Import server actions instead of client API functions
import {
  createProjectAction,
  updateProjectAction,
  getProjectByIdAction,
  deleteProjectAction,
} from "@/actions/project-actions";
import { getOrganizationsAction } from "@/actions/organization-actions";
import {
  batchUploadMediaAction,
  uploadVideoLinkAction,
} from "@/actions/media-actions";
import {
  extractMediaFromUrlAction,
  importMediaFromUrlAction,
} from "@/actions/scraper-actions";
import { CREATOR_ROLES } from "@/lib/constants/creator-options";
import { Organization, Project } from "@/types/project";
import MediaUploadStep from "./new-project-steps/media-upload-step";
import ProjectDetailsStep from "./new-project-steps/project-details-step";
import { ScraperProgress } from "@/components/scraper-progress";
import { ProjectCard } from "@/app/[username]/work/components/project-card";

interface MediaItem {
  id: string;
  type: "image" | "video" | "youtube" | "vimeo";
  url: string;
  file?: File;
  youtube_id?: string;
  vimeo_id?: string;
  alt_text?: string;
  order?: number;
}

export default function NewProjectForm() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [mediaLink, setMediaLink] = useState<string>("");
  const [projectLink, setProjectLink] = useState<string>("");
  const [isLargeFile, setIsLargeFile] = useState<boolean>(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState<string | null>(
    null
  );

  // Form step state
  const [formStep, setFormStep] = useState<number>(1); // 1 = Media upload, 2 = Project details
  const [showImportOption, setShowImportOption] = useState<boolean>(true);

  // Project information state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [year, setYear] = useState<number | undefined>(
    new Date().getFullYear()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>("");

  // Client/Organization state
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);

  // Import state
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [scrapingHandleId, setScrapingHandleId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Format role options from the constant list
  const roleOptions: Option[] = CREATOR_ROLES.map((role) => ({
    value: role,
    label: role,
  }));

  // Load organizations on component mount
  useEffect(() => {
    async function fetchOrganizations() {
      setIsLoadingOrgs(true);
      try {
        const response = await getOrganizationsAction();

        if (response.success && response.data) {
          setOrganizations(response.data.organizations);
        } else {
          console.error("Failed to load organizations:", response.message);
          toast.error("Failed to load client list");
        }
      } catch (error) {
        console.error("Error fetching organizations:", error);
        toast.error("Error loading clients");
      } finally {
        setIsLoadingOrgs(false);
      }
    }

    fetchOrganizations();
  }, []);

  // Format client options from fetched organizations
  const clientOptions: Option[] = organizations.map((org) => ({
    value: org.id,
    label: org.name,
  }));

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);

    // Supported file types
    const supportedImageTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    const supportedVideoTypes = [
      "video/mp4",
      "video/quicktime",
      "video/x-msvideo",
      "video/x-ms-wmv",
      "video/webm",
    ];
    const supportedTypes = [...supportedImageTypes, ...supportedVideoTypes];

    // Check for file size and type
    const hasLargeFile = droppedFiles.some(
      (file) => file.size > 5 * 1024 * 1024
    );

    // Filter out unsupported file types
    const invalidFiles = droppedFiles.filter(
      (file) => !supportedTypes.includes(file.type)
    );

    if (invalidFiles.length > 0) {
      const invalidFileNames = invalidFiles.map((f) => f.name).join(", ");
      toast.error(
        `Unsupported file type(s): ${invalidFileNames}. Supported types: JPEG, PNG, GIF, WEBP, MP4, MOV, AVI, WMV, WEBM`
      );
    }

    // Filter to only valid files
    const validFiles = droppedFiles.filter(
      (file) =>
        supportedTypes.includes(file.type) && file.size <= 5 * 1024 * 1024
    );

    setIsLargeFile(hasLargeFile);

    if (validFiles.length > 0) {
      setFiles((prevFiles) => [...prevFiles, ...validFiles]);

      // Create media items from files
      const newMediaItems: MediaItem[] = validFiles.map((file) => {
        const isVideo = file.type.startsWith("video/");
        return {
          id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          type: (isVideo ? "video" : "image") as "image" | "video",
          url: URL.createObjectURL(file),
          file,
        };
      });

      setMediaItems((prev) => [...prev, ...newMediaItems]);

      // Hide import option once user uploads files
      setShowImportOption(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);

      // Supported file types
      const supportedImageTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      const supportedVideoTypes = [
        "video/mp4",
        "video/quicktime",
        "video/x-msvideo",
        "video/x-ms-wmv",
        "video/webm",
      ];
      const supportedTypes = [...supportedImageTypes, ...supportedVideoTypes];

      // Check for file size and type
      const hasLargeFile = selectedFiles.some(
        (file) => file.size > 5 * 1024 * 1024
      );

      // Filter out unsupported file types
      const invalidFiles = selectedFiles.filter(
        (file) => !supportedTypes.includes(file.type)
      );

      if (invalidFiles.length > 0) {
        const invalidFileNames = invalidFiles.map((f) => f.name).join(", ");
        toast.error(
          `Unsupported file type(s): ${invalidFileNames}. Supported types: JPEG, PNG, GIF, WEBP, MP4, MOV, AVI, WMV, WEBM`
        );
      }

      // Filter to only valid files
      const validFiles = selectedFiles.filter(
        (file) =>
          supportedTypes.includes(file.type) && file.size <= 5 * 1024 * 1024
      );

      setIsLargeFile(hasLargeFile);

      if (validFiles.length > 0) {
        setFiles((prevFiles) => [...prevFiles, ...validFiles]);

        // Create media items from files
        const newMediaItems: MediaItem[] = validFiles.map((file) => {
          const isVideo = file.type.startsWith("video/");
          return {
            id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            type: (isVideo ? "video" : "image") as "image" | "video",
            url: URL.createObjectURL(file),
            file,
          };
        });

        setMediaItems((prev) => [...prev, ...newMediaItems]);

        // Hide import option once user uploads files
        setShowImportOption(false);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleAddMediaLink = () => {
    if (!mediaLink) return;

    let newMedia: MediaItem | null = null;

    // Check for YouTube link
    const youtubeRegex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const youtubeMatch = mediaLink.match(youtubeRegex);

    // Check for Vimeo link
    const vimeoRegex =
      /(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/[^\/]+\/videos\/|album\/\d+\/video\/|)(\d+)(?:$|\/|\?))/;
    const vimeoMatch = mediaLink.match(vimeoRegex);

    if (youtubeMatch && youtubeMatch[1]) {
      // It's a YouTube link
      newMedia = {
        id: `youtube-${Date.now()}`,
        type: "youtube",
        url: mediaLink,
        youtube_id: youtubeMatch[1],
      };
    } else if (vimeoMatch && vimeoMatch[1]) {
      // It's a Vimeo link
      newMedia = {
        id: `vimeo-${Date.now()}`,
        type: "vimeo",
        url: mediaLink,
        vimeo_id: vimeoMatch[1],
      };
    } else {
      // Try fallback Vimeo pattern for URLs like https://vimeo.com/1072008273/ecb6710763
      const vimeoFallbackMatch = mediaLink.match(/vimeo\.com\/(\d+)/);
      if (vimeoFallbackMatch && vimeoFallbackMatch[1]) {
        newMedia = {
          id: `vimeo-${Date.now()}`,
          type: "vimeo",
          url: mediaLink,
          vimeo_id: vimeoFallbackMatch[1],
        };
      } else {
        // Invalid video URL
        toast.error("Please enter a valid YouTube or Vimeo URL");
        return;
      }
    }

    setMediaItems((prev) => [...prev, newMedia!]);
    setMediaLink("");
  };

  const handleImportMedia = async () => {
    if (!projectLink) {
      toast.error("Please enter a valid URL");
      return;
    }

    setIsImporting(true);
    setImportError(null);
    setScrapingHandleId(null);
    setAccessToken(null);

    try {
      // Validate URL
      let url;
      try {
        url = new URL(projectLink);
      } catch (error) {
        throw new Error("Please enter a valid URL");
      }

      // Check if it's a supported platform
      const isBehance = url.hostname.includes("behance.net");
      const isDribbble = url.hostname.includes("dribbble.com");

      if (!isBehance && !isDribbble) {
        throw new Error(
          "Currently only Behance and Dribbble URLs are supported"
        );
      }

      toast.info("Scraping media from URL. This may take a few seconds...");

      // Extract media from external URL
      const response = await extractMediaFromUrlAction({
        url: projectLink,
        autoImport: false,
        extractImages: true,
        extractVideos: true,
        maxImages: 50,
        maxVideos: 10,
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to import media from URL");
      }

      // We now have a handleId instead of direct media data
      if (response.data.handleId) {
        setScrapingHandleId(response.data.handleId);
        // Store the access token if available
        if (response.data.publicAccessToken) {
          setAccessToken(response.data.publicAccessToken);
        }
        // The actual media will be handled by the ScraperProgress component
        // via the onScraperComplete callback
      } else {
        throw new Error("No scraper handle ID returned");
      }

      // Extract project title from URL if possible
      const urlParts = projectLink.split("/");
      const lastPart = urlParts[urlParts.length - 1];
      const suggestedTitle = lastPart
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      if (!title && suggestedTitle) {
        setTitle(suggestedTitle);
      }

      // Clear the project link field
      setProjectLink("");

      // isImporting will be set to false when the scraper completes
      // in onScraperComplete
    } catch (error: any) {
      console.error("Import error:", error);
      setImportError(error.message || "Failed to import media");
      toast.error(error.message || "Failed to import media");
      setIsImporting(false);
    }
  };

  // Handle the completion of the scraper task
  const onScraperComplete = (data: any) => {
    if (!data || !data.success) {
      setImportError(data?.error || "Failed to import media");
      toast.error(data?.error || "Failed to import media");
      setIsImporting(false);
      return;
    }

    try {
      // Process the scraped data
      const scrapeData = data.data;

      if (
        !scrapeData.media ||
        !Array.isArray(scrapeData.media) ||
        scrapeData.media.length === 0
      ) {
        throw new Error("No media found at the provided URL");
      }

      // Convert scraped media to our MediaItem format
      const importedMedia = scrapeData.media.map((item: any) => {
        const id = `imported-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        if (item.type === "video") {
          if (item.youtube_id) {
            return {
              id,
              type: "youtube" as const,
              url: `https://youtube.com/watch?v=${item.youtube_id}`,
              youtube_id: item.youtube_id,
              alt_text: item.alt_text,
              order: item.order,
            };
          } else if (item.vimeo_id) {
            return {
              id,
              type: "vimeo" as const,
              url: `https://vimeo.com/${item.vimeo_id}`,
              vimeo_id: item.vimeo_id,
              alt_text: item.alt_text,
              order: item.order,
            };
          }
        }

        return {
          id,
          type: item.type as "image" | "video",
          url: item.url,
          alt_text: item.alt_text,
          order: item.order,
        };
      });

      // Add to existing media items
      setMediaItems((prev) => [...prev, ...importedMedia]);

      const mediaTypeDistribution = {
        images: importedMedia.filter((m: MediaItem) => m.type === "image")
          .length,
        videos: importedMedia.filter((m: MediaItem) => m.type === "video")
          .length,
        youtube: importedMedia.filter((m: MediaItem) => m.type === "youtube")
          .length,
        vimeo: importedMedia.filter((m: MediaItem) => m.type === "vimeo")
          .length,
      };

      toast.success(
        `Imported ${importedMedia.length} media items: ` +
          Object.entries(mediaTypeDistribution)
            .filter(([_, count]: [string, number]) => count > 0)
            .map(([type, count]) => `${count} ${type}`)
            .join(", ")
      );

      // Hide import option after successful import
      setShowImportOption(false);
    } catch (error: any) {
      console.error("Import processing error:", error);
      setImportError(error.message || "Failed to process imported media");
      toast.error(error.message || "Failed to process imported media");
    } finally {
      setIsImporting(false);
    }
  };

  const handleRemoveMedia = (id: string) => {
    setMediaItems((prev) => prev.filter((item) => item.id !== id));
    // Also remove from files array if it's a file
    const mediaItem = mediaItems.find((item) => item.id === id);
    if (mediaItem && mediaItem.file) {
      setFiles((prev) => prev.filter((file) => file !== mediaItem.file));
    }
  };

  const handleOpenMedia = (media: MediaItem) => {
    setSelectedMedia(media);
  };

  const handleSelectThumbnail = (media: MediaItem) => {
    if (!media || !media.id) {
      console.error("Invalid media item passed to handleSelectThumbnail");
      toast.error("Failed to select thumbnail: Invalid item");
      return;
    }
    setSelectedThumbnail(media.id); // Store the ID
    toast.success("Selected as project thumbnail");
  };

  const handleProceedToDetails = () => {
    // Validate there's at least one media item before proceeding
    if (mediaItems.length === 0) {
      toast.error("Please add at least one media item before proceeding");
      return;
    }

    setFormStep(2);
  };

  const handleGoBackToMedia = () => {
    setFormStep(1);
  };

  const handleCreateProject = async () => {
    // Validate required fields
    if (!title.trim()) {
      toast.error("Project title is required");
      return;
    }

    if (!shortDescription.trim()) {
      toast.error("Short description is required");
      return;
    }

    if (selectedRoles.length === 0) {
      toast.error("At least one project role is required");
      return;
    }

    if (!year) {
      toast.error("Project year is required");
      return;
    }

    // Validate that there's at least one media item
    if (mediaItems.length === 0) {
      toast.error(
        "Please add at least one media item before creating the project"
      );
      return;
    }

    setIsSubmitting(true);
    setCurrentStep("Creating project...");

    try {
      // Get current user's username
      const username = window.location.pathname.split("/")[1] || "";
      console.log("Extracted username from URL:", username);
      console.log("Current pathname:", window.location.pathname);

      if (!username) {
        throw new Error("Could not determine username from URL");
      }

      // Variable to store the final URL determined after uploads/imports
      let finalThumbnailUrl: string | null = null;

      // First, create the project
      const projectResponse = await createProjectAction(username, {
        title,
        description,
        short_description: shortDescription,
        roles: selectedRoles,
        client_ids: selectedClients,
        year,
        // No thumbnail info here, will update later if needed
      });

      if (!projectResponse.success || !projectResponse.data) {
        console.error("Project creation failed:", projectResponse);
        throw new Error(projectResponse.message || "Failed to create project");
      }

      const projectId = projectResponse.data.id;

      if (!projectId) {
        console.error("No project ID returned from API");
        throw new Error("No project ID returned from API");
      }

      // Track upload success for validation
      let hasUploadErrors = false;
      let uploadErrorMessages: string[] = [];

      // Separate local files from remote URL items
      const fileUploads = [...files]; // These are true File objects
      console.log(
        "Files to upload:",
        fileUploads.map((f) => ({ name: f.name, size: f.size, type: f.type }))
      );

      // Add scraped media URLs (excluding YouTube/Vimeo which are handled separately)
      const scrapedMediaItems = mediaItems
        .filter(
          (item) =>
            !item.file && // Not already a file
            item.type !== "youtube" && // Not YouTube
            item.type !== "vimeo" && // Not Vimeo
            item.url // Has a URL
        )
        .map((item) => ({
          url: item.url,
          type: item.type as "image" | "video",
          alt_text: item.alt_text,
          order: item.order,
        }));

      console.log("Scraped media items to import:", scrapedMediaItems);

      // Handle local file uploads first if there are any
      let uploadResponse: any = null; // Store response for later use
      if (fileUploads.length > 0) {
        setCurrentStep(`Uploading ${fileUploads.length} local files...`);

        try {
          uploadResponse = await batchUploadMediaAction(
            username,
            projectId,
            fileUploads
          );

          if (!uploadResponse.success) {
            console.error("File upload failed:", uploadResponse);
            hasUploadErrors = true;
            uploadErrorMessages.push(
              `File upload failed: ${uploadResponse.message || uploadResponse.error}`
            );
          } else if (uploadResponse.data) {
            // Check for partial failures
            if (
              uploadResponse.data.errors &&
              uploadResponse.data.errors.length > 0
            ) {
              hasUploadErrors = true;
              uploadErrorMessages.push(
                `${uploadResponse.data.errors.length} files failed to upload`
              );
            }

            // Process successful upload, check if selected thumbnail was uploaded
            const selectedMediaItem = mediaItems.find(
              (item) => item.id === selectedThumbnail
            );

            if (selectedMediaItem?.file) {
              // Access the correct array: data.media
              const uploadedMediaArray = uploadResponse.data?.media;

              // Declare variable here to ensure it's accessible in the outer scope
              let matchingImage: any = null;

              // Strategy 1: Match by filename
              const fileName = selectedMediaItem.file.name;

              // Ensure media array exists before trying to find
              if (Array.isArray(uploadedMediaArray)) {
                // Access metadata for original_filename
                matchingImage = uploadedMediaArray.find(
                  // Use metadata for original filename
                  (img: any) => img.metadata?.original_filename === fileName
                );
              } else {
                console.warn(
                  "uploadResponse.data.media is not an array or is missing."
                );
                // Handle case where media array is missing - cannot find match
              }

              // Strategy 2: Try to match by file size if strategy 1 fails
              if (!matchingImage) {
                const fileSize = selectedMediaItem.file.size;
                // Access metadata for file_size
                matchingImage = uploadedMediaArray.find(
                  // Use metadata for file size
                  (img: any) => img.metadata?.file_size === fileSize
                );
              }

              if (matchingImage && matchingImage.url) {
                finalThumbnailUrl = matchingImage.url; // Store the URL
              } else {
                console.warn(
                  "Could not find matching uploaded image for selected thumbnail file."
                );
              }
            }
          }
        } catch (uploadError: any) {
          console.error("Error during file upload:", uploadError);
          hasUploadErrors = true;
          uploadErrorMessages.push(
            `File upload error: ${uploadError.message || "Unknown error"}`
          );
        }
      }

      // Then handle scraped media URLs using the proper endpoint
      let importResponse: any = null; // Store response for later use
      if (scrapedMediaItems.length > 0) {
        setCurrentStep(`Uploading ${scrapedMediaItems.length} media URLs...`);

        try {
          const importResults = [];
          const importErrors = [];

          for (const mediaItem of scrapedMediaItems) {
            try {
              const result = await importMediaFromUrlAction({
                projectId: projectId,
                url: mediaItem.url,
                mediaType: mediaItem.type,
                title: mediaItem.alt_text,
              });

              if (result.success) {
                importResults.push(result.data);
              } else {
                importErrors.push(result.error);
              }
            } catch (error: any) {
              importErrors.push(error.message);
            }
          }

          // Create a response object similar to the expected format
          importResponse = {
            success: importResults.length > 0,
            data: {
              media: importResults,
              total: importResults.length,
              errors: importErrors,
            },
            message: `Imported ${importResults.length} media items`,
          };

          // Check for import failures
          if (importErrors.length > 0) {
            hasUploadErrors = true;
            uploadErrorMessages.push(
              `${importErrors.length} media items failed to import`
            );
          }

          // Check if we need to set the thumbnail from imported images
          if (
            selectedThumbnail &&
            !finalThumbnailUrl &&
            // Check the correct media array
            Array.isArray(importResponse.data?.media) // Check if media array exists
          ) {
            // Find the selected thumbnail in imported images (using frontend ID)
            const selectedMediaItem = mediaItems.find(
              (item) => item.id === selectedThumbnail
            );

            if (selectedMediaItem && selectedMediaItem.url) {
              // Search in the correct media array (importResponse.data.media)
              const matchingImage = importResponse.data.media.find(
                (img: any) => img.url === selectedMediaItem.url
              );

              if (matchingImage && matchingImage.url) {
                finalThumbnailUrl = matchingImage.url; // Store the URL
              }
            }
          }
        } catch (importError: any) {
          console.error("Error during URL import:", importError);
          hasUploadErrors = true;
          uploadErrorMessages.push(
            `URL import error: ${importError.message || "Unknown error"}`
          );
        }
      }

      // Upload any video links (YouTube or Vimeo)
      const videoLinks = mediaItems.filter(
        (item) =>
          (item.type === "youtube" && item.youtube_id) ||
          (item.type === "vimeo" && item.vimeo_id)
      );

      console.log(
        "Video links to add:",
        videoLinks.map((v) => ({
          type: v.type,
          url: v.url,
          youtube_id: v.youtube_id,
          vimeo_id: v.vimeo_id,
        }))
      );

      if (videoLinks.length > 0) {
        setCurrentStep(`Adding ${videoLinks.length} video links...`);

        let successCount = 0;
        let errorCount = 0;

        for (const videoItem of videoLinks) {
          if (!videoItem.file) {
            // Skip if it's a file that was already uploaded
            try {
              const videoResponse = await uploadVideoLinkAction(
                username,
                projectId,
                {
                  video_url: videoItem.url,
                  title: `${videoItem.type === "youtube" ? "YouTube" : "Vimeo"} video`,
                }
              );

              if (!videoResponse.success) {
                console.error("Video link upload failed:", videoResponse);
                errorCount++;
              } else {
                successCount++;
              }
            } catch (videoError: any) {
              console.error("Error adding video link:", videoError);
              errorCount++;
            }
          }
        }

        if (errorCount > 0) {
          hasUploadErrors = true;
          uploadErrorMessages.push(
            `${errorCount} video links failed to upload`
          );
        }
      }

      // Check if we have any upload errors - if so, fail the entire process
      if (hasUploadErrors) {
        // Delete the created project since media upload failed
        try {
          await deleteProjectAction(username, projectId);
        } catch (deleteError) {
          console.error(
            "Failed to cleanup project after media upload failure:",
            deleteError
          );
        }

        const errorMessage = uploadErrorMessages.join("; ");
        throw new Error(
          `Media upload failed: ${errorMessage}. Project creation cancelled.`
        );
      }

      // ----- Final Thumbnail Update -----
      // After all uploads/imports, check if we determined a thumbnail URL
      if (finalThumbnailUrl) {
        setCurrentStep("Setting project thumbnail...");
        try {
          const updateResponse = await updateProjectAction(
            username,
            projectId,
            {
              thumbnail_url: finalThumbnailUrl,
            }
          );

          if (updateResponse.success) {
            toast.success("Project thumbnail set successfully");
          } else {
            console.error("Thumbnail update failed:", updateResponse);
            toast.error("Failed to set project thumbnail (URL method)");
          }
        } catch (thumbnailError: any) {
          console.error("Error setting thumbnail URL:", thumbnailError);
          toast.error(
            `Thumbnail setting error: ${thumbnailError.message || "Unknown error"}`
          );
        }
      } else if (selectedThumbnail) {
        // This case means a thumbnail was selected, but we couldn't determine its final URL
        // (e.g., it wasn't an image, or the upload/import failed/didn't return it)
        toast.warning("Could not determine final URL for selected thumbnail.");
      }

      setCurrentStep("Finalizing project...");
      toast.success("Project created successfully with all media uploaded!");
      router.push(`/project/${projectId}`);
    } catch (error: any) {
      console.error("Error creating project:", error);
      toast.error(error.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
      setCurrentStep("");
    }
  };

  // Construct the project object for the preview
  const projectPreview = {
    id: "new-project-preview",
    title: title || "New Project",
    short_description: shortDescription || "New Project Description",
    images: mediaItems
      .filter((item) => item.type === "image")
      .map((item) => ({ url: item.url })),
    thumbnail_url: mediaItems.find((item) => item.id === selectedThumbnail)
      ?.url,
  };

  return (
    <>
      {/* Project Card Preview */}
      <div className="max-w-lg mx-auto mb-8">
        <ProjectCard project={projectPreview} isPreview={true} />
      </div>

      {formStep === 1 ? (
        <MediaUploadStep
          showImportOption={showImportOption}
          projectLink={projectLink}
          setProjectLink={setProjectLink}
          importError={importError}
          isImporting={isImporting}
          handleImportMedia={handleImportMedia}
          handleFileDrop={handleFileDrop}
          handleDragOver={(e: React.DragEvent) => e.preventDefault()}
          isLargeFile={isLargeFile}
          handleFileSelect={handleFileSelect}
          mediaLink={mediaLink}
          setMediaLink={setMediaLink}
          handleAddMediaLink={handleAddMediaLink}
          mediaItems={mediaItems}
          handleOpenMedia={handleOpenMedia}
          handleRemoveMedia={handleRemoveMedia}
          handleProceedToDetails={handleProceedToDetails}
          scrapingHandleId={scrapingHandleId}
          onScraperComplete={onScraperComplete}
          accessToken={accessToken}
          selectedThumbnail={selectedThumbnail}
          handleSelectThumbnail={handleSelectThumbnail}
          project={projectPreview} // Pass the constructed project object
        />
      ) : (
        <ProjectDetailsStep
          title={title}
          setTitle={setTitle}
          shortDescription={shortDescription}
          setShortDescription={setShortDescription}
          description={description}
          setDescription={setDescription}
          year={year}
          setYear={setYear}
          selectedRoles={selectedRoles}
          setSelectedRoles={setSelectedRoles}
          selectedClients={selectedClients}
          setSelectedClients={setSelectedClients}
          isLoadingOrgs={isLoadingOrgs}
          organizations={organizations}
          handleGoBackToMedia={handleGoBackToMedia}
          handleCreateProject={handleCreateProject}
          isSubmitting={isSubmitting}
          currentStep={currentStep}
        />
      )}

      {/* Media Preview Dialog */}
      <Dialog
        open={!!selectedMedia}
        onOpenChange={(open) => {
          if (!open) setSelectedMedia(null);
        }}
      >
        <DialogContent className="max-w-4xl max-h-screen overflow-auto">
          <DialogHeader>
            <DialogTitle>Media Preview</DialogTitle>
            <DialogDescription>Preview of the selected media</DialogDescription>
          </DialogHeader>
          {selectedMedia?.type === "image" && (
            <>
              <img
                src={selectedMedia.url}
                alt="Preview"
                className="w-full h-auto"
              />
              <div className="flex justify-end mt-4 space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleSelectThumbnail(selectedMedia);
                  }}
                  disabled={selectedThumbnail === selectedMedia.id}
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  {selectedThumbnail === selectedMedia.id
                    ? "Selected as Thumbnail"
                    : "Set as Thumbnail"}
                </Button>
              </div>
            </>
          )}
          {selectedMedia?.type === "video" && (
            <video src={selectedMedia.url} controls className="w-full h-auto" />
          )}
          {selectedMedia?.type === "youtube" && selectedMedia.youtube_id && (
            <div className="aspect-video">
              <YouTubeEmbed youtubeId={selectedMedia.youtube_id} />
            </div>
          )}
          {selectedMedia?.type === "vimeo" && selectedMedia.vimeo_id && (
            <div className="aspect-video">
              <VimeoEmbed vimeoId={selectedMedia.vimeo_id} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
