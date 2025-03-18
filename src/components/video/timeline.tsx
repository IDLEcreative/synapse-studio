"use client";

import { cn } from "@/lib/utils";
import { useVideoProjectStore } from "@/data/store";
import type { HTMLAttributes, MouseEvent } from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { MinusIcon, PlusIcon } from "lucide-react";
import { Button } from "../ui/button";

type TimelineRulerProps = {
  duration?: number;
} & HTMLAttributes<HTMLDivElement>;

export function TimelineRuler({
  className,
  duration = 30,
}: TimelineRulerProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const playerCurrentTimestamp = useVideoProjectStore(
    (s) => s.playerCurrentTimestamp,
  );
  const setPlayerCurrentTimestamp = useVideoProjectStore(
    (s) => s.setPlayerCurrentTimestamp,
  );
  const player = useVideoProjectStore((s) => s.player);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Calculate the effective duration based on zoom level
  const effectiveDuration = Math.max(duration / zoomLevel, 5);

  // Calculate visible range
  const startTime = Math.max(0, playerCurrentTimestamp - effectiveDuration / 2);
  const endTime = Math.min(duration, startTime + effectiveDuration);
  const adjustedStartTime = Math.max(
    0,
    Math.min(startTime, duration - effectiveDuration),
  );

  // Calculate major ticks (every 5 seconds for more minimal look)
  const visibleDuration = endTime - adjustedStartTime;
  const majorTickInterval = 5; // Show ticks every 5 seconds
  const majorTickCount = Math.ceil(visibleDuration / majorTickInterval) + 1;

  // Handle keyboard shortcuts for zooming
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "=" || e.key === "+") {
      setZoomLevel((prev) => Math.min(prev + 0.5, 3));
    } else if (e.key === "-" || e.key === "_") {
      setZoomLevel((prev) => Math.max(prev - 0.5, 0.5));
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  // Handle click on timeline to seek
  const handleTimelineClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!timelineRef.current || !player) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const clickTime = adjustedStartTime + percentage * visibleDuration;
      const targetTime = Math.max(0, Math.min(clickTime, duration));

      setPlayerCurrentTimestamp(Math.round(targetTime * 10) / 10);
      player.seekTo(Math.round(targetTime * 30));
    },
    [
      adjustedStartTime,
      duration,
      player,
      setPlayerCurrentTimestamp,
      visibleDuration,
    ],
  );

  return (
    <div
      className={cn("w-full h-full absolute overflow-hidden", className)}
      ref={timelineRef}
      onClick={handleTimelineClick}
    >
      <div className="flex h-full bg-gray-900/30 relative">
        {/* Ultra-minimal zoom controls */}
        <div className="absolute right-2 top-1 flex items-center gap-1 z-10">
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 text-gray-400 hover:text-white p-0"
            onClick={() => setZoomLevel((prev) => Math.max(prev - 0.5, 0.5))}
            title="Zoom out (-)"
          >
            <MinusIcon className="h-3 w-3" />
          </Button>

          <span className="text-xs text-gray-400 tabular-nums">
            {zoomLevel}x
          </span>

          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 text-gray-400 hover:text-white p-0"
            onClick={() => setZoomLevel((prev) => Math.min(prev + 0.5, 3))}
            title="Zoom in (+)"
          >
            <PlusIcon className="h-3 w-3" />
          </Button>
        </div>

        {/* Current time indicator - simplified */}
        <div className="absolute left-2 top-1 z-10">
          <span className="text-xs text-gray-300 tabular-nums">
            {playerCurrentTimestamp.toFixed(1)}s
          </span>
        </div>

        {/* Minimal timeline ticks - only show every 5 seconds */}
        <div className="flex w-full relative mt-6">
          {Array.from({ length: majorTickCount }).map((_, index) => {
            const tickTime =
              Math.floor(adjustedStartTime / majorTickInterval) *
                majorTickInterval +
              index * majorTickInterval;
            if (tickTime > duration) return null;

            const position =
              ((tickTime - adjustedStartTime) / visibleDuration) * 100;

            return (
              <div
                key={index}
                className="absolute flex flex-col items-center"
                style={{ left: `${position}%` }}
              >
                <div className="text-gray-500 text-xs tabular-nums">
                  {tickTime}s
                </div>
                <div className="h-2 w-px bg-gray-700 mt-1"></div>
              </div>
            );
          })}

          {/* Current position indicator removed to avoid double bar */}
        </div>
      </div>
    </div>
  );
}
