"use client";

import { useJobCreator } from "@/data/mutations";
import { queryKeys, useProject, useProjectMediaItems } from "@/data/queries";
import type { MediaItem } from "@/data/schema";
import {
  type GenerateData,
  type MediaType,
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

import { useEffect, useMemo, useState } from "react";
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
import { WithTooltip } from "./ui/tooltip";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { VoiceSelector } from "./playht/voice-selector";
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
      <SelectTrigger className="text-base w-full font-semibold bg-black/50 border-white/5 hover:border-blue-500/30 transition-colors rounded-xl">
        <div className="flex items-center gap-2">
          {selectedEndpoint ? (
            <>
              <span>{selectedEndpoint.label}</span>
              {selectedEndpoint.endpointId.includes("v1.5") && (
                <Badge
                  variant="outline"
                  className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] px-1.5 py-0 flex-shrink-0"
                >
                  NEW
                </Badge>
              )}
            </>
          ) : (
            <span className="text-muted-foreground">Select a model</span>
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
                  <span className="font-medium truncate">{endpoint.label}</span>
                  {endpoint.endpointId.includes("v1.5") && (
                    <Badge
                      variant="outline"
                      className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] px-1.5 py-0 flex-shrink-0"
                    >
                      NEW
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5 truncate w-full">
                  {endpoint.description}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-medium">{endpoint.label}</span>
                {endpoint.endpointId.includes("v1.5") && (
                  <Badge
                    variant="outline"
                    className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] px-1.5 py-0 flex-shrink-0"
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

export default function RightPanel({
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

    if (
      (mediaType === "video" &&
        endpoint?.endpointId === "fal-ai/hunyuan-video") ||
      mediaType !== "video"
    ) {
      setGenerateData({ image: null, ...initialInput });
    } else {
      setGenerateData({ ...initialInput });
    }

    setEndpointId(
      endpoint?.endpointId ??
        filteredEndpoints[0]?.endpointId ??
        AVAILABLE_ENDPOINTS[0].endpointId,
    );
  };

  const createJob = useJobCreator({
    projectId,
    endpointId:
      generateData.image && mediaType === "video"
        ? `${endpointId}/image-to-video`
        : endpointId,
    mediaType,
    input: {
      ...(endpoint?.initialInput || {}),
      ...mapInputKey(generateData, endpoint?.inputMap || {}),
    },
  });

  const handleOnGenerate = async () => {
    await createJob.mutateAsync({} as any, {
      onSuccess: async () => {
        if (!createJob.isError) {
          handleOnOpenChange(false);
        }
      },
    });
  };

  useEffect(() => {
    videoProjectStore.onGenerate = handleOnGenerate;
  }, [handleOnGenerate]);

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
              className="w-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border-blue-500/30 hover:border-blue-500/50 text-blue-400 hover:text-blue-300 rounded-xl"
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
              <h3 className="text-sm font-medium text-gray-300">Prompt</h3>
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
              placeholder="Describe what you want to generate..."
              className="min-h-[100px] bg-black/50 border-white/5 resize-none rounded-xl"
              value={generateData.prompt}
              onChange={(e) => setGenerateData({ prompt: e.target.value })}
            />

            {/* Recraft 20B specific controls */}
            {endpointId === "fal-ai/recraft-20b" && (
              <div className="flex flex-col gap-4 mt-4">
                {/* Style Selector */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-medium text-gray-300">Style</h3>
                  <Select
                    value={generateData.style || "realistic_image"}
                    onValueChange={(value) => setGenerateData({ style: value })}
                  >
                    <SelectTrigger className="bg-black/50 border-white/5 rounded-xl">
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realistic_image">Realistic</SelectItem>
                      <SelectItem value="anime">Anime</SelectItem>
                      <SelectItem value="illustration">Illustration</SelectItem>
                      <SelectItem value="painting">Painting</SelectItem>
                      <SelectItem value="3d_render">3D Render</SelectItem>
                      <SelectItem value="sketch">Sketch</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-400">
                    Choose the visual style for your generated image
                  </p>
                </div>

                {/* Image Size Selector */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-medium text-gray-300">
                    Image Size
                  </h3>
                  <Select
                    value={generateData.image_size || "square_hd"}
                    onValueChange={(value) =>
                      setGenerateData({ image_size: value })
                    }
                  >
                    <SelectTrigger className="bg-black/50 border-white/5 rounded-xl">
                      <SelectValue placeholder="Select image size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="square_hd">Square HD</SelectItem>
                      <SelectItem value="portrait_hd">Portrait HD</SelectItem>
                      <SelectItem value="landscape_hd">Landscape HD</SelectItem>
                      <SelectItem value="widescreen_hd">
                        Widescreen HD (16:9)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-400">
                    Select the aspect ratio and resolution for your image
                  </p>
                </div>
              </div>
            )}

            {/* Generate Button */}
            <Button
              variant="default"
              size="lg"
              onClick={handleOnGenerate}
              disabled={createJob.isPending || !generateData.prompt?.trim()}
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
}
