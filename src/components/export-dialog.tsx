import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "./ui/dialog";
import { cn, resolveMediaUrl } from "@/lib/utils";
import {
  EMPTY_VIDEO_COMPOSITION,
  useProject,
  useVideoComposition,
} from "@/data/queries";
import { fal } from "@/lib/fal";
import { Button } from "./ui/button";
import { useProjectId, useVideoProjectStore } from "@/data/store";
import { LoadingIcon } from "./ui/icons";
import {
  CopyIcon,
  DownloadIcon,
  Share2Icon as ShareIcon,
  FilmIcon,
  CheckCircleIcon,
  Settings2Icon,
  XIcon,
} from "lucide-react";
import { Input } from "./ui/input";
import type { ShareVideoParams } from "@/lib/share";
import { PROJECT_PLACEHOLDER } from "@/data/schema";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useToast } from "@/hooks/use-toast";

type ExportDialogProps = {} & Parameters<typeof Dialog>[0];

type ShareResult = {
  video_url: string;
  thumbnail_url: string;
};

type ExportSettings = {
  resolution: string;
  format: string;
  quality: string;
  fps: number;
};

export function ExportDialog({ onOpenChange, ...props }: ExportDialogProps) {
  const projectId = useProjectId();
  const { data: composition = EMPTY_VIDEO_COMPOSITION } =
    useVideoComposition(projectId);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("export");
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    resolution: "1080p",
    format: "mp4",
    quality: "high",
    fps: 30,
  });

  // Resolution options based on aspect ratio
  const { data: project = PROJECT_PLACEHOLDER } = useProject(projectId);
  const aspectRatio = project?.aspectRatio || "16:9";

  const resolutionOptions = {
    "16:9": [
      { label: "720p (1280×720)", value: "720p" },
      { label: "1080p (1920×1080)", value: "1080p" },
      { label: "4K (3840×2160)", value: "4k" },
    ],
    "9:16": [
      { label: "720p (720×1280)", value: "720p" },
      { label: "1080p (1080×1920)", value: "1080p" },
      { label: "4K (2160×3840)", value: "4k" },
    ],
    "1:1": [
      { label: "720p (720×720)", value: "720p" },
      { label: "1080p (1080×1080)", value: "1080p" },
      { label: "4K (2160×2160)", value: "4k" },
    ],
  };

  const exportVideo = useMutation({
    mutationFn: async () => {
      const mediaItems = composition.mediaItems;
      const videoData = composition.tracks.map((track) => ({
        id: track.id,
        type: track.type === "video" ? "video" : "audio",
        keyframes: composition.frames[track.id].map((frame) => ({
          timestamp: frame.timestamp,
          duration: frame.duration,
          url: resolveMediaUrl(mediaItems[frame.data.mediaId]),
        })),
      }));

      if (videoData.length === 0) {
        throw new Error("No tracks to export");
      }

      // Get dimensions based on resolution and aspect ratio
      let width = 1920;
      let height = 1080;

      if (exportSettings.resolution === "720p") {
        width =
          aspectRatio === "16:9" ? 1280 : aspectRatio === "9:16" ? 720 : 720;
        height =
          aspectRatio === "16:9" ? 720 : aspectRatio === "9:16" ? 1280 : 720;
      } else if (exportSettings.resolution === "4k") {
        width =
          aspectRatio === "16:9" ? 3840 : aspectRatio === "9:16" ? 2160 : 2160;
        height =
          aspectRatio === "16:9" ? 2160 : aspectRatio === "9:16" ? 3840 : 2160;
      } else {
        // 1080p (default)
        width =
          aspectRatio === "16:9" ? 1920 : aspectRatio === "9:16" ? 1080 : 1080;
        height =
          aspectRatio === "16:9" ? 1080 : aspectRatio === "9:16" ? 1920 : 1080;
      }

      // Convert quality setting to bitrate
      const qualityMap = {
        low: { videoBitrate: "2M", audioBitrate: "128k" },
        medium: { videoBitrate: "5M", audioBitrate: "192k" },
        high: { videoBitrate: "8M", audioBitrate: "256k" },
      };

      const quality =
        qualityMap[exportSettings.quality as keyof typeof qualityMap];

      toast({
        title: "Export started",
        description:
          "Your video is being processed. This may take a few minutes.",
      });

      const { data } = await fal.subscribe("fal-ai/ffmpeg-api/compose", {
        input: {
          tracks: videoData,
          output_format: exportSettings.format,
          width,
          height,
          fps: exportSettings.fps,
          video_bitrate: quality.videoBitrate,
          audio_bitrate: quality.audioBitrate,
        },
        mode: "polling",
        pollInterval: 3000,
      });

      toast({
        title: "Export complete",
        description: "Your video has been successfully exported.",
      });

      return data as ShareResult;
    },
  });
  const setExportDialogOpen = useVideoProjectStore(
    (s) => s.setExportDialogOpen,
  );
  const handleOnOpenChange = (open: boolean) => {
    setExportDialogOpen(open);
    onOpenChange?.(open);
  };

  const share = useMutation({
    mutationFn: async () => {
      if (!exportVideo.data) {
        throw new Error("No video to share");
      }
      const videoInfo = exportVideo.data;

      // Get dimensions based on current export settings
      let width = 1920;
      let height = 1080;

      if (exportSettings.resolution === "720p") {
        width =
          aspectRatio === "16:9" ? 1280 : aspectRatio === "9:16" ? 720 : 720;
        height =
          aspectRatio === "16:9" ? 720 : aspectRatio === "9:16" ? 1280 : 720;
      } else if (exportSettings.resolution === "4k") {
        width =
          aspectRatio === "16:9" ? 3840 : aspectRatio === "9:16" ? 2160 : 2160;
        height =
          aspectRatio === "16:9" ? 2160 : aspectRatio === "9:16" ? 3840 : 2160;
      } else {
        // 1080p (default)
        width =
          aspectRatio === "16:9" ? 1920 : aspectRatio === "9:16" ? 1080 : 1080;
        height =
          aspectRatio === "16:9" ? 1080 : aspectRatio === "9:16" ? 1920 : 1080;
      }

      toast({
        title: "Sharing video",
        description: "Preparing your video for sharing...",
      });

      const response = await fetch("/api/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: project.title,
          description: project.description ?? "",
          videoUrl: videoInfo.video_url,
          thumbnailUrl: videoInfo.thumbnail_url,
          createdAt: Date.now(),
          width,
          height,
        } satisfies ShareVideoParams),
      });

      if (!response.ok) {
        throw new Error("Failed to share video");
      }

      toast({
        title: "Video shared",
        description: "Your video has been successfully shared.",
      });

      return response.json();
    },
  });

  const handleOnShare = async () => {
    try {
      const { id } = await share.mutateAsync();
      router.push(`/share/${id}`);
    } catch (error) {
      toast({
        title: "Share failed",
        description:
          "There was a problem sharing your video. Please try again.",
        variant: "destructive",
      });
    }
  };

  const actionsDisabled = exportVideo.isPending || share.isPending;

  // Reset to export tab when dialog opens
  useEffect(() => {
    if (props.open) {
      setActiveTab("export");
    }
  }, [props.open]);

  return (
    <Dialog onOpenChange={handleOnOpenChange} {...props}>
      <DialogContent className="sm:max-w-4xl max-w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FilmIcon className="w-6 h-6 opacity-50" />
            Export video
          </DialogTitle>
          <DialogDescription>
            Export your video to share or download
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="export" className="flex items-center gap-2">
              <FilmIcon className="w-4 h-4" />
              Export
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings2Icon className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4">
            <div className="text-muted-foreground mb-4">
              <p>This may take a while, sit back and relax.</p>
            </div>

            <div
              className={cn(
                "w-full max-h-[500px] mx-auto max-w-full relative overflow-hidden rounded-lg border border-gray-800 shadow-xl",
                project?.aspectRatio === "16:9"
                  ? "aspect-[16/9]"
                  : project?.aspectRatio === "9:16"
                    ? "aspect-[9/16]"
                    : "aspect-[1/1]",
              )}
            >
              {exportVideo.isPending || exportVideo.data === undefined ? (
                <div
                  className={cn(
                    "bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center w-full h-full",
                  )}
                >
                  {exportVideo.isPending ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
                        <LoadingIcon className="w-24 h-24 relative z-10" />
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-medium text-white mb-1">
                          Processing your video
                        </p>
                        <p className="text-sm text-gray-400">
                          This may take a few minutes
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <FilmIcon className="w-24 h-24 opacity-50" />
                      <p className="text-gray-400">
                        Click Export to start processing
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative w-full h-full">
                  <video
                    src={exportVideo.data.video_url}
                    controls
                    className="w-full h-full"
                    poster={exportVideo.data.thumbnail_url}
                  />
                  <div className="absolute top-4 right-4">
                    <div className="bg-green-500/90 text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
                      <CheckCircleIcon className="w-4 h-4" />
                      Export Complete
                    </div>
                  </div>
                </div>
              )}
            </div>

            {exportVideo.data && (
              <div className="flex flex-col gap-4 mt-4">
                <div className="flex flex-row gap-2 items-center">
                  <Input
                    value={exportVideo.data?.video_url ?? ""}
                    placeholder="Video URL..."
                    readOnly
                    className="text-muted-foreground bg-gray-900/50 border-gray-700"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        exportVideo.data?.video_url ?? "",
                      );
                      toast({
                        title: "URL copied",
                        description: "Video URL copied to clipboard",
                      });
                    }}
                    disabled={exportVideo.data === undefined}
                    className="border-gray-700 hover:bg-gray-800"
                  >
                    <CopyIcon className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter className="mt-6">
              <Button
                onClick={handleOnShare}
                variant="outline"
                disabled={actionsDisabled || !exportVideo.data}
                className="border-gray-700 hover:bg-gray-800"
              >
                <ShareIcon className="w-4 h-4 mr-2 text-blue-400" />
                Share
              </Button>
              <Button
                variant="outline"
                disabled={actionsDisabled || !exportVideo.data}
                aria-disabled={actionsDisabled || !exportVideo.data}
                className="border-gray-700 hover:bg-gray-800"
                asChild
              >
                <a href={exportVideo.data?.video_url ?? "#"} download>
                  <DownloadIcon className="w-4 h-4 mr-2 text-blue-400" />
                  Download
                </a>
              </Button>
              <Button
                onClick={() => exportVideo.mutate()}
                disabled={actionsDisabled}
                className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/20"
              >
                {exportVideo.isPending ? (
                  <>
                    <LoadingIcon className="w-4 h-4 mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FilmIcon className="w-4 h-4 mr-2" />
                    Export
                  </>
                )}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="resolution">Resolution</Label>
                <Select
                  value={exportSettings.resolution}
                  onValueChange={(value) =>
                    setExportSettings({ ...exportSettings, resolution: value })
                  }
                >
                  <SelectTrigger
                    id="resolution"
                    className="bg-gray-900/50 border-gray-700"
                  >
                    <SelectValue placeholder="Select resolution" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900/95 backdrop-blur-md border-gray-700">
                    {resolutionOptions[
                      aspectRatio as keyof typeof resolutionOptions
                    ].map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="text-sm hover:bg-gray-800 focus:bg-gray-800"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400">
                  Higher resolution means better quality but larger file size
                </p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="format">Format</Label>
                <Select
                  value={exportSettings.format}
                  onValueChange={(value) =>
                    setExportSettings({ ...exportSettings, format: value })
                  }
                >
                  <SelectTrigger
                    id="format"
                    className="bg-gray-900/50 border-gray-700"
                  >
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900/95 backdrop-blur-md border-gray-700">
                    <SelectItem
                      value="mp4"
                      className="text-sm hover:bg-gray-800 focus:bg-gray-800"
                    >
                      MP4 (H.264)
                    </SelectItem>
                    <SelectItem
                      value="webm"
                      className="text-sm hover:bg-gray-800 focus:bg-gray-800"
                    >
                      WebM (VP9)
                    </SelectItem>
                    <SelectItem
                      value="mov"
                      className="text-sm hover:bg-gray-800 focus:bg-gray-800"
                    >
                      MOV (QuickTime)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400">
                  MP4 is widely compatible, WebM is better for web
                </p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="quality">Quality</Label>
                <Select
                  value={exportSettings.quality}
                  onValueChange={(value) =>
                    setExportSettings({ ...exportSettings, quality: value })
                  }
                >
                  <SelectTrigger
                    id="quality"
                    className="bg-gray-900/50 border-gray-700"
                  >
                    <SelectValue placeholder="Select quality" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900/95 backdrop-blur-md border-gray-700">
                    <SelectItem
                      value="low"
                      className="text-sm hover:bg-gray-800 focus:bg-gray-800"
                    >
                      Low (2 Mbps)
                    </SelectItem>
                    <SelectItem
                      value="medium"
                      className="text-sm hover:bg-gray-800 focus:bg-gray-800"
                    >
                      Medium (5 Mbps)
                    </SelectItem>
                    <SelectItem
                      value="high"
                      className="text-sm hover:bg-gray-800 focus:bg-gray-800"
                    >
                      High (8 Mbps)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400">
                  Higher quality means better visuals but larger file size
                </p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="fps">Frame Rate (FPS)</Label>
                <Select
                  value={exportSettings.fps.toString()}
                  onValueChange={(value) =>
                    setExportSettings({
                      ...exportSettings,
                      fps: parseInt(value),
                    })
                  }
                >
                  <SelectTrigger
                    id="fps"
                    className="bg-gray-900/50 border-gray-700"
                  >
                    <SelectValue placeholder="Select frame rate" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900/95 backdrop-blur-md border-gray-700">
                    <SelectItem
                      value="24"
                      className="text-sm hover:bg-gray-800 focus:bg-gray-800"
                    >
                      24 FPS (Cinematic)
                    </SelectItem>
                    <SelectItem
                      value="30"
                      className="text-sm hover:bg-gray-800 focus:bg-gray-800"
                    >
                      30 FPS (Standard)
                    </SelectItem>
                    <SelectItem
                      value="60"
                      className="text-sm hover:bg-gray-800 focus:bg-gray-800"
                    >
                      60 FPS (Smooth)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400">
                  Higher frame rate means smoother motion
                </p>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500/20 rounded-full">
                  <FilmIcon className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-blue-400">
                    Export Preview
                  </h4>
                  <p className="text-xs text-gray-300 mt-1">
                    {aspectRatio === "16:9"
                      ? "Landscape"
                      : aspectRatio === "9:16"
                        ? "Portrait"
                        : "Square"}{" "}
                    video at {exportSettings.resolution} resolution,
                    {exportSettings.fps} FPS, {exportSettings.quality} quality,{" "}
                    {exportSettings.format.toUpperCase()} format
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <DialogClose asChild>
                <Button
                  variant="outline"
                  className="border-gray-700 hover:bg-gray-800"
                >
                  <XIcon className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </DialogClose>
              <Button
                onClick={() => setActiveTab("export")}
                className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/20"
              >
                <FilmIcon className="w-4 h-4 mr-2" />
                Continue to Export
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
