import { db } from "@/data/db";
import {
  TRACK_TYPE_ORDER,
  type MediaItem,
  type VideoTrack,
} from "@/data/schema";
import { useProjectId, useVideoProjectStore } from "@/data/store";
import { cn, resolveDuration } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type DragEventHandler, useMemo, useState } from "react";
import { VideoControls } from "./video-controls";
import { TimelineRuler } from "./video/timeline";
import { VideoTrackRow } from "./video/track";
import { queryKeys, refreshVideoCache } from "@/data/queries";

export default function BottomBar() {
  const queryClient = useQueryClient();
  const projectId = useProjectId();
  const playerCurrentTimestamp = useVideoProjectStore(
    (s) => s.playerCurrentTimestamp
  );
  const player = useVideoProjectStore((s) => s.player);
  const setPlayerCurrentTimestamp = useVideoProjectStore(
    (s) => s.setPlayerCurrentTimestamp
  );
  const formattedTimestamp =
    (playerCurrentTimestamp < 10 ? "0" : "") +
    playerCurrentTimestamp.toFixed(2);
  const minTrackWidth = `${((2 / 30) * 100).toFixed(2)}%`;
  const [dragOverTracks, setDragOverTracks] = useState(false);

  const handleOnDragOver: DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    setDragOverTracks(true);
    const jobPayload = event.dataTransfer.getData("job");
    if (!jobPayload) return false;
    const job: MediaItem = JSON.parse(jobPayload);
    return job.status === "completed";
  };

  const addToTrack = useMutation({
    mutationFn: async (media: MediaItem) => {
      const tracks = await db.tracks.tracksByProject(media.projectId);
      const trackType = media.mediaType === "image" ? "video" : media.mediaType;
      let track = tracks.find((t) => t.type === trackType);
      if (!track) {
        const id = await db.tracks.create({
          projectId: media.projectId,
          type: trackType,
          label: media.mediaType,
          locked: true,
        });
        const newTrack = await db.tracks.find(id.toString());
        if (!newTrack) return;
        track = newTrack;
      }
      const keyframes = await db.keyFrames.keyFramesByTrack(track.id);

      const lastKeyframe = [...keyframes]
        .sort((a, b) => a.timestamp - b.timestamp)
        .reduce(
          (acc, frame) => {
            if (frame.timestamp + frame.duration > acc.timestamp + acc.duration)
              return frame;
            return acc;
          },
          { timestamp: 0, duration: 0 },
        );

      const duration = resolveDuration(media) ?? 5000;

      const newId = await db.keyFrames.create({
        trackId: track.id,
        data: {
          mediaId: media.id,
          type: media.input?.image_url ? "image" : "prompt",
          prompt: media.input?.prompt || "",
          url: media.input?.image_url?.url,
        },
        timestamp: lastKeyframe
          ? lastKeyframe.timestamp + 1 + lastKeyframe.duration
          : 0,
        duration,
      });
      return db.keyFrames.find(newId.toString());
    },
    onSuccess: (data) => {
      if (!data) return;
      refreshVideoCache(queryClient, projectId);
    },
  });

  const { data: tracks = [] } = useQuery({
    queryKey: queryKeys.projectTracks(projectId),
    queryFn: async () => {
      const result = await db.tracks.tracksByProject(projectId);
      return result.toSorted(
        (a, b) => TRACK_TYPE_ORDER[a.type] - TRACK_TYPE_ORDER[b.type],
      );
    },
  });

  const trackObj: Record<string, VideoTrack> = useMemo(() => {
    return {
      video:
        tracks.find((t) => t.type === "video") ||
        ({
          id: "video",
          type: "video",
          label: "Video",
          locked: true,
          keyframes: [],
          projectId: projectId,
        } as VideoTrack),
      music:
        tracks.find((t) => t.type === "music") ||
        ({
          id: "music",
          type: "music",
          label: "Music",
          locked: true,
          keyframes: [],
          projectId: projectId,
        } as VideoTrack),
      voiceover:
        tracks.find((t) => t.type === "voiceover") ||
        ({
          id: "voiceover",
          type: "voiceover",
          label: "Voiceover",
          locked: true,
          keyframes: [],
          projectId: projectId,
        } as VideoTrack),
    };
  }, [tracks, projectId]);

  const handleOnDrop: DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    setDragOverTracks(false);
    const jobPayload = event.dataTransfer.getData("job");
    if (!jobPayload) return false;
    const job: MediaItem = JSON.parse(jobPayload);
    addToTrack.mutate(job);
    return true;
  };

  return (
    <div className="border-t pb-2 border-white/10 flex flex-col bg-gray-900/30">
      <div className="border-b border-white/10 bg-gray-900/80 px-6 flex flex-row gap-8 py-3 justify-between items-center flex-1">
        <div className="h-full flex flex-col justify-center px-4 glass-panel rounded-lg font-mono cursor-default select-none shadow-inner">
          <div className="flex flex-row items-baseline font-medium tabular-nums">
            <span className="text-blue-400 font-bold">00:</span>
            <span className="text-white">{formattedTimestamp}</span>
            <span className="text-gray-500 mx-2">/</span>
            <span className="text-sm text-gray-400">
              <span className="text-gray-500">00:</span>30.00
            </span>
          </div>
        </div>
        <VideoControls />
      </div>
      <div
        className={cn(
          "min-h-64 max-h-72 h-full flex flex-row overflow-y-auto transition-all duration-300",
          dragOverTracks 
            ? "bg-blue-900/20 border border-blue-500/30 shadow-[inset_0_0_20px_rgba(59,130,246,0.2)]" 
            : "bg-gray-900/20"
        )}
        onDragOver={handleOnDragOver}
        onDragLeave={() => setDragOverTracks(false)}
        onDrop={handleOnDrop}
      >
        <div className="flex flex-col justify-start w-full h-full relative">
          <div
            className="absolute z-[32] top-6 bottom-0 w-[3px] bg-gradient-to-b from-blue-400 to-blue-600 shadow-[0_0_12px_rgba(59,130,246,0.6)] ms-4 cursor-ew-resize group"
            style={{
              // Calculate position as percentage of timeline width
              // playerCurrentTimestamp is in seconds, convert to percentage of 30 seconds
              left: `${((playerCurrentTimestamp / 30) * 100).toFixed(2)}%`,
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              
              // Find the parent container that holds the timeline
              const timelineContainer = document.querySelector('.timeline-container');
              if (!timelineContainer) return;
              
              const timelineRect = timelineContainer.getBoundingClientRect();
              
              // Calculate the initial offset to maintain during drag
              const initialOffset = e.clientX - e.currentTarget.getBoundingClientRect().left;
              
              const handleMouseMove = (moveEvent: MouseEvent) => {
                moveEvent.preventDefault();
                
                // Calculate position relative to timeline width, accounting for initial offset
                const relativeX = moveEvent.clientX - timelineRect.left - initialOffset;
                const timelineWidth = timelineRect.width;
                
                // Convert to percentage (0-1 range), clamped between 0 and 1
                const percentX = Math.max(0, Math.min(1, relativeX / timelineWidth));
                
                // Convert to timestamp (0-30 seconds)
                const newTimestamp = percentX * 30;
                
                // Update timestamp in store (rounded to 2 decimal places for better display)
                setPlayerCurrentTimestamp(Math.round(newTimestamp * 100) / 100);
                
                // Seek player to new position (convert seconds to frames at 30fps)
                if (player) {
                  const framePosition = Math.round(newTimestamp * 30);
                  player.seekTo(framePosition);
                }
              };
              
              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };
              
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          >
            {/* Wider hit area for easier grabbing */}
            <div className="absolute top-0 -left-[6px] w-[15px] h-full opacity-0 group-hover:opacity-30 transition-opacity bg-blue-300 rounded-full" />
            
            {/* Visible handle at the top */}
            <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 h-10 w-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center shadow-xl border-2 border-white scale-90 group-hover:scale-100">
              <div className="w-[1px] h-3 bg-white mx-[2px]" />
              <div className="w-[1px] h-3 bg-white mx-[2px]" />
            </div>
          </div>
          <TimelineRuler className="z-30 pointer-events-none" />
          <div className="flex timeline-container flex-col h-full mx-4 mt-10 gap-3 z-[31] pb-2">
            {Object.values(trackObj).map((track, index) =>
              track ? (
                <VideoTrackRow
                  key={track.id}
                  data={track}
                  style={{
                    minWidth: minTrackWidth,
                  }}
                />
              ) : (
                <div
                  key={`empty-track-${index}`}
                  className="flex flex-row relative w-full h-full timeline-container"
                />
              ),
            )}
          </div>
          
          {tracks.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center glass-panel px-8 py-6 rounded-xl border border-white/10 backdrop-blur-md shadow-xl">
                <div className="inline-flex items-center justify-center p-2 bg-blue-500/10 rounded-full mb-3">
                  <span className="inline-block w-2 h-2 bg-blue-400 rounded-full animate-pulse mr-1"></span>
                  <span className="inline-block w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></span>
                </div>
                <p className="text-gray-200 mb-2 font-medium">Drag media from your gallery to add to the timeline</p>
                <p className="text-sm text-gray-400">Or use the Generate button to create new content</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
