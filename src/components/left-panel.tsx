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
  ListPlusIcon,
  MicIcon,
  MusicIcon,
  LoaderCircleIcon,
  CloudUploadIcon,
  SparklesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PanelLeftIcon,
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
import { useState } from "react";
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

export default function LeftPanel() {
  const projectId = useProjectId();
  const { data: project = PROJECT_PLACEHOLDER } = useProject(projectId);
  const projectUpdate = useProjectUpdater(projectId);
  const [mediaType, setMediaType] = useState("all");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const queryClient = useQueryClient();

  const { data: mediaItems = [], isLoading } = useProjectMediaItems(projectId);
  const setProjectDialogOpen = useVideoProjectStore(
    (s) => s.setProjectDialogOpen,
  );
  const openGenerateDialog = useVideoProjectStore((s) => s.openGenerateDialog);

  const { startUpload, isUploading } = useUploadThing("fileUploader");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    try {
      const uploadedFiles = await startUpload(Array.from(files));
      if (uploadedFiles) {
        await handleUploadComplete(uploadedFiles);
      }
    } catch (err) {
      console.warn(`ERROR! ${err}`);
      toast({
        title: "Failed to upload file",
        description: "Please try again",
      });
    }
  };

  const handleUploadComplete = async (
    files: ClientUploadedFileData<{
      uploadedBy: string;
    }>[],
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

  return (
    <div className={`flex flex-col border-r border-white/10 ${isCollapsed ? 'w-16' : 'w-96'} bg-gray-900/30 transition-all duration-300 relative`}>
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-1/2 transform -translate-y-1/2 bg-gray-800 border border-white/10 rounded-full p-1 z-10 hover:bg-gray-700 transition-colors"
        title={isCollapsed ? "Expand panel" : "Collapse panel"}
      >
        {isCollapsed ? (
          <ChevronRightIcon className="w-4 h-4 text-gray-300" />
        ) : (
          <ChevronLeftIcon className="w-4 h-4 text-gray-300" />
        )}
      </button>
      <div className={`p-4 flex items-center ${isCollapsed ? 'justify-center' : 'gap-4'} border-b border-white/10 bg-gray-900/50`}>
        {isCollapsed ? (
          <Button
            className="hover:bg-blue-500/20 border-blue-500/30 text-blue-400 hover:text-blue-300 transition-colors"
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
              <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
                <AccordionItem value="item-1" className="border-b-0">
                  <AccordionTrigger className="py-3 hover:bg-blue-500/10 rounded-md px-3 transition-all group">
                    <div className="flex flex-row items-center gap-2">
                      <div className="w-6 h-6 flex items-center justify-center rounded-md bg-blue-500/20 text-blue-400">
                        <FilmIcon className="w-3.5 h-3.5" />
                      </div>
                      <h2 className="text-sm font-semibold flex-1 group-hover:text-blue-400 transition-all duration-300">
                        {project?.title || "Project Settings"}
                      </h2>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="border-b-0 px-3 pt-4 pb-2">
                    <div className="flex flex-col gap-5 glass-panel p-4 rounded-lg border border-white/5 shadow-lg shadow-black/20">
                      <div>
                        <label htmlFor="projectName" className="text-xs text-gray-300 mb-1.5 block font-medium flex items-center">
                          <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Project Title</span>
                          <div className="ml-1 h-px flex-1 bg-gradient-to-r from-blue-500/20 to-transparent"></div>
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
                            projectUpdate.mutate({ title: e.target.value.trim() })
                          }
                          className="focus-visible:ring-blue-500 bg-gray-800/50 border-gray-700 hover:border-blue-500/50 transition-colors"
                        />
                      </div>

                      <div>
                        <label htmlFor="projectDescription" className="text-xs text-gray-300 mb-1.5 block font-medium flex items-center">
                          <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Description</span>
                          <div className="ml-1 h-px flex-1 bg-gradient-to-r from-blue-500/20 to-transparent"></div>
                        </label>
                        <Textarea
                          id="projectDescription"
                          name="description"
                          placeholder="Describe your video"
                          className="resize-none focus-visible:ring-blue-500 bg-gray-800/50 border-gray-700 hover:border-blue-500/50 transition-colors"
                          value={project.description}
                          rows={4}
                          onChange={(e) =>
                            projectUpdate.mutate({ description: e.target.value })
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
                className="mt-2 hover:bg-blue-500/20 border-blue-500/30 text-blue-400 hover:text-blue-300 transition-colors"
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
      <div className="flex-1 py-4 flex flex-col gap-4 border-b border-white/10 h-full overflow-hidden relative">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openGenerateDialog()}
              className="hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 p-2"
              title="Generate Media"
            >
              <SparklesIcon className="w-4 h-4" />
            </Button>
            <Button
              variant={mediaType === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMediaType("all")}
              className={mediaType === "all" 
                ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 hover:text-blue-300 p-2" 
                : "hover:bg-white/5 text-gray-400 hover:text-white p-2"}
              title="All Media"
            >
              <GalleryVerticalIcon className="w-4 h-4" />
            </Button>
            <Button
              variant={mediaType === "image" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMediaType("image")}
              className={mediaType === "image" 
                ? "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 hover:text-purple-300 p-2" 
                : "hover:bg-white/5 text-gray-400 hover:text-white p-2"}
              title="Images"
            >
              <ImageIcon className="w-4 h-4" />
            </Button>
            <Button
              variant={mediaType === "music" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMediaType("music")}
              className={mediaType === "music" 
                ? "bg-green-500/20 text-green-400 hover:bg-green-500/30 hover:text-green-300 p-2" 
                : "hover:bg-white/5 text-gray-400 hover:text-white p-2"}
              title="Audio"
            >
              <MusicIcon className="w-4 h-4" />
            </Button>
            <Button
              variant={mediaType === "video" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMediaType("video")}
              className={mediaType === "video" 
                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 p-2" 
                : "hover:bg-white/5 text-gray-400 hover:text-white p-2"}
              title="Video"
            >
              <FilmIcon className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={isUploading}
              className="cursor-pointer disabled:cursor-default disabled:opacity-50 hover:bg-white/5 text-gray-400 hover:text-white p-2"
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
            <div className="flex flex-col gap-3 px-4">
              <div className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 flex items-center justify-center rounded-md bg-blue-500/20 text-blue-400">
                    <GalleryVerticalIcon className="w-3.5 h-3.5" />
                  </div>
                  <h2 className="text-sm font-semibold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                    Media Gallery
                  </h2>
                </div>
                <Button
                  variant={mediaItems.length > 0 ? "outline" : "default"}
                  size="sm"
                  onClick={() => openGenerateDialog()}
                  className={mediaItems.length > 0 
                    ? "border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300" 
                    : "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/20"}
                >
                  <SparklesIcon className="w-4 h-4 mr-1.5" />
                  Generate
                </Button>
              </div>
              
              <div className="flex items-center gap-1 bg-gray-800/30 p-1 rounded-lg border border-white/5">
                <Button
                  variant={mediaType === "all" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setMediaType("all")}
                  className={mediaType === "all" 
                    ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 hover:text-blue-300 flex-1" 
                    : "hover:bg-white/5 text-gray-400 hover:text-white flex-1"}
                >
                  <GalleryVerticalIcon className="w-3.5 h-3.5 mr-1" />
                  All
                </Button>
                <Button
                  variant={mediaType === "image" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setMediaType("image")}
                  className={mediaType === "image" 
                    ? "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 hover:text-purple-300 flex-1" 
                    : "hover:bg-white/5 text-gray-400 hover:text-white flex-1"}
                >
                  <ImageIcon className="w-3.5 h-3.5 mr-1" />
                  Images
                </Button>
                <Button
                  variant={mediaType === "music" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setMediaType("music")}
                  className={mediaType === "music" 
                    ? "bg-green-500/20 text-green-400 hover:bg-green-500/30 hover:text-green-300 flex-1" 
                    : "hover:bg-white/5 text-gray-400 hover:text-white flex-1"}
                >
                  <MusicIcon className="w-3.5 h-3.5 mr-1" />
                  Audio
                </Button>
                <Button
                  variant={mediaType === "video" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setMediaType("video")}
                  className={mediaType === "video" 
                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 flex-1" 
                    : "hover:bg-white/5 text-gray-400 hover:text-white flex-1"}
                >
                  <FilmIcon className="w-3.5 h-3.5 mr-1" />
                  Video
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isUploading}
                  className="cursor-pointer disabled:cursor-default disabled:opacity-50 hover:bg-white/5 text-gray-400 hover:text-white"
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
            </div>
            
            {!isLoading && mediaItems.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center gap-4 px-4 py-8 border border-white/5 mx-4 rounded-lg glass-panel bg-gradient-to-b from-gray-800/20 to-gray-900/30">
                <div className="p-5 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 rounded-full relative group hover:scale-105 transition-all duration-300 shadow-lg shadow-blue-500/10">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl opacity-70 group-hover:opacity-100 transition-opacity"></div>
                  <ImagePlusIcon className="w-10 h-10 text-blue-400 relative z-10 group-hover:text-blue-300 transition-colors" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-gray-200 mb-2 text-lg bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Empty Gallery</h3>
                  <p className="text-sm text-gray-300 max-w-[280px] leading-relaxed">
                    Create your image, audio and voiceover collection to compose your videos
                  </p>
                </div>
                <div className="flex gap-3 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 px-4"
                    asChild
                  >
                    <label htmlFor="emptyGalleryUpload">
                      <Input
                        id="emptyGalleryUpload"
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        multiple={false}
                        disabled={isUploading}
                        accept="image/*,audio/*,video/*"
                      />
                      <CloudUploadIcon className="w-4 h-4 mr-1.5" />
                      Upload
                    </label>
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => openGenerateDialog()}
                    className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/20 px-4"
                  >
                    <SparklesIcon className="w-4 h-4 mr-1.5" />
                    Generate
                  </Button>
                </div>
              </div>
            )}

            {mediaItems.length > 0 && (
              <div className="px-4 mt-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-400">
                    {mediaItems.length} item{mediaItems.length !== 1 ? 's' : ''} 
                    {mediaType !== 'all' ? ` • ${mediaType}` : ''}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-gray-400 hover:text-gray-300 hover:bg-white/5 h-6 px-2"
                    title="Sort by newest"
                  >
                    <span>Newest</span>
                    <ChevronDown className="w-3 h-3 ml-1 opacity-70" />
                  </Button>
                </div>
                <MediaItemPanel
                  data={mediaItems}
                  mediaType={mediaType}
                  className="overflow-y-auto rounded-md"
                />
              </div>
            )}
          </>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 to-transparent h-12 pointer-events-none" />
      </div>
    </div>
  );
}
