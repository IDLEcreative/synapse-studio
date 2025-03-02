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
  const setPlayerCurrentTimestamp = useVideoProjectStore((s) => s.setPlayerCurrentTimestamp);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const { toast } = useToast();
  const volumeTimerRef = useRef<NodeJS.Timeout | null>(null);
  
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
  
  const onSeekToStart = () => {
    if (!player) return;
    
    // Seek to the first frame
    player.seekTo(0);
    
    // Update the timestamp in the store
    setPlayerCurrentTimestamp(0);
    
    toast({
      title: "Seek to start",
      description: "Playhead moved to the beginning",
      duration: 1500,
    });
  };
  
  const onSeekToEnd = () => {
    if (!player) return;
    
    try {
      // Try to access the duration using any to bypass TypeScript checks
      // since the Remotion API might have changed
      const playerAny = player as any;
      let endFrame = 0;
      
      // Try different methods to get the duration
      if (playerAny.getDurationInFrames) {
        endFrame = playerAny.getDurationInFrames() - 1;
        player.seekTo(endFrame);
      } else if (playerAny.getDuration) {
        endFrame = playerAny.getDuration() - 1;
        player.seekTo(endFrame);
      } else if (playerAny.props?.durationInFrames) {
        endFrame = playerAny.props.durationInFrames - 1;
        player.seekTo(endFrame);
      } else {
        // Last resort: seek to a large frame number that's likely at the end
        // The player will clamp to the actual duration
        endFrame = 9999;
        player.seekTo(endFrame);
      }
      
      // Update the timestamp in the store (convert frames to seconds)
      const newTimestamp = endFrame / FPS;
      setPlayerCurrentTimestamp(Math.round(newTimestamp * 100) / 100);
      
      toast({
        title: "Seek to end",
        description: "Playhead moved to the end",
        duration: 1500,
      });
    } catch (error) {
      console.error("Error seeking to end:", error);
      // Fallback: seek to a large frame number
      player.seekTo(9999);
      
      // Update the timestamp in the store with an approximate value
      setPlayerCurrentTimestamp(30); // Assume 30 seconds as the end
    }
  };
  
  const onSeekBackward = () => {
    if (!player) return;
    player.pause();
    
    // Get current frame and ensure we don't go below 0
    const currentFrame = player.getCurrentFrame();
    const newFrame = Math.max(0, currentFrame - FPS);
    
    // Seek to new frame
    player.seekTo(newFrame);
    
    // Update the timestamp in the store (convert frames to seconds)
    const newTimestamp = newFrame / FPS;
    setPlayerCurrentTimestamp(Math.round(newTimestamp * 100) / 100);
  };
  
  const onSeekForward = () => {
    if (!player) return;
    
    // Get current frame
    const currentFrame = player.getCurrentFrame();
    const newFrame = currentFrame + FPS;
    
    // Seek to new frame
    player.seekTo(newFrame);
    
    // Update the timestamp in the store (convert frames to seconds)
    const newTimestamp = newFrame / FPS;
    setPlayerCurrentTimestamp(Math.round(newTimestamp * 100) / 100);
  };
  
  const toggleMute = () => {
    if (!player) return;
    
    try {
      const playerAny = player as any;
      if (playerAny.mute && playerAny.unmute) {
        if (isMuted) {
          playerAny.unmute();
          toast({
            title: "Unmuted",
            description: "Audio enabled",
            duration: 1500,
          });
        } else {
          playerAny.mute();
          toast({
            title: "Muted",
            description: "Audio disabled",
            duration: 1500,
          });
        }
        setIsMuted(!isMuted);
      }
    } catch (error) {
      console.error("Error toggling mute:", error);
    }
  };
  
  const handleVolumeChange = (values: number[]) => {
    setVolume(values[0]);
    
    try {
      const playerAny = player as any;
      if (playerAny.setVolume) {
        playerAny.setVolume(values[0]);
        
        // If volume is set to 0, mute; otherwise unmute
        if (values[0] === 0 && !isMuted) {
          setIsMuted(true);
          playerAny.mute();
        } else if (values[0] > 0 && isMuted) {
          setIsMuted(false);
          playerAny.unmute();
        }
      }
    } catch (error) {
      console.error("Error changing volume:", error);
    }
  };
  
  const handleVolumeMouseEnter = () => {
    if (volumeTimerRef.current) {
      clearTimeout(volumeTimerRef.current);
      volumeTimerRef.current = null;
    }
    setShowVolumeSlider(true);
  };
  
  const handleVolumeMouseLeave = () => {
    volumeTimerRef.current = setTimeout(() => {
      setShowVolumeSlider(false);
    }, 1000);
  };
  
  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    
    try {
      const playerAny = player as any;
      if (playerAny.setPlaybackRate) {
        playerAny.setPlaybackRate(rate);
        
        toast({
          title: `Playback Speed: ${rate}x`,
          description: rate === 1 ? "Normal speed" : (rate < 1 ? "Slow motion" : "Fast forward"),
          duration: 1500,
        });
      }
    } catch (error) {
      console.error("Error changing playback rate:", error);
    }
  };

  useHotkeys("space", handleTogglePlay, [player]);
  useHotkeys("left", onSeekBackward, [player]);
  useHotkeys("right", onSeekForward, [player]);
  useHotkeys("home", onSeekToStart, [player]);
  useHotkeys("end", onSeekToEnd, [player]);
  useHotkeys("m", toggleMute, [player]);
  useHotkeys("shift+,", () => changePlaybackRate(Math.max(0.25, playbackRate - 0.25)), [playbackRate]);
  useHotkeys("shift+.", () => changePlaybackRate(Math.min(2, playbackRate + 0.25)), [playbackRate]);
  useHotkeys("shift+/", () => changePlaybackRate(1), []);
  useHotkeys("?", () => setShowKeyboardShortcuts(true), []);

  return (
    <>
      <div className="flex flex-row justify-center items-center gap-2 bg-gray-900/60 px-4 py-2 rounded-full border border-gray-800/50 shadow-lg backdrop-blur-sm">
        <WithTooltip tooltip="Go to start (Home)">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onSeekToStart}
            className="h-8 w-8 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-full"
          >
            <ChevronFirstIcon className="h-4 w-4" />
          </Button>
        </WithTooltip>
        
        <WithTooltip tooltip="Previous frame (Left arrow)">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onSeekBackward}
            className="h-8 w-8 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-full"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
        </WithTooltip>
        
        <WithTooltip tooltip={playerState === "paused" ? "Play (Space)" : "Pause (Space)"}>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleTogglePlay}
            className={cn(
              "h-12 w-12 rounded-full transition-all duration-300 shadow-md",
              playerState === "paused" 
                ? "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/20" 
                : "bg-gray-700 hover:bg-gray-600 text-white"
            )}
          >
            {playerState === "paused" && <PlayIcon className="h-6 w-6" />}
            {playerState === "playing" && <PauseIcon className="h-6 w-6" />}
          </Button>
        </WithTooltip>
        
        <WithTooltip tooltip="Next frame (Right arrow)">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onSeekForward}
            className="h-8 w-8 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-full"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </WithTooltip>
        
        <WithTooltip tooltip="Go to end (End)">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onSeekToEnd}
            className="h-8 w-8 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-full"
          >
            <ChevronLastIcon className="h-4 w-4" />
          </Button>
        </WithTooltip>
        
        <div className="h-5 mx-1 w-px bg-gray-700/50"></div>
        
        <div 
          className="relative"
          onMouseEnter={handleVolumeMouseEnter}
          onMouseLeave={handleVolumeMouseLeave}
        >
          <WithTooltip tooltip={isMuted ? "Unmute (M)" : "Mute (M)"}>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleMute}
              className="h-8 w-8 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-full"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          </WithTooltip>
          
          {showVolumeSlider && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-gray-900/90 backdrop-blur-md rounded-lg border border-gray-700 shadow-xl">
              <div className="h-24 flex flex-col items-center justify-center gap-2">
                <Slider
                  value={[volume]}
                  min={0}
                  max={1}
                  step={0.01}
                  orientation="vertical"
                  className="h-20"
                  onValueChange={handleVolumeChange}
                />
                <span className="text-xs text-gray-300">{Math.round(volume * 100)}%</span>
              </div>
            </div>
          )}
        </div>
        
        <WithTooltip tooltip="Playback speed">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              // Cycle through common playback rates: 0.5 -> 1 -> 1.5 -> 2 -> 0.5
              const rates = [0.5, 1, 1.5, 2];
              const currentIndex = rates.indexOf(playbackRate);
              const nextIndex = (currentIndex + 1) % rates.length;
              changePlaybackRate(rates[nextIndex]);
            }}
            className="h-8 px-2 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-full"
          >
            <ClockIcon className="h-3.5 w-3.5 mr-1" />
            <span className="text-xs font-mono">{playbackRate}x</span>
          </Button>
        </WithTooltip>
        
        <div className="h-5 mx-1 w-px bg-gray-700/50"></div>
        
        <WithTooltip tooltip="Keyboard shortcuts (?)">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowKeyboardShortcuts(true)}
            className="h-8 w-8 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-full"
          >
            <KeyboardIcon className="h-4 w-4" />
          </Button>
        </WithTooltip>
      </div>
      
      <Dialog open={showKeyboardShortcuts} onOpenChange={setShowKeyboardShortcuts}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyboardIcon className="w-5 h-5 opacity-70" />
              Keyboard Shortcuts
            </DialogTitle>
            <DialogDescription>
              Use these keyboard shortcuts to speed up your editing workflow
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-blue-400">Playback Controls</h3>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Play/Pause</span>
                  <kbd className="px-2 py-0.5 text-xs bg-gray-800 rounded border border-gray-700 text-gray-300">Space</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Mute/Unmute</span>
                  <kbd className="px-2 py-0.5 text-xs bg-gray-800 rounded border border-gray-700 text-gray-300">M</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Speed Up</span>
                  <kbd className="px-2 py-0.5 text-xs bg-gray-800 rounded border border-gray-700 text-gray-300">Shift + .</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Slow Down</span>
                  <kbd className="px-2 py-0.5 text-xs bg-gray-800 rounded border border-gray-700 text-gray-300">Shift + ,</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Normal Speed</span>
                  <kbd className="px-2 py-0.5 text-xs bg-gray-800 rounded border border-gray-700 text-gray-300">Shift + /</kbd>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-blue-400">Navigation</h3>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Previous Frame</span>
                  <kbd className="px-2 py-0.5 text-xs bg-gray-800 rounded border border-gray-700 text-gray-300">←</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Next Frame</span>
                  <kbd className="px-2 py-0.5 text-xs bg-gray-800 rounded border border-gray-700 text-gray-300">→</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Go to Start</span>
                  <kbd className="px-2 py-0.5 text-xs bg-gray-800 rounded border border-gray-700 text-gray-300">Home</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Go to End</span>
                  <kbd className="px-2 py-0.5 text-xs bg-gray-800 rounded border border-gray-700 text-gray-300">End</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Show Shortcuts</span>
                  <kbd className="px-2 py-0.5 text-xs bg-gray-800 rounded border border-gray-700 text-gray-300">?</kbd>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="border-gray-700 hover:bg-gray-800">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
