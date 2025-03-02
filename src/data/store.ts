"use client";

import { AVAILABLE_ENDPOINTS } from "@/lib/fal";
import type { PlayerRef } from "@remotion/player";
import { createContext, useContext } from "react";
import { create } from "zustand";

export const LAST_PROJECT_ID_KEY = "__aivs_lastProjectId";

export type MediaType = "image" | "video" | "voiceover" | "music";

export type GenerateData = {
  prompt: string;
  image?: File | string | null;
  video_url?: File | string | null;
  audio_url?: File | string | null;
  duration: number;
  voice: string;
  // Flux Pro tool parameters
  edgeStrength?: number;    // For Canny models
  depthStrength?: number;   // For Depth models
  maskImage?: string | File | null;  // For Fill models (mask area)
  variationStrength?: number; // For Redux models
  advanced_camera_control?: {
    movement: string;
    value: number;
  };
  [key: string]: any;
};

export type FluxProStudioState = {
  isOpen: boolean;
  initialImage: string | null;
  activeTab: "fill" | "canny" | "depth" | "redux" | "batch";
  projectId: string;
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
  
  // Flux Pro Studio functions
  setFluxProStudio: (state: Partial<FluxProStudioState>) => void;
  openFluxProStudio: (initialImage?: string | null, tab?: "fill" | "canny" | "depth" | "redux" | "batch") => void;
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
    image: null,
    duration: 30,
    voice: "",
    video_url: null,
    audio_url: null,
  },
  exportDialogOpen: false,
  fluxProStudio: {
    isOpen: false,
    initialImage: null,
    activeTab: "fill",
    projectId: "",
  },
};

// Create a store using Zustand's create function
export const useVideoProjectStore = create<VideoProjectState>((set, get) => ({
  ...DEFAULT_PROPS,
  setProjectId: (projectId: string) => set({ projectId }),
  setProjectDialogOpen: (projectDialogOpen: boolean) =>
    set({ projectDialogOpen }),
  setGenerateData: (generateData: Partial<GenerateData>) =>
    set({
      generateData: Object.assign({}, get().generateData, generateData),
    }),
  resetGenerateData: () =>
    set({
      generateData: {
        ...get().generateData,
        prompt: "",
        duration: 30,
        image: null,
        video_url: null,
        audio_url: null,
        voice: "",
      },
    }),
  // [NOTE]: This is a placeholder function
  onGenerate: () => {},
  setPlayer: (player: PlayerRef) => set({ player }),
  setPlayerCurrentTimestamp: (playerCurrentTimestamp: number) =>
    set({ playerCurrentTimestamp }),
  setPlayerState: (playerState: "playing" | "paused") => set({ playerState }),
  setGenerateMediaType: (generateMediaType: MediaType) =>
    set({ generateMediaType }),
  openGenerateDialog: (mediaType) =>
    set({
      generateDialogOpen: true,
      generateMediaType: mediaType ?? get().generateMediaType,
    }),
  closeGenerateDialog: () => set({ generateDialogOpen: false }),
  setSelectedMediaId: (selectedMediaId: string | null) =>
    set({ selectedMediaId }),
  selectKeyframe: (frameId: string) => {
    const selected = get().selectedKeyframes;
    if (selected.includes(frameId)) {
      set({
        selectedKeyframes: selected.filter((id) => id !== frameId),
      });
    } else {
      set({ selectedKeyframes: [...selected, frameId] });
    }
  },
  setExportDialogOpen: (exportDialogOpen: boolean) =>
    set({ exportDialogOpen }),
  setEndpointId: (endpointId: string) => set({ endpointId }),
  
  // Flux Pro Studio functions
  setFluxProStudio: (state: Partial<FluxProStudioState>) => set({
    fluxProStudio: { ...get().fluxProStudio, ...state }
  }),
  openFluxProStudio: (initialImage = null, tab = "fill") => set({
    fluxProStudio: { 
      isOpen: true, 
      initialImage, 
      activeTab: tab,
      projectId: get().projectId
    }
  }),
  closeFluxProStudio: () => set({
    fluxProStudio: { ...get().fluxProStudio, isOpen: false }
  }),
}));

export function useProjectId() {
  return useVideoProjectStore((s) => s.projectId);
}
