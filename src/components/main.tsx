"use client";

import BottomBar from "@/components/bottom-bar";
import Header from "@/components/header";
import RightPanel from "@/components/right-panel";
import VideoPreview from "@/components/video-preview";
import { useVideoProjectStore } from "@/data/store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useStore } from "zustand";
import { ProjectDialog } from "./project-dialog";
import { MediaGallerySheet } from "./media-gallery";
import { ToastProvider } from "./ui/toast";
import { Toaster } from "./ui/toaster";
import { ExportDialog } from "./export-dialog";
import LeftPanel from "./left-panel";
import FluxProStudio from "./flux-pro/flux-pro-studio";

type AppProps = {
  projectId: string;
};

export function App({ projectId }: AppProps) {

  const queryClient = useRef(new QueryClient()).current;
  // Initialize the project ID when the component mounts
  useEffect(() => {
    useVideoProjectStore.getState().setProjectId(projectId);
  }, [projectId]);
  
  const projectDialogOpen = useVideoProjectStore((s) => s.projectDialogOpen);
  const selectedMediaId = useVideoProjectStore((s) => s.selectedMediaId);
  const setSelectedMediaId = useVideoProjectStore((s) => s.setSelectedMediaId);
  const handleOnSheetOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedMediaId(null);
    }
  };
  const isExportDialogOpen = useVideoProjectStore((s) => s.exportDialogOpen);
  const setExportDialogOpen = useVideoProjectStore((s) => s.setExportDialogOpen);
  return (
    <ToastProvider>
      <QueryClientProvider client={queryClient}>
        <div className="flex flex-col relative overflow-x-hidden h-screen bg-black">
          <Header />
          <main className="flex overflow-hidden h-full w-screen">
            <LeftPanel />
            <div className="flex flex-col flex-1">
              <VideoPreview />
              <BottomBar />
            </div>
          </main>
          <RightPanel />
        </div>
        <Toaster />
        <ProjectDialog open={projectDialogOpen} />
        <ExportDialog
          open={isExportDialogOpen}
          onOpenChange={setExportDialogOpen}
        />
        <MediaGallerySheet
          open={selectedMediaId !== null}
          onOpenChange={handleOnSheetOpenChange}
          selectedMediaId={selectedMediaId ?? ""}
        />
        <FluxProStudio />
      </QueryClientProvider>
    </ToastProvider>
  );
}
