"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { fal } from "@/lib/fal";
import { db } from "@/data/db";
import { useVideoProjectStore } from "@/data/store";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys, useProjectMediaItems } from "@/data/queries";
import { useUploadThing } from "@/lib/uploadthing";
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

interface FillEditorProps {
  initialImage?: string | null;
  onComplete: (result: { url: string; metadata: any }) => void;
  supportLayers?: boolean;
}

export default function FillEditor({
  initialImage,
  onComplete,
  supportLayers = false,
}: FillEditorProps) {
  console.log("FillEditor RENDERING with initialImage:", initialImage);

  // Core state
  const [image, setImage] = useState<string | null>(initialImage || null);
  const [prompt, setPrompt] = useState("");
  const [brushSize, setBrushSize] = useState(20);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showMediaGallery, setShowMediaGallery] = useState(false);

  // History management
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

  // Upload functionality
  const { startUpload } = useUploadThing("fileUploader");

  // Initialize canvases
  useEffect(() => {
    console.log("FillEditor useEffect - initializing canvases");

    // Wait for next tick to ensure refs are available
    const timer = setTimeout(() => {
      if (
        !imageCanvasRef.current ||
        !maskCanvasRef.current ||
        !displayCanvasRef.current
      ) {
        console.error("Canvas refs not available");
        return;
      }

      console.log("Canvas refs available, initializing...");

      const imageCanvas = imageCanvasRef.current;
      const maskCanvas = maskCanvasRef.current;
      const displayCanvas = displayCanvasRef.current;

      // Set canvas dimensions
      const canvasWidth = 512;
      const canvasHeight = 512;

      imageCanvas.width = canvasWidth;
      imageCanvas.height = canvasHeight;
      maskCanvas.width = canvasWidth;
      maskCanvas.height = canvasHeight;
      displayCanvas.width = canvasWidth;
      displayCanvas.height = canvasHeight;

      // Initialize image canvas
      const imageCtx = imageCanvas.getContext("2d");
      if (imageCtx) {
        if (image) {
          console.log("Loading image into canvas:", image);
          // Load initial image
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            console.log("Image loaded successfully");
            imageCtx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
            updateDisplayCanvas();
            addToHistory(imageCanvas.toDataURL());
          };
          img.onerror = (e) => {
            console.error(
              "Error loading image, possibly due to CORS restrictions:",
              e,
            );
            imageCtx.fillStyle = "#333333";
            imageCtx.fillRect(0, 0, canvasWidth, canvasHeight);
            updateDisplayCanvas();
            addToHistory(imageCanvas.toDataURL());
          };
          img.src = image;
        } else {
          console.log("No image provided, creating default background");
          // Create a default gray background
          imageCtx.fillStyle = "#333333";
          imageCtx.fillRect(0, 0, canvasWidth, canvasHeight);
          updateDisplayCanvas();
          addToHistory(imageCanvas.toDataURL());
        }
      }

      // Initialize mask canvas
      const maskCtx = maskCanvas.getContext("2d");
      if (maskCtx) {
        maskCtx.clearRect(0, 0, canvasWidth, canvasHeight);
        addToMaskHistory(maskCanvas.toDataURL());
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [image]);

  // Update display canvas by compositing image and mask
  const updateDisplayCanvas = () => {
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
  };

  // History management
  const addToHistory = (dataUrl: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(dataUrl);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const addToMaskHistory = (dataUrl: string) => {
    const newHistory = maskHistory.slice(0, maskHistoryIndex + 1);
    newHistory.push(dataUrl);
    setMaskHistory(newHistory);
    setMaskHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      loadImageFromHistory(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      loadImageFromHistory(historyIndex + 1);
    }
  };

  const loadImageFromHistory = (index: number) => {
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
      console.error("Error loading image from history");
    };
    img.src = history[index];
  };

  // Drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    console.log("startDrawing called");
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
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    if (!maskCanvasRef.current) return;

    const canvas = maskCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    ctx.lineTo(x, y);
    ctx.stroke();

    updateDisplayCanvas();
  };

  const endDrawing = () => {
    setIsDrawing(false);

    if (!maskCanvasRef.current) return;

    // Add to mask history
    addToMaskHistory(maskCanvasRef.current.toDataURL());
  };

  const clearMask = () => {
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
  };

  // Generate with Flux Pro Fill
  const generateWithFluxProFill = async () => {
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

      console.log("Calling fal API with:", {
        prompt,
        imageUrl: imageDataUrl ? "present" : "missing",
        maskUrl: maskDataUrl ? "present" : "missing",
      });

      // Call the API
      const result = await fal.subscribe("fal-ai/flux-pro/v1/fill", {
        input: {
          prompt,
          image_url: imageDataUrl,
          mask_url: maskDataUrl,
        },
      } as any);

      console.log("API call successful");

      // Process the result
      let resultImageUrl: string | null = null;

      if (result && "data" in result && result.data) {
        const data = result.data as any;

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
  };

  // Validate that a mask has been drawn
  const validateMaskExists = async (): Promise<boolean> => {
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
  };

  // Load result image
  const loadResultImage = async (resultImageUrl: string): Promise<void> => {
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

      img.onerror = (e) => {
        reject(new Error("Error loading result image"));
      };

      img.src = resultImageUrl;
    });
  };

  // File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      const uploadedFiles = await startUpload(Array.from(files));
      if (uploadedFiles && uploadedFiles.length > 0) {
        const file = uploadedFiles[0];

        // Set the image to the uploaded file URL
        setImage(file.url);

        toast({
          title: "Image uploaded successfully",
          description: "Your image is ready for editing.",
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
          <h2 className="text-xl font-semibold mb-4">Select an Image</h2>

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
              <div className="relative">
                <input
                  type="file"
                  id="file-upload"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileUpload}
                  accept=".jpg,.jpeg,.png,.webp"
                  disabled={isUploading}
                />
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={isUploading}
                >
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
                </Button>
              </div>

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
