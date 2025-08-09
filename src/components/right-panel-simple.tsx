"use client";

import { memo, useState, useMemo } from "react";
import { useJobCreator } from "@/data/mutations";
import { useProject } from "@/data/queries";
import {
  type MediaType,
  useProjectId,
  useVideoProjectStore,
} from "@/data/store";
import { AVAILABLE_ENDPOINTS } from "@/lib/fal";
import {
  ImageIcon,
  VideoIcon,
  MicIcon,
  MusicIcon,
  XIcon,
  SparklesIcon,
} from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { LoadingIcon } from "./ui/icons";

// Simple media type selector
function MediaTypeSelector({
  value,
  onChange,
}: { value: string; onChange: (value: string) => void }) {
  const types = [
    { id: "image", icon: ImageIcon, label: "Image" },
    { id: "video", icon: VideoIcon, label: "Video" },
    { id: "voiceover", icon: MicIcon, label: "Voice" },
    { id: "music", icon: MusicIcon, label: "Music" },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {types.map((type) => (
        <button
          key={type.id}
          onClick={() => onChange(type.id)}
          className={cn(
            "p-3 rounded-lg border transition-colors",
            value === type.id
              ? "bg-blue-500/20 border-blue-500"
              : "bg-black/30 border-white/10 hover:border-white/20",
          )}
        >
          <type.icon className="w-5 h-5 mx-auto mb-1" />
          <div className="text-xs">{type.label}</div>
        </button>
      ))}
    </div>
  );
}

const RightPanelSimple = memo(function RightPanelSimple() {
  const { toast } = useToast();
  const projectId = useProjectId();
  const store = useVideoProjectStore();
  const {
    generateData,
    setGenerateData,
    endpointId,
    setEndpointId,
    generateDialogOpen,
    closeGenerateDialog,
  } = store;

  const mediaType = useVideoProjectStore((s) => s.generateMediaType);
  const setMediaType = useVideoProjectStore((s) => s.setGenerateMediaType);

  const { data: project } = useProject(projectId);

  const endpoints = useMemo(
    () => AVAILABLE_ENDPOINTS.filter((e) => e.category === mediaType),
    [mediaType],
  );

  const createJob = useJobCreator({
    projectId,
    endpointId,
    mediaType,
    input: { prompt: generateData.prompt },
  });

  const handleGenerate = async () => {
    if (!generateData.prompt?.trim()) {
      toast({ title: "Please enter a prompt", variant: "destructive" });
      return;
    }

    await createJob.mutateAsync(undefined, {
      onSuccess: () => {
        closeGenerateDialog();
        toast({ title: "Generation started" });
      },
      onError: () => {
        toast({ title: "Generation failed", variant: "destructive" });
      },
    });
  };

  const handleMediaTypeChange = (type: string) => {
    setMediaType(type as MediaType);
    const firstEndpoint = AVAILABLE_ENDPOINTS.find((e) => e.category === type);
    if (firstEndpoint) {
      setEndpointId(firstEndpoint.endpointId);
    }
  };

  if (!generateDialogOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-black/95 border-l border-white/10 p-4 z-50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Generate Media</h2>
        <Button variant="ghost" size="icon" onClick={closeGenerateDialog}>
          <XIcon className="w-5 h-5" />
        </Button>
      </div>

      <div className="space-y-4">
        <MediaTypeSelector value={mediaType} onChange={handleMediaTypeChange} />

        <Select value={endpointId} onValueChange={setEndpointId}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {endpoints.map((endpoint) => (
              <SelectItem key={endpoint.endpointId} value={endpoint.endpointId}>
                {endpoint.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Textarea
          placeholder="Describe what you want to generate..."
          className="min-h-[120px]"
          value={generateData.prompt}
          onChange={(e) => setGenerateData({ prompt: e.target.value })}
        />

        <Button
          className="w-full"
          onClick={handleGenerate}
          disabled={createJob.isPending || !generateData.prompt?.trim()}
        >
          {createJob.isPending ? (
            <LoadingIcon className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <SparklesIcon className="w-4 h-4 mr-2" />
          )}
          Generate {mediaType}
        </Button>
      </div>
    </div>
  );
});

export default RightPanelSimple;
