"use client";

import { useJobCreator, type Veo2Input } from "@/data/mutations";
import { queryKeys, useProject, useProjectMediaItems } from "@/data/queries";
import type { MediaItem } from "@/data/schema";
import {
  type GenerateData,
  type MediaType,
  type AspectRatio,
  type DurationString,
  useProjectId,
  useVideoProjectStore,
} from "@/data/store";
import { AVAILABLE_ENDPOINTS, type InputAsset } from "@/lib/fal";
import {
  ImageIcon,
  MicIcon,
  MusicIcon,
  LoaderCircleIcon,
  VideoIcon,
  ArrowLeft,
  TrashIcon,
  WandSparklesIcon,
  XIcon,
  InfoIcon,
  UploadIcon,
  SparklesIcon,
  CheckIcon,
  ChevronRightIcon,
  GalleryVerticalIcon,
  Sparkles,
} from "lucide-react";
import { MediaItemRow } from "./media-panel";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Slider } from "./ui/slider";

import { useEffect, useMemo, useState, memo } from "react";
import { useUploadThing } from "@/lib/uploadthing";
import type { ClientUploadedFileData } from "uploadthing/types";
import { db } from "@/data/db";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  assetKeyMap,
  cn,
  getAssetKey,
  getAssetType,
  mapInputKey,
  resolveMediaUrl,
} from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { enhancePrompt } from "@/lib/prompt";
import {
  WithTooltip,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { LoadingIcon } from "./ui/icons";
import { getMediaMetadata } from "@/lib/ffmpeg";
import CameraMovement from "./camera-control";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";

type ModelEndpointPickerProps = {
  mediaType: string;
  onValueChange: (value: MediaType) => void;
} & Parameters<typeof Select>[0];

function ModelEndpointPicker({
  mediaType,
  value,
  ...props
}: ModelEndpointPickerProps) {
  const endpoints = useMemo(
    () =>
      AVAILABLE_ENDPOINTS.filter((endpoint) => endpoint.category === mediaType),
    [mediaType],
  );

  // Find the selected endpoint to display its label
  const selectedEndpoint = useMemo(
    () => AVAILABLE_ENDPOINTS.find((endpoint) => endpoint.endpointId === value),
    [value],
  );

  return (
    <Select {...props} value={value}>
      <SelectTrigger className="text-base w-full font-semibold bg-black/30 border-white/10 hover:border-white/20 transition-colors rounded-xl">
        <div className="flex items-center gap-2">
          {selectedEndpoint ? (
            <>
              <span className="text-white">{selectedEndpoint.label}</span>
              {selectedEndpoint.endpointId.includes("v1.5") && (
                <Badge
                  variant="outline"
                  className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] px-1.5 py-0 shrink-0"
                >
                  NEW
                </Badge>
              )}
            </>
          ) : (
            <span className="text-white">Select a model</span>
          )}
        </div>
      </SelectTrigger>
      <SelectContent className="max-w-md float-panel">
        {endpoints.map((endpoint) => (
          <SelectItem
            key={endpoint.endpointId}
            value={endpoint.endpointId}
            className="py-2"
            textValue={endpoint.label} // This ensures screen readers read the label only
          >
            {endpoint.description ? (
              <div className="flex flex-col gap-1 w-full overflow-hidden">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate text-white">
                    {endpoint.label}
                  </span>
                  {endpoint.endpointId.includes("v1.5") && (
                    <Badge
                      variant="outline"
                      className="bg-blue-500/20 text-blue-200 border-blue-500/30 text-[10px] px-1.5 py-0 shrink-0"
                    >
                      NEW
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-200 mt-0.5 truncate w-full">
                  {endpoint.description}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-medium text-white">{endpoint.label}</span>
                {endpoint.endpointId.includes("v1.5") && (
                  <Badge
                    variant="outline"
                    className="bg-blue-500/20 text-blue-200 border-blue-500/30 text-[10px] px-1.5 py-0 shrink-0"
                  >
                    NEW
                  </Badge>
                )}
              </div>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Media type card component for better visual representation
function MediaTypeCard({
  type,
  icon,
  isSelected,
  onClick,
  color = "blue",
}: {
  type: string;
  icon: React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
  color?: "blue" | "purple" | "green" | "red" | "yellow";
}) {
  const colorMap = {
    blue: {
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      text: "text-blue-400",
      hover: "hover:bg-blue-500/20 hover:border-blue-500/30",
    },
    purple: {
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      text: "text-purple-400",
      hover: "hover:bg-purple-500/20 hover:border-purple-500/30",
    },
    green: {
      bg: "bg-green-500/10",
      border: "border-green-500/20",
      text: "text-green-400",
      hover: "hover:bg-green-500/20 hover:border-green-500/30",
    },
    red: {
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      text: "text-red-400",
      hover: "hover:bg-red-500/20 hover:border-red-500/30",
    },
    yellow: {
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
      text: "text-yellow-400",
      hover: "hover:bg-yellow-500/20 hover:border-yellow-500/30",
    },
  };

  const colors = colorMap[color];

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200",
        isSelected
          ? `${colors.bg} ${colors.border} ${colors.text}`
          : "border-white/5 hover:border-white/10 bg-black/30 hover:bg-black/50",
      )}
    >
      {isSelected && (
        <div className="absolute top-1.5 right-1.5">
          <CheckIcon className="w-3 h-3" />
        </div>
      )}
      <div
        className={cn(
          "w-8 h-8 flex items-center justify-center rounded-full",
          isSelected ? colors.bg : "bg-black/50",
        )}
      >
        {icon}
      </div>
      <span
        className={cn(
          "text-xs font-medium",
          isSelected ? colors.text : "text-gray-300",
        )}
      >
        {type}
      </span>
    </button>
  );
}

const RightPanel = memo(function RightPanel({
  onOpenChange,
}: {
  onOpenChange?: (open: boolean) => void;
}) {
  const videoProjectStore = useVideoProjectStore((s) => s);
  const {
    generateData,
    setGenerateData,
    resetGenerateData,
    endpointId,
    setEndpointId,
  } = videoProjectStore;

  const [tab, setTab] = useState<string>("generation");
  const [assetMediaType, setAssetMediaType] = useState("all");
  const [activeTab, setActiveTab] = useState("prompt");
  const projectId = useProjectId();
  const openGenerateDialog = useVideoProjectStore((s) => s.openGenerateDialog);
  const generateDialogOpen = useVideoProjectStore((s) => s.generateDialogOpen);
  const closeGenerateDialog = useVideoProjectStore(
    (s) => s.closeGenerateDialog,
  );
  const openFluxProStudio = useVideoProjectStore((s) => s.openFluxProStudio);
  const queryClient = useQueryClient();

  const handleOnOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      closeGenerateDialog();
      resetGenerateData();
      return;
    }
    onOpenChange?.(isOpen);
    openGenerateDialog();
  };

  const { data: project } = useProject(projectId);

  const { toast } = useToast();
  const enhance = useMutation({
    mutationFn: async () => {
      return enhancePrompt(generateData.prompt, {
        type: mediaType,
        project,
      });
    },
    onSuccess: (enhancedPrompt) => {
      setGenerateData({ prompt: enhancedPrompt });
      toast({
        title: "Prompt enhanced",
        description: "Your prompt has been improved with AI suggestions.",
      });
    },
    onError: (error) => {
      console.warn("Failed to create suggestion", error);
      toast({
        title: "Failed to enhance prompt",
        description: "There was an unexpected error. Try again.",
      });
    },
  });

  const { data: mediaItems = [] } = useProjectMediaItems(projectId);
  const mediaType = useVideoProjectStore((s) => s.generateMediaType);
  const setMediaType = useVideoProjectStore((s) => s.setGenerateMediaType);

  const endpoint = useMemo(
    () =>
      AVAILABLE_ENDPOINTS.find(
        (endpoint) => endpoint.endpointId === endpointId,
      ),
    [endpointId],
  );

  const handleMediaTypeChange = (mediaType: string) => {
    setMediaType(mediaType as MediaType);

    // Get all endpoints for this media type
    const filteredEndpoints = AVAILABLE_ENDPOINTS.filter(
      (endpoint) => endpoint.category === mediaType,
    );

    // Get the first available endpoint for this media type
    const endpoint = filteredEndpoints.length > 0 ? filteredEndpoints[0] : null;

    const initialInput = endpoint?.initialInput || {};

    setGenerateData({ ...initialInput });

    setEndpointId(
      endpoint?.endpointId ??
        filteredEndpoints[0]?.endpointId ??
        AVAILABLE_ENDPOINTS[0].endpointId,
    );
  };

  // Prepare the input data for the job
  const prepareJobInput = () => {
    // Start with the initial input from the endpoint
    const baseInput = {
      ...(endpoint?.initialInput || {}),
      ...mapInputKey(generateData, endpoint?.inputMap || {}),
    };

    // For Veo 2, handle the special case of image-to-video
    if (endpointId === "fal-ai/veo2") {
      // Create a new object with the base input
      const veoInput: Veo2Input = {
        prompt: generateData.prompt,
        aspect_ratio: generateData.aspect_ratio || "auto",
        duration: generateData.duration_string || "5s",
      };

      // Only include image_url if we have an image and it's a string URL
      if (generateData.image && typeof generateData.image === "string") {
        console.log("Using image URL for Veo 2:", generateData.image);
        veoInput.image_url = generateData.image;
      }

      console.log("Final Veo 2 input:", veoInput);
      return veoInput;
    }

    // For all other cases, return the base input
    return baseInput;
  };

  // Determine the correct endpoint for Veo 2 based on whether an image is provided
  const effectiveEndpointId = useMemo(() => {
    if (
      endpointId === "fal-ai/veo2" &&
      generateData.image &&
      typeof generateData.image === "string"
    ) {
      // Use the image-to-video endpoint when an image is provided
      return "fal-ai/veo2/image-to-video";
    }
    // Otherwise use the standard endpoint
    return endpointId;
  }, [endpointId, generateData.image]);

  const createJob = useJobCreator({
    projectId,
    endpointId: effectiveEndpointId,
    mediaType,
    input: prepareJobInput(),
  });

  // Disable the generate button if prompt is empty
  const isGenerateDisabled =
    createJob.isPending || !generateData.prompt?.trim();

  const handleOnGenerate = async () => {
    // Log the input data for debugging
    console.log("Generating with input:", prepareJobInput());
    console.log("Base endpoint:", endpointId);
    console.log("Effective endpoint:", effectiveEndpointId);
    console.log("Image data:", generateData.image);

    // Show a toast to indicate the mode being used
    if (generateData.image && typeof generateData.image === "string") {
      toast({
        title: "Using Image-to-Video Mode",
        description: "Animating your uploaded image based on the prompt.",
      });
    } else {
      toast({
        title: "Using Text-to-Video Mode",
        description: "Generating video from your text prompt.",
      });
    }

    await createJob.mutateAsync(undefined, {
      onSuccess: async (data) => {
        console.log("Job created successfully:", data);
        if (!createJob.isError) {
          handleOnOpenChange(false);
          toast({
            title: "Generation started",
            description:
              "Your video is being generated. It will appear in the media panel when ready.",
          });
        }
      },
      onError: (error) => {
        console.error("Job creation failed:", error);
        toast({
          title: "Generation failed",
          description:
            "There was an error generating your content. Please try again.",
        });
      },
    });
  };

  // Remove the problematic useEffect - we'll call handleOnGenerate directly

  const handleSelectMedia = (media: MediaItem) => {
    const asset = endpoint?.inputAsset?.find((item) => {
      const assetType = getAssetType(item);

      if (
        assetType === "audio" &&
        (media.mediaType === "voiceover" || media.mediaType === "music")
      ) {
        return true;
      }
      return assetType === media.mediaType;
    });

    if (!asset) {
      setTab("generation");
      return;
    }

    setGenerateData({ [getAssetKey(asset)]: resolveMediaUrl(media) });
    setTab("generation");
  };

  const { startUpload, isUploading } = useUploadThing("fileUploader");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    try {
      const uploadedFiles = await startUpload(Array.from(files));
      if (uploadedFiles) {
        await handleUploadComplete(uploadedFiles);
      }
    } catch (err) {
      console.warn(`ERROR! ${err}`);
      toast({
        title: "Failed to upload file",
        description: "Please try again",
      });
    }
  };

  const handleUploadComplete = async (
    files: ClientUploadedFileData<{
      uploadedBy: string;
    }>[],
  ) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const mediaType = file.type.split("/")[0];
      const outputType = mediaType === "audio" ? "music" : mediaType;

      const data: Omit<MediaItem, "id"> = {
        projectId,
        kind: "uploaded",
        createdAt: Date.now(),
        mediaType: outputType as MediaType,
        status: "completed",
        url: file.url,
      };

      setGenerateData({
        ...generateData,
        [assetKeyMap[outputType as keyof typeof assetKeyMap]]: file.url,
      });

      const mediaId = await db.media.create(data);
      const media = await db.media.find(mediaId as string);

      if (media && media.mediaType !== "image") {
        const mediaMetadata = await getMediaMetadata(media as MediaItem);

        await db.media
          .update(media.id, {
            ...media,
            metadata: mediaMetadata?.media || {},
          })
          .finally(() => {
            queryClient.invalidateQueries({
              queryKey: queryKeys.projectMediaItems(projectId),
            });
          });
      }
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col float-panel w-96 z-50 transition-all duration-300 absolute top-0 h-full bg-black",
        generateDialogOpen ? "right-0" : "-right-96",
      )}
    >
      <div className="flex-1 p-4 flex flex-col gap-4 h-full overflow-auto relative">
        <div className="flex flex-row items-center justify-between">
          <h2 className="text-sm text-gray-400 font-semibold flex-1">
            Generate Media
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOnOpenChange(false)}
            className="flex items-center gap-2 hover:bg-white/5 text-gray-400 hover:text-white rounded-full"
          >
            <XIcon className="w-6 h-6" />
          </Button>
        </div>
        <div className="w-full flex flex-col">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <MediaTypeCard
              type="Image"
              icon={<ImageIcon className="w-4 h-4" />}
              isSelected={mediaType === "image"}
              onClick={() => handleMediaTypeChange("image")}
              color="purple"
            />
            <MediaTypeCard
              type="Video"
              icon={<VideoIcon className="w-4 h-4" />}
              isSelected={mediaType === "video"}
              onClick={() => handleMediaTypeChange("video")}
              color="red"
            />
            <MediaTypeCard
              type="Voiceover"
              icon={<MicIcon className="w-4 h-4" />}
              isSelected={mediaType === "voiceover"}
              onClick={() => handleMediaTypeChange("voiceover")}
              color="yellow"
            />
            <MediaTypeCard
              type="Music"
              icon={<MusicIcon className="w-4 h-4" />}
              isSelected={mediaType === "music"}
              onClick={() => handleMediaTypeChange("music")}
              color="green"
            />
          </div>
          <div className="flex flex-col gap-2 mt-2 justify-start font-medium text-base">
            <div className="text-gray-400">Using</div>
            <ModelEndpointPicker
              mediaType={mediaType}
              value={endpointId}
              onValueChange={(endpointId) => {
                resetGenerateData();
                setEndpointId(endpointId);

                const endpoint = AVAILABLE_ENDPOINTS.find(
                  (endpoint) => endpoint.endpointId === endpointId,
                );

                const initialInput = endpoint?.initialInput || {};
                setGenerateData({ ...initialInput });
              }}
            />
          </div>
        </div>

        {/* Pro Studio Button */}
        {mediaType === "image" && (
          <div className="mt-2 mb-2">
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                // Close the generate dialog
                handleOnOpenChange(false);
                // Open the Flux Pro Studio
                openFluxProStudio(null, "flux-pro");
              }}
              className="w-full bg-black/30 hover:bg-black/50 border border-white/10 hover:border-white/20 text-white rounded-xl"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Open Image Studio
            </Button>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Access advanced image editing tools in the Image Studio
            </p>
          </div>
        )}

        {/* Prompt Input Section */}
        {tab === "generation" && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <h3 className="text-sm font-medium text-gray-300">Prompt</h3>
                {endpointId === "fal-ai/veo2" && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="w-3.5 h-3.5 text-gray-400 hover:text-gray-300 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs bg-black border border-white/10 text-white p-3">
                        <p className="font-medium mb-1">
                          Effective Veo 2 Prompts:
                        </p>
                        <ul className="list-disc pl-4 text-xs space-y-1">
                          <li>
                            <strong>Action:</strong> Describe how the
                            image/scene should be animated
                          </li>
                          <li>
                            <strong>Style:</strong> Specify the visual style
                            (realistic, cartoon, etc.)
                          </li>
                          <li>
                            <strong>Camera:</strong> Describe camera movements
                            (zoom, pan, tracking)
                          </li>
                          <li>
                            <strong>Ambiance:</strong> Set the mood and
                            atmosphere
                          </li>
                        </ul>
                        <p className="text-xs mt-1 italic">
                          Example: "A lego chef cooking eggs with steam rising,
                          camera slowly zooming in, warm morning light"
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                onClick={() => enhance.mutate()}
                disabled={enhance.isPending}
              >
                {enhance.isPending ? (
                  <LoadingIcon className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <WandSparklesIcon className="mr-1 h-3 w-3" />
                )}
                Enhance
              </Button>
            </div>
            <Textarea
              placeholder={
                endpointId === "fal-ai/veo2"
                  ? generateData.image
                    ? "Describe how to animate the image (e.g., 'A lego chef cooking eggs, camera slowly zooming in')"
                    : "Describe the video you want to generate in detail (subject, action, style, camera motion)"
                  : "Describe what you want to generate..."
              }
              className="min-h-[100px] bg-black/50 border-white/5 resize-none rounded-xl"
              value={generateData.prompt}
              onChange={(e) => setGenerateData({ prompt: e.target.value })}
            />

            {/* Veo 2 specific controls */}
            {(endpointId === "fal-ai/veo2" ||
              endpointId === "fal-ai/veo2/image-to-video") && (
              <div className="flex flex-col gap-4 mt-4">
                {/* Image Upload Section */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-medium text-gray-100">
                    Input Image
                  </h3>
                  <div className="relative">
                    <label
                      htmlFor="image-upload"
                      className="flex flex-col items-center justify-center w-full h-32 bg-black/30 border border-white/10 hover:border-white/20 rounded-xl cursor-pointer overflow-hidden"
                    >
                      {generateData.image ? (
                        <div className="w-full h-full relative">
                          <img
                            src={
                              typeof generateData.image === "string"
                                ? generateData.image
                                : URL.createObjectURL(generateData.image)
                            }
                            alt="Uploaded image"
                            className="w-full h-full object-contain"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-1"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setGenerateData({ image: null });
                            }}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-300">
                          <UploadIcon className="w-8 h-8 mb-2" />
                          <span className="text-sm">
                            Upload an image to animate
                          </span>
                          <span className="text-xs text-gray-400 mt-1">
                            Click to browse or drag and drop
                          </span>
                        </div>
                      )}
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              // Show loading state
                              setGenerateData({ image: file });

                              // Upload the file to get a proper URL
                              const uploadedFiles = await startUpload([file]);
                              if (uploadedFiles && uploadedFiles.length > 0) {
                                // Set the uploaded image URL in the generateData
                                setGenerateData({
                                  image: uploadedFiles[0].url,
                                });
                                toast({
                                  title: "Image uploaded",
                                  description:
                                    "Your image is ready to be animated.",
                                });
                              }
                            } catch (err) {
                              console.warn(`ERROR! ${err}`);
                              toast({
                                title: "Failed to upload image",
                                description: "Please try again",
                              });
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-300">
                    Optional: Upload an image to animate, or leave empty to
                    generate from text prompt
                  </p>
                </div>
                {/* Aspect Ratio Selector */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-medium text-gray-100">
                    Aspect Ratio
                  </h3>
                  <Select
                    value={generateData.aspect_ratio || "auto"}
                    onValueChange={(value) =>
                      setGenerateData({ aspect_ratio: value as AspectRatio })
                    }
                  >
                    <SelectTrigger className="bg-black/30 border-white/10 hover:border-white/20 rounded-xl text-white">
                      <SelectValue placeholder="Select aspect ratio" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/10">
                      <SelectItem value="auto" className="text-white">
                        Auto (from image)
                      </SelectItem>
                      <SelectItem value="16:9" className="text-white">
                        Landscape (16:9)
                      </SelectItem>
                      <SelectItem value="9:16" className="text-white">
                        Portrait (9:16)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-300">
                    Choose the aspect ratio for your generated video
                  </p>
                </div>

                {/* Duration Selector */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-medium text-gray-100">
                    Duration
                  </h3>
                  <Select
                    value={generateData.duration_string || "5s"}
                    onValueChange={(value) =>
                      setGenerateData({
                        duration_string: value as DurationString,
                      })
                    }
                  >
                    <SelectTrigger className="bg-black/30 border-white/10 hover:border-white/20 rounded-xl text-white">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/10">
                      <SelectItem value="5s" className="text-white">
                        5 seconds
                      </SelectItem>
                      <SelectItem value="6s" className="text-white">
                        6 seconds
                      </SelectItem>
                      <SelectItem value="7s" className="text-white">
                        7 seconds
                      </SelectItem>
                      <SelectItem value="8s" className="text-white">
                        8 seconds
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-300">
                    Select the duration of your generated video
                  </p>
                </div>
              </div>
            )}

            {/* Generate Button */}
            <Button
              variant="default"
              size="lg"
              onClick={handleOnGenerate}
              disabled={isGenerateDisabled}
              className="mt-4 w-full btn-accent rounded-xl"
            >
              {createJob.isPending ? (
                <LoadingIcon className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <SparklesIcon className="mr-2 h-4 w-4" />
              )}
              {`Generate ${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});

export default RightPanel;
