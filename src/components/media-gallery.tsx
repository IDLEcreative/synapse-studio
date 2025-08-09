import {
  ComponentProps,
  HTMLAttributes,
  MouseEventHandler,
  PropsWithChildren,
  useMemo,
  memo,
} from "react";
import Image from "next/image";
import {
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetOverlay,
  SheetPanel,
  SheetPortal,
  SheetTitle,
} from "./ui/sheet";
import {
  queryKeys,
  refreshVideoCache,
  useProjectMediaItems,
} from "@/data/queries";
import { useProjectId, useVideoProjectStore } from "@/data/store";
import { cn, resolveMediaUrl } from "@/lib/utils";
import { MediaItem } from "@/data/schema";
import {
  CopyIcon,
  FilmIcon,
  ImagesIcon,
  MicIcon,
  MusicIcon,
  TrashIcon,
  SparklesIcon,
} from "lucide-react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { formatDuration } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/data/db";
import { LoadingIcon } from "./ui/icons";
import { AVAILABLE_ENDPOINTS } from "@/lib/fal";

type MediaGallerySheetProps = ComponentProps<typeof Sheet> & {
  selectedMediaId: string;
};

type AudioPlayerProps = {
  media: MediaItem;
} & HTMLAttributes<HTMLAudioElement>;

function AudioPlayer({ media, ...props }: AudioPlayerProps) {
  const src = resolveMediaUrl(media);
  if (!src) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="aspect-square bg-gray-800/50 border border-white/5 rounded-md shadow-lg text-muted-foreground flex flex-col items-center justify-center">
        {media.mediaType === "music" && (
          <MusicIcon className="w-1/2 h-1/2 text-green-400 opacity-70" />
        )}
        {media.mediaType === "voiceover" && (
          <MicIcon className="w-1/2 h-1/2 text-yellow-400 opacity-70" />
        )}
      </div>
      <div>
        <audio
          src={src}
          {...props}
          controls
          className="rounded-md w-full bg-gray-800/50 border border-white/5"
        />
      </div>
    </div>
  );
}

type MediaPropertyItemProps = {
  className?: string;
  label: string;
  value: string;
};

function MediaPropertyItem({
  children,
  className,
  label,
  value,
}: PropsWithChildren<MediaPropertyItemProps>) {
  return (
    <div
      className={cn(
        "group relative flex flex-col gap-1 rounded-md bg-gray-800/50 border border-white/5 p-3 text-sm flex-wrap text-wrap overflow-hidden shadow-md",
        className,
      )}
    >
      <div className="absolute right-2 top-2 opacity-30 transition-opacity group-hover:opacity-70">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            navigator.clipboard.writeText(value);
            // Could add a toast notification here
          }}
          className="h-7 w-7 hover:bg-blue-500/10 hover:text-blue-400"
        >
          <CopyIcon className="w-3.5 h-3.5" />
        </Button>
      </div>
      <div className="font-medium text-gray-400 text-xs">{label}</div>
      <div className="font-medium text-gray-200 text-ellipsis text-xs">
        {children ?? value}
      </div>
    </div>
  );
}

const MEDIA_PLACEHOLDER: MediaItem = {
  id: "placeholder",
  kind: "generated",
  input: { prompt: "n/a" },
  mediaType: "image",
  status: "pending",
  createdAt: 0,
  endpointId: "n/a",
  projectId: "",
  requestId: "",
};

export const MediaGallerySheet = memo(function MediaGallerySheet({
  selectedMediaId,
  ...props
}: MediaGallerySheetProps) {
  const projectId = useProjectId();
  const { data: mediaItems = [] } = useProjectMediaItems(projectId);
  const selectedMedia =
    mediaItems.find((media) => media.id === selectedMediaId) ??
    MEDIA_PLACEHOLDER;
  const setSelectedMediaId = useVideoProjectStore((s) => s.setSelectedMediaId);
  const openGenerateDialog = useVideoProjectStore((s) => s.openGenerateDialog);
  const setGenerateData = useVideoProjectStore((s) => s.setGenerateData);
  const setEndpointId = useVideoProjectStore((s) => s.setEndpointId);
  const setGenerateMediaType = useVideoProjectStore(
    (s) => s.setGenerateMediaType,
  );
  const onGenerate = useVideoProjectStore((s) => s.onGenerate);

  const handleOpenGenerateDialog = () => {
    setGenerateMediaType("video");
    const image = (selectedMedia.output as { images?: Array<{ url: string }> })
      ?.images?.[0]?.url;

    const endpoint = AVAILABLE_ENDPOINTS.find(
      (endpoint) => endpoint.category === "video",
    );

    setEndpointId(endpoint?.endpointId ?? AVAILABLE_ENDPOINTS[0].endpointId);

    setGenerateData({
      ...(selectedMedia.input || {}),
      image,
      duration: undefined,
    });
    setSelectedMediaId(null);
    openGenerateDialog();
  };

  const handleVary = () => {
    setGenerateMediaType(selectedMedia.mediaType);
    setEndpointId(selectedMedia.endpointId as string);
    setGenerateData(selectedMedia.input || {});
    setSelectedMediaId(null);
    onGenerate();
  };

  // Event handlers
  const preventClose: MouseEventHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const close = () => {
    setSelectedMediaId(null);
  };
  const mediaUrl = useMemo(
    () => resolveMediaUrl(selectedMedia),
    [selectedMedia],
  );
  const prompt =
    typeof selectedMedia?.input?.prompt === "string"
      ? selectedMedia.input.prompt
      : undefined;

  const queryClient = useQueryClient();
  const deleteMedia = useMutation({
    mutationFn: () => db.media.delete(selectedMediaId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projectMediaItems(projectId),
      });
      refreshVideoCache(queryClient, projectId);
      close();
    },
  });
  return (
    <Sheet {...props}>
      <SheetOverlay className="pointer-events-none flex flex-col" />
      <SheetPortal>
        <div
          className="pointer-events-auto fixed inset-0 z-[51] mr-[42rem] flex flex-col items-center justify-center gap-4 px-32 py-16"
          onClick={close}
        >
          {!!mediaUrl && (
            <>
              {selectedMedia.mediaType === "image" && (
                <div
                  className="relative w-full max-w-[90%] h-auto max-h-[90%]"
                  onClick={preventClose}
                >
                  <Image
                    src={mediaUrl}
                    alt={prompt || "Media image"}
                    width={1200}
                    height={800}
                    className="animate-fade-scale-in object-contain transition-all"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                    priority
                    unoptimized={
                      mediaUrl.startsWith("blob:") ||
                      mediaUrl.startsWith("data:")
                    }
                  />
                </div>
              )}
              {selectedMedia.mediaType === "video" && (
                <video
                  src={mediaUrl}
                  className="animate-fade-scale-in h-auto max-h-[90%] w-auto max-w-[90%] object-contain transition-all"
                  controls
                  onClick={preventClose}
                />
              )}
              {(selectedMedia.mediaType === "music" ||
                selectedMedia.mediaType === "voiceover") && (
                <AudioPlayer media={selectedMedia} />
              )}
            </>
          )}
          <style jsx>{`
            @keyframes fadeScaleIn {
              from {
                opacity: 0;
                transform: scale(0.8);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
            .animate-fade-scale-in {
              animation: fadeScaleIn 0.3s ease-out forwards;
            }
          `}</style>
        </div>
        <SheetPanel
          className="flex h-screen max-h-screen min-h-screen flex-col overflow-hidden sm:max-w-2xl"
          onPointerDownOutside={
            preventClose as unknown as (event: Event) => void
          }
        >
          <div className="flex h-full max-h-full flex-1 flex-col overflow-y-auto px-6">
            {/* Header with media info */}
            <div className="mb-6 border-b border-white/5 pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {selectedMedia.mediaType === "image" && (
                    <ImagesIcon className="w-5 h-5 text-gray-400" />
                  )}
                  {selectedMedia.mediaType === "video" && (
                    <FilmIcon className="w-5 h-5 text-gray-400" />
                  )}
                  {selectedMedia.mediaType === "music" && (
                    <MusicIcon className="w-5 h-5 text-gray-400" />
                  )}
                  <h2 className="text-lg font-semibold text-white">
                    {(typeof selectedMedia.metadata?.title === "string"
                      ? selectedMedia.metadata.title
                      : null) || "Media Details"}
                  </h2>
                </div>
              </div>

              {/* Prompt/Description */}
              {prompt && (
                <div className="mt-4">
                  <div className="text-xs text-gray-500 mb-1 font-medium">
                    Prompt
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {prompt}
                  </p>
                </div>
              )}
            </div>
            {/* Actions section */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-medium text-gray-400">Actions</h3>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {selectedMedia?.mediaType === "image" && (
                  <>
                    <Button
                      onClick={handleOpenGenerateDialog}
                      variant="ghost"
                      disabled={deleteMedia.isPending}
                      className="text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-md py-3 h-auto"
                    >
                      <div className="flex flex-col items-center gap-1 w-full">
                        <FilmIcon className="w-5 h-5" />
                        <span className="text-xs font-medium">Make Video</span>
                      </div>
                    </Button>
                    <Button
                      onClick={() => {
                        const openFluxProStudio =
                          useVideoProjectStore.getState().openFluxProStudio;
                        openFluxProStudio(mediaUrl, "fill");
                        close();
                      }}
                      variant="ghost"
                      disabled={deleteMedia.isPending}
                      className="text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-md py-3 h-auto"
                    >
                      <div className="flex flex-col items-center gap-1 w-full">
                        <SparklesIcon className="w-5 h-5" />
                        <span className="text-xs font-medium">Flux Pro</span>
                      </div>
                    </Button>
                  </>
                )}
                <Button
                  onClick={handleVary}
                  variant="ghost"
                  disabled={deleteMedia.isPending}
                  className="text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-md py-3 h-auto"
                >
                  <div className="flex flex-col items-center gap-1 w-full">
                    <ImagesIcon className="w-5 h-5" />
                    <span className="text-xs font-medium">Re-run</span>
                  </div>
                </Button>
                <Button
                  variant="ghost"
                  disabled={deleteMedia.isPending}
                  onClick={() => deleteMedia.mutate()}
                  className="text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-md py-3 h-auto"
                >
                  <div className="flex flex-col items-center gap-1 w-full">
                    {deleteMedia.isPending ? (
                      <LoadingIcon className="w-5 h-5" />
                    ) : (
                      <TrashIcon className="w-5 h-5 text-rose-400" />
                    )}
                    <span className="text-xs font-medium">Delete</span>
                  </div>
                </Button>
              </div>
            </div>
            {/* Additional actions and metadata */}
            <div className="flex-1 flex flex-col justify-end">
              {/* Created date */}
              {selectedMedia.createdAt && (
                <div className="text-xs text-gray-400 mb-2">
                  Created{" "}
                  {new Date(selectedMedia.createdAt).toLocaleDateString()} at{" "}
                  {new Date(selectedMedia.createdAt).toLocaleTimeString()}
                </div>
              )}

              {/* Tags section - placeholder for future feature */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-medium text-gray-400">Tags</h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 text-gray-300 text-xs">
                    {selectedMedia.mediaType}
                  </span>
                  <span className="px-2 py-0.5 text-gray-300 text-xs">
                    {selectedMedia.endpointId?.split("/").pop() ||
                      "AI generated"}
                  </span>
                  <button className="px-2 py-0.5 text-gray-400 text-xs hover:text-gray-300 transition-colors">
                    + Add Tag
                  </button>
                </div>
              </div>
            </div>
          </div>
        </SheetPanel>
      </SheetPortal>
    </Sheet>
  );
});
