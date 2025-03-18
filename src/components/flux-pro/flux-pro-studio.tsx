"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Save,
  Download,
  Keyboard,
  Maximize2,
  Minimize2,
} from "lucide-react";
import {
  CollapsibleToolPanel,
  GenerationTools,
  ExportTools,
} from "@/components/flux-pro/collapsible-tool-panel";
import { useVideoProjectStore } from "@/data/store";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/data/db";
import { queryKeys } from "@/data/queries";
import { useQueryClient } from "@tanstack/react-query";
import { MediaItem } from "@/data/schema";
import FillEditor from "@/components/flux-pro/fill-editor";
import CannyEditor from "@/components/flux-pro/canny-editor";
import DepthEditor from "@/components/flux-pro/depth-editor";
import ReduxEditor from "@/components/flux-pro/redux-editor";
import FluxProEditor from "@/components/flux-pro/flux-pro-editor";
import FinetuneEditor from "@/components/flux-pro/finetune-editor";
import { cn } from "@/lib/utils";
import { FLUX_PRO_TOOLS, ALL_ENDPOINTS } from "@/lib/fal";

export function FluxProStudio() {
  const fluxProStudio = useVideoProjectStore((s) => s.fluxProStudio);
  const setFluxProStudio = useVideoProjectStore((s) => s.setFluxProStudio);
  const closeFluxProStudio = useVideoProjectStore((s) => s.closeFluxProStudio);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>(fluxProStudio.activeTab);
  const isToolPanelCollapsed = useVideoProjectStore(
    (s) => s.fluxProStudio.isToolPanelCollapsed,
  );

  const toggleToolPanel = () => {
    setFluxProStudio({ isToolPanelCollapsed: !isToolPanelCollapsed });
  };
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const studioRef = useRef<HTMLDivElement>(null);

  // Update active tab when fluxProStudio.activeTab changes
  useEffect(() => {
    setActiveTab(fluxProStudio.activeTab);
  }, [fluxProStudio.activeTab]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only process shortcuts when studio is open
      if (!fluxProStudio.isOpen) return;

      // Escape to exit fullscreen
      if (e.key === "Escape" && isFullscreen) {
        toggleFullscreen();
      }

      // Number keys 1-6 to switch tabs
      if (e.key >= "1" && e.key <= "6" && e.altKey) {
        const tabIndex = parseInt(e.key) - 1;
        const tabValues = [
          "flux-pro",
          "fill",
          "canny",
          "depth",
          "redux",
          "finetune",
        ];
        if (tabIndex >= 0 && tabIndex < tabValues.length) {
          setActiveTab(tabValues[tabIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [fluxProStudio.isOpen, isFullscreen]);

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!studioRef.current) return;

    if (!isFullscreen) {
      if (studioRef.current.requestFullscreen) {
        studioRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Handle result from any editor
  const handleComplete = (result: { url: string; metadata: any }) => {
    // Update the initial image with the latest result
    setFluxProStudio({
      initialImage: result.url,
    });

    // Show success toast
    toast({
      title: "Edit Complete",
      description: "Your edit has been processed successfully",
    });
  };

  // Save current state to media gallery
  const saveToMediaGallery = async () => {
    if (!fluxProStudio.initialImage) {
      toast({
        title: "Nothing to save",
        description: "Make some edits first before saving",
      });
      return;
    }

    setIsSaving(true);

    try {
      // Create a new media item in the database
      const data: Omit<MediaItem, "id"> = {
        projectId: fluxProStudio.projectId,
        kind: "generated",
        // Use the appropriate endpoint ID based on the active tab
        endpointId:
          activeTab === "flux-pro"
            ? "fal-ai/flux-pro/v1.1"
            : activeTab === "redux"
              ? "fal-ai/flux-pro/v1.1/redux"
              : `fal-ai/flux-pro/v1/${activeTab}`,
        requestId: `flux-pro-${Date.now()}`,
        createdAt: Date.now(),
        mediaType: "image",
        status: "completed",
        url: fluxProStudio.initialImage,
        input: {
          prompt: `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} edit`,
        },
      };

      await db.media.create(data);

      // Invalidate queries to refresh the media gallery
      queryClient.invalidateQueries({
        queryKey: queryKeys.projectMediaItems(fluxProStudio.projectId),
      });

      toast({
        title: "Saved to Gallery",
        description: "Your edited image has been saved to the media gallery",
      });

      // Close the studio
      closeFluxProStudio();
    } catch (error) {
      console.error("Error saving to media gallery:", error);
      toast({
        title: "Save Failed",
        description: "There was an error saving your image",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Export current state to video
  const exportToVideo = async () => {
    if (!fluxProStudio.initialImage) {
      toast({
        title: "Nothing to export",
        description: "Make some edits first before exporting to video",
      });
      return;
    }

    setIsExporting(true);

    try {
      // Set up the generate dialog with the current image
      const openGenerateDialog =
        useVideoProjectStore.getState().openGenerateDialog;
      const setGenerateMediaType =
        useVideoProjectStore.getState().setGenerateMediaType;
      const setGenerateData = useVideoProjectStore.getState().setGenerateData;
      const setEndpointId = useVideoProjectStore.getState().setEndpointId;

      // Find a video endpoint from ALL_ENDPOINTS
      const videoEndpoints = ALL_ENDPOINTS.filter(
        (endpoint) => endpoint.category === "video",
      );
      const defaultVideoEndpoint =
        videoEndpoints.length > 0
          ? videoEndpoints[0].endpointId
          : "fal-ai/minimax/video-01-live"; // Fallback

      // Set up for video generation
      setGenerateMediaType("video");
      setGenerateData({
        image: fluxProStudio.initialImage,
        prompt: `Video from ${activeTab} edit`,
        duration: 5, // Default duration in seconds
      });
      setEndpointId(defaultVideoEndpoint);

      // Close the studio and open the generate dialog
      closeFluxProStudio();
      openGenerateDialog("video");

      toast({
        title: "Ready for Video Export",
        description: "Your image is ready to be converted to video",
      });
    } catch (error) {
      console.error("Error setting up video export:", error);
      toast({
        title: "Export Failed",
        description: "There was an error preparing your image for video export",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (!fluxProStudio.isOpen) {
    return null;
  }

  return (
    <div
      ref={studioRef}
      className="fixed inset-0 bg-black z-50 flex flex-col h-screen"
    >
      {/* Header */}
      <div className="border-b border-white/5 p-4 flex justify-between items-center bg-black">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={closeFluxProStudio}
            className="text-gray-400 hover:text-white hover:bg-white/5 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Editor
          </Button>
          <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Image Studio
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="btn-minimal rounded-xl"
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 mr-1.5" />
            ) : (
              <Maximize2 className="w-4 h-4 mr-1.5" />
            )}
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              toast({
                title: "Keyboard Shortcuts",
                description: "Alt+1-6: Switch tabs, Esc: Exit fullscreen",
              });
            }}
            className="btn-minimal rounded-xl"
            title="Show keyboard shortcuts"
          >
            <Keyboard className="w-4 h-4 mr-1.5" />
            Shortcuts
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Tool Panel */}
        <CollapsibleToolPanel
          isCollapsed={isToolPanelCollapsed}
          onToggleCollapse={() => {
            console.log(
              "Toggling tool panel from",
              isToolPanelCollapsed,
              "to",
              !isToolPanelCollapsed,
            );
            setFluxProStudio({ isToolPanelCollapsed: !isToolPanelCollapsed });
          }}
        >
          <GenerationTools
            isCollapsed={isToolPanelCollapsed}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
          />

          <ExportTools
            isCollapsed={isToolPanelCollapsed}
            onExportToVideo={exportToVideo}
            onSaveToGallery={saveToMediaGallery}
            hasEdits={!!fluxProStudio.initialImage}
            isExporting={isExporting}
            isSaving={isSaving}
          />
        </CollapsibleToolPanel>

        {/* Editing area */}
        <div className="flex-1 flex flex-col transition-all duration-300">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col h-full"
          >
            <div className="flex-1 overflow-hidden">
              <TabsContent value="flux-pro" className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto">
                  <FluxProEditor
                    onComplete={handleComplete}
                    proTools={FLUX_PRO_TOOLS}
                  />
                </div>
              </TabsContent>

              <TabsContent value="fill" className="h-full">
                <FillEditor
                  initialImage={fluxProStudio.initialImage}
                  onComplete={handleComplete}
                  supportLayers={true}
                />
              </TabsContent>

              <TabsContent value="canny" className="h-full">
                <CannyEditor
                  initialImage={fluxProStudio.initialImage}
                  onComplete={handleComplete}
                  supportLayers={true}
                />
              </TabsContent>

              <TabsContent value="depth" className="h-full">
                <DepthEditor
                  initialImage={fluxProStudio.initialImage}
                  onComplete={handleComplete}
                  supportLayers={true}
                />
              </TabsContent>

              <TabsContent value="redux" className="h-full">
                <ReduxEditor
                  initialImage={fluxProStudio.initialImage}
                  onComplete={handleComplete}
                  supportLayers={true}
                />
              </TabsContent>

              <TabsContent value="finetune" className="h-full">
                <FinetuneEditor />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default FluxProStudio;
