import { db } from "@/data/db";
import {
  EMPTY_VIDEO_COMPOSITION,
  useProject,
  useVideoComposition,
} from "@/data/queries";
import {
  type MediaItem,
  PROJECT_PLACEHOLDER,
  TRACK_TYPE_ORDER,
  type VideoKeyFrame,
  type VideoProject,
  type VideoTrack,
} from "@/data/schema";
import { useProjectId, useVideoProjectStore } from "@/data/store";
import { cn, resolveDuration, resolveMediaUrl } from "@/lib/utils";
import { Player, type PlayerRef } from "@remotion/player";
import { preloadVideo, preloadAudio } from "@remotion/preload";
import { useCallback, useEffect, useState, memo } from "react";
import {
  AbsoluteFill,
  Audio,
  Composition,
  Img,
  Sequence,
  Video,
} from "remotion";
import { throttle } from "throttle-debounce";
import { Button } from "./ui/button";
import { DownloadIcon, LoaderCircleIcon, SparklesIcon } from "lucide-react";

interface VideoCompositionProps {
  project: VideoProject;
  tracks: VideoTrack[];
  frames: Record<string, VideoKeyFrame[]>;
  mediaItems: Record<string, MediaItem>;
}

const FPS = 30;
const DEFAULT_DURATION = 5;
const VIDEO_WIDTH = 1024;
const VIDEO_HEIGHT = 720;

const videoSizeMap = {
  "16:9": { width: 1024, height: 576 },
  "9:16": { width: 576, height: 1024 },
  "1:1": { width: 1024, height: 1024 },
};

export const VideoComposition: React.FC<VideoCompositionProps> = memo(
  ({ project, tracks, frames, mediaItems }) => {
    const sortedTracks = [...tracks].sort((a, b) => {
      return TRACK_TYPE_ORDER[a.type] - TRACK_TYPE_ORDER[b.type];
    });

    let width = VIDEO_WIDTH;
    let height = VIDEO_HEIGHT;

    if (project.aspectRatio) {
      const size = videoSizeMap[project.aspectRatio];
      if (size) {
        width = size.width;
        height = size.height;
      }
    }

    return (
      <Composition
        id={project.id}
        component={MainComposition as any}
        durationInFrames={DEFAULT_DURATION * FPS}
        fps={FPS}
        width={width}
        height={height}
        defaultProps={{
          project,
          tracks: sortedTracks,
          frames,
          mediaItems,
        }}
      />
    );
  },
);

const MainComposition: React.FC<VideoCompositionProps> = memo(
  ({ tracks, frames, mediaItems }) => {
    return (
      <AbsoluteFill>
        {tracks.map((track) => (
          <Sequence key={track.id}>
            {track.type === "video" && (
              <VideoTrackSequence
                track={track}
                frames={frames[track.id] || []}
                mediaItems={mediaItems}
              />
            )}
            {(track.type === "music" || track.type === "voiceover") && (
              <AudioTrackSequence
                track={track}
                frames={frames[track.id] || []}
                mediaItems={mediaItems}
              />
            )}
          </Sequence>
        ))}
      </AbsoluteFill>
    );
  },
);

interface TrackSequenceProps {
  track: VideoTrack;
  frames: VideoKeyFrame[];
  mediaItems: Record<string, MediaItem>;
}

const VideoTrackSequence: React.FC<TrackSequenceProps> = memo(
  ({ frames, mediaItems }) => {
    return (
      <AbsoluteFill>
        {frames.map((frame) => {
          const media = mediaItems[frame.data.mediaId];
          if (!media || media.status !== "completed") return null;

          const mediaUrl = resolveMediaUrl(media);
          if (!mediaUrl) return null;

          const duration = frame.duration || resolveDuration(media) || 5000;
          const durationInFrames = Math.floor(duration / (1000 / FPS));

          // Use fallback image if available
          const fallbackImageUrl =
            (typeof media.metadata?.start_frame_url === "string"
              ? media.metadata.start_frame_url
              : undefined) ||
            (typeof media.metadata?.end_frame_url === "string"
              ? media.metadata.end_frame_url
              : undefined) ||
            (typeof media.input?.image_url === "string"
              ? media.input.image_url
              : undefined);

          return (
            <Sequence
              key={frame.id}
              from={Math.floor(frame.timestamp / (1000 / FPS))}
              durationInFrames={durationInFrames}
              premountFor={3000}
            >
              {media.mediaType === "video" && (
                <ErrorBoundaryVideo
                  src={mediaUrl}
                  fallbackImageUrl={fallbackImageUrl}
                />
              )}
              {media.mediaType === "image" && (
                <Img src={mediaUrl} style={{ objectFit: "cover" }} />
              )}
            </Sequence>
          );
        })}
      </AbsoluteFill>
    );
  },
);

// Custom video component with error handling
const ErrorBoundaryVideo: React.FC<{
  src: string;
  fallbackImageUrl?: string;
}> = memo(({ src, fallbackImageUrl }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [proxiedSrc, setProxiedSrc] = useState(src);

  // Log the video source for debugging
  useEffect(() => {
    console.log(`Attempting to load video: ${src}`);

    // Check if we need to proxy this URL
    if (
      !src.startsWith("/api/media-proxy") &&
      (src.includes("fal.media") ||
        src.includes("v2.fal.media") ||
        src.includes("v3.fal.media"))
    ) {
      const newSrc = `/api/media-proxy?url=${encodeURIComponent(src)}`;
      console.log(`Using proxied URL for video: ${newSrc}`);
      setProxiedSrc(newSrc);
    } else {
      setProxiedSrc(src);
    }
  }, [src]);

  // Set a timeout for loading - if it takes too long, show fallback
  useEffect(() => {
    if (!isLoaded && !hasError) {
      const timer = setTimeout(() => {
        console.log(`Loading timeout for video: ${proxiedSrc}`);
        setLoadingTimeout(true);
      }, 5000); // 5 second timeout

      return () => clearTimeout(timer);
    }
  }, [isLoaded, hasError, proxiedSrc]);

  // Use effect to retry loading the video a few times
  useEffect(() => {
    if (hasError && retryCount < 3) {
      // Increased retry count
      const timer = setTimeout(() => {
        console.log(`Retrying video load (${retryCount + 1}/3): ${proxiedSrc}`);
        setHasError(false);
        setRetryCount((prev) => prev + 1);
      }, 1500); // Increased delay between retries

      return () => clearTimeout(timer);
    }
  }, [hasError, retryCount, proxiedSrc]);

  // Force preload the video when component mounts
  useEffect(() => {
    const preloadVideoElement = () => {
      try {
        const videoEl = document.createElement("video");
        videoEl.preload = "auto";
        videoEl.crossOrigin = "anonymous";
        videoEl.src = proxiedSrc;

        videoEl.onloadeddata = () => {
          console.log(`Successfully preloaded video: ${proxiedSrc}`);
          setIsLoaded(true);
          setLoadingTimeout(false);
        };

        videoEl.onerror = (e) => {
          console.error(`Error preloading video: ${proxiedSrc}`, e);
          setHasError(true);
        };

        videoEl.load();
      } catch (error) {
        console.error(`Exception preloading video: ${proxiedSrc}`, error);
      }
    };

    preloadVideoElement();
  }, [proxiedSrc]);

  // If we have an error after retries or loading timeout and a fallback image, show the image
  if (((hasError && retryCount >= 3) || loadingTimeout) && fallbackImageUrl) {
    return <Img src={fallbackImageUrl} style={{ objectFit: "cover" }} />;
  }

  // If we're still loading and have a fallback, show it with a loading indicator
  if (!isLoaded && fallbackImageUrl && !hasError) {
    return (
      <div className="relative w-full h-full">
        <Img
          src={fallbackImageUrl}
          style={{ objectFit: "cover", opacity: 0.7 }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Otherwise try to play the video with error handling
  return (
    <>
      {/* Fallback image that's hidden when video loads successfully */}
      {fallbackImageUrl && (
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-300",
            isLoaded ? "opacity-0" : "opacity-100",
          )}
        >
          <Img src={fallbackImageUrl} style={{ objectFit: "cover" }} />
        </div>
      )}

      {/* Actual video element with improved error handling */}
      <Video
        src={proxiedSrc}
        crossOrigin="anonymous"
        onError={(e) => {
          console.error(`Video error for ${proxiedSrc}:`, e);
          setHasError(true);
        }}
        onPlay={() => {
          console.log(`Video playing: ${proxiedSrc}`);
          setHasError(false);
          setIsLoaded(true);
          setLoadingTimeout(false);
        }}
        onLoad={() => {
          console.log(`Video loaded: ${proxiedSrc}`);
          setIsLoaded(true);
          setLoadingTimeout(false);
        }}
        muted={false}
        volume={1}
      />
    </>
  );
});

const AudioTrackSequence: React.FC<TrackSequenceProps> = memo(
  ({ frames, mediaItems }) => {
    return (
      <>
        {frames.map((frame) => {
          const media = mediaItems[frame.data.mediaId];
          if (!media || media.status !== "completed") return null;

          const audioUrl = resolveMediaUrl(media);
          if (!audioUrl) return null;

          const duration = frame.duration || resolveDuration(media) || 5000;
          const durationInFrames = Math.floor(duration / (1000 / FPS));

          return (
            <Sequence
              key={frame.id}
              from={Math.floor(frame.timestamp / (1000 / FPS))}
              durationInFrames={durationInFrames}
              premountFor={3000}
            >
              <ErrorBoundaryAudio src={audioUrl} />
            </Sequence>
          );
        })}
      </>
    );
  },
);

// Custom audio component with error handling
const ErrorBoundaryAudio: React.FC<{
  src: string;
}> = memo(({ src }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [proxiedSrc, setProxiedSrc] = useState(src);

  // Log the audio source for debugging
  useEffect(() => {
    console.log(`Attempting to load audio: ${src}`);

    // Check if we need to proxy this URL
    if (
      !src.startsWith("/api/media-proxy") &&
      (src.includes("fal.media") ||
        src.includes("v2.fal.media") ||
        src.includes("v3.fal.media"))
    ) {
      const newSrc = `/api/media-proxy?url=${encodeURIComponent(src)}`;
      console.log(`Using proxied URL for audio: ${newSrc}`);
      setProxiedSrc(newSrc);
    } else {
      setProxiedSrc(src);
    }
  }, [src]);

  // Use effect to retry loading the audio a few times
  useEffect(() => {
    if (hasError && retryCount < 3) {
      const timer = setTimeout(() => {
        console.log(`Retrying audio load (${retryCount + 1}/3): ${proxiedSrc}`);
        setHasError(false);
        setRetryCount((prev) => prev + 1);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [hasError, retryCount, proxiedSrc]);

  // Force preload the audio when component mounts
  useEffect(() => {
    const preloadAudioElement = () => {
      try {
        const audioEl = document.createElement("audio");
        audioEl.preload = "auto";
        audioEl.crossOrigin = "anonymous";
        audioEl.src = proxiedSrc;

        audioEl.onloadeddata = () => {
          console.log(`Successfully preloaded audio: ${proxiedSrc}`);
          setIsLoaded(true);
        };

        audioEl.onerror = (e) => {
          console.error(`Error preloading audio: ${proxiedSrc}`, e);
          setHasError(true);
        };

        audioEl.load();
      } catch (error) {
        console.error(`Exception preloading audio: ${proxiedSrc}`, error);
      }
    };

    preloadAudioElement();
  }, [proxiedSrc]);

  if (hasError && retryCount >= 3) {
    // If audio fails after all retries, render a silent placeholder
    console.warn(`Audio failed to load after retries: ${proxiedSrc}`);
    return null;
  }

  return (
    <Audio
      src={proxiedSrc}
      crossOrigin="anonymous"
      onError={(e) => {
        console.error(`Audio error for ${proxiedSrc}:`, e);
        setHasError(true);
      }}
      onLoad={() => {
        console.log(`Audio loaded: ${proxiedSrc}`);
        setIsLoaded(true);
      }}
    />
  );
});

const VideoPreview = memo(function VideoPreview() {
  const projectId = useProjectId();
  const setPlayer = useVideoProjectStore((s) => s.setPlayer);

  const { data: project = PROJECT_PLACEHOLDER } = useProject(projectId);
  const {
    data: composition = EMPTY_VIDEO_COMPOSITION,
    isLoading: isCompositionLoading,
  } = useVideoComposition(projectId);
  const { tracks = [], frames = {}, mediaItems = {} } = composition;

  useEffect(() => {
    const mediaIds = Object.values(frames)
      .flat()
      .flatMap((f) => f.data.mediaId);

    // Create a function to preload media with retries
    const preloadMediaWithRetry = async (media: MediaItem, retries = 3) => {
      // Increased retries
      const mediaUrl = resolveMediaUrl(media);
      if (!mediaUrl) {
        console.error(`No media URL for media ID: ${media.id}`);
        return;
      }

      try {
        if (media.mediaType === "video") {
          console.log(`Preloading video: ${mediaUrl}`);

          // Manual preloading as a fallback with CORS handling
          const videoEl = document.createElement("video");
          videoEl.preload = "auto";
          videoEl.muted = true;
          videoEl.crossOrigin = "anonymous";
          videoEl.src = mediaUrl;

          // Set up event listeners before loading
          videoEl.onloadeddata = () => {
            console.log(`Successfully preloaded video: ${mediaUrl}`);
          };

          videoEl.onerror = async (e) => {
            console.error(`Error preloading video element: ${mediaUrl}`, e);
            // The error is already being handled by the retry mechanism
          };

          videoEl.load();

          // Also use the Remotion preloader
          try {
            await preloadVideo(mediaUrl);
          } catch (error) {
            console.warn(`Remotion preloadVideo failed: ${mediaUrl}`, error);
            // The resolveMediaUrl function should already route problematic URLs through our proxy
            // This is just a fallback in case that didn't work
            if (
              !mediaUrl.startsWith("/api/media-proxy") &&
              (mediaUrl.includes("fal.media") ||
                mediaUrl.includes("v2.fal.media") ||
                mediaUrl.includes("v3.fal.media"))
            ) {
              console.log(`Attempting direct fetch for: ${mediaUrl}`);
              await fetch(mediaUrl, { mode: "no-cors" }).catch((e) =>
                console.log("Fetch no-cors completed"),
              );
            }
          }
        }

        if (media.mediaType === "music" || media.mediaType === "voiceover") {
          console.log(`Preloading audio: ${mediaUrl}`);

          // Manual preloading as a fallback with CORS handling
          const audioEl = document.createElement("audio");
          audioEl.preload = "auto";
          audioEl.crossOrigin = "anonymous";
          audioEl.src = mediaUrl;

          // Set up event listeners before loading
          audioEl.onloadeddata = () => {
            console.log(`Successfully preloaded audio: ${mediaUrl}`);
          };

          audioEl.onerror = async (e) => {
            console.error(`Error preloading audio element: ${mediaUrl}`, e);
            // The error is already being handled by the retry mechanism
          };

          audioEl.load();

          // Also use the Remotion preloader
          try {
            await preloadAudio(mediaUrl);
          } catch (error) {
            console.warn(`Remotion preloadAudio failed: ${mediaUrl}`, error);
            // The resolveMediaUrl function should already route problematic URLs through our proxy
            // This is just a fallback in case that didn't work
            if (
              !mediaUrl.startsWith("/api/media-proxy") &&
              (mediaUrl.includes("fal.media") ||
                mediaUrl.includes("v2.fal.media") ||
                mediaUrl.includes("v3.fal.media"))
            ) {
              console.log(`Attempting direct fetch for: ${mediaUrl}`);
              await fetch(mediaUrl, { mode: "no-cors" }).catch((e) =>
                console.log("Fetch no-cors completed"),
              );
            }
          }
        }
      } catch (error) {
        if (retries > 0) {
          console.warn(
            `Error preloading media, retrying (${retries} attempts left): ${mediaUrl}`,
            error,
          );
          // Wait a bit before retrying
          await new Promise((resolve) => setTimeout(resolve, 1500)); // Increased delay
          await preloadMediaWithRetry(media, retries - 1);
        } else {
          console.error(
            `Failed to preload media after retries: ${mediaUrl}`,
            error,
          );
        }
      }
    };

    // Preload all media items
    for (const media of Object.values(mediaItems)) {
      if (media.status === "completed" && mediaIds.includes(media.id)) {
        preloadMediaWithRetry(media);
      }
    }
  }, [frames, mediaItems]);

  // Calculate the effective duration based on the latest keyframe
  const calculateDuration = useCallback(() => {
    let maxTimestamp = 0;
    let maxDuration = 0;

    for (const trackFrames of Object.values(frames)) {
      for (const frame of trackFrames) {
        const frameEnd = frame.timestamp + frame.duration;
        maxTimestamp = Math.max(maxTimestamp, frame.timestamp);
        maxDuration = Math.max(maxDuration, frameEnd);
      }
    }
    // Add 5 seconds padding after the last frame
    return Math.max(DEFAULT_DURATION, Math.ceil((maxDuration + 5000) / 1000));
  }, [frames]);

  const duration = calculateDuration();

  const setPlayerCurrentTimestamp = useVideoProjectStore(
    (s) => s.setPlayerCurrentTimestamp,
  );

  const setPlayerState = useVideoProjectStore((s) => s.setPlayerState);
  // Frame updates are super frequent, so we throttle the updates to the timestamp
  const updatePlayerCurrentTimestamp = useCallback(
    throttle(64, setPlayerCurrentTimestamp),
    [],
  );

  // Register events on the player
  const playerRef = useCallback(
    (player: PlayerRef) => {
      if (!player) return;
      setPlayer(player);

      console.log("Player instance created and registered");

      player.addEventListener("play", (e) => {
        console.log("Player event: play");
        setPlayerState("playing");
      });

      player.addEventListener("pause", (e) => {
        console.log("Player event: pause");
        setPlayerState("paused");
      });

      player.addEventListener("seeked", (e) => {
        const currentFrame = e.detail.frame;
        console.log(`Player event: seeked to frame ${currentFrame}`);
        updatePlayerCurrentTimestamp(currentFrame / FPS);
      });

      player.addEventListener("frameupdate", (e) => {
        const currentFrame = e.detail.frame;
        updatePlayerCurrentTimestamp(currentFrame / FPS);
      });

      player.addEventListener("error", (e) => {
        console.error("Player event: error", e);
      });
    },
    [setPlayer, setPlayerState, updatePlayerCurrentTimestamp],
  );

  const setExportDialogOpen = useVideoProjectStore(
    (s) => s.setExportDialogOpen,
  );

  let width = VIDEO_WIDTH;
  let height = VIDEO_HEIGHT;

  if (project.aspectRatio) {
    const size = videoSizeMap[project.aspectRatio];
    if (size) {
      width = size.width;
      height = size.height;
    }
  }

  return (
    <div className="flex-grow flex-1 h-full flex items-center justify-center bg-black/90 relative">
      <div className="absolute top-4 right-4 z-40 flex gap-2">
        <Button
          className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/20 transition-all"
          variant="default"
          onClick={() => setExportDialogOpen(true)}
          disabled={isCompositionLoading || tracks.length === 0}
        >
          <DownloadIcon className="w-4 h-4 mr-1.5" />
          Export Video
        </Button>
      </div>

      {isCompositionLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-30">
          <div className="flex flex-col items-center glass-panel p-6 rounded-xl">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
              <LoaderCircleIcon className="w-12 h-12 animate-spin text-blue-400 mb-3 relative z-10" />
            </div>
            <p className="text-gray-200 font-medium">Loading composition...</p>
            <p className="text-gray-400 text-sm mt-1">Preparing your media</p>
          </div>
        </div>
      )}

      {tracks.length === 0 && !isCompositionLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 pointer-events-none">
          <div className="flex flex-col items-center glass-panel p-8 rounded-xl border border-white/10 backdrop-blur-md max-w-md transform transition-all hover-scale">
            <div className="p-4 bg-blue-500/10 rounded-full mb-4">
              <SparklesIcon className="w-14 h-14 text-blue-400" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-3 text-gradient">
              Start Creating
            </h3>
            <p className="text-gray-200 text-center mb-5 leading-relaxed">
              Add media to your timeline by generating AI content or uploading
              your own files from the gallery
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400 bg-gray-800/50 px-4 py-2 rounded-full">
              <span className="inline-block w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
              Drag and drop media items to the timeline below
            </div>
          </div>
        </div>
      )}

      <div className="w-full h-full flex items-center justify-center mx-6 max-h-[calc(100vh-25rem)] relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.12),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[conic-gradient(from_90deg_at_50%_50%,rgba(59,130,246,0.05),rgba(16,185,129,0.05),rgba(59,130,246,0.05))]"></div>
        <Player
          className={cn(
            "[&_video]:shadow-2xl inline-flex items-center justify-center mx-auto w-full h-full max-h-[500px] 3xl:max-h-[800px] rounded-md overflow-hidden border border-gray-800",
            {
              "aspect-[16/9]": project.aspectRatio === "16:9",
              "aspect-[9/16]": project.aspectRatio === "9:16",
              "aspect-[1/1]": project.aspectRatio === "1:1",
            },
          )}
          ref={playerRef}
          component={MainComposition}
          inputProps={{
            project,
            tracks,
            frames,
            mediaItems,
          }}
          durationInFrames={duration * FPS}
          fps={FPS}
          compositionWidth={width}
          compositionHeight={height}
          style={{
            width: "100%",
            height: "100%",
          }}
          clickToPlay={true}
          showPosterWhenPaused={false}
          autoPlay={false}
          loop={false}
          controls={false}
          showVolumeControls={true}
          initiallyMuted={false}
        />
      </div>
    </div>
  );
});

export default VideoPreview;
