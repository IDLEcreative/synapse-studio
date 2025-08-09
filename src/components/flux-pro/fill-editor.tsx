"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { fal } from "@/lib/fal";
import { db } from "@/data/db";
import { useVideoProjectStore, type MediaType } from "@/data/store";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys, useProjectMediaItems } from "@/data/queries";
import { uploadFile } from "@/lib/supabase";
import { getMediaMetadata } from "@/lib/ffmpeg";
import { MediaItem } from "@/data/schema";
import { LoadingIcon } from "@/components/ui/icons";
import {
  UndoIcon,
  RedoIcon,
  SparklesIcon,
  TrashIcon,
  Paintbrush,
  Eraser,
  UploadIcon,
  ImageIcon,
} from "lucide-react";

// Constants
const CANVAS_WIDTH = 512;
const CANVAS_HEIGHT = 512;
const MAX_HISTORY_LENGTH = 20;

interface FillEditorProps {
  initialImage?: string | null;
  onComplete: (result: {
    url: string;
    metadata: Record<string, unknown>;
  }) => void;
  supportLayers?: boolean;
}

export default function FillEditor({
  initialImage,
  onComplete,
  supportLayers = false,
}: FillEditorProps) {
  // Core state
  const [image, setImage] = useState<string | null>(initialImage || null);
  const [prompt, setPrompt] = useState("");
  const [brushSize, setBrushSize] = useState(20);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showMediaGallery, setShowMediaGallery] = useState(false);
  const [canvasesInitialized, setCanvasesInitialized] = useState(false);

  // History management - limit history size to prevent memory issues
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [maskHistory, setMaskHistory] = useState<string[]>([]);
  const [maskHistoryIndex, setMaskHistoryIndex] = useState(-1);

  // Project and toast
  const projectId = useVideoProjectStore((s) => s.projectId);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Canvas refs
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasInitializedRef = useRef(false);

  // Upload functionality is now handled by Supabase

  // History management with size limits to prevent memory issues
  const addToHistory = useCallback(
    (dataUrl: string) => {
      setHistory((prevHistory) => {
        const newHistory = prevHistory.slice(0, historyIndex + 1);
        newHistory.push(dataUrl);

        // Limit history size
        if (newHistory.length > MAX_HISTORY_LENGTH) {
          newHistory.shift();
        }

        setHistoryIndex(
          Math.min(newHistory.length - 1, MAX_HISTORY_LENGTH - 1),
        );
        return newHistory;
      });
    },
    [historyIndex],
  );

  const addToMaskHistory = useCallback(
    (dataUrl: string) => {
      setMaskHistory((prevHistory) => {
        const newHistory = prevHistory.slice(0, maskHistoryIndex + 1);
        newHistory.push(dataUrl);

        // Limit history size
        if (newHistory.length > MAX_HISTORY_LENGTH) {
          newHistory.shift();
        }

        setMaskHistoryIndex(
          Math.min(newHistory.length - 1, MAX_HISTORY_LENGTH - 1),
        );
        return newHistory;
      });
    },
    [maskHistoryIndex],
  );

  // Update display canvas by compositing image and mask - memoized to prevent unnecessary recreations
  const updateDisplayCanvas = useCallback(() => {
    if (
      !imageCanvasRef.current ||
      !maskCanvasRef.current ||
      !displayCanvasRef.current
    )
      return;

    const displayCtx = displayCanvasRef.current.getContext("2d");
    if (!displayCtx) return;

    // Clear display canvas
    displayCtx.clearRect(
      0,
      0,
      displayCanvasRef.current.width,
      displayCanvasRef.current.height,
    );

    // Draw image
    displayCtx.drawImage(imageCanvasRef.current, 0, 0);

    // Draw mask with semi-transparency
    displayCtx.globalAlpha = 0.5;
    displayCtx.drawImage(maskCanvasRef.current, 0, 0);
    displayCtx.globalAlpha = 1.0;
  }, [imageCanvasRef, maskCanvasRef, displayCanvasRef]); // Adjusted dependencies

  // Initialize canvases when component mounts and refs are available
  useEffect(() => {
    // Only proceed if not already initialized
    if (canvasInitializedRef.current) return;

    // Ensure all canvas refs are available
    if (
      !imageCanvasRef.current ||
      !maskCanvasRef.current ||
      !displayCanvasRef.current
    ) {
      return; // Exit if any ref is not available yet
    }

    // All refs are available, proceed with initialization
    const imageCanvas = imageCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    const displayCanvas = displayCanvasRef.current;

    // Set canvas dimensions
    imageCanvas.width = CANVAS_WIDTH;
    imageCanvas.height = CANVAS_HEIGHT;
    maskCanvas.width = CANVAS_WIDTH;
    maskCanvas.height = CANVAS_HEIGHT;
    displayCanvas.width = CANVAS_WIDTH;
    displayCanvas.height = CANVAS_HEIGHT;

    // Initialize mask canvas
    const maskCtx = maskCanvas.getContext("2d");
    if (maskCtx) {
      maskCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      // Add initial mask state to history
      addToMaskHistory(maskCanvas.toDataURL());
    }

    // Mark as initialized
    canvasInitializedRef.current = true;
    setCanvasesInitialized(true);

    // If we have an image, it will be loaded in the next effect
  }, [imageCanvasRef, maskCanvasRef, displayCanvasRef, addToMaskHistory]);

  // Load image when image state changes or canvases are initialized
  useEffect(() => {
    if (!canvasesInitialized || !imageCanvasRef.current) return;

    const imageCanvas = imageCanvasRef.current;
    const imageCtx = imageCanvas.getContext("2d");

    if (!imageCtx) return;

    const loadImage = () => {
      if (image) {
        // Load initial image
        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = () => {
          imageCtx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          updateDisplayCanvas();
          addToHistory(imageCanvas.toDataURL());
        };

        img.onerror = () => {
          // Create a default gray background on error
          imageCtx.fillStyle = "#333333";
          imageCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          updateDisplayCanvas();
          addToHistory(imageCanvas.toDataURL());

          toast({
            title: "Image Load Error",
            description:
              "Could not load the image. Using default background instead.",
          });
        };

        img.src = image;
      } else {
        // Create a default gray background
        imageCtx.fillStyle = "#333333";
        imageCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        updateDisplayCanvas();
        addToHistory(imageCanvas.toDataURL());
      }
    };

    loadImage();
  }, [image, canvasesInitialized, toast, addToHistory, updateDisplayCanvas]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      loadImageFromHistory(historyIndex - 1);
    }
  }, [historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      loadImageFromHistory(historyIndex + 1);
    }
  }, [historyIndex, history.length]);

  const loadImageFromHistory = useCallback(
    (index: number) => {
      if (!imageCanvasRef.current) return;

      const ctx = imageCanvasRef.current.getContext("2d");
      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.clearRect(
          0,
          0,
          imageCanvasRef.current!.width,
          imageCanvasRef.current!.height,
        );
        ctx.drawImage(img, 0, 0);
        updateDisplayCanvas();
      };
      img.onerror = () => {
        toast({
          title: "History Error",
          description: "Could not load image from history",
        });
      };
      img.src = history[index];
    },
    [history, updateDisplayCanvas, toast],
  );

  // Drawing functions - memoized to prevent unnecessary recreations
  const startDrawing = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      setIsDrawing(true);

      if (!maskCanvasRef.current) return;

      const canvas = maskCanvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);

      // Set drawing style
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (isErasing) {
        ctx.globalCompositeOperation = "destination-out";
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = "#ffffff";
      }

      // Draw a dot at the starting point
      ctx.lineTo(x + 0.1, y + 0.1);
      ctx.stroke();

      updateDisplayCanvas();
    },
    [isErasing, brushSize, updateDisplayCanvas],
  );

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing || !maskCanvasRef.current) return;

      const canvas = maskCanvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);

      ctx.lineTo(x, y);
      ctx.stroke();

      updateDisplayCanvas();
    },
    [isDrawing, updateDisplayCanvas],
  );

  const endDrawing = useCallback(() => {
    if (!isDrawing || !maskCanvasRef.current) return;

    setIsDrawing(false);
    addToMaskHistory(maskCanvasRef.current.toDataURL());
  }, [isDrawing, addToMaskHistory]);

  const clearMask = useCallback(() => {
    if (!maskCanvasRef.current) return;

    const ctx = maskCanvasRef.current.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(
      0,
      0,
      maskCanvasRef.current.width,
      maskCanvasRef.current.height,
    );

    // Add to mask history
    addToMaskHistory(maskCanvasRef.current.toDataURL());
    updateDisplayCanvas();

    toast({
      title: "Mask Cleared",
      description: "The mask has been cleared",
    });
  }, [addToMaskHistory, updateDisplayCanvas, toast]);

  // Validate that a mask has been drawn
  const validateMaskExists = useCallback(async (): Promise<boolean> => {
    if (!maskCanvasRef.current) return false;

    const ctx = maskCanvasRef.current.getContext("2d");
    if (!ctx) return false;

    // Get image data to check if any non-transparent pixels exist
    const imageData = ctx.getImageData(
      0,
      0,
      maskCanvasRef.current.width,
      maskCanvasRef.current.height,
    );
    const data = imageData.data;

    // Check if there are any non-transparent pixels (alpha > 0)
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) {
        return true;
      }
    }

    return false;
  }, []);

  // Load result image
  const loadResultImage = useCallback(
    async (resultImageUrl: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!imageCanvasRef.current) {
          reject(new Error("Canvas ref not found"));
          return;
        }

        const ctx = imageCanvasRef.current.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = () => {
          // Clear the canvas and draw the new image
          ctx.clearRect(
            0,
            0,
            imageCanvasRef.current!.width,
            imageCanvasRef.current!.height,
          );
          ctx.drawImage(
            img,
            0,
            0,
            imageCanvasRef.current!.width,
            imageCanvasRef.current!.height,
          );

          // Clear the mask canvas
          if (maskCanvasRef.current) {
            const maskCtx = maskCanvasRef.current.getContext("2d");
            if (maskCtx) {
              maskCtx.clearRect(
                0,
                0,
                maskCanvasRef.current.width,
                maskCanvasRef.current.height,
              );
              addToMaskHistory(maskCanvasRef.current.toDataURL());
            }
          }

          // Update display
          updateDisplayCanvas();

          // Add to history
          addToHistory(resultImageUrl);

          resolve();
        };

        img.onerror = () => {
          reject(new Error("Error loading result image"));
        };

        img.src = resultImageUrl;
      });
    },
    [updateDisplayCanvas, addToMaskHistory, addToHistory],
  );

  // Generate with Flux Pro Fill
  const generateWithFluxProFill = useCallback(async () => {
    if (!prompt) {
      toast({
        title: "Prompt Required",
        description: "Please enter a prompt before generating.",
      });
      return;
    }

    // Validate that a mask has been drawn
    const hasMask = await validateMaskExists();
    if (!hasMask) {
      toast({
        title: "Mask Required",
        description: "Please draw a mask on the areas you want to modify.",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Get image and mask data URLs
      const imageDataUrl = imageCanvasRef.current?.toDataURL() || null;
      const maskDataUrl = maskCanvasRef.current?.toDataURL() || null;

      if (!imageDataUrl || !maskDataUrl) {
        throw new Error("Failed to get image or mask data");
      }

      // Call the API
      const result = (await fal.subscribe("fal-ai/flux-pro/v1/fill", {
        input: {
          prompt,
          image_url: imageDataUrl,
          mask_url: maskDataUrl,
        } as any,
      })) as unknown as { data: { images: Array<{ url: string }> } };

      // Process the result
      let resultImageUrl: string | null = null;

      if (result && "data" in result && result.data) {
        const data = result.data as { images: Array<{ url: string }> };

        if (data.images && data.images.length > 0 && data.images[0].url) {
          resultImageUrl = data.images[0].url;
        }
      }

      if (resultImageUrl) {
        // Load the result image
        await loadResultImage(resultImageUrl);

        // Call onComplete with the result
        onComplete({
          url: resultImageUrl,
          metadata: {
            prompt: prompt,
            model: "fal-ai/flux-pro/v1/fill",
          },
        });

        toast({
          title: "Generation Complete",
          description: "Your image has been successfully generated.",
        });
      } else {
        throw new Error("No valid image found in result");
      }
    } catch (error) {
      console.error("Error generating with Flux Pro Fill:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, validateMaskExists, loadResultImage, onComplete, toast]);

  // File upload handler using Supabase
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      // Upload the file to Supabase
      const file = files[0];
      const fileUrl = await uploadFile(file);

      // Set the image to the uploaded file URL
      setImage(fileUrl);

      // Add to database for persistence
      const mediaType = file.type.split("/")[0];
      const outputType = mediaType === "audio" ? "music" : mediaType;

      const data: Omit<MediaItem, "id"> = {
        projectId,
        kind: "uploaded",
        createdAt: Date.now(),
        mediaType: outputType as MediaType,
        status: "completed",
        url: fileUrl,
      };

      try {
        const mediaId = await db.media.create(data);
        const media = await db.media.find(mediaId as string);

        if (media) {
          const mediaMetadata = await getMediaMetadata(media as MediaItem);
          await db.media
            .update(media.id, {
              ...media,
              metadata: mediaMetadata?.media || {},
            })
            .finally(() => {
              queryClient.invalidateQueries({
                queryKey: queryKeys.projectMediaItems(projectId),
              });
            });
        }

        toast({
          title: "Image uploaded successfully",
          description: "Your image is ready for editing.",
        });
      } catch (dbError) {
        console.error("Error saving media to database:", dbError);
        // Still set the image even if database save fails
        toast({
          title: "Image uploaded",
          description: "Image loaded but may not be saved to your gallery.",
        });
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast({
        title: "Failed to upload image",
        description: "Please try again",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Media Gallery Dialog Component
  const MediaGalleryDialog = ({
    isOpen,
    onClose,
    onSelectImage,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onSelectImage: (mediaItem: MediaItem) => void;
  }) => {
    const { data: mediaItems = [] } = useProjectMediaItems(projectId);
    const imageMediaItems = mediaItems.filter(
      (item: MediaItem) =>
        item.mediaType === "image" && item.status === "completed",
    );

    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogTitle className="text-xl font-semibold mb-4">
            Select an Image
          </DialogTitle>

          {imageMediaItems.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No images found in your gallery
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {imageMediaItems.map((item: MediaItem) => (
                <div
                  key={item.id}
                  className="relative aspect-square rounded-lg overflow-hidden border border-gray-700 hover:border-blue-500 cursor-pointer transition-all"
                  onClick={() => onSelectImage(item)}
                >
                  {item.url && (
                    <img
                      src={item.url}
                      alt="Gallery image"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  // Handle selecting an image from the gallery
  const handleSelectFromGallery = (mediaItem: MediaItem) => {
    if (mediaItem.url) {
      setImage(mediaItem.url);
      setShowMediaGallery(false);

      toast({
        title: "Image selected",
        description: "You can now edit the selected image.",
      });
    }
  };

  // Simple UI for testing
  return (
    <div className="flex flex-col h-full bg-black p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white mb-2">
          Fill & Inpaint Editor
        </h2>
        <p className="text-gray-400">
          Draw a mask and generate content with AI
        </p>
      </div>

      {!image ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md text-center">
            <SparklesIcon className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-4">
              No Image Selected
            </h3>
            <p className="text-gray-400 mb-6">
              Upload an image to get started with the Fill & Inpaint feature.
            </p>

            <div className="flex flex-col gap-4">
              <Button
                variant="outline"
                className="w-full cursor-pointer"
                disabled={isUploading}
                asChild
              >
                <label htmlFor="fill-editor-file-upload">
                  <input
                    id="fill-editor-file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept=".jpg,.jpeg,.png,.webp"
                    disabled={isUploading}
                  />
                  {isUploading ? (
                    <>
                      <LoadingIcon className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <UploadIcon className="w-4 h-4 mr-2" />
                      Upload Image
                    </>
                  )}
                </label>
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowMediaGallery(true)}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Select from Gallery
              </Button>
            </div>
          </div>

          {/* Media Gallery Dialog */}
          {showMediaGallery && (
            <MediaGalleryDialog
              isOpen={showMediaGallery}
              onClose={() => setShowMediaGallery(false)}
              onSelectImage={handleSelectFromGallery}
            />
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative bg-gray-900 rounded-lg overflow-hidden">
            {/* Canvas container */}
            <div className="relative w-full h-full">
              {/* Hidden image canvas */}
              <canvas ref={imageCanvasRef} className="hidden" />

              {/* Hidden mask canvas */}
              <canvas ref={maskCanvasRef} className="hidden" />

              {/* Display canvas */}
              <canvas
                ref={displayCanvasRef}
                className="absolute inset-0 w-full h-full"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={endDrawing}
                onMouseLeave={endDrawing}
              />

              {/* Toolbar */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 p-2 bg-gray-800 rounded-full">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsErasing(false)}
                  className={`rounded-full p-2 ${!isErasing ? "bg-blue-500/20 text-blue-400" : "text-gray-400"}`}
                >
                  <Paintbrush className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsErasing(true)}
                  className={`rounded-full p-2 ${isErasing ? "bg-blue-500/20 text-blue-400" : "text-gray-400"}`}
                >
                  <Eraser className="w-4 h-4" />
                </Button>

                <div className="h-4 w-px bg-gray-700 mx-1"></div>

                <Slider
                  defaultValue={[brushSize]}
                  value={[brushSize]}
                  onValueChange={(value) => setBrushSize(value[0])}
                  max={50}
                  min={1}
                  step={1}
                  className="w-24"
                />

                <span className="text-xs text-gray-400 w-6 text-center">
                  {brushSize}
                </span>

                <div className="h-4 w-px bg-gray-700 mx-1"></div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearMask}
                  className="rounded-full p-2 text-gray-400"
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              </div>

              {/* Loading overlay */}
              {isGenerating && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                  <div className="flex flex-col items-center">
                    <SparklesIcon className="w-12 h-12 animate-pulse text-blue-400 mb-3" />
                    <p className="text-white font-medium">Generating...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Side panel */}
          <div className="w-full md:w-64 bg-gray-800 rounded-lg p-4 flex flex-col">
            <h3 className="text-white font-medium mb-2">Prompt</h3>
            <Textarea
              placeholder="Describe what you want to generate in the masked area..."
              className="flex-1 min-h-[120px] mb-4 bg-gray-700 border-gray-600"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />

            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={generateWithFluxProFill}
              disabled={isGenerating || !prompt}
            >
              <SparklesIcon className="w-4 h-4 mr-2" />
              Generate
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
