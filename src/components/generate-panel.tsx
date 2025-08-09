"use client";

import { memo } from "react";
import { useGeneration } from "@/hooks/use-generation";
import { useVideoProjectStore } from "@/data/store";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  ImageIcon,
  VideoIcon,
  MicIcon,
  MusicIcon,
  XIcon,
  SparklesIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Minimal generation panel - just the essentials
 * No fancy UI, no complex features, just prompt -> generate
 */
const GeneratePanel = memo(function GeneratePanel() {
  const { generateDialogOpen, closeGenerateDialog } = useVideoProjectStore();
  const {
    prompt,
    mediaType,
    endpointId,
    isGenerating,
    availableEndpoints,
    generate,
    updatePrompt,
    updateMediaType,
    setEndpointId,
  } = useGeneration();

  if (!generateDialogOpen) return null;

  const mediaTypes = [
    { id: "image", icon: ImageIcon },
    { id: "video", icon: VideoIcon },
    { id: "voiceover", icon: MicIcon },
    { id: "music", icon: MusicIcon },
  ];

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-black border-l border-white/10 p-4 z-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Generate</h2>
        <Button variant="ghost" size="icon" onClick={closeGenerateDialog}>
          <XIcon className="w-4 h-4" />
        </Button>
      </div>

      {/* Media Type */}
      <div className="flex gap-1 mb-4">
        {mediaTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => updateMediaType(type.id)}
            className={cn(
              "flex-1 p-2 rounded",
              mediaType === type.id ? "bg-blue-500/20" : "bg-white/5",
            )}
          >
            <type.icon className="w-4 h-4 mx-auto" />
          </button>
        ))}
      </div>

      {/* Model */}
      <Select value={endpointId} onValueChange={setEndpointId}>
        <SelectTrigger className="mb-4">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableEndpoints.map((endpoint) => (
            <SelectItem key={endpoint.endpointId} value={endpoint.endpointId}>
              {endpoint.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Prompt */}
      <Textarea
        placeholder="Describe what you want..."
        className="mb-4 min-h-[100px]"
        value={prompt}
        onChange={(e) => updatePrompt(e.target.value)}
      />

      {/* Generate */}
      <Button
        className="w-full"
        onClick={generate}
        disabled={isGenerating || !prompt.trim()}
      >
        {isGenerating ? (
          "Generating..."
        ) : (
          <>
            <SparklesIcon className="w-4 h-4 mr-2" />
            Generate
          </>
        )}
      </Button>
    </div>
  );
});

export default GeneratePanel;
