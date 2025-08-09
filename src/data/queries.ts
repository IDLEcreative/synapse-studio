import {
  keepPreviousData,
  type QueryClient,
  useQuery,
} from "@tanstack/react-query";
import { db } from "./db";
import {
  MediaItem,
  PROJECT_PLACEHOLDER,
  VideoKeyFrame,
  VideoTrack,
} from "./schema";

export const queryKeys = {
  projects: ["projects"],
  project: (projectId: string) => ["project", projectId],
  projectMediaItems: (projectId: string) => ["mediaItems", projectId],
  projectMedia: (projectId: string, jobId: string) => [
    "media",
    projectId,
    jobId,
  ],
  projectTracks: (projectId: string) => ["tracks", projectId],
  projectPreview: (projectId: string) => ["preview", projectId],
};

export const refreshVideoCache = async (
  queryClient: QueryClient,
  projectId: string,
) => {
  // Use refetchQueries instead of invalidateQueries to avoid excessive refetching
  // and leverage the existing cache during the refetch
  return Promise.all([
    queryClient.refetchQueries({
      queryKey: queryKeys.projectTracks(projectId),
      type: "active", // Only refetch active queries
    }),
    queryClient.refetchQueries({
      queryKey: queryKeys.projectPreview(projectId),
      type: "active",
    }),
    queryClient.refetchQueries({
      queryKey: queryKeys.projectMediaItems(projectId),
      type: "active",
    }),
    queryClient.refetchQueries({
      queryKey: ["frames"],
      type: "active",
    }),
  ]);
};

export const useProject = (projectId: string) => {
  return useQuery({
    queryKey: queryKeys.project(projectId),
    queryFn: async () =>
      (await db.projects.find(projectId)) ?? PROJECT_PLACEHOLDER,
    staleTime: 5 * 60 * 1000, // 5 minutes - projects don't change often
    gcTime: 10 * 60 * 1000, // 10 minutes in cache
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

export const useProjects = () => {
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: db.projects.list,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes in cache
    refetchOnMount: false,
    refetchOnWindowFocus: true, // Projects list should refresh on focus
  });
};

export const useProjectMediaItems = (projectId: string) => {
  return useQuery({
    queryKey: queryKeys.projectMediaItems(projectId),
    queryFn: () => db.media.mediaByProject(projectId),
    staleTime: 30 * 1000, // 30 seconds - media items change frequently during generation
    gcTime: 2 * 60 * 1000, // 2 minutes in cache
    refetchOnMount: false, // Reduce excessive refetching
    refetchOnWindowFocus: false, // Let the staleTime handle freshness
    placeholderData: keepPreviousData,
    refetchInterval: (query) => {
      // Auto-refresh if there are pending media items
      const data = query.state.data;
      const hasPending =
        data &&
        Array.isArray(data) &&
        data.some(
          (item) => item.status === "pending" || item.status === "running",
        );
      return hasPending ? 5000 : false; // 5 seconds if pending, otherwise no auto-refresh
    },
  });
};

export type VideoCompositionData = {
  tracks: VideoTrack[];
  frames: Record<string, VideoKeyFrame[]>;
  mediaItems: Record<string, MediaItem>;
};

export const EMPTY_VIDEO_COMPOSITION: VideoCompositionData = {
  tracks: [],
  frames: {},
  mediaItems: {},
};

export const useVideoComposition = (projectId: string) =>
  useQuery({
    queryKey: queryKeys.projectPreview(projectId),
    queryFn: async () => {
      const tracks = await db.tracks.tracksByProject(projectId);
      const frames = (
        await Promise.all(
          tracks.map((track) => db.keyFrames.keyFramesByTrack(track.id)),
        )
      ).flatMap((f) => f);
      const mediaItems = await db.media.mediaByProject(projectId);
      return {
        tracks,
        frames: Object.fromEntries(
          tracks.map((track) => [
            track.id,
            frames.filter((f) => f.trackId === track.id),
          ]),
        ),
        mediaItems: Object.fromEntries(
          mediaItems.map((item) => [item.id, item]),
        ),
      } satisfies VideoCompositionData;
    },
    staleTime: 15 * 1000, // 15 seconds - composition changes during editing
    gcTime: 60 * 1000, // 1 minute in cache
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    refetchInterval: (query) => {
      // Auto-refresh if there are incomplete media items in the composition
      const data = query.state.data;
      const hasIncompleteMedia =
        data?.mediaItems &&
        Object.values(data.mediaItems).some(
          (item) => item.status === "pending" || item.status === "running",
        );
      return hasIncompleteMedia ? 3000 : false; // 3 seconds if incomplete, otherwise no auto-refresh
    },
  });
