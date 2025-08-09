import type { MediaItem, VideoTrack } from "@/data/schema";
import { GenerateData, LAST_PROJECT_ID_KEY } from "@/data/store";
import { type ClassValue, clsx } from "clsx";
import { ImageIcon, MicIcon, MusicIcon, VideoIcon } from "lucide-react";
import type { FunctionComponent } from "react";
import { twMerge } from "tailwind-merge";
import type { InputAsset } from "./fal";
import { logger } from "@/lib/logger";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractJson<T>(raw: string): T {
  const json = raw.replace("```json", "").replace("```", "");
  return JSON.parse(json);
}

export function rememberLastProjectId(projectId: string) {
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    document.cookie = `${LAST_PROJECT_ID_KEY}=${projectId}; max-age=31536000; path=/`;
  }
}

export function mapInputKey(
  input: Record<string, unknown>,
  inputMap: Record<string, string>,
): Record<string, unknown> {
  if (typeof input !== "object" || input === null) return input;
  const newInput: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    const newKey = inputMap[key] || key;
    if (!(newKey in newInput)) {
      newInput[newKey] = value;
    }
  }

  return newInput;
}

export const trackIcons: Record<
  VideoTrack["type"] | "image",
  FunctionComponent
> = {
  video: VideoIcon,
  music: MusicIcon,
  voiceover: MicIcon,
  image: ImageIcon,
};

export function resolveDuration(item: MediaItem): number | null {
  if (!item) return null;

  const metadata = item.metadata;
  if (
    metadata &&
    "duration" in metadata &&
    typeof metadata.duration === "number"
  ) {
    return metadata.duration * 1000;
  }

  const data = item.output;
  if (!data) return null;
  if ("seconds_total" in data && typeof data.seconds_total === "number") {
    return data.seconds_total * 1000;
  }
  if (
    "audio" in data &&
    typeof data.audio === "object" &&
    data.audio &&
    "duration" in data.audio &&
    typeof data.audio.duration === "number"
  ) {
    return data.audio.duration * 1000;
  }
  return null;
}

/**
 * Depending on the output type of the job, the URL of the audio/image/video
 * might be represented by different properties. This utility function resolves
 * the URL of the media based on the output data.
 */
export function resolveMediaUrl(item: MediaItem | undefined): string | null {
  if (!item) return null;

  let mediaUrl: string | null = null;

  if (item.kind === "uploaded") {
    mediaUrl = item.url;
  } else {
    const data = item.output;
    if (!data) return null;
    if (
      "images" in data &&
      Array.isArray(data.images) &&
      data.images.length > 0
    ) {
      mediaUrl = data.images[0].url;
    } else {
      const fileProperties = {
        image: 1,
        video: 1,
        audio: 1,
        audio_file: 1,
        audio_url: 1,
      };
      const property = Object.keys(data).find((key) => {
        const value = (data as any)[key];
        return (
          key in fileProperties &&
          value &&
          typeof value === "object" &&
          "url" in value
        );
      });
      if (property) {
        mediaUrl = ((data as any)[property] as any).url;
      }
    }
  }

  // If no URL was found, return null
  if (!mediaUrl) return null;

  // Check if the URL is from a domain that might cause CORS issues
  const corsProblematicDomains = ["fal.media", "v2.fal.media", "v3.fal.media"];

  try {
    const urlObj = new URL(mediaUrl);
    const shouldProxy = corsProblematicDomains.some((domain) =>
      urlObj.hostname.includes(domain),
    );

    // If the URL is from a problematic domain, route it through our proxy
    if (shouldProxy && typeof window !== "undefined") {
      const proxyUrl = `/api/media-proxy?url=${encodeURIComponent(mediaUrl)}`;
      logger.debug("Routing media through proxy", {
        mediaUrl,
        proxyUrl,
        operation: "media_url_resolution",
      });
      return proxyUrl;
    }
  } catch (error) {
    logger.error("Error parsing media URL", error, {
      operation: "media_url_resolution",
    });
  }

  return mediaUrl;
}

export function getAssetType(asset: InputAsset): "image" | "video" | "audio" {
  return typeof asset === "string" ? asset : asset.type;
}

export const assetKeyMap: Record<"image" | "video" | "audio", string> = {
  image: "image",
  video: "video_url",
  audio: "audio_url",
};

export function getAssetKey(asset: InputAsset): string {
  return typeof asset === "string"
    ? assetKeyMap[asset]
    : asset.key || assetKeyMap[asset.type];
}
