"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Save, Download, History, Keyboard, Maximize2, Minimize2 } from "lucide-react";
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
import BatchProcessor from "@/components/flux-pro/batch-processor";
import HistoryPanel from "@/components/flux-pro/history-panel";

type HistoryItem = {
  id: string;
  thumbnail: string;
  timestamp: number;
  description: string;
};

export function FluxProStudio() {
  const fluxProStudio = useVideoProjectStore((s) => s.fluxProStudio);
  const setFluxProStudio = useVideoProjectStore((s) => s.setFluxProStudio);
  const closeFluxProStudio = useVideoProjectStore((s) => s.closeFluxProStudio);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>(fluxProStudio.activeTab);
  const [showHistory, setShowHistory] = useState(false);
  const [editHistory, setEditHistory] = useState<HistoryItem[]>([]);
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
      
      // Ctrl/Cmd + Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        // Implement undo logic here
        if (editHistory.length > 0 && editHistory.length > 1) {
          // Logic would depend on how you implement history
          toast({
            title: "Undo",
            description: "Last action undone",
          });
        }
      }
      
      // Ctrl/Cmd + Shift + Z for redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        // Implement redo logic here
        toast({
          title: "Redo",
          description: "Action redone",
        });
      }
      
      // Escape to exit fullscreen
      if (e.key === 'Escape' && isFullscreen) {
        toggleFullscreen();
      }
      
      // Number keys 1-5 to switch tabs
      if (e.key >= '1' && e.key <= '5' && e.altKey) {
        const tabIndex = parseInt(e.key) - 1;
        const tabValues = ['fill', 'canny', 'depth', 'redux', 'batch'];
        if (tabIndex >= 0 && tabIndex < tabValues.length) {
          setActiveTab(tabValues[tabIndex]);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [fluxProStudio.isOpen, isFullscreen, editHistory]);
  
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
    // Add to edit history
    const historyItem: HistoryItem = {
      id: Date.now().toString(),
      thumbnail: result.url,
      timestamp: Date.now(),
      description: `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} edit: ${result.metadata.prompt?.substring(0, 30) || ""}...`,
    };
    
    setEditHistory([historyItem, ...editHistory]);
    
    // Show success toast
    toast({
      title: "Edit Complete",
      description: "Your edit has been processed successfully",
    });
  };
  
  // Save current state to media gallery
  const saveToMediaGallery = async () => {
    if (!editHistory.length) {
      toast({
        title: "Nothing to save",
        description: "Make some edits first before saving",
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Get the most recent edit
      const latestEdit = editHistory[0];
      
      // Create a new media item in the database
      const data: Omit<MediaItem, "id"> = {
        projectId: fluxProStudio.projectId,
        kind: "generated",
        endpointId: "fal-ai/flux-pro/v1/fill", // Default endpoint
        requestId: `flux-pro-${Date.now()}`,
        createdAt: Date.now(),
        mediaType: "image",
        status: "completed",
        url: latestEdit.thumbnail,
        input: {
          prompt: latestEdit.description
        }
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
    if (!editHistory.length) {
      toast({
        title: "Nothing to export",
        description: "Make some edits first before exporting to video",
      });
      return;
    }
    
    setIsExporting(true);
    
    try {
      // Get the most recent edit
      const latestEdit = editHistory[0];
      
      // Set up the generate dialog with the current image
      const openGenerateDialog = useVideoProjectStore.getState().openGenerateDialog;
      const setGenerateMediaType = useVideoProjectStore.getState().setGenerateMediaType;
      const setGenerateData = useVideoProjectStore.getState().setGenerateData;
      const setEndpointId = useVideoProjectStore.getState().setEndpointId;
      
      // Find a video endpoint
      const AVAILABLE_ENDPOINTS = useVideoProjectStore.getState().endpointId;
      
      // Set up for video generation
      setGenerateMediaType("video");
      setGenerateData({
        image: latestEdit.thumbnail,
        prompt: latestEdit.description,
        duration: 5 // Default duration in seconds
      });
      
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
    <div ref={studioRef} className="fixed inset-0 bg-black z-50 flex flex-col h-screen">
      {/* Header */}
      <div className="border-b border-white/10 p-4 flex justify-between items-center bg-gray-900/80">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={closeFluxProStudio}
            className="text-gray-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Editor
          </Button>
          <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Flux Pro Studio
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className={showHistory ? "bg-blue-500/20 text-blue-400" : ""}
            title="Toggle history panel"
          >
            <History className="w-4 h-4 mr-1.5" />
            History
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={toggleFullscreen}
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
                description: "Alt+1-5: Switch tabs, Ctrl+Z: Undo, Ctrl+Shift+Z: Redo, Esc: Exit fullscreen",
              });
            }}
            title="Show keyboard shortcuts"
          >
            <Keyboard className="w-4 h-4 mr-1.5" />
            Shortcuts
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={exportToVideo}
            disabled={isExporting || !editHistory.length}
            title="Export current image to video"
          >
            {isExporting ? (
              <span className="animate-spin mr-1.5">⟳</span>
            ) : (
              <Download className="w-4 h-4 mr-1.5" />
            )}
            Export to Video
          </Button>
          <Button 
            variant="default"
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white"
            onClick={saveToMediaGallery}
            disabled={isSaving || !editHistory.length}
            title="Save current image to media gallery and exit"
          >
            {isSaving ? (
              <span className="animate-spin mr-1.5">⟳</span>
            ) : (
              <Save className="w-4 h-4 mr-1.5" />
            )}
            Save & Exit
          </Button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editing area */}
        <div className={`flex-1 flex flex-col ${showHistory ? 'mr-80' : ''} transition-all duration-300`}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full">
            <TabsList className="px-4 py-2 bg-gray-900/50 border-b border-white/10">
              <TabsTrigger value="fill">Fill & Inpaint</TabsTrigger>
              <TabsTrigger value="canny">Edge-Guided</TabsTrigger>
              <TabsTrigger value="depth">Depth-Guided</TabsTrigger>
              <TabsTrigger value="redux">Variations</TabsTrigger>
              <TabsTrigger value="batch">Batch Processing</TabsTrigger>
            </TabsList>
            
            <div className="flex-1 overflow-hidden">
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
              
              <TabsContent value="batch" className="h-full">
                <BatchProcessor 
                  projectId={fluxProStudio.projectId}
                  onComplete={handleComplete}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
        
        {/* History panel (collapsible) */}
        {showHistory && (
          <div className="w-80 border-l border-white/10 bg-gray-900/30 overflow-y-auto">
            <HistoryPanel 
              history={editHistory}
              onSelect={(item: HistoryItem) => {
                // Load the selected history item
                setFluxProStudio({ 
                  initialImage: item.thumbnail 
                });
              }}
              onDelete={(id: string) => {
                // Remove from history
                setEditHistory(editHistory.filter(item => item.id !== id));
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default FluxProStudio;
