import { fal } from "@/lib/fal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "./db";
import { queryKeys } from "./queries";
import type { VideoProject } from "./schema";
import { logger } from "@/lib/logger";

export const useProjectUpdater = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (project: Partial<VideoProject>) =>
      db.projects.update(projectId, project),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
    },
  });
};

export const useProjectCreator = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (project: Omit<VideoProject, "id">) =>
      db.projects.create(project),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
};

export interface Veo2Input extends Record<string, unknown> {
  prompt: string;
  aspect_ratio?: string;
  duration?: string;
  image_url?: string;
}

export interface FluxProInput extends Record<string, unknown> {
  prompt: string;
  image_url?: string;
  mask_url?: string;
  width?: number;
  height?: number;
  steps?: number;
  guidance?: number;
  strength?: number;
  seed?: number;
  safety_tolerance?: number;
  output_format?: "jpeg" | "png" | "webp";
}

export type ModelInput = Record<string, unknown>;

type JobCreatorParams = {
  projectId: string;
  endpointId: string;
  mediaType: "video" | "image" | "voiceover" | "music";
  input: ModelInput;
};

export const useJobCreator = ({
  projectId,
  endpointId,
  mediaType,
  input,
}: JobCreatorParams) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      logger.debug("Submitting job with input", {
        endpointId,
        inputKeys: Object.keys(input || {}),
        operation: "job_creation",
      });

      return fal.queue.submit(endpointId, {
        input,
      });
    },
    onSuccess: async (data) => {
      logger.info("Job creation successful", {
        requestId: data.request_id,
        endpointId,
        operation: "job_creation",
      });

      await db.media.create({
        projectId,
        createdAt: Date.now(),
        mediaType,
        kind: "generated",
        endpointId,
        requestId: data.request_id,
        status: "pending",
        input,
      });

      await queryClient.invalidateQueries({
        queryKey: queryKeys.projectMediaItems(projectId),
      });
    },
    onError: (error) => {
      logger.error("Job creation failed", error, {
        endpointId,
        operation: "job_creation",
      });
    },
  });
};
