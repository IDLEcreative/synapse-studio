"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fal } from "@/lib/fal";
import { useProjectMediaItems } from "@/data/queries";
import { db } from "@/data/db";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  SparklesIcon, 
  ImageIcon, 
  PlayIcon, 
  PauseIcon, 
  SquareIcon,
  CheckIcon,
  XIcon,
  LoaderIcon,
  ArrowRightIcon
} from "lucide-react";

interface BatchProcessorProps {
  projectId: string;
  onComplete: (result: { url: string; metadata: any }) => void;
}

type BatchJob = {
  id: string;
  prompt: string;
  model: string;
  status: "pending" | "processing" | "completed" | "failed";
  result?: string;
  error?: string;
  params: Record<string, any>;
};

export default function BatchProcessor({ 
  projectId,
  onComplete
}: BatchProcessorProps) {
  const [batchPrompt, setBatchPrompt] = useState("");
  const [batchSize, setBatchSize] = useState(4);
  const [batchJobs, setBatchJobs] = useState<BatchJob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("setup");
  const [selectedModel, setSelectedModel] = useState("fal-ai/flux-pro/v1/redux");
  const [variationStrength, setVariationStrength] = useState(0.5);
  const [edgeStrength, setEdgeStrength] = useState(0.5);
  const [depthStrength, setDepthStrength] = useState(0.5);
  
  const { data: mediaItems = [] } = useProjectMediaItems(projectId);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Filter for images only
  const imageItems = mediaItems.filter(item => item.mediaType === "image");
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  
  useEffect(() => {
    // Set the first image as selected if there are images and none is selected
    if (imageItems.length > 0 && !selectedImageId) {
      setSelectedImageId(imageItems[0].id);
    }
  }, [imageItems, selectedImageId]);
  
  // Get the selected image URL
  const selectedImage = imageItems.find(item => item.id === selectedImageId);
  
  // Generate batch jobs
  const generateBatchJobs = () => {
    if (!selectedImage) {
      toast({
        title: "No image selected",
        description: "Please select an image to process",
        variant: "destructive",
      });
      return;
    }
    
    if (!batchPrompt) {
      toast({
        title: "No prompt provided",
        description: "Please enter a prompt for batch processing",
        variant: "destructive",
      });
      return;
    }
    
    // Create batch jobs
    const newJobs: BatchJob[] = [];
    
    for (let i = 0; i < batchSize; i++) {
      const params: Record<string, any> = {
        prompt: batchPrompt,
        image_url: selectedImage.url,
      };
      
      // Add model-specific parameters
      if (selectedModel.includes("redux")) {
        params.variation_strength = variationStrength;
      } else if (selectedModel.includes("canny")) {
        params.edge_strength = edgeStrength;
      } else if (selectedModel.includes("depth")) {
        params.depth_strength = depthStrength;
      }
      
      newJobs.push({
        id: `batch-${Date.now()}-${i}`,
        prompt: batchPrompt,
        model: selectedModel,
        status: "pending",
        params,
      });
    }
    
    setBatchJobs(newJobs);
    setActiveTab("results");
  };
  
  // Process batch jobs
  const processBatchJobs = async () => {
    if (batchJobs.length === 0) return;
    
    setIsProcessing(true);
    
    // Process jobs sequentially
    for (let i = 0; i < batchJobs.length; i++) {
      const job = batchJobs[i];
      
      // Skip completed or failed jobs
      if (job.status === "completed" || job.status === "failed") continue;
      
      // Update job status to processing
      setBatchJobs(prev => 
        prev.map(j => j.id === job.id ? { ...j, status: "processing" } : j)
      );
      
      try {
        // Call the API with type assertion to bypass TypeScript errors
        const result = await fal.subscribe(job.model, job.params as any) as unknown as { image: string };
        
        if (result.image) {
          // Update job status to completed
          setBatchJobs(prev => 
            prev.map(j => j.id === job.id ? { 
              ...j, 
              status: "completed", 
              result: result.image 
            } : j)
          );
          
          // Save to media gallery
          const data = {
            projectId,
            kind: "generated" as const,
            createdAt: Date.now(),
            mediaType: "image" as const,
            status: "completed" as const,
            url: result.image,
            metadata: {
              prompt: job.prompt,
              model: job.model,
              ...job.params
            }
          };
          
          await db.media.create(data);
          
          // Invalidate media items query to refresh the gallery
          queryClient.invalidateQueries({ queryKey: ["projectMediaItems", projectId] });
        }
      } catch (error) {
        console.error("Error processing batch job:", error);
        
        // Update job status to failed
        setBatchJobs(prev => 
          prev.map(j => j.id === job.id ? { 
            ...j, 
            status: "failed", 
            error: "Failed to process job" 
          } : j)
        );
      }
    }
    
    setIsProcessing(false);
  };
  
  // Stop batch processing
  const stopBatchProcessing = () => {
    setIsProcessing(false);
  };
  
  // Save a specific result
  const saveResult = (job: BatchJob) => {
    if (job.result) {
      onComplete({
        url: job.result,
        metadata: {
          prompt: job.prompt,
          model: job.model,
          ...job.params
        }
      });
      
      toast({
        title: "Result saved",
        description: "The selected result has been saved to your project",
      });
    }
  };
  
  return (
    <div className="flex h-full">
      <div className="flex-1 p-4 flex flex-col h-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="mb-4">
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>
          
          <TabsContent value="setup" className="flex-1 flex flex-col">
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Source Image</h3>
                  <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto p-1">
                    {imageItems.map(item => (
                      <div 
                        key={item.id}
                        className={`
                          relative rounded-md overflow-hidden border cursor-pointer
                          ${selectedImageId === item.id 
                            ? 'border-blue-500 ring-1 ring-blue-500' 
                            : 'border-white/10 hover:border-white/20'
                          }
                        `}
                        onClick={() => setSelectedImageId(item.id)}
                      >
                        <div className="aspect-square w-full bg-gray-800/50">
                          <img 
                            src={item.url} 
                            alt="Media item"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {selectedImageId === item.id && (
                          <div className="absolute top-2 right-2 bg-blue-500 rounded-full p-1">
                            <CheckIcon className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {imageItems.length === 0 && (
                      <div className="col-span-3 flex flex-col items-center justify-center h-[200px] text-center p-4 border border-dashed border-white/10 rounded-md">
                        <ImageIcon className="w-8 h-8 text-gray-500 mb-2" />
                        <p className="text-sm text-gray-500">No images available</p>
                        <p className="text-xs text-gray-600 mt-1">
                          Generate or upload images to your project first
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Batch Settings</h3>
                  <div className="flex flex-col gap-4 bg-gray-800/30 rounded-lg p-4 border border-white/10">
                    <div>
                      <Label htmlFor="batchSize" className="text-xs text-gray-400 mb-1 block">
                        Batch Size: {batchSize}
                      </Label>
                      <Slider
                        id="batchSize"
                        defaultValue={[batchSize]}
                        value={[batchSize]}
                        onValueChange={(value) => setBatchSize(value[0])}
                        max={10}
                        min={1}
                        step={1}
                        className="flex-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="modelSelect" className="text-xs text-gray-400 mb-1 block">
                        Model
                      </Label>
                      <Select 
                        value={selectedModel} 
                        onValueChange={setSelectedModel}
                      >
                        <SelectTrigger className="bg-gray-900/50 border-gray-700">
                          <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fal-ai/flux-pro/v1/redux">Flux Pro Redux</SelectItem>
                          <SelectItem value="fal-ai/flux-pro/v1.1/redux">Flux Pro Redux v1.1</SelectItem>
                          <SelectItem value="fal-ai/flux-pro/v1/canny">Flux Pro Canny</SelectItem>
                          <SelectItem value="fal-ai/flux-pro/v1/canny-fine-tuned">Flux Pro Canny (Fine-tuned)</SelectItem>
                          <SelectItem value="fal-ai/flux-pro/v1/depth">Flux Pro Depth</SelectItem>
                          <SelectItem value="fal-ai/flux-pro/v1/depth-fine-tuned">Flux Pro Depth (Fine-tuned)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Model-specific parameters */}
                    {selectedModel.includes("redux") && (
                      <div>
                        <Label htmlFor="variationStrength" className="text-xs text-gray-400 mb-1 block">
                          Variation Strength: {variationStrength.toFixed(1)}
                        </Label>
                        <Slider
                          id="variationStrength"
                          defaultValue={[variationStrength]}
                          value={[variationStrength]}
                          onValueChange={(value) => setVariationStrength(value[0])}
                          max={1}
                          min={0}
                          step={0.1}
                          className="flex-1"
                        />
                      </div>
                    )}
                    
                    {selectedModel.includes("canny") && (
                      <div>
                        <Label htmlFor="edgeStrength" className="text-xs text-gray-400 mb-1 block">
                          Edge Strength: {edgeStrength.toFixed(1)}
                        </Label>
                        <Slider
                          id="edgeStrength"
                          defaultValue={[edgeStrength]}
                          value={[edgeStrength]}
                          onValueChange={(value) => setEdgeStrength(value[0])}
                          max={1}
                          min={0}
                          step={0.1}
                          className="flex-1"
                        />
                      </div>
                    )}
                    
                    {selectedModel.includes("depth") && (
                      <div>
                        <Label htmlFor="depthStrength" className="text-xs text-gray-400 mb-1 block">
                          Depth Strength: {depthStrength.toFixed(1)}
                        </Label>
                        <Slider
                          id="depthStrength"
                          defaultValue={[depthStrength]}
                          value={[depthStrength]}
                          onValueChange={(value) => setDepthStrength(value[0])}
                          max={1}
                          min={0}
                          step={0.1}
                          className="flex-1"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Prompt</h3>
                  <Textarea
                    placeholder="Enter your prompt for batch processing..."
                    className="min-h-[200px] bg-gray-800/50 border-gray-700 resize-none"
                    value={batchPrompt}
                    onChange={(e) => setBatchPrompt(e.target.value)}
                  />
                </div>
                
                <div className="flex-1 flex items-end">
                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/20"
                    onClick={generateBatchJobs}
                    disabled={!selectedImage || !batchPrompt}
                  >
                    <SparklesIcon className="w-4 h-4 mr-1.5" />
                    Generate Batch Jobs
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="results" className="flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-gray-300">
                Batch Results ({batchJobs.filter(job => job.status === "completed").length}/{batchJobs.length} completed)
              </h3>
              
              <div className="flex gap-2">
                {isProcessing ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={stopBatchProcessing}
                  >
                    <SquareIcon className="w-4 h-4 mr-1.5" />
                    Stop Processing
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={processBatchJobs}
                    disabled={batchJobs.length === 0 || batchJobs.every(job => job.status === "completed")}
                    className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white"
                  >
                    <PlayIcon className="w-4 h-4 mr-1.5" />
                    Start Processing
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("setup")}
                >
                  <ArrowRightIcon className="w-4 h-4 mr-1.5 rotate-180" />
                  Back to Setup
                </Button>
              </div>
            </div>
            
            {batchJobs.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-white/10 rounded-md">
                <SparklesIcon className="w-8 h-8 text-gray-500 mb-2" />
                <p className="text-sm text-gray-500">No batch jobs created yet</p>
                <p className="text-xs text-gray-600 mt-1">
                  Go to the Setup tab to create batch jobs
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto p-1">
                {batchJobs.map(job => (
                  <div 
                    key={job.id}
                    className="flex flex-col border border-white/10 rounded-md overflow-hidden bg-gray-800/30"
                  >
                    <div className="aspect-square w-full bg-gray-900/50 relative">
                      {job.status === "pending" && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <p className="text-xs text-gray-400">Pending</p>
                        </div>
                      )}
                      
                      {job.status === "processing" && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <LoaderIcon className="w-6 h-6 text-blue-400 animate-spin" />
                        </div>
                      )}
                      
                      {job.status === "failed" && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <XIcon className="w-6 h-6 text-red-400" />
                        </div>
                      )}
                      
                      {job.status === "completed" && job.result && (
                        <img 
                          src={job.result} 
                          alt={job.prompt}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    
                    <div className="p-2">
                      <p className="text-xs text-gray-300 line-clamp-1">{job.prompt}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{job.model.split("/").pop()}</p>
                      
                      {job.status === "completed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-2 h-7 text-xs"
                          onClick={() => saveResult(job)}
                        >
                          <CheckIcon className="w-3 h-3 mr-1" />
                          Save Result
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
