"use client";

import { useState, memo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fal, type QueueUpdate } from "@/lib/fal";
import { SparklesIcon, DownloadIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

// Minimal resolution options - only what's commonly used
const RESOLUTIONS = [
  { value: "square_hd", label: "Square (1024×1024)", aspectRatio: "1:1" },
  {
    value: "landscape_16_9",
    label: "Landscape (1024×576)",
    aspectRatio: "16:9",
  },
  { value: "portrait_9_16", label: "Portrait (576×1024)", aspectRatio: "9:16" },
];

export interface FluxProSimpleProps {
  onComplete: (result: { url: string; metadata: any }) => void;
}

const FluxProSimple = memo(function FluxProSimple({
  onComplete,
}: FluxProSimpleProps) {
  const [prompt, setPrompt] = useState("");
  const [resolution, setResolution] = useState("landscape_16_9");
  const [numImages, setNumImages] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImages([]);

    try {
      const selectedRes = RESOLUTIONS.find((r) => r.value === resolution);

      const result = await fal.subscribe("fal-ai/flux-pro/v1.1-ultra", {
        input: {
          prompt: prompt.trim(),
          aspect_ratio: (selectedRes?.aspectRatio || "16:9") as
            | "21:9"
            | "16:9"
            | "4:3"
            | "1:1"
            | "3:4"
            | "9:16"
            | "9:21",
          num_images: numImages,
          enable_safety_checker: true,
          safety_tolerance: "2" as "1" | "2" | "3" | "4" | "5" | "6",
          output_format: "jpeg",
        },
        logs: true,
        onQueueUpdate: (update: QueueUpdate) => {
          if (update.status === "IN_PROGRESS") {
            update.logs?.forEach((log) => console.log(log.message));
          }
        },
      });

      if (result.data?.images && result.data.images.length > 0) {
        const images = (
          result.data as { images: Array<{ url: string }> }
        ).images.map((img) => img.url);
        setGeneratedImages(images);

        onComplete({
          url: images[0],
          metadata: {
            prompt: prompt,
            model: "fal-ai/flux-pro/v1.1-ultra",
            seed: result.data.seed,
          },
        });
      } else {
        setError("No images were generated. Please try again.");
      }
    } catch (err) {
      console.error("Error generating with Flux Pro:", err);
      setError("An error occurred during generation. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `flux-pro-${Date.now()}.jpeg`;
    a.click();
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4">
      <div className="space-y-4">
        <div>
          <Label className="text-sm text-gray-300 mb-2 block">Prompt</Label>
          <Textarea
            placeholder="Describe the image you want to generate..."
            className="min-h-[100px] bg-gray-800/50 border-gray-700"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <div>
          <Label className="text-sm text-gray-300 mb-2 block">Resolution</Label>
          <Select value={resolution} onValueChange={setResolution}>
            <SelectTrigger className="bg-gray-800/50 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RESOLUTIONS.map((res) => (
                <SelectItem key={res.value} value={res.value}>
                  {res.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <Label className="text-sm text-gray-300">Number of Images</Label>
            <span className="text-sm text-gray-400">{numImages}</span>
          </div>
          <Slider
            value={[numImages]}
            onValueChange={(value) => setNumImages(value[0])}
            max={4}
            min={1}
            step={1}
          />
        </div>

        <Button
          className="w-full"
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
        >
          {isGenerating ? (
            "Generating..."
          ) : (
            <>
              <SparklesIcon className="w-4 h-4 mr-2" />
              Generate Image
            </>
          )}
        </Button>

        {error && (
          <div className="p-3 bg-red-900/30 border border-red-700 rounded-md text-red-400 text-sm">
            {error}
          </div>
        )}
      </div>

      {generatedImages.length > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-200">
            Generated Images
          </h3>

          {generatedImages.map((img, index) => (
            <div key={index} className="relative">
              <img
                src={img}
                alt={`Generated ${index + 1}`}
                className="w-full rounded-lg"
              />
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => handleDownload(img)}
              >
                <DownloadIcon className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default FluxProSimple;
