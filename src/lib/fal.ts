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
  subscribe: async (endpointId: string, options: FalSubscribeOptions) => {
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
      throw new Error(
        `API request failed with status ${response.status}: ${errorText}`,
      );
    }

    const data = await response.json();
    return { data, requestId: data.requestId || "local-request-id" };
  },
  queue: {
    submit: async (endpointId: string, options: FalQueueOptions) => {
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
        throw new Error(
          `API request failed with status ${response.status}: ${errorText}`,
        );
      }

      const data = await response.json();
      console.log("falClient.queue.submit response:", data);
      return { request_id: data.requestId || "local-request-id" };
    },
    status: async (endpointId: string, options: FalStatusOptions) => {
      const response = await fetch(`/api/fal?requestId=${options.requestId}`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      return await response.json();
    },
    result: async (endpointId: string, options: FalResultOptions) => {
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

// FAL API types
export interface FalSubscribeOptions {
  input: Record<string, unknown>;
  logs?: boolean;
  onQueueUpdate?: (update: QueueUpdate) => void;
  pollInterval?: number;
  timeout?: number;
}

export interface FalQueueOptions {
  input: Record<string, unknown>;
  webhookUrl?: string;
}

export interface FalStatusOptions {
  requestId: string;
}

export interface FalResultOptions {
  requestId: string;
}

export interface QueueUpdate {
  status: string;
  logs?: Array<{ message: string; timestamp?: string }>;
  completed_at?: string;
  started_at?: string;
}

export interface FalResponse<T = unknown> {
  data: T;
  requestId: string;
}

export interface FalQueueResponse {
  request_id: string;
}

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
    description:
      "Premium image quality with enhanced detail, superior text rendering, better composition, and advanced prompt understanding. Produces more realistic outputs with improved lighting and reduced artifacts.",
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
    endpointId: "fal-ai/flux-pro/v1.1-ultra",
    label: "Flux Pro 1.1 Ultra",
    description:
      "Premium image quality with enhanced detail, superior text rendering, better composition, and advanced prompt understanding. Produces more realistic outputs with improved lighting and reduced artifacts.",
    cost: "",
    category: "image",
  },
];

// Combined endpoints for use in the Pro Studio
export const ALL_ENDPOINTS = [...AVAILABLE_ENDPOINTS, ...FLUX_PRO_TOOLS];
