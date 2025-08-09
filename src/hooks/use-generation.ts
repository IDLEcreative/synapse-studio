import { useState, useCallback } from "react";
import { useJobCreator } from "@/data/mutations";
import { useProjectId, useVideoProjectStore } from "@/data/store";
import { useToast } from "@/hooks/use-toast";
import { AVAILABLE_ENDPOINTS } from "@/lib/fal";

/**
 * Simplified hook for managing generation state and operations
 * Extracts complex logic from components
 */
export function useGeneration() {
  const { toast } = useToast();
  const projectId = useProjectId();
  const store = useVideoProjectStore();
  const {
    generateData,
    setGenerateData,
    endpointId,
    setEndpointId,
    generateMediaType: mediaType,
    setGenerateMediaType: setMediaType,
    closeGenerateDialog,
  } = store;

  const [isGenerating, setIsGenerating] = useState(false);

  // Get endpoints for current media type
  const availableEndpoints = AVAILABLE_ENDPOINTS.filter(
    (endpoint) => endpoint.category === mediaType,
  );

  // Prepare input for the current endpoint
  const prepareInput = useCallback(() => {
    const endpoint = AVAILABLE_ENDPOINTS.find(
      (e) => e.endpointId === endpointId,
    );
    return {
      prompt: generateData.prompt,
      ...(endpoint?.initialInput || {}),
      // Add any model-specific parameters from generateData
      ...Object.entries(generateData).reduce(
        (acc, [key, value]) => {
          if (key !== "prompt" && value !== undefined && value !== null) {
            acc[key] = value;
          }
          return acc;
        },
        {} as Record<string, any>,
      ),
    };
  }, [endpointId, generateData]);

  const createJob = useJobCreator({
    projectId,
    endpointId,
    mediaType,
    input: prepareInput(),
  });

  const generate = useCallback(async () => {
    if (!generateData.prompt?.trim()) {
      toast({
        title: "Missing prompt",
        description: "Please enter a description of what you want to generate.",
        variant: "destructive",
      });
      return false;
    }

    setIsGenerating(true);

    try {
      await createJob.mutateAsync(undefined);
      closeGenerateDialog();
      toast({
        title: "Generation started",
        description: `Your ${mediaType} is being generated.`,
      });
      return true;
    } catch (error) {
      console.error("Generation failed:", error);
      toast({
        title: "Generation failed",
        description: "Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsGenerating(false);
    }
  }, [generateData.prompt, mediaType, createJob, closeGenerateDialog, toast]);

  const updatePrompt = useCallback(
    (prompt: string) => {
      setGenerateData({ prompt });
    },
    [setGenerateData],
  );

  const updateMediaType = useCallback(
    (type: string) => {
      setMediaType(type as any);
      // Auto-select first endpoint for new media type
      const firstEndpoint = AVAILABLE_ENDPOINTS.find(
        (e) => e.category === type,
      );
      if (firstEndpoint) {
        setEndpointId(firstEndpoint.endpointId);
        setGenerateData(firstEndpoint.initialInput || {});
      }
    },
    [setMediaType, setEndpointId, setGenerateData],
  );

  return {
    // State
    prompt: generateData.prompt,
    mediaType,
    endpointId,
    isGenerating: isGenerating || createJob.isPending,
    availableEndpoints,

    // Actions
    generate,
    updatePrompt,
    updateMediaType,
    setEndpointId,
    setGenerateData,
  };
}
