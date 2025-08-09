"use client";

import { AVAILABLE_ENDPOINTS } from "@/lib/fal";
import type { PlayerRef } from "@remotion/player";
import { createContext, useContext } from "react";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export const LAST_PROJECT_ID_KEY = "__aivs_lastProjectId";

export type MediaType = "image" | "video" | "voiceover" | "music";

export type AspectRatio = "auto" | "16:9" | "9:16" | "1:1" | "4:3" | "3:4";
export type DurationString = "5s" | "6s" | "7s" | "8s";
export type FinetuneMode = "character" | "product" | "style" | "general";
export type Priority = "speed" | "quality" | "high_res_only";
export type FinetuneType = "full" | "lora";
export type CameraMovement =
  | "zoom_in"
  | "zoom_out"
  | "pan_left"
  | "pan_right"
  | "tilt_up"
  | "tilt_down"
  | "static";

// Simplified: Core generation parameters only
// Model-specific parameters should be handled at the component level
export type GenerateData = {
  prompt: string;
  image?: File | string | null;
  video_url?: File | string | null;
  audio_url?: File | string | null;
  duration?: number;
  voice?: string;
  // Essential Veo 2 parameters only
  aspect_ratio?: AspectRatio;
  duration_string?: DurationString;
  // Generic catch-all for model-specific params
  // Components can add what they need without polluting the type
  [key: string]: any;
};

export type FluxProStudioState = {
  isOpen: boolean;
  initialImage: string | null;
  activeTab: "flux-pro" | "fill" | "canny" | "depth" | "redux" | "finetune";
  projectId: string;
  isToolPanelCollapsed: boolean;
};

interface VideoProjectProps {
  projectId: string;
  projectDialogOpen: boolean;
  player: PlayerRef | null;
  playerCurrentTimestamp: number;
  playerState: "playing" | "paused";
  generateDialogOpen: boolean;
  generateMediaType: MediaType;
  selectedMediaId: string | null;
  selectedKeyframes: string[];
  generateData: GenerateData;
  exportDialogOpen: boolean;
  endpointId: string;
  fluxProStudio: FluxProStudioState;
}

interface VideoProjectState extends VideoProjectProps {
  setProjectId: (projectId: string) => void;
  setProjectDialogOpen: (open: boolean) => void;
  resetGenerateData: () => void;
  setPlayer: (player: PlayerRef) => void;
  setPlayerCurrentTimestamp: (timestamp: number) => void;
  setPlayerState: (state: "playing" | "paused") => void;
  setGenerateMediaType: (mediaType: MediaType) => void;
  openGenerateDialog: (mediaType?: MediaType) => void;
  closeGenerateDialog: () => void;
  setSelectedMediaId: (mediaId: string | null) => void;
  selectKeyframe: (frameId: string) => void;
  setGenerateData: (generateData: Partial<GenerateData>) => void;
  setExportDialogOpen: (open: boolean) => void;
  setEndpointId: (endpointId: string) => void;
  onGenerate: () => void;
  setOnGenerate: (fn: () => void) => void;

  // Flux Pro Studio functions
  setFluxProStudio: (state: Partial<FluxProStudioState>) => void;
  openFluxProStudio: (
    initialImage?: string | null,
    tab?: "flux-pro" | "fill" | "canny" | "depth" | "redux" | "finetune",
  ) => void;
  closeFluxProStudio: () => void;
}

const DEFAULT_PROPS: VideoProjectProps = {
  projectId: "",
  endpointId: AVAILABLE_ENDPOINTS[0].endpointId,
  projectDialogOpen: false,
  player: null,
  playerCurrentTimestamp: 0,
  playerState: "paused",
  generateDialogOpen: false,
  generateMediaType: "image",
  selectedMediaId: null,
  selectedKeyframes: [],
  generateData: {
    prompt: "",
    // Only include essentials in initial state
    // Components can add what they need
  },
  exportDialogOpen: false,
  fluxProStudio: {
    isOpen: false,
    initialImage: null,
    activeTab: "flux-pro",
    projectId: "",
    isToolPanelCollapsed: false,
  },
};

// Create a store using Zustand's create function with immer middleware
export const useVideoProjectStore = create<VideoProjectState>()(
  immer((set, get) => ({
    ...DEFAULT_PROPS,
    setProjectId: (projectId: string) =>
      set((state) => {
        state.projectId = projectId;
      }),
    setProjectDialogOpen: (projectDialogOpen: boolean) =>
      set((state) => {
        state.projectDialogOpen = projectDialogOpen;
      }),
    setGenerateData: (generateData: Partial<GenerateData>) =>
      set((state) => {
        Object.assign(state.generateData, generateData);
      }),
    resetGenerateData: () =>
      set((state) => {
        // Only reset the prompt, let components manage their own fields
        state.generateData = { prompt: "" };
      }),
    // [NOTE]: This is a placeholder function
    onGenerate: () => {},
    setOnGenerate: (fn: () => void) =>
      set((state) => {
        state.onGenerate = fn;
      }),
    setPlayer: (player: PlayerRef) =>
      set((state) => {
        state.player = player;
      }),
    setPlayerCurrentTimestamp: (playerCurrentTimestamp: number) =>
      set((state) => {
        state.playerCurrentTimestamp = playerCurrentTimestamp;
      }),
    setPlayerState: (playerState: "playing" | "paused") =>
      set((state) => {
        state.playerState = playerState;
      }),
    setGenerateMediaType: (generateMediaType: MediaType) =>
      set((state) => {
        state.generateMediaType = generateMediaType;
      }),
    openGenerateDialog: (mediaType) =>
      set((state) => {
        state.generateDialogOpen = true;
        state.generateMediaType = mediaType ?? state.generateMediaType;
      }),
    closeGenerateDialog: () =>
      set((state) => {
        state.generateDialogOpen = false;
      }),
    setSelectedMediaId: (selectedMediaId: string | null) =>
      set((state) => {
        state.selectedMediaId = selectedMediaId;
      }),
    selectKeyframe: (frameId: string) =>
      set((state) => {
        const index = state.selectedKeyframes.indexOf(frameId);
        if (index !== -1) {
          state.selectedKeyframes.splice(index, 1);
        } else {
          state.selectedKeyframes.push(frameId);
        }
      }),
    setExportDialogOpen: (exportDialogOpen: boolean) =>
      set((state) => {
        state.exportDialogOpen = exportDialogOpen;
      }),
    setEndpointId: (endpointId: string) =>
      set((state) => {
        state.endpointId = endpointId;
      }),

    // Flux Pro Studio functions
    setFluxProStudio: (newState: Partial<FluxProStudioState>) =>
      set((state) => {
        Object.assign(state.fluxProStudio, newState);
      }),
    openFluxProStudio: (initialImage = null, tab = "flux-pro") =>
      set((state) => {
        state.fluxProStudio.isOpen = true;
        state.fluxProStudio.initialImage = initialImage;
        state.fluxProStudio.activeTab = tab;
        state.fluxProStudio.projectId = state.projectId;
      }),
    closeFluxProStudio: () =>
      set((state) => {
        state.fluxProStudio.isOpen = false;
      }),
  })),
);

export function useProjectId() {
  return useVideoProjectStore((s) => s.projectId);
}
