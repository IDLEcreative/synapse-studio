import { db } from "@/data/db";
import {
  queryKeys,
  refreshVideoCache,
  useProjectMediaItems,
} from "@/data/queries";
import type { MediaItem, VideoKeyFrame, VideoTrack } from "@/data/schema";
import { cn, resolveDuration, resolveMediaUrl, trackIcons } from "@/lib/utils";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  TrashIcon,
  CopyIcon,
  ScissorsIcon,
  LockIcon,
  UnlockIcon,
  Volume2,
  VolumeX,
  MoreHorizontalIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "lucide-react";
import {
  type HTMLAttributes,
  type MouseEventHandler,
  createElement,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import { WithTooltip } from "../ui/tooltip";
import { useProjectId, useVideoProjectStore } from "@/data/store";
import { fal } from "@/lib/fal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

type VideoTrackRowProps = {
  data: VideoTrack;
} & HTMLAttributes<HTMLDivElement>;

export function VideoTrackRow({ data, ...props }: VideoTrackRowProps) {
  const { data: keyframes = [], isLoading } = useQuery({
    queryKey: ["frames", data.id],
    queryFn: () => db.keyFrames.keyFramesByTrack(data.id),
    staleTime: 1000, // Reduce stale time to refresh more frequently
  });
  const queryClient = useQueryClient();
  const projectId = useProjectId();
  const { toast } = useToast();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLocked, setIsLocked] = useState(data.locked || false);

  const mediaType = useMemo(() => keyframes[0]?.data.type, [keyframes]);

  // Initialize locked state from data
  useEffect(() => {
    setIsLocked(data.locked || false);
  }, [data.locked]);

  const trackLabel =
    data.label || data.type.charAt(0).toUpperCase() + data.type.slice(1);

  const trackColor =
    {
      video: "bg-blue-500",
      music: "bg-green-500",
      voiceover: "bg-purple-500",
    }[data.type] || "bg-gray-500";

  const handleToggleLock = () => {
    const newLockedState = !isLocked;
    setIsLocked(newLockedState);

    // Update track locked state
    db.tracks.update(data.id, { locked: newLockedState }).then(() => {
      refreshVideoCache(queryClient, projectId);
    });
  };

  // Ultra-minimal track header
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-2 py-1">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-400 hover:text-white"
            title={isCollapsed ? "Expand track" : "Collapse track"}
          >
            {isCollapsed ? (
              <ChevronUpIcon className="w-3 h-3" />
            ) : (
              <ChevronDownIcon className="w-3 h-3" />
            )}
          </button>

          <div className={`w-2 h-2 rounded-full ${trackColor}`} />

          <span className="text-xs text-gray-300">{trackLabel}</span>

          <span className="text-xs text-gray-500 ml-1">{keyframes.length}</span>
        </div>

        <button
          onClick={handleToggleLock}
          className={`flex items-center justify-center rounded-sm p-0.5 transition-colors ${
            isLocked
              ? "bg-gray-800/80 text-white hover:bg-gray-700"
              : "text-gray-400 hover:text-white hover:bg-gray-700/50"
          }`}
          title={isLocked ? "Unlock track" : "Lock track"}
        >
          {isLocked ? (
            <LockIcon className="w-3 h-3" />
          ) : (
            <UnlockIcon className="w-3 h-3" />
          )}
          <span className="text-xs ml-1">
            {isLocked ? "Locked" : "Unlocked"}
          </span>
        </button>
      </div>

      <div
        className={cn(
          "relative w-full timeline-container",
          "flex flex-col select-none overflow-hidden shrink-0 transition-all duration-300",
          {
            "min-h-[50px]": mediaType && !isCollapsed,
            "min-h-[40px]": !mediaType && !isCollapsed,
            "min-h-[0px] h-0 opacity-50": isCollapsed,
            "opacity-85 pointer-events-none": isLocked && !isCollapsed,
            "after:absolute after:inset-0 after:bg-gray-900/30 after:backdrop-blur-[1px] after:z-10":
              isLocked && !isCollapsed,
          },
        )}
        {...props}
      >
        {!isCollapsed &&
          keyframes.map((frame) => (
            <VideoTrackView
              key={frame.id}
              className="absolute top-0 bottom-0"
              style={{
                left: `${((frame.timestamp / 1000 / 30) * 100).toFixed(2)}%`,
                width: `${((frame.duration / 1000 / 30) * 100).toFixed(2)}%`,
              }}
              track={data}
              frame={frame}
              isLocked={isLocked}
            />
          ))}

        {/* Lock overlay indicator */}
        {isLocked && !isCollapsed && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className="bg-gray-800/50 rounded-full p-1.5">
              <LockIcon className="w-5 h-5 text-white" />
            </div>
          </div>
        )}

        {!isCollapsed && keyframes.length === 0 && (
          <div className="h-full w-full flex items-center justify-center text-xs text-gray-500 italic">
            Empty
          </div>
        )}

        {isCollapsed && (
          <div className={`h-px w-full ${trackColor} opacity-50`}></div>
        )}
      </div>
    </div>
  );
}

type AudioWaveformProps = {
  data: MediaItem;
  volume?: number;
};

function AudioWaveform({ data, volume = 1 }: AudioWaveformProps) {
  const { data: waveform = [] } = useQuery({
    queryKey: ["media", "waveform", data.id],
    queryFn: async () => {
      if (data.metadata?.waveform && Array.isArray(data.metadata.waveform)) {
        return data.metadata.waveform;
      }
      const { data: waveformInfo } = await fal.subscribe(
        "fal-ai/ffmpeg-api/waveform",
        {
          input: {
            media_url: resolveMediaUrl(data),
            points_per_second: 3, // Reduced for more minimal look
            precision: 2,
          },
        },
      );
      await db.media.update(data.id, {
        ...data,
        metadata: {
          ...data.metadata,
          waveform: waveformInfo.waveform,
        },
      });
      return waveformInfo.waveform as number[];
    },
    placeholderData: keepPreviousData,
    staleTime: Number.POSITIVE_INFINITY,
  });

  // Sample the waveform to reduce visual complexity
  const sampledWaveform = waveform.filter((_, i) => i % 2 === 0);

  // Apply volume scaling to waveform visualization
  const scaledWaveform = sampledWaveform.map((v) => v * volume);

  return (
    <div className="h-full flex items-center">
      <div className="w-full h-5 flex items-center">
        {scaledWaveform.map((v, index) => {
          const amplitude = Math.abs(v);
          const height = Math.max(amplitude * 15, 1); // Even smaller max height

          return (
            <div
              key={index}
              className="w-px bg-white/30 mx-px"
              style={{ height: `${height}px` }}
            />
          );
        })}
      </div>
    </div>
  );
}

type VideoTrackViewProps = {
  track: VideoTrack;
  frame: VideoKeyFrame;
  isLocked?: boolean;
} & HTMLAttributes<HTMLDivElement>;

export function VideoTrackView({
  className,
  track,
  frame,
  isLocked = false,
  ...props
}: VideoTrackViewProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteKeyframe = useMutation({
    mutationFn: () => db.keyFrames.delete(frame.id),
    onSuccess: () => {
      refreshVideoCache(queryClient, track.projectId);
      toast({
        title: "Clip removed",
        description: "The clip has been removed from the timeline",
      });
    },
  });

  const handleOnDelete = () => {
    if (isLocked) {
      toast({
        title: "Track is locked",
        description: "Unlock the track to make changes",
        variant: "destructive",
      });
      return;
    }
    deleteKeyframe.mutate();
  };

  const isSelected = useVideoProjectStore((state) =>
    state.selectedKeyframes.includes(frame.id),
  );
  const selectKeyframe = useVideoProjectStore((state) => state.selectKeyframe);
  const handleOnClick: MouseEventHandler = (e) => {
    if (e.detail > 1) {
      return;
    }
    selectKeyframe(frame.id);
  };

  const projectId = useProjectId();
  const { data: mediaItems = [] } = useProjectMediaItems(projectId);

  const media = mediaItems.find((item) => item.id === frame.data.mediaId);
  // Handle missing data
  if (!media) return null;

  const mediaUrl = resolveMediaUrl(media);

  const imageUrl = useMemo(() => {
    if (media.mediaType === "image") {
      return mediaUrl;
    }
    if (media.mediaType === "video") {
      return (
        media.input?.image_url ||
        media.metadata?.start_frame_url ||
        media.metadata?.end_frame_url
      );
    }
    return undefined;
  }, [media, mediaUrl]);

  const label = media.input?.prompt || media.mediaType || "unknown";

  const trackRef = useRef<HTMLDivElement>(null);

  const calculateBounds = () => {
    const timelineElement = document.querySelector(".timeline-container");
    const timelineRect = timelineElement?.getBoundingClientRect();

    if (!timelineRect) return { left: 0, right: 0 };

    return {
      left: 0,
      right: timelineRect.width,
    };
  };

  // State to track if clip is being dragged outside the timeline
  const [isDraggingOutside, setIsDraggingOutside] = useState(false);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isLocked) {
      toast({
        title: "Track is locked",
        description: "Unlock the track to move clips",
        variant: "destructive",
      });
      return;
    }

    const trackElement = trackRef.current;
    if (!trackElement) return;
    const bounds = calculateBounds();
    const startX = e.clientX;
    const startLeft = trackElement.offsetLeft;

    // Create a minimal ghost element for drag feedback
    const ghostElement = document.createElement("div");
    ghostElement.className = "clip-ghost-element";
    ghostElement.style.position = "fixed";
    ghostElement.style.zIndex = "9999";
    ghostElement.style.pointerEvents = "none";
    ghostElement.style.opacity = "0.7";
    ghostElement.style.width = `${trackElement.offsetWidth}px`;
    ghostElement.style.height = `${trackElement.offsetHeight}px`;
    ghostElement.style.borderRadius = "4px";
    ghostElement.style.transition = "opacity 0.1s ease";

    // Create a minimal remove indicator
    const removeIndicator = document.createElement("div");
    removeIndicator.className = "remove-indicator";
    removeIndicator.style.position = "fixed";
    removeIndicator.style.zIndex = "10000";
    removeIndicator.style.pointerEvents = "none";
    removeIndicator.style.opacity = "0";
    removeIndicator.style.padding = "4px 8px";
    removeIndicator.style.borderRadius = "2px";
    removeIndicator.style.backgroundColor = "rgba(220, 38, 38, 0.8)";
    removeIndicator.style.color = "white";
    removeIndicator.style.fontSize = "10px";
    removeIndicator.style.transition = "opacity 0.1s ease";
    removeIndicator.textContent = "Remove";

    // Add elements to the document body
    document.body.appendChild(ghostElement);
    document.body.appendChild(removeIndicator);

    // Set background color based on track type
    const trackRect = trackElement.getBoundingClientRect();
    ghostElement.style.backgroundColor =
      track.type === "video"
        ? "rgba(59, 130, 246, 0.7)"
        : track.type === "music"
          ? "rgba(34, 197, 94, 0.7)"
          : "rgba(168, 85, 247, 0.7)";
    ghostElement.style.border = "1px solid rgba(255, 255, 255, 0.2)";

    // Position the ghost element at the initial position of the track
    ghostElement.style.left = `${trackRect.left}px`;
    ghostElement.style.top = `${trackRect.top}px`;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      let newLeft = startLeft + deltaX;

      // Update ghost element position
      ghostElement.style.left = `${moveEvent.clientX - trackRect.width / 2}px`;
      ghostElement.style.top = `${moveEvent.clientY - trackRect.height / 2}px`;

      // Position the remove indicator
      removeIndicator.style.left = `${moveEvent.clientX - removeIndicator.offsetWidth / 2}px`;
      removeIndicator.style.top = `${moveEvent.clientY - trackRect.height - 20}px`;

      // Check if dragging outside the timeline container
      const timelineElement = trackElement.closest(".timeline-container");
      if (!timelineElement) return;

      const timelineRect = timelineElement.getBoundingClientRect();
      const isOutside =
        moveEvent.clientY < timelineRect.top - 50 ||
        moveEvent.clientY > timelineRect.bottom + 50 ||
        moveEvent.clientX < timelineRect.left - 100 ||
        moveEvent.clientX > timelineRect.right + 100;

      if (isOutside) {
        setIsDraggingOutside(true);
        ghostElement.style.opacity = "0.5";
        ghostElement.style.border = "1px solid rgba(220, 38, 38, 0.5)";
        removeIndicator.style.opacity = "1";
        document.body.style.cursor = "no-drop";
        return;
      } else {
        setIsDraggingOutside(false);
        ghostElement.style.opacity = "0.7";
        ghostElement.style.border = "1px solid rgba(255, 255, 255, 0.2)";
        removeIndicator.style.opacity = "0";
        document.body.style.cursor = "grabbing";

        // Normal timeline positioning logic
        if (newLeft < bounds.left) {
          newLeft = bounds.left;
        } else if (newLeft > bounds.right) {
          newLeft = bounds.right;
        }

        const parentWidth = timelineElement
          ? (timelineElement as HTMLElement).offsetWidth
          : 1;

        // Calculate new timestamp
        const newTimestamp = (newLeft / parentWidth) * 30 * 1000;

        // Prevent overlapping with other clips
        const allClips =
          trackElement.parentElement?.querySelectorAll(".absolute");
        let allowPosition = true;

        if (allClips) {
          for (const clip of allClips) {
            if (clip === trackElement) continue;

            const clipRect = clip.getBoundingClientRect();
            const clipLeft = parseFloat(window.getComputedStyle(clip).left);
            const clipWidth = parseFloat(window.getComputedStyle(clip).width);

            const currentLeft = newLeft;
            const currentRight = newLeft + trackRect.width;
            const otherLeft = clipLeft;
            const otherRight = clipLeft + clipWidth;

            // Check for overlap
            if (currentLeft < otherRight && currentRight > otherLeft) {
              allowPosition = false;
              break;
            }
          }
        }

        if (allowPosition) {
          frame.timestamp = Math.max(0, newTimestamp);
          trackElement.style.left = `${((frame.timestamp / 1000 / 30) * 100).toFixed(2)}%`;
          db.keyFrames.update(frame.id, { timestamp: frame.timestamp });
        } else {
          // Visual feedback for overlap
          ghostElement.style.opacity = "0.5";
          ghostElement.style.border = "1px solid rgba(255, 200, 0, 0.5)";
        }
      }
    };

    const handleMouseUp = () => {
      // Clean up ghost elements
      document.body.removeChild(ghostElement);
      document.body.removeChild(removeIndicator);
      document.body.style.cursor = "";

      // If released outside the timeline, delete the clip
      if (isDraggingOutside) {
        deleteKeyframe.mutate();
        toast({
          title: "Clip removed",
          description: "The clip has been removed from the timeline",
        });
      } else {
        // Normal cleanup for in-timeline release
        queryClient.invalidateQueries({
          queryKey: queryKeys.projectPreview(projectId),
        });
      }

      setIsDraggingOutside(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleResize = (
    e: React.MouseEvent<HTMLDivElement>,
    direction: "left" | "right",
  ) => {
    if (isLocked) {
      toast({
        title: "Track is locked",
        description: "Unlock the track to resize clips",
        variant: "destructive",
      });
      return;
    }

    e.stopPropagation();
    const trackElement = trackRef.current;
    if (!trackElement) return;
    const startX = e.clientX;
    const startWidth = trackElement.offsetWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      let newWidth = startWidth + (direction === "right" ? deltaX : -deltaX);

      const minDuration = 1000;
      const maxDuration: number = resolveDuration(media) ?? 5000;

      const timelineElement = trackElement.closest(".timeline-container");
      const parentWidth = timelineElement
        ? (timelineElement as HTMLElement).offsetWidth
        : 1;
      // Calculate new duration in milliseconds
      let newDuration = (newWidth / parentWidth) * 30 * 1000;

      // Enforce min/max duration constraints
      if (newDuration < minDuration) {
        newDuration = minDuration;
        newWidth = (minDuration / 1000 / 30) * parentWidth;
      } else if (newDuration > maxDuration) {
        newDuration = maxDuration;
        newWidth = (maxDuration / 1000 / 30) * parentWidth;
      }

      // Update duration
      frame.duration = newDuration;

      // Update width
      trackElement.style.width = `${((frame.duration / 1000 / 30) * 100).toFixed(2)}%`;
    };

    const handleMouseUp = () => {
      // Round duration to nearest 100ms for cleaner values
      frame.duration = Math.round(frame.duration / 100) * 100;

      // Update width with rounded duration
      trackElement.style.width = `${((frame.duration / 1000 / 30) * 100).toFixed(2)}%`;
      db.keyFrames.update(frame.id, { duration: frame.duration });
      queryClient.invalidateQueries({
        queryKey: queryKeys.projectPreview(projectId),
      });
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      ref={trackRef}
      onMouseDown={handleMouseDown}
      onContextMenu={(e) => e.preventDefault()}
      aria-checked={isSelected}
      onClick={handleOnClick}
      className={cn(
        "flex flex-col border border-gray-700 rounded-lg shadow-md",
        isSelected ? "ring-2 ring-blue-500 ring-opacity-50" : "",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "flex flex-col select-none rounded overflow-hidden group h-full cursor-grab active:cursor-grabbing",
          {
            "bg-blue-500/90": track.type === "video",
            "bg-green-500/90": track.type === "music",
            "bg-purple-500/90": track.type === "voiceover",
          },
        )}
      >
        <div className="px-2 py-0.5 flex items-center justify-between">
          <span className="text-xs text-white truncate max-w-[80%] font-medium">
            {String((media.input as any)?.prompt || label)}
          </span>
          <span className="text-xs text-white/70 bg-black/20 px-1 rounded-sm">
            {(frame.duration / 1000).toFixed(1)}s
          </span>
        </div>
        <div
          className="flex-1 items-center h-full max-h-full overflow-hidden relative"
          style={
            imageUrl &&
            (media.mediaType === "video" || media.mediaType === "image")
              ? {
                  background: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)), url(${imageUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          {(media.mediaType === "music" || media.mediaType === "voiceover") && (
            <AudioWaveform data={media} />
          )}
          <div
            className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize opacity-0 hover:opacity-100 hover:bg-white/20 transition-opacity"
            onMouseDown={(e) => handleResize(e, "right")}
            title="Resize clip"
          />
        </div>
      </div>
    </div>
  );
}
