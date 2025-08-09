import { db } from "@/data/db";
import { queryKeys } from "@/data/queries";
import type { MediaItem } from "@/data/schema";
import { useProjectId, useVideoProjectStore } from "@/data/store";
import { fal } from "@/lib/fal";
import { cn, resolveMediaUrl, trackIcons } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  CircleXIcon,
  GripVerticalIcon,
  HourglassIcon,
  ImageIcon,
  MicIcon,
  MusicIcon,
  VideoIcon,
} from "lucide-react";
import {
  type DragEventHandler,
  Fragment,
  type HTMLAttributes,
  createElement,
  memo,
  useMemo,
} from "react";
import { FixedSizeList as List } from "react-window";
import { Badge } from "./ui/badge";
import { LoadingIcon } from "./ui/icons";
import { useToast } from "@/hooks/use-toast";
import { getMediaMetadata } from "@/lib/ffmpeg";

type MediaItemRowProps = {
  data: MediaItem;
  onOpen: (data: MediaItem) => void;
  draggable?: boolean;
} & HTMLAttributes<HTMLDivElement>;

export const MediaItemRow = memo(function MediaItemRow({
  data,
  className,
  onOpen,
  draggable = true,
  ...props
}: MediaItemRowProps) {
  const isDone = data.status === "completed" || data.status === "failed";
  const queryClient = useQueryClient();
  const projectId = useProjectId();
  const { toast } = useToast();
  useQuery({
    queryKey: queryKeys.projectMedia(projectId, data.id),
    queryFn: async () => {
      if (data.kind === "uploaded") return null;

      try {
        const queueStatus = await fal.queue.status(data.endpointId, {
          requestId: data.requestId,
        });

        if (queueStatus.status === "IN_PROGRESS") {
          await db.media.update(data.id, {
            ...data,
            status: "running",
          });
          await queryClient.invalidateQueries({
            queryKey: queryKeys.projectMediaItems(data.projectId),
          });
        }

        let media: Partial<MediaItem> = {};

        if (queueStatus.status === "COMPLETED") {
          try {
            const result = await fal.queue.result(data.endpointId, {
              requestId: data.requestId,
            });
            media = {
              ...data,
              output: result.data,
              status: "completed",
            };

            await db.media.update(data.id, media);

            toast({
              title: "Generation completed",
              description: `Your ${data.mediaType} has been generated successfully.`,
            });

            if (media.mediaType !== "image") {
              const mediaMetadata = await getMediaMetadata(media as MediaItem);

              await db.media.update(data.id, {
                ...media,
                metadata: mediaMetadata?.media || {},
              });

              await queryClient.invalidateQueries({
                queryKey: queryKeys.projectMediaItems(data.projectId),
              });
            }
          } catch (error) {
            await db.media.update(data.id, {
              ...data,
              status: "failed",
            });
            toast({
              title: "Generation failed",
              description: `Failed to generate ${data.mediaType}.`,
            });
          } finally {
            await queryClient.invalidateQueries({
              queryKey: queryKeys.projectMediaItems(data.projectId),
            });
          }
        }

        return null;
      } catch (error) {
        console.error("Error checking queue status:", error);
        return null;
      }
    },
    enabled: !isDone && data.kind === "generated",
    refetchInterval: data.mediaType === "video" ? 20000 : 1000,
  });
  const mediaUrl = resolveMediaUrl(data) ?? "";
  const mediaId = data.id.split("-")[0];
  const handleOnDragStart: DragEventHandler<HTMLDivElement> = (event) => {
    event.dataTransfer.setData("job", JSON.stringify(data));
    return true;
    // event.dataTransfer.dropEffect = "copy";
  };

  const coverImage =
    data.mediaType === "video"
      ? (typeof data.metadata?.start_frame_url === "string"
          ? data.metadata.start_frame_url
          : null) ||
        (typeof data.metadata?.end_frame_url === "string"
          ? data.metadata.end_frame_url
          : null)
      : resolveMediaUrl(data);

  return (
    <div
      className={cn(
        "flex items-start space-x-2 py-2 w-full px-4 hover:bg-blue-500/5 rounded-xl transition-all cursor-pointer",
        className,
      )}
      {...props}
      onClick={(e) => {
        e.stopPropagation();
        onOpen(data);
      }}
      draggable={draggable && data.status === "completed"}
      onDragStart={handleOnDragStart}
    >
      {!!draggable && (
        <div
          className={cn(
            "flex items-center h-full cursor-grab text-muted-foreground",
            {
              "text-muted": data.status !== "completed",
            },
          )}
        >
          <GripVerticalIcon className="w-4 h-4" />
        </div>
      )}
      <div className="w-16 h-16 aspect-square relative rounded-xl overflow-hidden border border-white/5 hover:border-blue-500/30 bg-black/50 transition-all shadow-md">
        {data.status === "completed" ? (
          <>
            {(data.mediaType === "image" || data.mediaType === "video") &&
              (coverImage ? (
                <img
                  src={coverImage}
                  alt="Generated media"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center top-0 left-0 absolute p-2 z-50">
                  {data.mediaType === "image" ? (
                    <ImageIcon className="w-7 h-7 text-muted-foreground" />
                  ) : (
                    <VideoIcon className="w-7 h-7 text-muted-foreground" />
                  )}
                </div>
              ))}
            {data.mediaType === "music" && (
              <div className="w-full h-full flex items-center justify-center top-0 left-0 absolute p-2 z-50">
                <MusicIcon className="w-7 h-7 text-muted-foreground" />
              </div>
            )}
            {data.mediaType === "voiceover" && (
              <div className="w-full h-full flex items-center justify-center top-0 left-0 absolute p-2 z-50">
                <MicIcon className="w-7 h-7 text-muted-foreground" />
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-white/5 flex items-center justify-center text-muted-foreground">
            {data.status === "running" && <LoadingIcon className="w-8 h-8" />}
            {data.status === "pending" && (
              <HourglassIcon className="w-8 h-8 animate-spin ease-in-out delay-700 duration-1000" />
            )}
            {data.status === "failed" && (
              <CircleXIcon className="w-8 h-8 text-rose-700" />
            )}
          </div>
        )}
      </div>
      <div className="flex flex-col h-full gap-1 flex-1">
        <div className="flex flex-col items-start justify-center">
          <div className="flex w-full justify-between">
            <h3 className="text-sm font-medium flex flex-row gap-1 items-center">
              {createElement(trackIcons[data.mediaType], {
                className: cn("w-4 h-4 stroke-1", {
                  "text-purple-400": data.mediaType === "image",
                  "text-green-400": data.mediaType === "music",
                  "text-yellow-400": data.mediaType === "voiceover",
                  "text-red-400": data.mediaType === "video",
                }),
              } as React.ComponentProps<
                (typeof trackIcons)[keyof typeof trackIcons]
              >)}
              <span>{data.kind === "generated" ? "Job" : "File"}</span>
              <code className="text-muted-foreground font-mono text-xs">
                #{mediaId}
              </code>
            </h3>
            {data.status !== "completed" && (
              <Badge
                variant="outline"
                className={cn("text-xs font-medium px-2 py-0 h-5", {
                  "text-rose-400 bg-rose-500/10 border-rose-500/30":
                    data.status === "failed",
                  "text-blue-400 bg-blue-500/10 border-blue-500/30":
                    data.status === "running",
                  "text-amber-400 bg-amber-500/10 border-amber-500/30":
                    data.status === "pending",
                })}
              >
                {data.status}
              </Badge>
            )}
          </div>
          <p className="text-gray-400 text-xs line-clamp-1 mt-0.5">
            {(typeof data.input?.prompt === "string"
              ? data.input.prompt
              : null) || "Uploaded media"}
          </p>
        </div>
        <div className="flex flex-row gap-2 justify-between mt-1">
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(data.createdAt, { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
});

// New Grid Item component for the grid view
export const MediaItemGrid = memo(function MediaItemGrid({
  data,
  className,
  onOpen,
  draggable = true,
  ...props
}: MediaItemRowProps) {
  const isDone = data.status === "completed" || data.status === "failed";
  const mediaId = data.id.split("-")[0];
  const handleOnDragStart: DragEventHandler<HTMLDivElement> = (event) => {
    event.dataTransfer.setData("job", JSON.stringify(data));
    return true;
  };

  const coverImage =
    data.mediaType === "video"
      ? (typeof data.metadata?.start_frame_url === "string"
          ? data.metadata.start_frame_url
          : null) ||
        (typeof data.metadata?.end_frame_url === "string"
          ? data.metadata.end_frame_url
          : null)
      : resolveMediaUrl(data);

  return (
    <div
      className={cn(
        "flex flex-col w-[calc(33.33%-8px)] m-1 rounded-xl overflow-hidden border border-white/5 hover:border-blue-500/30 bg-black/50 transition-all cursor-pointer shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200",
        className,
      )}
      {...props}
      onClick={(e) => {
        e.stopPropagation();
        onOpen(data);
      }}
      draggable={draggable && data.status === "completed"}
      onDragStart={handleOnDragStart}
    >
      <div className="aspect-square relative overflow-hidden bg-black/50">
        {data.status === "completed" ? (
          <>
            {(data.mediaType === "image" || data.mediaType === "video") &&
              (coverImage ? (
                <img
                  src={coverImage}
                  alt="Generated media"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center top-0 left-0 absolute p-2 z-50">
                  {data.mediaType === "image" ? (
                    <ImageIcon className="w-10 h-10 text-muted-foreground" />
                  ) : (
                    <VideoIcon className="w-10 h-10 text-muted-foreground" />
                  )}
                </div>
              ))}
            {data.mediaType === "music" && (
              <div className="w-full h-full flex items-center justify-center top-0 left-0 absolute p-2 z-50">
                <MusicIcon className="w-10 h-10 text-muted-foreground" />
              </div>
            )}
            {data.mediaType === "voiceover" && (
              <div className="w-full h-full flex items-center justify-center top-0 left-0 absolute p-2 z-50">
                <MicIcon className="w-10 h-10 text-muted-foreground" />
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-white/5 flex items-center justify-center text-muted-foreground">
            {data.status === "running" && <LoadingIcon className="w-10 h-10" />}
            {data.status === "pending" && (
              <HourglassIcon className="w-10 h-10 animate-spin ease-in-out delay-700 duration-1000" />
            )}
            {data.status === "failed" && (
              <CircleXIcon className="w-10 h-10 text-rose-700" />
            )}
          </div>
        )}

        {/* Type indicator */}
        <div className="absolute top-2 left-2 z-10">
          <div
            className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center",
              {
                "bg-purple-500/20 text-purple-400": data.mediaType === "image",
                "bg-green-500/20 text-green-400": data.mediaType === "music",
                "bg-yellow-500/20 text-yellow-400":
                  data.mediaType === "voiceover",
                "bg-red-500/20 text-red-400": data.mediaType === "video",
              },
            )}
          >
            {createElement(trackIcons[data.mediaType], {
              className: "w-3.5 h-3.5 stroke-1",
            } as React.ComponentProps<
              (typeof trackIcons)[keyof typeof trackIcons]
            >)}
          </div>
        </div>

        {/* Status badge */}
        {data.status !== "completed" && (
          <div className="absolute top-2 right-2 z-10">
            <Badge
              variant="outline"
              className={cn("text-xs font-medium px-2 py-0 h-5", {
                "text-rose-400 bg-rose-500/10 border-rose-500/30":
                  data.status === "failed",
                "text-blue-400 bg-blue-500/10 border-blue-500/30":
                  data.status === "running",
                "text-amber-400 bg-amber-500/10 border-amber-500/30":
                  data.status === "pending",
              })}
            >
              {data.status}
            </Badge>
          </div>
        )}
      </div>

      {/* Info footer */}
      <div className="p-2 bg-black/70">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-gray-300 truncate">
            {data.kind === "generated" ? "Job" : "File"} #{mediaId}
          </h3>
          <span className="text-[10px] text-gray-500">
            {formatDistanceToNow(data.createdAt, { addSuffix: true })}
          </span>
        </div>
        <p className="text-gray-400 text-[10px] line-clamp-1 mt-0.5">
          {(typeof data.input?.prompt === "string"
            ? data.input.prompt
            : null) || "Uploaded media"}
        </p>
      </div>
    </div>
  );
});

type MediaItemsPanelProps = {
  data: MediaItem[];
  mediaType: string;
  viewMode?: "list" | "grid";
} & HTMLAttributes<HTMLDivElement>;

// Virtualized list item component for performance
type VirtualizedItemProps = {
  index: number;
  style: React.CSSProperties;
  data: {
    items: MediaItem[];
    onOpen: (item: MediaItem) => void;
    viewMode: "list" | "grid";
  };
};

const VirtualizedItem = memo(function VirtualizedItem({
  index,
  style,
  data,
}: VirtualizedItemProps) {
  const { items, onOpen, viewMode } = data;
  const item = items[index];

  if (!item) return null;

  return (
    <div style={style}>
      {viewMode === "list" ? (
        <MediaItemRow data={item} onOpen={onOpen} />
      ) : (
        <MediaItemGrid data={item} onOpen={onOpen} />
      )}
    </div>
  );
});

export const MediaItemPanel = memo(function MediaItemPanel({
  className,
  data,
  mediaType,
  viewMode = "list",
}: MediaItemsPanelProps) {
  const setSelectedMediaId = useVideoProjectStore((s) => s.setSelectedMediaId);

  const handleOnOpen = useMemo(
    () => (item: MediaItem) => {
      setSelectedMediaId(item.id);
    },
    [setSelectedMediaId],
  );

  const filteredData = useMemo(() => {
    return data.filter((media) => {
      if (mediaType === "all") return true;
      return media.mediaType === mediaType;
    });
  }, [data, mediaType]);

  const itemData = useMemo(
    () => ({
      items: filteredData,
      onOpen: handleOnOpen,
      viewMode,
    }),
    [filteredData, handleOnOpen, viewMode],
  );

  // Use virtualization only for large lists (>20 items)
  const shouldVirtualize = filteredData.length > 20;
  const itemHeight = viewMode === "list" ? 80 : 200; // Approximate heights
  const containerHeight = Math.min(600, filteredData.length * itemHeight); // Max 600px

  if (!shouldVirtualize) {
    // For small lists, render normally for better UX
    return (
      <div
        className={cn(
          "overflow-hidden",
          viewMode === "list" ? "flex flex-col space-y-1" : "flex flex-wrap",
          className,
        )}
      >
        {viewMode === "list"
          ? filteredData.map((media) => (
              <MediaItemRow key={media.id} data={media} onOpen={handleOnOpen} />
            ))
          : filteredData.map((media) => (
              <MediaItemGrid
                key={media.id}
                data={media}
                onOpen={handleOnOpen}
              />
            ))}
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden", className)}>
      <List
        height={containerHeight}
        width="100%"
        itemCount={filteredData.length}
        itemSize={itemHeight}
        itemData={itemData}
        className="scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
      >
        {VirtualizedItem}
      </List>
    </div>
  );
});
