"use client";

import { useProjectUpdater } from "@/data/mutations";
import { queryKeys, useProject, useProjectMediaItems } from "@/data/queries";
import { type MediaItem, PROJECT_PLACEHOLDER } from "@/data/schema";
import {
  type MediaType,
  useProjectId,
  useVideoProjectStore,
} from "@/data/store";
import { useHotkeys } from "react-hotkeys-hook";
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
  TagIcon,
  SlidersHorizontalIcon,
  BookmarkIcon,
  StarIcon,
  XIcon,
  KeyboardIcon,
} from "lucide-react";
import { MediaItemPanel } from "./media-panel";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useEffect, useRef, useState } from "react";
import { useUploadThing } from "@/lib/uploadthing";
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
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: allMediaItems = [], isLoading } =
    useProjectMediaItems(projectId);

  // Filter media items based on type and search query
  const mediaItems = allMediaItems.filter((item) => {
    const matchesType = mediaType === "all" || item.mediaType === mediaType;
    const matchesSearch =
      !searchQuery ||
      item.metadata?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.metadata?.description
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const setProjectDialogOpen = useVideoProjectStore(
    (s) => s.setProjectDialogOpen,
  );
  const openGenerateDialog = useVideoProjectStore((s) => s.openGenerateDialog);
  const { startUpload, isUploading } = useUploadThing("fileUploader");

  // Keyboard shortcuts
  useHotkeys(
    "ctrl+f, cmd+f",
    (e) => {
      e.preventDefault();
      setShowSearch(true);
      setTimeout(() => searchInputRef.current?.focus(), 100);
    },
    { enableOnFormTags: true },
  );

  useHotkeys(
    "escape",
    () => {
      if (showSearch && searchQuery) setSearchQuery("");
      else if (showSearch) setShowSearch(false);
    },
    { enableOnFormTags: true },
  );

  useHotkeys("ctrl+1, cmd+1", () => setMediaType("all"), {
    enableOnFormTags: true,
  });
  useHotkeys("ctrl+2, cmd+2", () => setMediaType("image"), {
    enableOnFormTags: true,
  });
  useHotkeys("ctrl+3, cmd+3", () => setMediaType("music"), {
    enableOnFormTags: true,
  });
  useHotkeys("ctrl+4, cmd+4", () => setMediaType("video"), {
    enableOnFormTags: true,
  });

  // Focus search input when search is shown
  useEffect(() => {
    if (showSearch) searchInputRef.current?.focus();
  }, [showSearch]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    try {
      const uploadedFiles = await startUpload(Array.from(files));
      if (uploadedFiles) await handleUploadComplete(uploadedFiles);
    } catch (err) {
      console.warn(`ERROR! ${err}`);
      toast({
        title: "Failed to upload file",
        description: "Please try again",
      });
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
        return (a.metadata?.title || a.id || "").localeCompare(
          b.metadata?.title || b.id || "",
        );
      case "z-a":
        return (b.metadata?.title || b.id || "").localeCompare(
          a.metadata?.title || a.id || "",
        );
      default:
        return 0;
    }
  });

  // Display the sort order text
  const getSortOrderText = () => {
    switch (sortOrder) {
      case "newest":
        return "Newest";
      case "oldest":
        return "Oldest";
      case "a-z":
        return "Name (A-Z)";
      case "z-a":
        return "Name (Z-A)";
      default:
        return "Newest";
    }
  };

  return (
    <div
      className={`flex flex-col float-panel ${isCollapsed ? "w-16" : "w-96"} transition-all duration-300 relative`}
    >
      {/* Keyboard shortcuts dialog */}
      {showKeyboardShortcuts && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="float-card rounded-xl p-5 w-full max-w-xs">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-blue-400 font-semibold flex items-center">
                <KeyboardIcon className="w-4 h-4 mr-2" />
                Keyboard Shortcuts
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowKeyboardShortcuts(false)}
                className="h-6 w-6 p-0 rounded-full hover:bg-white/10"
              >
                <XIcon className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Search</span>
                <span className="text-gray-400 font-mono bg-black/30 px-2 py-0.5 rounded">
                  Ctrl/⌘ + F
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">All Media</span>
                <span className="text-gray-400 font-mono bg-black/30 px-2 py-0.5 rounded">
                  Ctrl/⌘ + 1
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Images</span>
                <span className="text-gray-400 font-mono bg-black/30 px-2 py-0.5 rounded">
                  Ctrl/⌘ + 2
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Audio</span>
                <span className="text-gray-400 font-mono bg-black/30 px-2 py-0.5 rounded">
                  Ctrl/⌘ + 3
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Video</span>
                <span className="text-gray-400 font-mono bg-black/30 px-2 py-0.5 rounded">
                  Ctrl/⌘ + 4
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Close/Clear</span>
                <span className="text-gray-400 font-mono bg-black/30 px-2 py-0.5 rounded">
                  Esc
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

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
            className="btn-minimal text-blue-400 hover:text-blue-300 transition-colors rounded-xl"
            variant="outline"
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
                  <AccordionTrigger className="py-3 hover:bg-white/5 rounded-xl px-3 transition-all group">
                    <div className="flex flex-row items-center gap-2">
                      <div className="w-6 h-6 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                        <FilmIcon className="w-3.5 h-3.5" />
                      </div>
                      <h2 className="text-sm font-semibold flex-1 group-hover:text-blue-400 transition-all duration-300">
                        {project?.title || "Project Settings"}
                      </h2>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="border-b-0 px-3 pt-4 pb-2">
                    <div className="flex flex-col gap-5 float-card p-4 rounded-xl">
                      <div>
                        <label
                          htmlFor="projectName"
                          className="text-xs text-gray-300 mb-1.5 block font-medium flex items-center"
                        >
                          <span className="text-blue-400">Project Title</span>
                          <div className="ml-1 h-px flex-1 bg-gradient-to-r from-blue-500/10 to-transparent"></div>
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
                          className="focus-visible:ring-blue-500 bg-black/50 border-white/5 hover:border-blue-500/30 transition-colors rounded-xl"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="projectDescription"
                          className="text-xs text-gray-300 mb-1.5 block font-medium flex items-center"
                        >
                          <span className="text-blue-400">Description</span>
                          <div className="ml-1 h-px flex-1 bg-gradient-to-r from-blue-500/10 to-transparent"></div>
                        </label>
                        <Textarea
                          id="projectDescription"
                          name="description"
                          placeholder="Describe your video"
                          className="resize-none focus-visible:ring-blue-500 bg-black/50 border-white/5 hover:border-blue-500/30 transition-colors rounded-xl"
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
                className="mt-2 btn-minimal text-blue-400 hover:text-blue-300 transition-colors rounded-xl"
                variant="outline"
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
              className="hover:bg-blue-500/10 text-blue-400 hover:text-blue-300 p-2 rounded-xl"
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
                  ? "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 p-2 rounded-xl"
                  : "hover:bg-white/5 text-gray-400 hover:text-white p-2 rounded-xl"
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
                  ? "bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 hover:text-purple-300 p-2 rounded-xl"
                  : "hover:bg-white/5 text-gray-400 hover:text-white p-2 rounded-xl"
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
                  ? "bg-green-500/10 text-green-400 hover:bg-green-500/20 hover:text-green-300 p-2 rounded-xl"
                  : "hover:bg-white/5 text-gray-400 hover:text-white p-2 rounded-xl"
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
                  ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 p-2 rounded-xl"
                  : "hover:bg-white/5 text-gray-400 hover:text-white p-2 rounded-xl"
              }
              title="Video"
            >
              <FilmIcon className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={isUploading}
              className="cursor-pointer disabled:cursor-default disabled:opacity-50 hover:bg-white/5 text-gray-400 hover:text-white p-2 rounded-xl"
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
                  <LoaderCircleIcon className="w-4 h-4 animate-spin text-blue-400" />
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
                  <div className="w-6 h-6 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                    <GalleryVerticalIcon className="w-3.5 h-3.5" />
                  </div>
                  <h2 className="text-sm font-semibold text-blue-400">
                    Media Gallery
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <WithTooltip tooltip="Keyboard shortcuts">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowKeyboardShortcuts(true)}
                      className="h-7 w-7 p-0 rounded-lg hover:bg-white/5 text-gray-400 hover:text-gray-300"
                    >
                      <KeyboardIcon className="w-3.5 h-3.5" />
                    </Button>
                  </WithTooltip>
                  <WithTooltip tooltip="Search media">
                    <Button
                      variant={showSearch ? "default" : "ghost"}
                      size="sm"
                      onClick={() => {
                        setShowSearch(!showSearch);
                        if (!showSearch)
                          setTimeout(
                            () => searchInputRef.current?.focus(),
                            100,
                          );
                      }}
                      className={cn(
                        "h-7 w-7 p-0 rounded-lg",
                        showSearch
                          ? "bg-blue-500/10 text-blue-400"
                          : "hover:bg-white/5 text-gray-400 hover:text-gray-300",
                      )}
                    >
                      <SearchIcon className="w-3.5 h-3.5" />
                    </Button>
                  </WithTooltip>
                  <Button
                    variant={mediaItems.length > 0 ? "outline" : "default"}
                    size="sm"
                    onClick={() => openGenerateDialog()}
                    className={
                      mediaItems.length > 0
                        ? "btn-minimal text-blue-400 hover:text-blue-300 rounded-xl"
                        : "btn-accent rounded-xl"
                    }
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
                    <SearchIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search media..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-8 py-2 h-9 bg-black/30 border-white/5 focus-visible:ring-blue-500/50 rounded-xl"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center"
                    >
                      <XIcon className="h-3.5 w-3.5 text-gray-400 hover:text-gray-300" />
                    </button>
                  )}
                </div>
              )}

              {/* Media type filters */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1 bg-black/30 p-1 rounded-xl border border-white/5">
                  <Button
                    variant={mediaType === "all" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setMediaType("all")}
                    className={cn(
                      "flex-1 rounded-lg transition-all duration-200",
                      mediaType === "all"
                        ? "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300"
                        : "hover:bg-white/5 text-gray-400 hover:text-white",
                    )}
                  >
                    <GalleryVerticalIcon className="w-3.5 h-3.5 mr-1" />
                    All
                    <span className="ml-1 text-xs opacity-70">⌘1</span>
                  </Button>
                  <Button
                    variant={mediaType === "image" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setMediaType("image")}
                    className={cn(
                      "flex-1 rounded-lg transition-all duration-200",
                      mediaType === "image"
                        ? "bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 hover:text-purple-300"
                        : "hover:bg-white/5 text-gray-400 hover:text-white",
                    )}
                  >
                    <ImageIcon className="w-3.5 h-3.5 mr-1" />
                    Images
                    <span className="ml-1 text-xs opacity-70">⌘2</span>
                  </Button>
                  <Button
                    variant={mediaType === "music" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setMediaType("music")}
                    className={cn(
                      "flex-1 rounded-lg transition-all duration-200",
                      mediaType === "music"
                        ? "bg-green-500/10 text-green-400 hover:bg-green-500/20 hover:text-green-300"
                        : "hover:bg-white/5 text-gray-400 hover:text-white",
                    )}
                  >
                    <MusicIcon className="w-3.5 h-3.5 mr-1" />
                    Audio
                    <span className="ml-1 text-xs opacity-70">⌘3</span>
                  </Button>
                  <Button
                    variant={mediaType === "video" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setMediaType("video")}
                    className={cn(
                      "flex-1 rounded-lg transition-all duration-200",
                      mediaType === "video"
                        ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                        : "hover:bg-white/5 text-gray-400 hover:text-white",
                    )}
                  >
                    <FilmIcon className="w-3.5 h-3.5 mr-1" />
                    Video
                    <span className="ml-1 text-xs opacity-70">⌘4</span>
                  </Button>
                </div>

                {/* Upload and filter buttons */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isUploading}
                    className="cursor-pointer disabled:cursor-default disabled:opacity-50 hover:bg-white/5 text-gray-400 hover:text-white rounded-lg transition-all duration-200 flex-1"
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
                        <LoaderCircleIcon className="w-4 h-4 animate-spin text-blue-400 mr-1.5" />
                      ) : (
                        <CloudUploadIcon className="w-4 h-4 mr-1.5" />
                      )}
                      Upload
                    </label>
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-white/5 text-gray-400 hover:text-white rounded-lg transition-all duration-200 h-9 w-9 p-0"
                      >
                        <SlidersHorizontalIcon className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="float-panel border-white/5 rounded-xl w-48"
                    >
                      <div className="px-2 py-1.5 text-xs text-gray-400 border-b border-white/5">
                        Advanced Filters
                      </div>
                      <DropdownMenuItem className="rounded-lg focus:bg-white/5 gap-2">
                        <TagIcon className="w-3.5 h-3.5 text-blue-400" />
                        <span>Filter by Tags</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="rounded-lg focus:bg-white/5 gap-2">
                        <StarIcon className="w-3.5 h-3.5 text-yellow-400" />
                        <span>Favorites</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="rounded-lg focus:bg-white/5 gap-2">
                        <BookmarkIcon className="w-3.5 h-3.5 text-purple-400" />
                        <span>Bookmarked</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
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
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent h-12 pointer-events-none" />
      </div>
    </div>
  );
}
