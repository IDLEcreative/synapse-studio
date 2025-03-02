"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { fal } from "@/lib/fal";
import { 
  UndoIcon, RedoIcon, SparklesIcon,
  EyeIcon, EyeOffIcon, PlusIcon, TrashIcon,
  Paintbrush, Eraser
} from "lucide-react";

// Layer type definition
type Layer = {
  id: string;
  name: string;
  visible: boolean;
  canvas: HTMLCanvasElement;
};

interface FillEditorProps {
  initialImage?: string | null;
  onComplete: (result: { url: string; metadata: any }) => void;
  supportLayers?: boolean;
}

export default function FillEditor({ 
  initialImage, 
  onComplete,
  supportLayers = false
}: FillEditorProps) {
  const [image, setImage] = useState<string | null>(initialImage || null);
  const [prompt, setPrompt] = useState("");
  const [brushSize, setBrushSize] = useState(20);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [maskHistory, setMaskHistory] = useState<string[]>([]);
  const [maskHistoryIndex, setMaskHistoryIndex] = useState(-1);
  
  // Layers support
  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string>("");
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Initialize layers if supported
  useEffect(() => {
    if (supportLayers) {
      // Create base layer
      const baseCanvas = document.createElement('canvas');
      baseCanvas.width = 512;
      baseCanvas.height = 512;
      
      const baseLayer: Layer = {
        id: 'base-layer',
        name: 'Background',
        visible: true,
        canvas: baseCanvas
      };
      
      // Create mask layer
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = 512;
      maskCanvas.height = 512;
      
      const maskLayer: Layer = {
        id: 'mask-layer',
        name: 'Mask',
        visible: true,
        canvas: maskCanvas
      };
      
      setLayers([baseLayer, maskLayer]);
      setActiveLayerId('mask-layer');
      
      // Load initial image if available
      if (image && baseLayer.canvas) {
        const ctx = baseLayer.canvas.getContext('2d');
        if (ctx) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            ctx.drawImage(img, 0, 0, baseCanvas.width, baseCanvas.height);
            compositeLayersToDisplay();
          };
          img.onerror = () => {
            console.error("Error loading image, possibly due to CORS restrictions");
            // Create a fallback solid color
            ctx.fillStyle = '#333333';
            ctx.fillRect(0, 0, baseCanvas.width, baseCanvas.height);
            compositeLayersToDisplay();
          };
          img.src = image;
        }
      }
    } else {
      // Non-layers mode initialization
      if (canvasRef.current && maskCanvasRef.current) {
        const canvas = canvasRef.current;
        const maskCanvas = maskCanvasRef.current;
        
        // Set canvas dimensions
        canvas.width = 512;
        canvas.height = 512;
        maskCanvas.width = 512;
        maskCanvas.height = 512;
        
        // Load initial image if available
        if (image) {
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              
              try {
                // Add to history
                addToHistory(canvas.toDataURL());
              } catch (error) {
                console.error("Error creating dataURL:", error);
                // Handle the error gracefully
              }
            };
            img.onerror = () => {
              console.error("Error loading image, possibly due to CORS restrictions");
              // Create a fallback solid color
              ctx.fillStyle = '#333333';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              try {
                addToHistory(canvas.toDataURL());
              } catch (error) {
                console.error("Error creating dataURL:", error);
              }
            };
            img.src = image;
          }
        } else {
          // Clear canvas and add to history
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            addToHistory(canvas.toDataURL());
          }
        }
        
        // Clear mask canvas
        const maskCtx = maskCanvas.getContext('2d');
        if (maskCtx) {
          maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
          addToMaskHistory(maskCanvas.toDataURL());
        }
      }
    }
  }, [image, supportLayers]);
  
  // Composite all visible layers to the display canvas
  const compositeLayersToDisplay = () => {
    if (!displayCanvasRef.current) return;
    
    const displayCtx = displayCanvasRef.current.getContext('2d');
    if (!displayCtx) return;
    
    // Clear display canvas
    displayCtx.clearRect(0, 0, displayCanvasRef.current.width, displayCanvasRef.current.height);
    
    // Draw each visible layer in order
    layers.forEach(layer => {
      if (layer.visible) {
        displayCtx.drawImage(layer.canvas, 0, 0);
      }
    });
  };
  
  // Add a new layer
  const addLayer = () => {
    const newCanvas = document.createElement('canvas');
    newCanvas.width = 512;
    newCanvas.height = 512;
    
    const newLayer: Layer = {
      id: `layer-${Date.now()}`,
      name: `Layer ${layers.length + 1}`,
      visible: true,
      canvas: newCanvas
    };
    
    setLayers([...layers, newLayer]);
    setActiveLayerId(newLayer.id);
  };
  
  // Delete a layer
  const deleteLayer = (id: string) => {
    // Don't allow deleting the base layer or mask layer
    if (id === 'base-layer' || id === 'mask-layer') return;
    
    const newLayers = layers.filter(layer => layer.id !== id);
    setLayers(newLayers);
    
    // If the active layer was deleted, set a new active layer
    if (activeLayerId === id) {
      setActiveLayerId(newLayers[newLayers.length - 1].id);
    }
    
    compositeLayersToDisplay();
  };
  
  // Toggle layer visibility
  const toggleLayerVisibility = (id: string) => {
    const newLayers = layers.map(layer => {
      if (layer.id === id) {
        return { ...layer, visible: !layer.visible };
      }
      return layer;
    });
    
    setLayers(newLayers);
    compositeLayersToDisplay();
  };
  
  // History management
  const addToHistory = (dataUrl: string) => {
    // Remove any forward history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(dataUrl);
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };
  
  const addToMaskHistory = (dataUrl: string) => {
    // Remove any forward history if we're not at the end
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
    if (supportLayers) {
      // Load history into base layer for layers mode
      const baseLayer = layers.find(layer => layer.id === 'base-layer');
      if (!baseLayer) return;
      
      const ctx = baseLayer.canvas.getContext('2d');
      if (!ctx) return;
      
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.clearRect(0, 0, baseLayer.canvas.width, baseLayer.canvas.height);
        ctx.drawImage(img, 0, 0);
        compositeLayersToDisplay();
      };
      img.onerror = () => {
        console.error("Error loading image from history, possibly due to CORS restrictions");
      };
      img.src = history[index];
    } else {
      // Load history into canvas for non-layers mode
      if (!canvasRef.current) return;
      
      const ctx = canvasRef.current.getContext('2d');
      
      if (!ctx) return;
      
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
        ctx.drawImage(img, 0, 0);
      };
      img.onerror = () => {
        console.error("Error loading image from history, possibly due to CORS restrictions");
      };
      img.src = history[index];
    }
  };
  
  // Drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    
    const canvas = supportLayers 
      ? layers.find(layer => layer.id === 'mask-layer')?.canvas 
      : maskCanvasRef.current;
    
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    // Set drawing style
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (isErasing) {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#ffffff';
    }
    
    // Draw a dot at the starting point
    ctx.lineTo(x + 0.1, y + 0.1);
    ctx.stroke();
    
    if (supportLayers) {
      compositeLayersToDisplay();
    }
  };
  
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = supportLayers 
      ? layers.find(layer => layer.id === 'mask-layer')?.canvas 
      : maskCanvasRef.current;
    
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    ctx.lineTo(x, y);
    ctx.stroke();
    
    if (supportLayers) {
      compositeLayersToDisplay();
    }
  };
  
  const endDrawing = () => {
    setIsDrawing(false);
    
    const canvas = supportLayers 
      ? layers.find(layer => layer.id === 'mask-layer')?.canvas 
      : maskCanvasRef.current;
    
    if (!canvas) return;
    
    // Add to mask history
    addToMaskHistory(canvas.toDataURL());
  };
  
  const clearMask = () => {
    const canvas = supportLayers 
      ? layers.find(layer => layer.id === 'mask-layer')?.canvas 
      : maskCanvasRef.current;
    
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Add to mask history
    addToMaskHistory(canvas.toDataURL());
    
    if (supportLayers) {
      compositeLayersToDisplay();
    }
  };
  
  // Generate with Flux Pro Fill
  const generateWithFluxProFill = async () => {
    if (!prompt) return;
    
    // Debug information to help diagnose issues
    console.log("Starting Flux Pro Fill generation");
    console.log("Initial image:", initialImage);
    
    // Instead of trying to get dataURLs from potentially tainted canvases,
    // we'll use the original image URL if available, or a fallback approach
    
    // For the base image, use the original initialImage if available
    let imageUrl: string | null = initialImage || null;
    let maskDataUrl: string | null = null;
    
    try {
      // For the mask, we can still try to get a dataURL since we're drawing it ourselves
      // and it shouldn't be tainted
      if (supportLayers) {
        console.log("Using layers mode for mask");
        const maskLayer = layers.find(layer => layer.id === 'mask-layer');
        if (!maskLayer) {
          console.error("Mask layer not found");
          return;
        }
        
        try {
          // Create a new untainted canvas for the mask to avoid CORS issues
          const untaintedCanvas = document.createElement('canvas');
          untaintedCanvas.width = maskLayer.canvas.width;
          untaintedCanvas.height = maskLayer.canvas.height;
          const ctx = untaintedCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(maskLayer.canvas, 0, 0);
            try {
              maskDataUrl = untaintedCanvas.toDataURL();
              console.log("Successfully created mask dataURL");
            } catch (err) {
              console.error("Unable to create mask dataURL:", err);
              alert("Unable to process the mask. Please try drawing a new mask.");
              return;
            }
          }
        } catch (error) {
          console.error("Error creating mask dataURL:", error);
          alert("Unable to process the mask. Please try drawing a new mask.");
          return;
        }
      } else {
        console.log("Using standard mode for mask");
        if (!maskCanvasRef.current) {
          console.error("Mask canvas ref not found");
          return;
        }
        
        try {
          // Create a new untainted canvas for the mask to avoid CORS issues
          const untaintedCanvas = document.createElement('canvas');
          untaintedCanvas.width = maskCanvasRef.current.width;
          untaintedCanvas.height = maskCanvasRef.current.height;
          const ctx = untaintedCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(maskCanvasRef.current, 0, 0);
            try {
              maskDataUrl = untaintedCanvas.toDataURL();
              console.log("Successfully created mask dataURL");
            } catch (err) {
              console.error("Unable to create mask dataURL:", err);
              alert("Unable to process the mask. Please try drawing a new mask.");
              return;
            }
          }
        } catch (error) {
          console.error("Error creating mask dataURL:", error);
          alert("Unable to process the mask. Please try drawing a new mask.");
          return;
        }
      }
      
      // If we don't have an image URL from initialImage, we need to create a new image
      // This is a fallback approach that creates a simple colored background
      if (!imageUrl) {
        console.log("No initial image, creating fallback");
        const fallbackCanvas = document.createElement('canvas');
        fallbackCanvas.width = 512;
        fallbackCanvas.height = 512;
        const ctx = fallbackCanvas.getContext('2d');
        if (ctx) {
          // Create a gradient background as a fallback
          const gradient = ctx.createLinearGradient(0, 0, 512, 512);
          gradient.addColorStop(0, '#333333');
          gradient.addColorStop(1, '#666666');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 512, 512);
          imageUrl = fallbackCanvas.toDataURL();
          console.log("Created fallback image");
        }
      }
      
      if (!imageUrl || !maskDataUrl) {
        console.error("Missing image or mask URL", { imageUrl, maskDataUrl });
        alert("Unable to prepare images for processing. Please try again with a different image.");
        return;
      }
      
      console.log("Ready to call API with:", { 
        prompt, 
        imageUrl: imageUrl ? "present" : "missing", 
        maskDataUrl: maskDataUrl ? "present" : "missing" 
      });
    } catch (error) {
      console.error("Error preparing images for generation:", error);
      alert("An error occurred while preparing images. Please try again.");
      return;
    }
    
    setIsGenerating(true);
    
    try {
      console.log("Calling fal API...");
      // Call the API with type assertion to bypass TypeScript errors
      const result = await fal.subscribe("fal-ai/flux-pro/v1/fill", {
        prompt,
        image_url: imageUrl,
        mask_url: maskDataUrl
      } as any) as unknown as { image: string };
      
      console.log("API call successful, result:", result ? "received" : "empty");
      
      if (result && result.image) {
        console.log("Processing result image");
        if (supportLayers) {
          // Update the base layer with the result
          const baseLayer = layers.find(layer => layer.id === 'base-layer');
          if (baseLayer) {
            const ctx = baseLayer.canvas.getContext('2d');
            if (ctx) {
              const img = new Image();
              img.crossOrigin = "anonymous";
              img.onload = () => {
                console.log("Result image loaded successfully");
                ctx.clearRect(0, 0, baseLayer.canvas.width, baseLayer.canvas.height);
                ctx.drawImage(img, 0, 0, baseLayer.canvas.width, baseLayer.canvas.height);
                
                // Clear the mask layer
                const maskLayer = layers.find(layer => layer.id === 'mask-layer');
                if (maskLayer) {
                  const maskCtx = maskLayer.canvas.getContext('2d');
                  if (maskCtx) {
                    maskCtx.clearRect(0, 0, maskLayer.canvas.width, maskLayer.canvas.height);
                  }
                }
                
                // Update display
                compositeLayersToDisplay();
                
                try {
                  // Add to history
                  addToHistory(result.image);
                  console.log("Added to history");
                } catch (error) {
                  console.error("Error adding to history:", error);
                }
                
                // Call onComplete with the result
                onComplete({
                  url: result.image,
                  metadata: {
                    prompt: prompt,
                    model: "fal-ai/flux-pro/v1/fill"
                  }
                });
                console.log("Generation complete");
              };
              img.onerror = (e) => {
                console.error("Error loading result image:", e);
                setIsGenerating(false);
              };
              img.src = result.image;
            }
          }
        } else {
          // Update canvas with the result
          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            
            if (ctx) {
              const img = new Image();
              img.crossOrigin = "anonymous";
              img.onload = () => {
                console.log("Result image loaded successfully");
                ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
                ctx.drawImage(img, 0, 0, canvasRef.current!.width, canvasRef.current!.height);
                
                // Clear the mask canvas
                if (maskCanvasRef.current) {
                  const maskCtx = maskCanvasRef.current.getContext('2d');
                  if (maskCtx) {
                    maskCtx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
                  }
                }
                
                try {
                  // Add to history
                  addToHistory(result.image);
                  console.log("Added to history");
                } catch (error) {
                  console.error("Error adding to history:", error);
                }
                
                // Call onComplete with the result
                onComplete({
                  url: result.image,
                  metadata: {
                    prompt: prompt,
                    model: "fal-ai/flux-pro/v1/fill"
                  }
                });
                console.log("Generation complete");
              };
              img.onerror = (e) => {
                console.error("Error loading result image:", e);
                setIsGenerating(false);
              };
              img.src = result.image;
            }
          }
        }
      } else {
        console.error("No image in result:", result);
        alert("Failed to generate image. Please try again.");
        setIsGenerating(false);
      }
    } catch (error) {
      console.error("Error generating with Flux Pro Fill:", error);
      alert("Error generating image: " + (error instanceof Error ? error.message : "Unknown error"));
      setIsGenerating(false);
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="flex h-full">
      {/* Layers panel (if supported) */}
      {supportLayers && (
        <div className="w-64 border-r border-white/10 bg-gray-900/30 p-4 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-gray-300">Layers</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={addLayer}
            >
              <PlusIcon className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {layers.map(layer => (
              <div 
                key={layer.id}
                className={`flex items-center justify-between p-2 rounded-md mb-1 ${activeLayerId === layer.id ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-gray-800/50'}`}
                onClick={() => setActiveLayerId(layer.id)}
              >
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLayerVisibility(layer.id);
                    }}
                  >
                    {layer.visible ? (
                      <EyeIcon className="w-4 h-4" />
                    ) : (
                      <EyeOffIcon className="w-4 h-4 text-gray-500" />
                    )}
                  </Button>
                  <span className="ml-2 text-sm">{layer.name}</span>
                </div>
                
                {layer.id !== 'base-layer' && layer.id !== 'mask-layer' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteLayer(layer.id);
                    }}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Main editing area */}
      <div className="flex-1 flex flex-col p-4">
        <div className="flex justify-between mb-4">
          <div className="flex gap-2">
            <h3 className="text-sm font-medium text-gray-300">Fill & Inpaint</h3>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={undo}
              disabled={historyIndex <= 0}
            >
              <UndoIcon className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
            >
              <RedoIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant={isErasing ? "outline" : "default"}
              size="sm"
              onClick={() => setIsErasing(false)}
              className={!isErasing ? "bg-blue-500 hover:bg-blue-600" : ""}
            >
              <Paintbrush className="w-4 h-4 mr-1.5" />
              Paint
            </Button>
            <Button
              variant={isErasing ? "default" : "outline"}
              size="sm"
              onClick={() => setIsErasing(true)}
              className={isErasing ? "bg-blue-500 hover:bg-blue-600" : ""}
            >
              <Eraser className="w-4 h-4 mr-1.5" />
              Erase
            </Button>
          </div>
          
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs text-gray-400">Size:</span>
            <Slider
              defaultValue={[brushSize]}
              value={[brushSize]}
              onValueChange={(value) => setBrushSize(value[0])}
              max={50}
              min={1}
              step={1}
              className="flex-1"
            />
            <span className="text-xs text-gray-400 w-6 text-right">{brushSize}</span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={clearMask}
          >
            Clear Mask
          </Button>
        </div>
        
        <div className="relative flex-1 mb-4 bg-gray-800/30 rounded-lg overflow-hidden">
          {supportLayers ? (
            <canvas
              ref={displayCanvasRef}
              width={512}
              height={512}
              className="absolute inset-0 w-full h-full"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={endDrawing}
              onMouseLeave={endDrawing}
            />
          ) : (
            <>
              <canvas
                ref={canvasRef}
                width={512}
                height={512}
                className="absolute inset-0 w-full h-full"
              />
              <canvas
                ref={maskCanvasRef}
                width={512}
                height={512}
                className="absolute inset-0 w-full h-full"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={endDrawing}
                onMouseLeave={endDrawing}
              />
            </>
          )}
          
          {isGenerating && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
                  <SparklesIcon className="w-12 h-12 animate-pulse text-blue-400 mb-3 relative z-10" />
                </div>
                <p className="text-gray-200 font-medium">Generating...</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="w-80 p-4 flex flex-col">
        <h3 className="text-sm font-medium text-gray-300 mb-2">Prompt</h3>
        <Textarea
          placeholder="Describe what you want to generate in the masked area..."
          className="min-h-[100px] bg-gray-800/50 border-gray-700 resize-none mb-4"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        
        <Button
          className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/20 mt-auto"
          onClick={generateWithFluxProFill}
          disabled={isGenerating || !prompt}
        >
          <SparklesIcon className="w-4 h-4 mr-1.5" />
          Generate
        </Button>
      </div>
    </div>
  );
}
