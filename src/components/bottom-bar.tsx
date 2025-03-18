import { db } from "@/data/db";
import {
  TRACK_TYPE_ORDER,
  type MediaItem,
  type VideoTrack,
} from "@/data/schema";
import { useProjectId, useVideoProjectStore } from "@/data/store";
import { cn, resolveDuration } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type DragEventHandler, useMemo, useState, useEffect } from "react";
import { VideoControls } from "./video-controls";
import { TimelineRuler } from "./video/timeline";
import { VideoTrackRow } from "./video/track";
import { queryKeys, refreshVideoCache } from "@/data/queries";

export default function BottomBar() {
  const queryClient = useQueryClient();
  const projectId = useProjectId();
  const playerCurrentTimestamp = useVideoProjectStore(
    (s) => s.playerCurrentTimestamp,
  );
  const player = useVideoProjectStore((s) => s.player);
  const setPlayerCurrentTimestamp = useVideoProjectStore(
    (s) => s.setPlayerCurrentTimestamp,
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

  const { data: tracks = [], refetch: refetchTracks } = useQuery({
    queryKey: queryKeys.projectTracks(projectId),
    queryFn: async () => {
      const result = await db.tracks.tracksByProject(projectId);
      return result.toSorted(
        (a, b) => TRACK_TYPE_ORDER[a.type] - TRACK_TYPE_ORDER[b.type],
      );
    },
    staleTime: 1000, // Reduce stale time to refresh more frequently
  });

  // Ensure tracks are refreshed when the component mounts
  useEffect(() => {
    refetchTracks();
    // Also refresh the video cache to ensure keyframes are loaded
    refreshVideoCache(queryClient, projectId);
  }, [projectId, queryClient, refetchTracks]);

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
    <div className="border-t pb-2 border-white/5 flex flex-col bg-black">
      <div className="border-b border-white/5 bg-black/80 px-6 flex flex-row gap-8 py-2 justify-between items-center flex-1">
        <div className="font-mono text-xs text-gray-400 tabular-nums">
          {formattedTimestamp}s
        </div>
        <VideoControls />
      </div>
      <div
        className={cn(
          "min-h-64 max-h-72 h-full flex flex-row overflow-y-auto transition-all duration-300",
          dragOverTracks
            ? "bg-blue-900/10 border border-blue-500/20 shadow-[inset_0_0_20px_rgba(59,130,246,0.1)]"
            : "bg-black/20",
        )}
        onDragOver={handleOnDragOver}
        onDragLeave={() => setDragOverTracks(false)}
        onDrop={handleOnDrop}
      >
        <div className="flex flex-col justify-start w-full h-full relative">
          <div
            className="absolute z-[32] top-6 bottom-0 w-px bg-blue-500 ms-4 cursor-ew-resize"
            style={{
              left: `${((playerCurrentTimestamp / 30) * 100).toFixed(2)}%`,
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              const timelineContainer = document.querySelector(".timeline-container");
              if (!timelineContainer) return;

              const timelineRect = timelineContainer.getBoundingClientRect();
              const initialOffset = e.clientX - e.currentTarget.getBoundingClientRect().left;

              const handleMouseMove = (moveEvent: MouseEvent) => {
                moveEvent.preventDefault();
                const relativeX = moveEvent.clientX - timelineRect.left - initialOffset;
                const timelineWidth = timelineRect.width;
                const percentX = Math.max(0, Math.min(1, relativeX / timelineWidth));
                const newTimestamp = percentX * 30;
                setPlayerCurrentTimestamp(Math.round(newTimestamp * 10) / 10);
                
                if (player) {
                  player.seekTo(Math.round(newTimestamp * 30));
                }
              };

              const handleMouseUp = () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
              };

              document.addEventListener("mousemove", handleMouseMove);
              document.addEventListener("mouseup", handleMouseUp);
            }}
          >
            {/* Minimal handle */}
            <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 h-2 w-2 bg-blue-500 rounded-full" />
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
              <div className="text-center float-card px-8 py-6 rounded-xl">
                <div className="inline-flex items-center justify-center p-2 bg-blue-500/10 rounded-full mb-3">
                  <span className="inline-block w-2 h-2 bg-blue-400 rounded-full animate-pulse mr-1"></span>
                  <span
                    className="inline-block w-2 h-2 bg-cyan-400 rounded-full animate-pulse"
                    style={{ animationDelay: "0.5s" }}
                  ></span>
                </div>
                <p className="text-gray-200 mb-2 font-medium">
                  Drag media from your gallery to add to the timeline
                </p>
                <p className="text-sm text-gray-400">
                  Or use the Generate button to create new content
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
