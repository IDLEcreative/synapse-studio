"use client";

import { cn } from "@/lib/utils";
import { useVideoProjectStore } from "@/data/store";
import type { HTMLAttributes, MouseEvent } from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { SearchIcon, ZoomInIcon, ZoomOutIcon } from "lucide-react";
import { Button } from "../ui/button";
import { WithTooltip } from "../ui/tooltip";
import { Slider } from "../ui/slider";

type TimelineRulerProps = {
  duration?: number;
} & HTMLAttributes<HTMLDivElement>;

export function TimelineRuler({
  className,
  duration = 30,
}: TimelineRulerProps) {
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = normal, 2 = 2x zoom, etc.
  const [isZoomControlVisible, setIsZoomControlVisible] = useState(false);
  const playerCurrentTimestamp = useVideoProjectStore(s => s.playerCurrentTimestamp);
  const setPlayerCurrentTimestamp = useVideoProjectStore(s => s.setPlayerCurrentTimestamp);
  const player = useVideoProjectStore(s => s.player);
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // Calculate the effective duration based on zoom level
  const effectiveDuration = Math.max(duration / zoomLevel, 5); // Minimum 5 seconds visible
  
  // Calculate visible range based on current timestamp and zoom level
  // Center the view around the current timestamp
  const halfVisibleDuration = effectiveDuration / 2;
  const startTime = Math.max(0, playerCurrentTimestamp - halfVisibleDuration);
  const endTime = Math.min(duration, startTime + effectiveDuration);
  
  // Adjust startTime if we're near the end to ensure we always show effectiveDuration seconds
  const adjustedStartTime = Math.max(0, Math.min(startTime, duration - effectiveDuration));
  
  // Calculate total ticks based on the visible duration
  const visibleDuration = endTime - adjustedStartTime;
  const totalTicks = Math.ceil(visibleDuration * 10); // 10 ticks per second
  
  // Handle keyboard shortcuts for zooming
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === '=' || e.key === '+') {
      setZoomLevel(prev => Math.min(prev + 0.25, 4)); // Max 4x zoom
    } else if (e.key === '-' || e.key === '_') {
      setZoomLevel(prev => Math.max(prev - 0.25, 0.5)); // Min 0.5x zoom
    }
  }, []);
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  // Handle click on timeline to seek
  const handleTimelineClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !player) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    
    // Calculate the time based on the visible range and click position
    const visibleDuration = endTime - adjustedStartTime;
    const clickTime = adjustedStartTime + (percentage * visibleDuration);
    
    // Clamp to valid range
    const targetTime = Math.max(0, Math.min(clickTime, duration));
    
    // Update timestamp and seek player
    setPlayerCurrentTimestamp(Math.round(targetTime * 100) / 100);
    
    // Convert to frames for the player (assuming 30fps)
    const targetFrame = Math.round(targetTime * 30);
    player.seekTo(targetFrame);
  }, [adjustedStartTime, duration, endTime, player, setPlayerCurrentTimestamp]);

  return (
    <div 
      className={cn("w-full h-full absolute overflow-hidden", className)}
      ref={timelineRef}
      onClick={handleTimelineClick}
    >
      <div className="flex px-2 py-0.5 h-full bg-gray-900/40 backdrop-blur-sm border-b border-gray-800 relative">
        {/* Zoom controls */}
        <div 
          className="absolute right-4 top-1 flex items-center gap-1 z-10"
          onMouseEnter={() => setIsZoomControlVisible(true)}
          onMouseLeave={() => setIsZoomControlVisible(false)}
        >
          <WithTooltip tooltip="Zoom out (-)">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 bg-gray-800/70 hover:bg-gray-700 rounded-full"
              onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.5))}
            >
              <ZoomOutIcon className="h-3 w-3 text-gray-300" />
            </Button>
          </WithTooltip>
          
          {isZoomControlVisible && (
            <div className="bg-gray-800/70 rounded-full px-2 py-1 flex items-center gap-2">
              <span className="text-xs text-gray-300 tabular-nums w-8 text-center">
                {zoomLevel.toFixed(1)}x
              </span>
              <Slider
                value={[zoomLevel]}
                min={0.5}
                max={4}
                step={0.1}
                className="w-20"
                onValueChange={(values) => setZoomLevel(values[0])}
              />
            </div>
          )}
          
          <WithTooltip tooltip="Zoom in (+)">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 bg-gray-800/70 hover:bg-gray-700 rounded-full"
              onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 4))}
            >
              <ZoomInIcon className="h-3 w-3 text-gray-300" />
            </Button>
          </WithTooltip>
        </div>
        
        {/* Current time indicator */}
        <div className="absolute left-2 top-1 z-10">
          <div className="bg-gray-800/70 rounded-full px-3 py-1 flex items-center gap-1.5">
            <SearchIcon className="h-3 w-3 text-blue-400" />
            <span className="text-xs text-blue-300 font-medium tabular-nums">
              {playerCurrentTimestamp.toFixed(1)}s
            </span>
          </div>
        </div>
        
        {/* Timeline ticks */}
        <div className="flex w-full relative">
          {Array.from({ length: totalTicks + 1 }).map((_, index) => {
            const tickTime = adjustedStartTime + (index / 10);
            // Ensure we don't show ticks beyond the duration
            if (tickTime > duration) return null;
            
            const roundedTickTime = Math.round(tickTime * 10);
            const isMajorTick = roundedTickTime % 50 === 0;
            const isMinorTick = roundedTickTime % 10 === 0 && !isMajorTick;
            const isSubTick = roundedTickTime % 5 === 0 && !isMinorTick && !isMajorTick;
            
            return (
              <div key={index} className="flex-grow flex flex-col">
                {isMajorTick && (
                  <div className="text-blue-400 text-sm font-medium tabular-nums h-full text-center mt-1">
                    {tickTime.toFixed(0)}s
                    <div className="h-full max-h-full w-[2px] bg-blue-500/30 mx-auto mt-1 mb-4"></div>
                  </div>
                )}
                {isMinorTick && !isMajorTick && (
                  <div className="flex flex-col items-center">
                    <div className="text-gray-400 tabular-nums text-center text-xs">
                      {tickTime.toFixed(1)}
                    </div>
                    <div className="h-2 w-px bg-gray-600 mx-auto"></div>
                  </div>
                )}
                {isSubTick && (
                  <div className="flex flex-col items-center mt-4">
                    <div className="h-1 w-px bg-gray-700 mx-auto"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
