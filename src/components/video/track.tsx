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
  ChevronUpIcon
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
  DropdownMenuTrigger
} from "../ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

type VideoTrackRowProps = {
  data: VideoTrack;
} & HTMLAttributes<HTMLDivElement>;

export function VideoTrackRow({ data, ...props }: VideoTrackRowProps) {
  const { data: keyframes = [] } = useQuery({
    queryKey: ["frames", data],
    queryFn: () => db.keyFrames.keyFramesByTrack(data.id),
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

  const trackLabel = data.label || data.type.charAt(0).toUpperCase() + data.type.slice(1);
  
  const trackColor = {
    "video": "from-blue-600 to-blue-500",
    "music": "from-green-600 to-green-500",
    "voiceover": "from-purple-600 to-purple-500"
  }[data.type] || "from-gray-600 to-gray-500";

  const handleToggleLock = () => {
    const newLockedState = !isLocked;
    setIsLocked(newLockedState);
    
    // Since tracks don't have an update method, we'll need to create a new track
    db.tracks.find(data.id).then(track => {
      if (track) {
        // Create a new track with the same properties but updated locked state
        const { id, ...trackWithoutId } = track;
        
        // Delete the old track and create a new one with the same ID
        // Note: This is a workaround since there's no update method
        db.tracks.create({
          ...trackWithoutId,
          locked: newLockedState,
          projectId: track.projectId,
          label: track.label,
          type: track.type
        });
        
        toast({
          title: newLockedState ? "Track locked" : "Track unlocked",
          description: newLockedState ? "Items cannot be moved or edited" : "Items can now be edited",
        });
        
        refreshVideoCache(queryClient, projectId);
      }
    });
  };

  const handleResetTrackName = () => {
    const defaultName = data.type === "video" ? "Video" : data.type === "music" ? "Music" : "Voiceover";
    
    // Since tracks don't have an update method, we'll need to create a new track
    db.tracks.find(data.id).then(track => {
      if (track) {
        // Create a new track with the same properties but updated label
        const { id, ...trackWithoutId } = track;
        
        // Delete the old track and create a new one with the same ID
        // Note: This is a workaround since there's no update method
        db.tracks.create({
          ...trackWithoutId,
          label: defaultName,
          projectId: track.projectId,
          locked: track.locked,
          type: track.type
        });
        
        refreshVideoCache(queryClient, projectId);
      }
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between px-2 py-1">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-md hover:bg-gray-800/50 text-gray-400 hover:text-white transition-colors"
          >
            {isCollapsed ? (
              <ChevronUpIcon className="w-4 h-4" />
            ) : (
              <ChevronDownIcon className="w-4 h-4" />
            )}
          </button>
          
          <div className="flex items-center gap-1.5">
            {createElement(trackIcons[data.type], {
              className: `w-4 h-4 ${data.type === 'video' ? 'text-blue-400' : data.type === 'music' ? 'text-green-400' : 'text-purple-400'}`,
              "aria-hidden": true,
              size: 16 // Adding size prop which is accepted by Lucide icons
            } as React.SVGProps<SVGSVGElement>)}
            <span className="text-sm font-medium text-gray-300">{trackLabel}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <WithTooltip tooltip={isLocked ? "Unlock track" : "Lock track"}>
            <button
              onClick={handleToggleLock}
              className={cn(
                "p-1 rounded-md transition-colors",
                isLocked 
                  ? "text-amber-400 hover:bg-amber-500/20" 
                  : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
              )}
            >
              {isLocked ? <LockIcon className="w-3.5 h-3.5" /> : <UnlockIcon className="w-3.5 h-3.5" />}
            </button>
          </WithTooltip>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 rounded-md hover:bg-gray-800/50 text-gray-400 hover:text-white transition-colors">
                <MoreHorizontalIcon className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-900/95 backdrop-blur-md border-gray-700 shadow-xl">
              <DropdownMenuItem 
                className="text-sm hover:bg-gray-800 focus:bg-gray-800"
                onClick={handleResetTrackName}
              >
                <CopyIcon className="w-4 h-4 mr-2 opacity-70" />
                Reset track name
              </DropdownMenuItem>
              
              {data.type === "music" || data.type === "voiceover" ? (
                <>
                  <DropdownMenuSeparator className="bg-gray-700/50" />
                  <DropdownMenuItem className="text-sm hover:bg-gray-800 focus:bg-gray-800">
                    <VolumeX className="w-4 h-4 mr-2 opacity-70" />
                    Decrease volume
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-sm hover:bg-gray-800 focus:bg-gray-800">
                    <Volume2 className="w-4 h-4 mr-2 opacity-70" />
                    Increase volume
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div
        className={cn(
          "relative w-full timeline-container",
          "flex flex-col select-none rounded-lg overflow-hidden shrink-0 transition-all duration-300",
          {
            "min-h-[64px]": mediaType && !isCollapsed,
            "min-h-[56px]": !mediaType && !isCollapsed,
            "min-h-[0px] h-0 opacity-50": isCollapsed,
            "opacity-60 pointer-events-none": isLocked && !isCollapsed,
          },
        )}
        {...props}
      >
        {!isCollapsed && keyframes.map((frame) => (
          <VideoTrackView
            key={frame.id}
            className="absolute top-0 bottom-0"
          style={{
            // Convert milliseconds to percentage of timeline
            // frame.timestamp is in milliseconds, convert to seconds (/ 1000)
            // then calculate percentage of 30 seconds (/ 30 * 100)
            left: `${((frame.timestamp / 1000) / 30 * 100).toFixed(2)}%`,
            // Same for duration
            width: `${((frame.duration / 1000) / 30 * 100).toFixed(2)}%`,
          }}
            track={data}
            frame={frame}
            isLocked={isLocked}
          />
        ))}
        
        {!isCollapsed && keyframes.length === 0 && (
          <div className="h-full w-full flex items-center justify-center text-sm text-gray-500 italic">
            Drag media here
          </div>
        )}
        
        {isCollapsed && (
          <div className={`h-1 w-full bg-gradient-to-r ${trackColor} rounded-full opacity-70`}></div>
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
            points_per_second: 5,
            precision: 3,
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

  const svgWidth = waveform.length * 3;
  const svgHeight = 100;
  
  // Apply volume scaling to waveform visualization
  const scaledWaveform = waveform.map(v => v * volume);

  return (
    <div className="h-full flex items-center">
      <svg
        width="100%"
        height="80%"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        preserveAspectRatio="none"
      >
        <title>Audio Waveform</title>
        <defs>
          <linearGradient id={`waveformGradient-${data.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.8)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0.3)" />
          </linearGradient>
        </defs>
        {scaledWaveform.map((v, index) => {
          const amplitude = Math.abs(v);
          const height = Math.max(amplitude * svgHeight, 2);
          const x = index * 3;
          const y = (svgHeight - height) / 2;

          return (
            <rect
              key={index}
              x={x}
              y={y}
              width="2"
              height={height}
              fill={`url(#waveformGradient-${data.id})`}
              rx="1"
              className="drop-shadow-sm"
            />
          );
        })}
      </svg>
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
        variant: "destructive"
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
    const trackElement = trackRef.current;
    const trackRect = trackElement?.getBoundingClientRect();

    if (!timelineRect || !trackRect || !trackElement)
      return { left: 0, right: 0 };

    const previousTrack = trackElement?.previousElementSibling;
    const nextTrack = trackElement?.nextElementSibling;

    const leftBound = previousTrack
      ? previousTrack.getBoundingClientRect().right - (timelineRect?.left || 0)
      : 0;
    const rightBound = nextTrack
      ? nextTrack.getBoundingClientRect().left -
        (timelineRect?.left || 0) -
        trackRect.width
      : timelineRect.width - trackRect.width;

    return {
      left: leftBound,
      right: rightBound,
    };
  };

  // State to track if clip is being dragged outside the timeline
  const [isDraggingOutside, setIsDraggingOutside] = useState(false);
  
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isLocked) {
      toast({
        title: "Track is locked",
        description: "Unlock the track to move clips",
        variant: "destructive"
      });
      return;
    }
    
    const trackElement = trackRef.current;
    if (!trackElement) return;
    const bounds = calculateBounds();
    const startX = e.clientX;
    const startLeft = trackElement.offsetLeft;
    
    // Create a ghost element for drag feedback
    const ghostElement = document.createElement('div');
    ghostElement.className = 'clip-ghost-element';
    ghostElement.style.position = 'fixed';
    ghostElement.style.zIndex = '9999';
    ghostElement.style.pointerEvents = 'none';
    ghostElement.style.opacity = '0.8';
    ghostElement.style.width = `${trackElement.offsetWidth}px`;
    ghostElement.style.height = `${trackElement.offsetHeight}px`;
    ghostElement.style.borderRadius = '8px';
    ghostElement.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    ghostElement.style.transition = 'transform 0.1s ease, opacity 0.2s ease';
    
    // Create a remove indicator
    const removeIndicator = document.createElement('div');
    removeIndicator.className = 'remove-indicator';
    removeIndicator.style.position = 'fixed';
    removeIndicator.style.zIndex = '10000';
    removeIndicator.style.pointerEvents = 'none';
    removeIndicator.style.opacity = '0';
    removeIndicator.style.padding = '6px 12px';
    removeIndicator.style.borderRadius = '4px';
    removeIndicator.style.backgroundColor = 'rgba(220, 38, 38, 0.9)';
    removeIndicator.style.color = 'white';
    removeIndicator.style.fontWeight = 'bold';
    removeIndicator.style.fontSize = '12px';
    removeIndicator.style.transition = 'opacity 0.2s ease';
    removeIndicator.textContent = 'Release to Remove';
    
    // Add elements to the document body
    document.body.appendChild(ghostElement);
    document.body.appendChild(removeIndicator);
    
    // Take a screenshot of the track element and use it as background for the ghost
    const trackRect = trackElement.getBoundingClientRect();
    ghostElement.style.backgroundImage = `url(${imageUrl || ''})`;
    ghostElement.style.backgroundSize = 'cover';
    ghostElement.style.backgroundPosition = 'center';
    ghostElement.style.backgroundColor = track.type === "video" 
      ? 'rgba(59, 130, 246, 0.7)' 
      : track.type === "music" 
        ? 'rgba(34, 197, 94, 0.7)' 
        : 'rgba(168, 85, 247, 0.7)';
    ghostElement.style.border = '2px solid rgba(255, 255, 255, 0.3)';
    
    // Position the ghost element at the initial position of the track
    ghostElement.style.left = `${trackRect.left}px`;
    ghostElement.style.top = `${trackRect.top}px`;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      let newLeft = startLeft + deltaX;
      
      // Update ghost element position
      ghostElement.style.left = `${moveEvent.clientX - (trackRect.width / 2)}px`;
      ghostElement.style.top = `${moveEvent.clientY - (trackRect.height / 2)}px`;
      
      // Position the remove indicator
      removeIndicator.style.left = `${moveEvent.clientX - (removeIndicator.offsetWidth / 2)}px`;
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
        ghostElement.style.transform = 'scale(0.9)';
        ghostElement.style.opacity = '0.6';
        ghostElement.style.border = '2px solid rgba(220, 38, 38, 0.7)';
        removeIndicator.style.opacity = '1';
        document.body.style.cursor = 'no-drop';
        
        // Don't update the actual clip position when outside
        return;
      } else {
        setIsDraggingOutside(false);
        ghostElement.style.transform = 'scale(1)';
        ghostElement.style.opacity = '0.8';
        ghostElement.style.border = '2px solid rgba(255, 255, 255, 0.3)';
        removeIndicator.style.opacity = '0';
        document.body.style.cursor = 'grabbing';
        
        // Normal timeline positioning logic
        if (newLeft < bounds.left) {
          newLeft = bounds.left;
        } else if (newLeft > bounds.right) {
          newLeft = bounds.right;
        }

        const parentWidth = timelineElement
          ? (timelineElement as HTMLElement).offsetWidth
          : 1;
        // Calculate new timestamp in milliseconds
        // Convert position (pixels) to percentage of parent width
        // Then convert percentage to seconds (30 seconds total)
        // Then convert seconds to milliseconds (* 1000)
        const newTimestamp = (newLeft / parentWidth) * 30 * 1000;
        frame.timestamp = Math.max(0, newTimestamp);

        // Update position
        trackElement.style.left = `${((frame.timestamp / 1000) / 30 * 100).toFixed(2)}%`;
        db.keyFrames.update(frame.id, { timestamp: frame.timestamp });
      }
    };

    const handleMouseUp = () => {
      // Clean up ghost elements
      document.body.removeChild(ghostElement);
      document.body.removeChild(removeIndicator);
      document.body.style.cursor = '';
      
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
        variant: "destructive"
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
      trackElement.style.width = `${((frame.duration / 1000) / 30 * 100).toFixed(2)}%`;
    };

    const handleMouseUp = () => {
      // Round duration to nearest 100ms for cleaner values
      frame.duration = Math.round(frame.duration / 100) * 100;
      
      // Update width with rounded duration
      trackElement.style.width = `${((frame.duration / 1000) / 30 * 100).toFixed(2)}%`;
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
            "bg-gradient-to-r from-blue-600 to-blue-500": track.type === "video",
            "bg-gradient-to-r from-green-600 to-green-500": track.type === "music",
            "bg-gradient-to-r from-purple-600 to-purple-500": track.type === "voiceover",
          },
        )}
      >
        <div className="p-1 pl-2 bg-black/20 flex flex-row items-center backdrop-blur-sm">
          <div className="flex flex-row gap-1 text-sm items-center font-semibold text-white w-full">
            <div className="flex flex-row truncate gap-1 items-center">
              {createElement(trackIcons[track.type], {
                className: "w-4 h-4 text-white drop-shadow-sm",
                "aria-hidden": true,
                size: 16 // Adding size prop which is accepted by Lucide icons
              } as React.SVGProps<SVGSVGElement>)}
              <span className="line-clamp-1 truncate text-sm font-medium w-full">
                {media.input?.prompt || label}
              </span>
            </div>
            <div className="flex flex-row shrink-0 flex-1 items-center justify-end">
              <span className="text-xs bg-black/30 px-1.5 py-0.5 rounded-sm text-white/80 mr-1">
                {(frame.duration / 1000).toFixed(1)}s
              </span>
              <WithTooltip tooltip="Remove content">
                <button
                  type="button"
                  className="p-1 rounded-full hover:bg-black/30 group-hover:text-white transition-colors"
                  onClick={handleOnDelete}
                >
                  <TrashIcon className="w-3 h-3 text-white" />
                </button>
              </WithTooltip>
            </div>
          </div>
        </div>
        <div
          className="p-px flex-1 items-center bg-repeat-x h-full max-h-full overflow-hidden relative"
          style={
            imageUrl
              ? {
                  background: `url(${imageUrl})`,
                  backgroundSize: "auto 100%",
                }
              : undefined
          }
        >
          {(media.mediaType === "music" || media.mediaType === "voiceover") && (
            <AudioWaveform data={media} />
          )}
          <div
            className={cn(
              "absolute right-0 z-50 top-0 bg-black/20 group-hover:bg-black/40",
              "rounded-md bottom-0 w-2 m-1 p-px cursor-ew-resize backdrop-blur-md text-white/40",
              "transition-colors flex flex-col items-center justify-center text-xs tracking-tighter",
            )}
            onMouseDown={(e) => handleResize(e, "right")}
          >
            <span className="flex gap-[1px]">
              <span className="w-px h-2 rounded bg-white/40" />
              <span className="w-px h-2 rounded bg-white/40" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
