import { useVideoProjectStore } from "@/data/store";
import { useHotkeys } from "react-hotkeys-hook";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";

import {
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PauseIcon,
  PlayIcon,
  Volume2,
  VolumeX,
  ScissorsIcon,
  CopyIcon,
  Trash2Icon,
  ClockIcon,
  RotateCcwIcon,
  RotateCwIcon,
  KeyboardIcon,
} from "lucide-react";
import { Button } from "./ui/button";
import { WithTooltip } from "./ui/tooltip";
import { Slider } from "./ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "./ui/dialog";

const FPS = 30;

export function VideoControls() {
  const player = useVideoProjectStore((s) => s.player);
  const playerState = useVideoProjectStore((s) => s.playerState);
  const setPlayerState = useVideoProjectStore((s) => s.setPlayerState);
  const setPlayerCurrentTimestamp = useVideoProjectStore(
    (s) => s.setPlayerCurrentTimestamp,
  );
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Ultra-minimal toggle play function
  const handleTogglePlay = () => {
    if (!player) return;
    if (player.isPlaying()) {
      player.pause();
      setPlayerState("paused");
    } else {
      player.play();
      setPlayerState("playing");
    }
  };

  // Minimal seek functions
  const onSeekBackward = () => {
    if (!player) return;
    const currentFrame = player.getCurrentFrame();
    const newFrame = Math.max(0, currentFrame - FPS);
    player.seekTo(newFrame);
    setPlayerCurrentTimestamp(Math.round((newFrame / FPS) * 10) / 10);
  };

  const onSeekForward = () => {
    if (!player) return;
    const currentFrame = player.getCurrentFrame();
    const newFrame = currentFrame + FPS;
    player.seekTo(newFrame);
    setPlayerCurrentTimestamp(Math.round((newFrame / FPS) * 10) / 10);
  };

  // Minimal mute toggle
  const toggleMute = () => {
    if (!player) return;
    try {
      const playerAny = player as any;
      if (playerAny.mute && playerAny.unmute) {
        if (isMuted) {
          playerAny.unmute();
        } else {
          playerAny.mute();
        }
        setIsMuted(!isMuted);
      }
    } catch (error) {
      console.error("Error toggling mute:", error);
    }
  };

  // Register essential keyboard shortcuts
  useHotkeys("space", handleTogglePlay, [player]);
  useHotkeys("left", onSeekBackward, [player]);
  useHotkeys("right", onSeekForward, [player]);
  useHotkeys("m", toggleMute, [player]);
  useHotkeys(
    "1",
    () => {
      setPlaybackRate(1);
      (player as any).setPlaybackRate?.(1);
    },
    [player],
  );
  useHotkeys(
    "2",
    () => {
      setPlaybackRate(2);
      (player as any).setPlaybackRate?.(2);
    },
    [player],
  );

  return (
    <div className="flex justify-center items-center gap-2 px-3 py-1 bg-gray-900/40">
      {/* Ultra-minimal controls */}
      <button
        onClick={onSeekBackward}
        className="text-gray-200 hover:text-white p-1"
        title="Previous frame (←)"
      >
        <ChevronLeftIcon className="h-3 w-3" />
      </button>

      <button
        onClick={handleTogglePlay}
        className={cn(
          "p-1 rounded-full transition-colors",
          playerState === "paused"
            ? "text-blue-400 hover:text-blue-300"
            : "text-gray-300 hover:text-white",
        )}
        title={playerState === "paused" ? "Play (Space)" : "Pause (Space)"}
      >
        {playerState === "paused" ? (
          <PlayIcon className="h-4 w-4" />
        ) : (
          <PauseIcon className="h-4 w-4" />
        )}
      </button>

      <button
        onClick={onSeekForward}
        className="text-gray-200 hover:text-white p-1"
        title="Next frame (→)"
      >
        <ChevronRightIcon className="h-3 w-3" />
      </button>

      <div className="h-3 mx-1 w-px bg-gray-800"></div>

      <button
        onClick={toggleMute}
        className="text-gray-200 hover:text-white p-1"
        title={isMuted ? "Unmute (M)" : "Mute (M)"}
      >
        {isMuted ? (
          <VolumeX className="h-3 w-3" />
        ) : (
          <Volume2 className="h-3 w-3" />
        )}
      </button>

      <button
        onClick={() => {
          const newRate = playbackRate === 1 ? 2 : 1;
          setPlaybackRate(newRate);
          (player as any).setPlaybackRate?.(newRate);
        }}
        className="text-gray-200 hover:text-white p-1"
        title="Toggle playback speed (1/2)"
      >
        <span className="text-xs">{playbackRate}x</span>
      </button>
    </div>
  );
}
