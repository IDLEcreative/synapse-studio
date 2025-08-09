"use client";

import { useProjectUpdater } from "@/data/mutations";
import { queryKeys, useProject, useProjectMediaItems } from "@/data/queries";
import { type MediaItem, PROJECT_PLACEHOLDER } from "@/data/schema";
import {
  type MediaType,
  useProjectId,
  useVideoProjectStore,
} from "@/data/store";
import {
  ChevronDown,
  FilmIcon,
  FolderOpenIcon,
  GalleryVerticalIcon,
  ImageIcon,
  ImagePlusIcon,
  MusicIcon,
  LoaderCircleIcon,
  CloudUploadIcon,
  SparklesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  GridIcon,
  ListIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { MediaItemPanel } from "./media-panel";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { useEffect, useRef, useState } from "react";
import { uploadFile } from "@/lib/supabase";
import type { ClientUploadedFileData } from "uploadthing/types";
import { db } from "@/data/db";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { getMediaMetadata } from "@/lib/ffmpeg";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { cn } from "@/lib/utils";
import { WithTooltip } from "./ui/tooltip";

export default function LeftPanel() {
  const projectId = useProjectId();
  const { data: project = PROJECT_PLACEHOLDER } = useProject(projectId);
  const projectUpdate = useProjectUpdater(projectId);
  const [mediaType, setMediaType] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [sortOrder, setSortOrder] = useState<
    "newest" | "oldest" | "a-z" | "z-a"
  >("newest");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: allMediaItems = [], isLoading } =
    useProjectMediaItems(projectId);

  // Filter media items based on type and search query
  const mediaItems = allMediaItems.filter((item) => {
    const matchesType = mediaType === "all" || item.mediaType === mediaType;
    const matchesSearch =
      !searchQuery ||
      (typeof item.metadata?.title === "string" &&
        item.metadata.title
          .toLowerCase()
          .includes(searchQuery.toLowerCase())) ||
      (typeof item.metadata?.description === "string" &&
        item.metadata.description
          .toLowerCase()
          .includes(searchQuery.toLowerCase())) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const setProjectDialogOpen = useVideoProjectStore(
    (s) => s.setProjectDialogOpen,
  );
  const openGenerateDialog = useVideoProjectStore((s) => s.openGenerateDialog);
  const [isUploading, setIsUploading] = useState(false);

  // Focus search input when search is shown
  useEffect(() => {
    if (showSearch) searchInputRef.current?.focus();
  }, [showSearch]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsUploading(true);

    try {
      // Upload the file to Supabase
      const file = files[0];
      const fileUrl = await uploadFile(file);

      // Process the uploaded file
      const mediaType = file.type.split("/")[0];
      const outputType = mediaType === "audio" ? "music" : mediaType;

      const data: Omit<MediaItem, "id"> = {
        projectId,
        kind: "uploaded",
        createdAt: Date.now(),
        mediaType: outputType as MediaType,
        status: "completed",
        url: fileUrl,
      };

      const mediaId = await db.media.create(data);
      const media = await db.media.find(mediaId as string);

      if (media) {
        const mediaMetadata = await getMediaMetadata(media as MediaItem);
        await db.media
          .update(media.id, {
            ...media,
            metadata: mediaMetadata?.media || {},
          })
          .finally(() => {
            queryClient.invalidateQueries({
              queryKey: queryKeys.projectMediaItems(projectId),
            });
          });
      }

      toast({
        title: "File uploaded successfully",
        description: "Your file is now available in the gallery.",
      });
    } catch (err) {
      console.warn(`ERROR! ${err}`);
      toast({
        title: "Failed to upload file",
        description: "Please try again",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadComplete = async (
    files: ClientUploadedFileData<{ uploadedBy: string }>[],
  ) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const mediaType = file.type.split("/")[0];
      const outputType = mediaType === "audio" ? "music" : mediaType;

      const data: Omit<MediaItem, "id"> = {
        projectId,
        kind: "uploaded",
        createdAt: Date.now(),
        mediaType: outputType as MediaType,
        status: "completed",
        url: file.url,
      };

      const mediaId = await db.media.create(data);
      const media = await db.media.find(mediaId as string);

      if (media) {
        const mediaMetadata = await getMediaMetadata(media as MediaItem);
        await db.media
          .update(media.id, {
            ...media,
            metadata: mediaMetadata?.media || {},
          })
          .finally(() => {
            queryClient.invalidateQueries({
              queryKey: queryKeys.projectMediaItems(projectId),
            });
          });
      }
    }
  };

  // Sort media items based on selected order
  const sortedMediaItems = [...mediaItems].sort((a, b) => {
    switch (sortOrder) {
      case "newest":
        return (b.createdAt || 0) - (a.createdAt || 0);
      case "oldest":
        return (a.createdAt || 0) - (b.createdAt || 0);
      case "a-z":
        return (
          typeof a.metadata?.title === "string" ? a.metadata.title : a.id
        ).localeCompare(
          typeof b.metadata?.title === "string" ? b.metadata.title : b.id,
        );
      case "z-a":
        return (
          typeof b.metadata?.title === "string" ? b.metadata.title : b.id
        ).localeCompare(
          typeof a.metadata?.title === "string" ? a.metadata.title : a.id,
        );
      default:
        return 0;
    }
  });

  return (
    <div
      className={`flex flex-col float-panel ${isCollapsed ? "w-16" : "w-96"} transition-all duration-300 relative`}
    >
      {/* Collapse/Expand button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-1/2 transform -translate-y-1/2 bg-black border border-white/5 rounded-full p-1 z-10 hover:bg-white/5 transition-colors shadow-md"
        title={isCollapsed ? "Expand panel" : "Collapse panel"}
      >
        {isCollapsed ? (
          <ChevronRightIcon className="w-4 h-4 text-gray-300" />
        ) : (
          <ChevronLeftIcon className="w-4 h-4 text-gray-300" />
        )}
      </button>

      {/* Project header section */}
      <div
        className={`p-4 flex items-center ${isCollapsed ? "justify-center" : "gap-4"} border-b border-white/5 bg-black/50 backdrop-blur-sm`}
      >
        {isCollapsed ? (
          <Button
            className="text-gray-400 hover:text-gray-300 transition-colors"
            variant="ghost"
            size="sm"
            onClick={() => setProjectDialogOpen(true)}
            title="Project Settings"
          >
            <FilmIcon className="w-4 h-4" />
          </Button>
        ) : (
          <>
            <div className="flex w-full">
              <Accordion
                type="single"
                collapsible
                className="w-full"
                defaultValue="item-1"
              >
                <AccordionItem value="item-1" className="border-b-0">
                  <AccordionTrigger className="py-3 hover:bg-black/20 rounded-md px-3 transition-all group">
                    <div className="flex flex-row items-center gap-2">
                      <FilmIcon className="w-4 h-4 text-gray-400" />
                      <h2 className="text-sm font-semibold flex-1 text-gray-300 group-hover:text-white transition-all duration-300">
                        {project?.title || "Project Settings"}
                      </h2>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="border-b-0 px-3 pt-4 pb-2">
                    <div className="flex flex-col gap-5">
                      <div>
                        <label
                          htmlFor="projectName"
                          className="text-xs text-gray-400 mb-1.5 block font-medium"
                        >
                          Project Title
                        </label>
                        <Input
                          id="projectName"
                          name="name"
                          placeholder="untitled"
                          value={project.title}
                          onChange={(e) =>
                            projectUpdate.mutate({ title: e.target.value })
                          }
                          onBlur={(e) =>
                            projectUpdate.mutate({
                              title: e.target.value.trim(),
                            })
                          }
                          className="focus-visible:ring-0 bg-gray-900/50 border-white/5 hover:border-gray-700 transition-colors rounded-md"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="projectDescription"
                          className="text-xs text-gray-400 mb-1.5 block font-medium"
                        >
                          Description
                        </label>
                        <Textarea
                          id="projectDescription"
                          name="description"
                          placeholder="Describe your video"
                          className="resize-none focus-visible:ring-0 bg-gray-900/50 border-white/5 hover:border-gray-700 transition-colors rounded-md"
                          value={project.description}
                          rows={4}
                          onChange={(e) =>
                            projectUpdate.mutate({
                              description: e.target.value,
                            })
                          }
                          onBlur={(e) =>
                            projectUpdate.mutate({
                              description: e.target.value.trim(),
                            })
                          }
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            <div className="self-start">
              <Button
                className="mt-2 text-gray-400 hover:text-gray-300 transition-colors"
                variant="ghost"
                size="sm"
                onClick={() => setProjectDialogOpen(true)}
                title="Open Project"
              >
                <FolderOpenIcon className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Media gallery section */}
      <div className="flex-1 py-4 flex flex-col gap-4 border-b border-white/5 h-full overflow-hidden relative">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openGenerateDialog()}
              className="text-gray-400 hover:text-gray-300 hover:bg-gray-900/50 p-2 rounded-md"
              title="Generate Media"
            >
              <SparklesIcon className="w-4 h-4" />
            </Button>
            <Button
              variant={mediaType === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMediaType("all")}
              className={
                mediaType === "all"
                  ? "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 p-2 rounded-md"
                  : "text-gray-400 hover:text-gray-300 hover:bg-gray-900/50 p-2 rounded-md"
              }
              title="All Media"
            >
              <GalleryVerticalIcon className="w-4 h-4" />
            </Button>
            <Button
              variant={mediaType === "image" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMediaType("image")}
              className={
                mediaType === "image"
                  ? "bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 hover:text-purple-300 p-2 rounded-md"
                  : "text-gray-400 hover:text-gray-300 hover:bg-gray-900/50 p-2 rounded-md"
              }
              title="Images"
            >
              <ImageIcon className="w-4 h-4" />
            </Button>
            <Button
              variant={mediaType === "music" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMediaType("music")}
              className={
                mediaType === "music"
                  ? "bg-green-500/10 text-green-400 hover:bg-green-500/20 hover:text-green-300 p-2 rounded-md"
                  : "text-gray-400 hover:text-gray-300 hover:bg-gray-900/50 p-2 rounded-md"
              }
              title="Audio"
            >
              <MusicIcon className="w-4 h-4" />
            </Button>
            <Button
              variant={mediaType === "video" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMediaType("video")}
              className={
                mediaType === "video"
                  ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 p-2 rounded-md"
                  : "text-gray-400 hover:text-gray-300 hover:bg-gray-900/50 p-2 rounded-md"
              }
              title="Video"
            >
              <FilmIcon className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={isUploading}
              className="cursor-pointer disabled:cursor-default disabled:opacity-50 text-gray-400 hover:text-gray-300 hover:bg-gray-900/50 p-2 rounded-md"
              asChild
              title="Upload Media"
            >
              <label htmlFor="fileUploadButton">
                <Input
                  id="fileUploadButton"
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  multiple={false}
                  disabled={isUploading}
                  accept="image/*,audio/*,video/*"
                />
                {isUploading ? (
                  <LoaderCircleIcon className="w-4 h-4 animate-spin text-gray-400" />
                ) : (
                  <CloudUploadIcon className="w-4 h-4" />
                )}
              </label>
            </Button>
          </div>
        ) : (
          <>
            {/* Media gallery header */}
            <div className="flex flex-col gap-3 px-4">
              <div className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <GalleryVerticalIcon className="w-4 h-4 text-gray-400" />
                  <h2 className="text-sm font-semibold text-gray-300">
                    Media Gallery
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <WithTooltip tooltip="Search media">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowSearch(!showSearch);
                        if (!showSearch)
                          setTimeout(
                            () => searchInputRef.current?.focus(),
                            100,
                          );
                      }}
                      className="h-7 w-7 p-0 rounded-md text-gray-400 hover:text-gray-300 hover:bg-gray-900/50"
                    >
                      <SearchIcon className="w-3.5 h-3.5" />
                    </Button>
                  </WithTooltip>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openGenerateDialog()}
                    className="text-gray-400 hover:text-gray-300 hover:bg-gray-900/50 rounded-md"
                  >
                    <SparklesIcon className="w-4 h-4 mr-1.5" />
                    Generate
                  </Button>
                </div>
              </div>

              {/* Search bar */}
              {showSearch && (
                <div className="relative mb-1 mt-1">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <SearchIcon className="h-4 w-4 text-gray-200" />
                  </div>
                  <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search media..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-8 py-2 h-9 bg-gray-900/50 border-white/5 focus-visible:ring-0 hover:border-gray-700 rounded-md"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center"
                    >
                      <XIcon className="h-3.5 w-3.5 text-gray-200 hover:text-gray-300" />
                    </button>
                  )}
                </div>
              )}

              {/* Media type filters */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1 bg-gray-900/50 p-1 rounded-md border border-white/5">
                  <Button
                    variant={mediaType === "all" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setMediaType("all")}
                    className={cn(
                      "flex-1 rounded-md transition-all duration-200",
                      mediaType === "all"
                        ? "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300"
                        : "text-gray-400 hover:text-gray-300 hover:bg-gray-900/50",
                    )}
                  >
                    <GalleryVerticalIcon className="w-3.5 h-3.5 mr-1" />
                    All
                  </Button>
                  <Button
                    variant={mediaType === "image" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setMediaType("image")}
                    className={cn(
                      "flex-1 rounded-md transition-all duration-200",
                      mediaType === "image"
                        ? "bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 hover:text-purple-300"
                        : "text-gray-400 hover:text-gray-300 hover:bg-gray-900/50",
                    )}
                  >
                    <ImageIcon className="w-3.5 h-3.5 mr-1" />
                    Images
                  </Button>
                  <Button
                    variant={mediaType === "music" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setMediaType("music")}
                    className={cn(
                      "flex-1 rounded-md transition-all duration-200",
                      mediaType === "music"
                        ? "bg-green-500/10 text-green-400 hover:bg-green-500/20 hover:text-green-300"
                        : "text-gray-400 hover:text-gray-300 hover:bg-gray-900/50",
                    )}
                  >
                    <MusicIcon className="w-3.5 h-3.5 mr-1" />
                    Audio
                  </Button>
                  <Button
                    variant={mediaType === "video" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setMediaType("video")}
                    className={cn(
                      "flex-1 rounded-md transition-all duration-200",
                      mediaType === "video"
                        ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                        : "text-gray-400 hover:text-gray-300 hover:bg-gray-900/50",
                    )}
                  >
                    <FilmIcon className="w-3.5 h-3.5 mr-1" />
                    Video
                  </Button>
                </div>

                {/* Upload button */}
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isUploading}
                  className="cursor-pointer disabled:cursor-default disabled:opacity-50 text-gray-400 hover:text-gray-300 hover:bg-gray-900/50 rounded-md transition-all duration-200 w-full"
                  asChild
                >
                  <label htmlFor="fileUploadButton">
                    <Input
                      id="fileUploadButton"
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      multiple={false}
                      disabled={isUploading}
                      accept="image/*,audio/*,video/*"
                    />
                    {isUploading ? (
                      <LoaderCircleIcon className="w-4 h-4 animate-spin text-gray-400 mr-1.5" />
                    ) : (
                      <CloudUploadIcon className="w-4 h-4 mr-1.5" />
                    )}
                    Upload
                  </label>
                </Button>
              </div>
            </div>

            {/* Media content */}
            <MediaItemPanel
              data={sortedMediaItems}
              mediaType={mediaType}
              viewMode={viewMode}
              className="px-4 overflow-y-auto rounded-xl"
            />
          </>
        )}
      </div>
    </div>
  );
}
