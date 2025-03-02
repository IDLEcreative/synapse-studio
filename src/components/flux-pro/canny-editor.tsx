"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { fal } from "@/lib/fal";
import { 
  UndoIcon, RedoIcon, SparklesIcon,
  EyeIcon, EyeOffIcon, PlusIcon, TrashIcon
} from "lucide-react";

// Layer type definition
type Layer = {
  id: string;
  name: string;
  visible: boolean;
  canvas: HTMLCanvasElement;
};

interface CannyEditorProps {
  initialImage?: string | null;
  onComplete: (result: { url: string; metadata: any }) => void;
  supportLayers?: boolean;
}

export default function CannyEditor({ 
  initialImage, 
  onComplete,
  supportLayers = false
}: CannyEditorProps) {
  const [image, setImage] = useState<string | null>(initialImage || null);
  const [prompt, setPrompt] = useState("");
  const [edgeStrength, setEdgeStrength] = useState(0.5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Layers support
  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string>("");
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
      
      setLayers([baseLayer]);
      setActiveLayerId('base-layer');
      
      // Load initial image if available
      if (image && baseLayer.canvas) {
        const ctx = baseLayer.canvas.getContext('2d');
        if (ctx) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, baseCanvas.width, baseCanvas.height);
            compositeLayersToDisplay();
          };
          img.src = image;
        }
      }
    } else {
      // Non-layers mode initialization
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        
        // Set canvas dimensions
        canvas.width = 512;
        canvas.height = 512;
        
        // Load initial image if available
        if (image) {
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            const img = new Image();
            img.onload = () => {
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              
              // Add to history
              addToHistory(canvas.toDataURL());
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
    // Don't allow deleting the base layer
    if (id === 'base-layer') return;
    
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
      img.onload = () => {
        ctx.clearRect(0, 0, baseLayer.canvas.width, baseLayer.canvas.height);
        ctx.drawImage(img, 0, 0);
        compositeLayersToDisplay();
      };
      img.src = history[index];
    } else {
      // Load history into canvas for non-layers mode
      if (!canvasRef.current) return;
      
      const ctx = canvasRef.current.getContext('2d');
      
      if (!ctx) return;
      
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = history[index];
    }
  };
  
  // Generate with Flux Pro Canny
  const generateWithFluxProCanny = async () => {
    if (!prompt) return;
    
    let imageUrl: string | null = null;
    
    if (supportLayers) {
      if (!displayCanvasRef.current) return;
      
      // Get the composite image
      imageUrl = displayCanvasRef.current.toDataURL();
    } else {
      if (!canvasRef.current) return;
      
      // Get the image
      imageUrl = canvasRef.current.toDataURL();
    }
    
    if (!imageUrl) return;
    
    setIsGenerating(true);
    
    try {
      // Call the API with type assertion to bypass TypeScript errors
      const result = await fal.subscribe("fal-ai/flux-pro/v1/canny", {
        prompt,
        image_url: imageUrl,
        edge_strength: edgeStrength
      } as any) as unknown as { image: string };
      
      if (result.image) {
        if (supportLayers) {
          // Update the base layer with the result
          const baseLayer = layers.find(layer => layer.id === 'base-layer');
          if (baseLayer) {
            const ctx = baseLayer.canvas.getContext('2d');
            if (ctx) {
              const img = new Image();
              img.onload = () => {
                ctx.clearRect(0, 0, baseLayer.canvas.width, baseLayer.canvas.height);
                ctx.drawImage(img, 0, 0, baseLayer.canvas.width, baseLayer.canvas.height);
                
                // Update display
                compositeLayersToDisplay();
                
                // Add to history
                addToHistory(result.image);
                
                // Call onComplete with the result
                onComplete({
                  url: result.image,
                  metadata: {
                    prompt: prompt,
                    model: "fal-ai/flux-pro/v1/canny",
                    edgeStrength
                  }
                });
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
              img.onload = () => {
                ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
                ctx.drawImage(img, 0, 0, canvasRef.current!.width, canvasRef.current!.height);
                
                // Add to history
                addToHistory(result.image);
                
                // Call onComplete with the result
                onComplete({
                  url: result.image,
                  metadata: {
                    prompt: prompt,
                    model: "fal-ai/flux-pro/v1/canny",
                    edgeStrength
                  }
                });
              };
              img.src = result.image;
            }
          }
        }
      }
    } catch (error) {
      console.error("Error generating with Flux Pro Canny:", error);
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
                
                {layer.id !== 'base-layer' && (
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
            <h3 className="text-sm font-medium text-gray-300">Edge-Guided Generation</h3>
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
        
        <div className="mb-4">
          <label className="text-sm text-gray-300 mb-1 block">Edge Strength: {edgeStrength.toFixed(1)}</label>
          <Slider
            defaultValue={[edgeStrength]}
            value={[edgeStrength]}
            onValueChange={(value) => setEdgeStrength(value[0])}
            max={1}
            min={0}
            step={0.1}
            className="flex-1"
          />
        </div>
        
        <div className="relative flex-1 mb-4 bg-gray-800/30 rounded-lg overflow-hidden">
          {supportLayers ? (
            <canvas
              ref={displayCanvasRef}
              width={512}
              height={512}
              className="absolute inset-0 w-full h-full"
            />
          ) : (
            <canvas
              ref={canvasRef}
              width={512}
              height={512}
              className="absolute inset-0 w-full h-full"
            />
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
          placeholder="Describe what you want to generate using edge detection..."
          className="min-h-[100px] bg-gray-800/50 border-gray-700 resize-none mb-4"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        
        <Button
          className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/20 mt-auto"
          onClick={generateWithFluxProCanny}
          disabled={isGenerating || !prompt}
        >
          <SparklesIcon className="w-4 h-4 mr-1.5" />
          Generate
        </Button>
      </div>
    </div>
  );
}
