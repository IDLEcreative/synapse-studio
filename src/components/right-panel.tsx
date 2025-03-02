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
  const selectedEndpoint = useMemo(() => 
    AVAILABLE_ENDPOINTS.find(endpoint => endpoint.endpointId === value),
    [value]
  );
  
  return (
    <Select {...props} value={value}>
      <SelectTrigger className="text-base w-full font-semibold bg-gray-800/50 border-gray-700 hover:border-blue-500/50 transition-colors">
        <div className="flex items-center gap-2">
          {selectedEndpoint ? (
            <>
              <span>{selectedEndpoint.label}</span>
              {selectedEndpoint.endpointId.includes("v1.5") && (
                <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px] px-1.5 py-0 flex-shrink-0">NEW</Badge>
              )}
            </>
          ) : (
            <span className="text-muted-foreground">Select a model</span>
          )}
        </div>
      </SelectTrigger>
      <SelectContent className="max-w-md">
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
                    <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px] px-1.5 py-0 flex-shrink-0">NEW</Badge>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5 truncate w-full">{endpoint.description}</p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-medium">{endpoint.label}</span>
                {endpoint.endpointId.includes("v1.5") && (
                  <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px] px-1.5 py-0 flex-shrink-0">NEW</Badge>
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
  color = "blue"
}: { 
  type: string; 
  icon: React.ReactNode; 
  isSelected: boolean; 
  onClick: () => void;
  color?: "blue" | "purple" | "green" | "red" | "yellow";
}) {
  const colorMap = {
    blue: {
      bg: "bg-blue-500/20",
      border: "border-blue-500/30",
      text: "text-blue-400",
      hover: "hover:bg-blue-500/30 hover:border-blue-500/50",
    },
    purple: {
      bg: "bg-purple-500/20",
      border: "border-purple-500/30",
      text: "text-purple-400",
      hover: "hover:bg-purple-500/30 hover:border-purple-500/50",
    },
    green: {
      bg: "bg-green-500/20",
      border: "border-green-500/30",
      text: "text-green-400",
      hover: "hover:bg-green-500/30 hover:border-green-500/50",
    },
    red: {
      bg: "bg-red-500/20",
      border: "border-red-500/30",
      text: "text-red-400",
      hover: "hover:bg-red-500/30 hover:border-red-500/50",
    },
    yellow: {
      bg: "bg-yellow-500/20",
      border: "border-yellow-500/30",
      text: "text-yellow-400",
      hover: "hover:bg-yellow-500/30 hover:border-yellow-500/50",
    },
  };

  const colors = colorMap[color];

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center gap-2 p-3 rounded-lg border transition-all duration-200",
        isSelected 
          ? `${colors.bg} ${colors.border} ${colors.text}` 
          : "border-white/10 hover:border-white/20 bg-gray-800/30 hover:bg-gray-800/50"
      )}
    >
      {isSelected && (
        <div className="absolute top-1.5 right-1.5">
          <CheckIcon className="w-3 h-3" />
        </div>
      )}
      <div className={cn("w-8 h-8 flex items-center justify-center rounded-full", isSelected ? colors.bg : "bg-gray-700/50")}>
        {icon}
      </div>
      <span className={cn("text-xs font-medium", isSelected ? colors.text : "text-gray-300")}>
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
    const endpoint = AVAILABLE_ENDPOINTS.find(
      (endpoint) => endpoint.category === mediaType,
    );

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

    setEndpointId(endpoint?.endpointId ?? AVAILABLE_ENDPOINTS[0].endpointId);
  };
  // TODO improve model-specific parameters
  type InputType = {
    prompt: string;
    image_url?: File | string | null;
    video_url?: File | string | null;
    audio_url?: File | string | null;
    image_size?: { width: number; height: number } | string;
    aspect_ratio?: string;
    seconds_total?: number;
    voice?: string;
    input?: string;
    reference_audio_url?: File | string | null;
    advanced_camera_control?: {
      movement: string;
      value: number;
    };
    // Flux Pro tool parameters
    edge_strength?: number;
    depth_strength?: number;
    variation_strength?: number;
    mask_image_url?: File | string | null;
  };

  const aspectRatioMap = {
    "16:9": { image: "landscape_16_9", video: "16:9" },
    "9:16": { image: "portrait_16_9", video: "9:16" },
    "1:1": { image: "square_1_1", video: "1:1" },
  };

  let imageAspectRatio: string | { width: number; height: number } | undefined;
  let videoAspectRatio: string | undefined;

  if (project?.aspectRatio) {
    imageAspectRatio = aspectRatioMap[project.aspectRatio].image;
    videoAspectRatio = aspectRatioMap[project.aspectRatio].video;
  }

  const input: InputType = {
    prompt: generateData.prompt,
    image_url: undefined,
    image_size: imageAspectRatio,
    aspect_ratio: videoAspectRatio,
    seconds_total: generateData.duration ?? undefined,
    voice:
      endpointId === "fal-ai/playht/tts/v3" ? generateData.voice : undefined,
    input:
      endpointId === "fal-ai/playht/tts/v3" ? generateData.prompt : undefined,
  };

  if (generateData.image) {
    input.image_url = generateData.image;
  }
  if (generateData.video_url) {
    input.video_url = generateData.video_url;
  }
  if (generateData.audio_url) {
    input.audio_url = generateData.audio_url;
  }
  if (generateData.reference_audio_url) {
    input.reference_audio_url = generateData.reference_audio_url;
  }

  if (generateData.advanced_camera_control) {
    input.advanced_camera_control = generateData.advanced_camera_control;
  }

  // Add Flux Pro tool parameters
  if (endpointId === "fal-ai/flux-pro/v1/canny" || endpointId === "fal-ai/flux-pro/v1/canny-fine-tuned") {
    if (generateData.edgeStrength !== undefined) {
      input.edge_strength = generateData.edgeStrength;
    }
  }

  if (endpointId === "fal-ai/flux-pro/v1/depth" || endpointId === "fal-ai/flux-pro/v1/depth-fine-tuned") {
    if (generateData.depthStrength !== undefined) {
      input.depth_strength = generateData.depthStrength;
    }
  }

  if (endpointId === "fal-ai/flux-pro/v1/redux" || endpointId === "fal-ai/flux-pro/v1.1/redux") {
    if (generateData.variationStrength !== undefined) {
      input.variation_strength = generateData.variationStrength;
    }
  }

  if (endpointId === "fal-ai/flux-pro/v1/fill" || endpointId === "fal-ai/flux-pro/v1/fill-fine-tuned") {
    if (generateData.maskImage) {
      input.mask_image_url = generateData.maskImage;
    }
  }

  const extraInput =
    endpointId === "fal-ai/f5-tts"
      ? {
          gen_text: generateData.prompt,
          ref_audio_url:
            "https://github.com/SWivid/F5-TTS/raw/21900ba97d5020a5a70bcc9a0575dc7dec5021cb/tests/ref_audio/test_en_1_ref_short.wav",
          ref_text: "Some call me nature, others call me mother nature.",
          model_type: "F5-TTS",
          remove_silence: true,
        }
      : {};
  const createJob = useJobCreator({
    projectId,
    endpointId:
      generateData.image && mediaType === "video"
        ? `${endpointId}/image-to-video`
        : endpointId,
    mediaType,
    input: {
      ...(endpoint?.initialInput || {}),
      ...mapInputKey(input, endpoint?.inputMap || {}),
      ...extraInput,
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
        "flex flex-col border-l border-white/10 w-96 z-50 transition-all duration-300 absolute top-0 h-full bg-black",
        generateDialogOpen ? "right-0" : "-right-96",
      )}
    >
      <div className="flex-1 p-4 flex flex-col gap-4 border-b border-white/10 h-full overflow-auto relative">
        <div className="flex flex-row items-center justify-between">
          <h2 className="text-sm text-gray-400 font-semibold flex-1">
            Generate Media
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOnOpenChange(false)}
            className="flex items-center gap-2"
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
            <div className="text-muted-foreground">Using</div>
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
        
        {/* Flux Pro Tool Controls */}
        {tab === "generation" && (
          <div className="flex flex-col gap-3 mb-4">
            {/* Flux Pro Tool Controls Section Header */}
            {(endpointId.includes("flux-pro") && (
              endpointId === "fal-ai/flux-pro/v1/canny" || 
              endpointId === "fal-ai/flux-pro/v1/canny-fine-tuned" ||
              endpointId === "fal-ai/flux-pro/v1/depth" || 
              endpointId === "fal-ai/flux-pro/v1/depth-fine-tuned" ||
              endpointId === "fal-ai/flux-pro/v1/redux" || 
              endpointId === "fal-ai/flux-pro/v1.1/redux" ||
              endpointId === "fal-ai/flux-pro/v1/fill" || 
              endpointId === "fal-ai/flux-pro/v1/fill-fine-tuned"
            )) && (
              <div className="flex items-center gap-2 mt-2">
                <h3 className="text-sm font-medium text-blue-400">Flux Pro Tools</h3>
                <div className="sidebar-gradient-divider"></div>
              </div>
            )}

            {/* Canny model controls */}
            {(endpointId === "fal-ai/flux-pro/v1/canny" || endpointId === "fal-ai/flux-pro/v1/canny-fine-tuned") && (
              <div className="flex flex-col gap-2 bg-gray-800/30 rounded-lg p-3 border border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
                    <SparklesIcon className="w-4 h-4 text-blue-400" />
                    Edge Strength
                  </h3>
                </div>
                <div className="flex items-center gap-4">
                  <Slider
                    defaultValue={[generateData.edgeStrength || 0.5]}
                    value={[generateData.edgeStrength || 0.5]}
                    onValueChange={(value) => setGenerateData({ edgeStrength: value[0] })}
                    max={1}
                    min={0}
                    step={0.1}
                    className="flex-1"
                  />
                  <div className="bg-neutral-900 px-3 py-2 text-xs rounded-md text-white inline-flex tabular-nums w-10 items-center justify-center text-center">
                    {generateData.edgeStrength?.toFixed(1) || "0.5"}
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Controls the strength of edge detection for structural guidance
                </p>
              </div>
            )}

            {/* Depth model controls */}
            {(endpointId === "fal-ai/flux-pro/v1/depth" || endpointId === "fal-ai/flux-pro/v1/depth-fine-tuned") && (
              <div className="flex flex-col gap-2 bg-gray-800/30 rounded-lg p-3 border border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
                    <SparklesIcon className="w-4 h-4 text-blue-400" />
                    Depth Strength
                  </h3>
                </div>
                <div className="flex items-center gap-4">
                  <Slider
                    defaultValue={[generateData.depthStrength || 0.5]}
                    value={[generateData.depthStrength || 0.5]}
                    onValueChange={(value) => setGenerateData({ depthStrength: value[0] })}
                    max={1}
                    min={0}
                    step={0.1}
                    className="flex-1"
                  />
                  <div className="bg-neutral-900 px-3 py-2 text-xs rounded-md text-white inline-flex tabular-nums w-10 items-center justify-center text-center">
                    {generateData.depthStrength?.toFixed(1) || "0.5"}
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Controls the influence of depth information on the generated image
                </p>
              </div>
            )}

            {/* Redux model controls */}
            {(endpointId === "fal-ai/flux-pro/v1/redux" || endpointId === "fal-ai/flux-pro/v1.1/redux") && (
              <div className="flex flex-col gap-2 bg-gray-800/30 rounded-lg p-3 border border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
                    <SparklesIcon className="w-4 h-4 text-blue-400" />
                    Variation Strength
                  </h3>
                </div>
                <div className="flex items-center gap-4">
                  <Slider
                    defaultValue={[generateData.variationStrength || 0.5]}
                    value={[generateData.variationStrength || 0.5]}
                    onValueChange={(value) => setGenerateData({ variationStrength: value[0] })}
                    max={1}
                    min={0}
                    step={0.1}
                    className="flex-1"
                  />
                  <div className="bg-neutral-900 px-3 py-2 text-xs rounded-md text-white inline-flex tabular-nums w-10 items-center justify-center text-center">
                    {generateData.variationStrength?.toFixed(1) || "0.5"}
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Controls how much the generated image varies from the reference
                </p>
              </div>
            )}

            {/* Fill model controls */}
            {(endpointId === "fal-ai/flux-pro/v1/fill" || endpointId === "fal-ai/flux-pro/v1/fill-fine-tuned") && (
              <div className="flex flex-col gap-2 bg-gray-800/30 rounded-lg p-3 border border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
                    <SparklesIcon className="w-4 h-4 text-blue-400" />
                    Mask Image (Optional)
                  </h3>
                </div>
                {!generateData.maskImage ? (
                  <Button
                    variant="outline"
                    className="flex items-center justify-center gap-1.5 bg-gray-800/50 border-gray-700 hover:border-purple-500/50 transition-colors"
                    asChild
                  >
                    <label htmlFor="maskImageUpload">
                      <Input
                        id="maskImageUpload"
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const files = e.target.files;
                          if (!files || !files[0]) return;
                          
                          const file = files[0];
                          setGenerateData({ maskImage: file });
                        }}
                        accept="image/*"
                      />
                      <UploadIcon className="w-4 h-4 text-purple-400 mr-1.5" />
                      <span className="text-gray-300 text-xs">Upload Mask Image</span>
                    </label>
                  </Button>
                ) : (
                  <div className="relative w-full">
                    <div className="overflow-hidden relative w-full flex flex-col items-center justify-center border border-gray-700 rounded-md bg-gray-800/50 p-2">
                      <div className="absolute top-2 right-2 z-10 flex gap-1">
                        <WithTooltip tooltip="Remove mask image">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full bg-black/70 hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                            onClick={() => setGenerateData({ maskImage: null })}
                          >
                            <TrashIcon className="w-3 h-3" />
                          </Button>
                        </WithTooltip>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 text-center">
                        Mask image uploaded
                      </p>
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Upload a mask image to define areas to be filled or modified
                </p>
              </div>
            )}
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
              className="min-h-[100px] bg-gray-800/50 border-gray-700 resize-none"
              value={generateData.prompt}
              onChange={(e) => setGenerateData({ prompt: e.target.value })}
            />
          </div>
        )}
      </div>
    </div>
  );
}
