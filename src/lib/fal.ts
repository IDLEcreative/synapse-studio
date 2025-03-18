"use client";

import { createFalClient } from "@fal-ai/client";

// Safe localStorage access that works in both client and server environments
const getLocalStorageItem = (key: string): string | null => {
  if (typeof window !== "undefined") {
    return localStorage?.getItem(key);
  }
  return null;
};

// Create a client that uses the server-side proxy without exposing credentials
export const fal = createFalClient({
  // No credentials needed here - they will be handled by the server-side proxy
  proxyUrl: "/api/fal",
});

// Direct client for use with the @fal-ai/client package
export const falClient = {
  subscribe: async (endpointId: string, options: any) => {
    // Log the request for debugging
    console.log("falClient.subscribe request:", {
      endpoint: endpointId,
      input: options.input,
    });
    
    const response = await fetch("/api/fal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        endpoint: endpointId,
        input: options.input,
        logs: options.logs || false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API request failed:", errorText);
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return { data, requestId: data.requestId || "local-request-id" };
  },
  queue: {
    submit: async (endpointId: string, options: any) => {
      // Log the request for debugging
      console.log("falClient.queue.submit request:", {
        endpoint: endpointId,
        input: options.input,
      });
      
      const response = await fetch("/api/fal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: endpointId,
          input: options.input,
          webhookUrl: options.webhookUrl,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API request failed:", errorText);
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("falClient.queue.submit response:", data);
      return { request_id: data.requestId || "local-request-id" };
    },
    status: async (endpointId: string, options: any) => {
      const response = await fetch(`/api/fal?requestId=${options.requestId}`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      return await response.json();
    },
    result: async (endpointId: string, options: any) => {
      const response = await fetch(`/api/fal?requestId=${options.requestId}`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      return { data, requestId: options.requestId };
    },
  },
  storage: {
    upload: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`File upload failed with status ${response.status}`);
      }

      const data = await response.json();
      return data.url;
    },
  },
};

// For admin/developer use only - allows setting a custom key in localStorage
// This is not used for regular API calls
export const setCustomFalKey = (key: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("fal_key", key);
    console.log(
      "Custom FAL key set. This will be used for development purposes only.",
    );
  }
};

export type InputAsset =
  | "video"
  | "image"
  | "audio"
  | {
      type: "video" | "image" | "audio";
      key: string;
    };

export type ApiInfo = {
  endpointId: string;
  label: string;
  description: string;
  cost: string;
  inferenceTime?: string;
  inputMap?: Record<string, string>;
  inputAsset?: InputAsset[];
  initialInput?: Record<string, unknown>;
  cameraControl?: boolean;
  category: "image" | "video" | "music" | "voiceover";
  isProTool?: boolean;
};

// Flux Pro tools that will only be available in the Pro Studio
export const FLUX_PRO_TOOLS: ApiInfo[] = [
  {
    endpointId: "fal-ai/flux-pro-trainer",
    label: "FLUX.1 Finetune [pro]",
    description: "Next generation text-to-image model finetuning",
    cost: "",
    category: "image",
    isProTool: true,
  },
  {
    endpointId: "fal-ai/flux-pro/v1.1-ultra",
    label: "Flux Pro 1.1 Ultra",
    description: "Premium image quality with enhanced detail, superior text rendering, better composition, and advanced prompt understanding. Produces more realistic outputs with improved lighting and reduced artifacts.",
    cost: "",
    category: "image",
    isProTool: true,
  },
  // Redux models
  {
    endpointId: "fal-ai/flux-pro/v1.1-ultra/redux",
    label: "FLUX 1.1 Ultra Redux [pro]",
    description: "Next generation text-to-image model",
    cost: "",
    category: "image",
    inputAsset: ["image"],
    isProTool: true,
  },
  // Canny models
  {
    endpointId: "fal-ai/flux-pro/v1/canny",
    label: "FLUX.1 [pro] Canny",
    description: "Edge-guided image generation with structural conditioning",
    cost: "",
    category: "image",
    inputAsset: ["image"],
    isProTool: true,
  },
  {
    endpointId: "fal-ai/flux-pro/v1/canny-fine-tuned",
    label: "FLUX.1 [pro] Canny Fine-tuned",
    description: "Enhanced edge-guided image generation with improved detail",
    cost: "",
    category: "image",
    inputAsset: ["image"],
    isProTool: true,
  },
  // Depth models
  {
    endpointId: "fal-ai/flux-pro/v1/depth",
    label: "FLUX.1 [pro] Depth",
    description: "Depth-guided image generation for 3D-aware results",
    cost: "",
    category: "image",
    inputAsset: ["image"],
    isProTool: true,
  },
  {
    endpointId: "fal-ai/flux-pro/v1/depth-fine-tuned",
    label: "FLUX.1 [pro] Depth Fine-tuned",
    description: "Enhanced depth-guided image generation with improved detail",
    cost: "",
    category: "image",
    inputAsset: ["image"],
    isProTool: true,
  },
  // Fill models
  {
    endpointId: "fal-ai/flux-pro/v1/fill",
    label: "FLUX.1 [pro] Fill",
    description:
      "Advanced inpainting and outpainting with state-of-the-art results",
    cost: "",
    category: "image",
    inputAsset: ["image"],
    isProTool: true,
  },
  {
    endpointId: "fal-ai/flux-pro/v1/fill-fine-tuned",
    label: "FLUX.1 [pro] Fill Fine-tuned",
    description: "Enhanced inpainting with improved detail and coherence",
    cost: "",
    category: "image",
    inputAsset: ["image"],
    isProTool: true,
  },
];

// Regular endpoints available in the right panel
export const AVAILABLE_ENDPOINTS: ApiInfo[] = [
  {
    endpointId: "fal-ai/recraft-20b",
    label: "Recraft 20B",
    description: "State of the art Recraft 20B model by recraft.ai",
    cost: "",
    category: "image",
    initialInput: {
      image_size: "square_hd",
      style: "realistic_image"
    }
  },
  {
    endpointId: "fal-ai/flux-pro/v1.1-ultra",
    label: "Flux Pro 1.1 Ultra",
    description: "Premium image quality with enhanced detail, superior text rendering, better composition, and advanced prompt understanding. Produces more realistic outputs with improved lighting and reduced artifacts.",
    cost: "",
    category: "image",
  },
  {
    endpointId: "fal-ai/stable-diffusion-v35-large",
    label: "Stable Diffusion 3.5 Large",
    description: "Image quality, typography, complex prompt understanding",
    cost: "",
    category: "image",
  },
  {
    endpointId: "fal-ai/minimax/video-01-live",
    label: "Minimax Video 01 Live",
    description: "High quality video, realistic motion and physics",
    cost: "",
    category: "video",
    inputAsset: ["image"],
  },
  {
    endpointId: "fal-ai/hunyuan-video",
    label: "Hunyuan",
    description: "High visual quality, motion diversity and text alignment",
    cost: "",
    category: "video",
  },
  {
    endpointId: "fal-ai/kling-video/v1.5/pro",
    label: "Kling 1.5 Pro",
    description: "High quality video",
    cost: "",
    category: "video",
    inputAsset: ["image"],
  },
  {
    endpointId: "fal-ai/kling-video/v1/standard/text-to-video",
    label: "Kling 1.0 Standard",
    description: "High quality video",
    cost: "",
    category: "video",
    inputAsset: [],
    cameraControl: true,
  },
  {
    endpointId: "fal-ai/luma-dream-machine",
    label: "Luma Dream Machine 1.5",
    description: "High quality video",
    cost: "",
    category: "video",
    inputAsset: ["image"],
  },
  {
    endpointId: "fal-ai/minimax-music",
    label: "Minimax Music",
    description:
      "Advanced AI techniques to create high-quality, diverse musical compositions",
    cost: "",
    category: "music",
    inputAsset: [
      {
        type: "audio",
        key: "reference_audio_url",
      },
    ],
  },
  {
    endpointId: "fal-ai/mmaudio-v2",
    label: "MMAudio V2",
    description:
      "MMAudio generates synchronized audio given video and/or text inputs. It can be combined with video models to get videos with audio.",
    cost: "",
    inputAsset: ["video"],
    category: "video",
  },
  {
    endpointId: "fal-ai/sync-lipsync",
    label: "sync.so -- lipsync 1.8.0",
    description:
      "Generate realistic lipsync animations from audio using advanced algorithms for high-quality synchronization.",
    cost: "",
    inputAsset: ["video", "audio"],
    category: "video",
  },
  {
    endpointId: "fal-ai/stable-audio",
    label: "Stable Audio",
    description: "Stable Diffusion music creation with high-quality tracks",
    cost: "",
    category: "music",
  },
  {
    endpointId: "fal-ai/playht/tts/v3",
    label: "PlayHT TTS v3",
    description: "Fluent and faithful speech with flow matching",
    cost: "",
    category: "voiceover",
    initialInput: {
      voice: "Dexter (English (US)/American)",
    },
  },
  {
    endpointId: "fal-ai/playai/tts/dialog",
    label: "PlayAI Text-to-Speech Dialog",
    description:
      "Generate natural-sounding multi-speaker dialogues. Perfect for expressive outputs, storytelling, games, animations, and interactive media.",
    cost: "",
    category: "voiceover",
    inputMap: {
      prompt: "input",
    },
    initialInput: {
      voices: [
        {
          voice: "Jennifer (English (US)/American)",
          turn_prefix: "Speaker 1: ",
        },
        {
          voice: "Furio (English (IT)/Italian)",
          turn_prefix: "Speaker 2: ",
        },
      ],
    },
  },
  {
    endpointId: "fal-ai/f5-tts",
    label: "F5 TTS",
    description: "Fluent and faithful speech with flow matching",
    cost: "",
    category: "voiceover",
    initialInput: {
      ref_audio_url:
        "https://github.com/SWivid/F5-TTS/raw/21900ba97d5020a5a70bcc9a0575dc7dec5021cb/tests/ref_audio/test_en_1_ref_short.wav",
      ref_text: "Some call me nature, others call me mother nature.",
      model_type: "F5-TTS",
      remove_silence: true,
    },
  },
  {
    endpointId: "fal-ai/veo2",
    label: "Veo 2",
    description:
      "Veo creates videos with realistic motion and high quality output, up to 4K.",
    cost: "",
    category: "video",
  },
];

// Combined endpoints for use in the Pro Studio
export const ALL_ENDPOINTS = [...AVAILABLE_ENDPOINTS, ...FLUX_PRO_TOOLS];
