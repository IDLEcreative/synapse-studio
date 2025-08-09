"use client";

import { useProjectCreator } from "@/data/mutations";
import { queryKeys, useProjects } from "@/data/queries";
import type { AspectRatio, VideoProject } from "@/data/schema";
import { useVideoProjectStore } from "@/data/store";
import { useToast } from "@/hooks/use-toast";
import { cn, rememberLastProjectId } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import {
  FileVideoIcon,
  FolderOpenIcon,
  Film,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { LoadingIcon } from "./ui/icons";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import { Skeleton } from "./ui/skeleton";
import { Textarea } from "./ui/textarea";
import { WithTooltip } from "./ui/tooltip";
import { seedDatabase } from "@/data/seed";

type ProjectDialogProps = {} & Parameters<typeof Dialog>[0];

export function ProjectDialog({ onOpenChange, ...props }: ProjectDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [aspect, setAspect] = useState<AspectRatio>("16:9");
  const [searchQuery, setSearchQuery] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch existing projects
  const { data: projects = [], isLoading } = useProjects();

  // Filtered projects based on search query
  const filteredProjects = projects.filter(
    (project) =>
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description &&
        project.description.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  // Seed data with template project if empty
  useEffect(() => {
    if (projects.length === 0 && !isLoading) {
      seedDatabase().then(() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.projects });
      });
    }
  }, [projects, isLoading]);

  // Focus title input when dialog opens
  useEffect(() => {
    if (props.open) {
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, [props.open]);

  // Create project mutation
  const setProjectId = useVideoProjectStore((s) => s.setProjectId);
  const createProject = useProjectCreator();

  const setProjectDialogOpen = useVideoProjectStore(
    (s) => s.setProjectDialogOpen,
  );

  const handleSelectProject = (project: VideoProject) => {
    setProjectId(project.id);
    setProjectDialogOpen(false);
    rememberLastProjectId(project.id);

    toast({
      title: "Project opened",
      description: `Successfully opened "${project.title}"`,
    });
  };

  const handleOnOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setTitle("");
      setDescription("");
      setSearchQuery("");
    }
    onOpenChange?.(isOpen);
    setProjectDialogOpen(isOpen);
  };

  return (
    <Dialog {...props} onOpenChange={handleOnOpenChange}>
      <DialogContent className="flex flex-col max-w-4xl h-fit max-h-[600px] min-h-[420px] bg-black/90 border-white/10 shadow-xl rounded-lg backdrop-blur-md">
        <DialogHeader>
          <div className="flex flex-row items-center gap-3 mb-6">
            <div className="bg-primary p-2 rounded-md shadow-lg">
              <Film className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-blue-500">
              SYNAPSE STUDIO
            </span>
          </div>
          <DialogTitle className="sr-only">New Project</DialogTitle>
          <DialogDescription className="sr-only">
            Create a new or open an existing project
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-row gap-8 h-full">
          {/* New Project Form */}
          <div className="flex flex-col flex-1 gap-6">
            <h2 className="text-lg font-semibold flex flex-row gap-2 items-center">
              <FileVideoIcon className="w-6 h-6 text-blue-400 stroke-1" />
              Create New Project
            </h2>

            <div className="flex flex-col gap-4">
              <div className="space-y-1">
                <label
                  htmlFor="project-title"
                  className="text-xs text-gray-100 font-medium"
                >
                  Project Title:
                </label>
                <Input
                  id="project-title"
                  ref={titleInputRef}
                  placeholder="Enter a title for your project"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="focus:ring-1 focus:ring-blue-500/30"
                  aria-required="true"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="project-description"
                  className="text-xs text-gray-100 font-medium"
                >
                  Description:
                </label>
                <Textarea
                  id="project-description"
                  placeholder="Describe your project (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="resize-none focus:ring-1 focus:ring-blue-500/30"
                />
              </div>

              <div className="space-y-2">
                <h4 className="text-xs text-gray-300 font-medium">
                  Aspect Ratio:
                </h4>
                <div className="flex flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setAspect("16:9")}
                    className={cn(
                      "flex flex-col items-center relative h-auto py-3 px-4 transition-all duration-200",
                      aspect === "16:9"
                        ? "bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                        : "glass-button hover:bg-white/5",
                    )}
                    aria-pressed={aspect === "16:9"}
                  >
                    <div
                      className="w-12 h-[27px] border-2 rounded mb-1 flex items-center justify-center"
                      style={{
                        borderColor:
                          aspect === "16:9"
                            ? "rgb(147, 197, 253)"
                            : "rgb(107, 114, 128)",
                      }}
                    >
                      <span className="text-[10px]">16:9</span>
                    </div>
                    <span className="text-xs">Landscape</span>
                    {aspect === "16:9" && (
                      <div className="absolute -top-1 -right-1">
                        <CheckCircle2 className="w-4 h-4 text-blue-400" />
                      </div>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setAspect("9:16")}
                    className={cn(
                      "flex flex-col items-center relative h-auto py-3 px-4 transition-all duration-200",
                      aspect === "9:16"
                        ? "bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                        : "glass-button hover:bg-white/5",
                    )}
                    aria-pressed={aspect === "9:16"}
                  >
                    <div
                      className="w-[27px] h-12 border-2 rounded mb-1 flex items-center justify-center"
                      style={{
                        borderColor:
                          aspect === "9:16"
                            ? "rgb(147, 197, 253)"
                            : "rgb(107, 114, 128)",
                      }}
                    >
                      <span className="text-[10px]">9:16</span>
                    </div>
                    <span className="text-xs">Portrait</span>
                    {aspect === "9:16" && (
                      <div className="absolute -top-1 -right-1">
                        <CheckCircle2 className="w-4 h-4 text-blue-400" />
                      </div>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setAspect("1:1")}
                    className={cn(
                      "flex flex-col items-center relative h-auto py-3 px-4 transition-all duration-200",
                      aspect === "1:1"
                        ? "bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                        : "glass-button hover:bg-white/5",
                    )}
                    aria-pressed={aspect === "1:1"}
                  >
                    <div
                      className="w-10 h-10 border-2 rounded mb-1 flex items-center justify-center"
                      style={{
                        borderColor:
                          aspect === "1:1"
                            ? "rgb(147, 197, 253)"
                            : "rgb(107, 114, 128)",
                      }}
                    >
                      <span className="text-[10px]">1:1</span>
                    </div>
                    <span className="text-xs">Square</span>
                    {aspect === "1:1" && (
                      <div className="absolute -top-1 -right-1">
                        <CheckCircle2 className="w-4 h-4 text-blue-400" />
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-row items-end justify-end gap-3 mt-2">
              <Button
                onClick={() =>
                  createProject.mutate(
                    {
                      title,
                      description,
                      aspectRatio: aspect,
                    },
                    {
                      onSuccess: (projectId) => {
                        handleSelectProject({ id: projectId } as VideoProject);
                        toast({
                          title: "Project created",
                          description: "Your new project is ready to edit",
                        });
                      },
                    },
                  )
                }
                disabled={!title.trim() || createProject.isPending}
                className={cn(
                  "bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200",
                  "shadow-[0_0_15px_rgba(37,99,235,0.5)]",
                  "border border-blue-500",
                )}
              >
                {createProject.isPending ? (
                  <>
                    <LoadingIcon className="mr-2" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    <span>Create Project</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2 items-center">
            <Separator orientation="vertical" className="flex-1" />
            <span className="font-semibold text-gray-400">or</span>
            <Separator orientation="vertical" className="flex-1" />
          </div>

          {/* Existing Projects */}
          <div className="flex flex-col flex-1 gap-5">
            <h2 className="text-lg font-semibold flex flex-row gap-2 items-center">
              <FolderOpenIcon className="w-6 h-6 text-blue-400 stroke-1" />
              Open Existing Project
            </h2>

            {/* Search projects */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-transparent focus:ring-1 focus:ring-blue-500/30"
              />
            </div>

            <div className="flex flex-col gap-3 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
              {isLoading ? (
                // Loading skeletons
                <>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="w-full h-[80px] rounded-lg" />
                  ))}
                </>
              ) : filteredProjects.length === 0 ? (
                <div className="text-center text-sm text-gray-400 py-8 bg-black/30 rounded-lg border border-gray-800">
                  {searchQuery
                    ? "No matching projects found"
                    : "No projects found"}
                </div>
              ) : (
                // Project list
                filteredProjects.map((project) => (
                  <button
                    type="button"
                    key={project.id}
                    onClick={() => handleSelectProject(project)}
                    className={cn(
                      "w-full text-left p-4 rounded-lg",
                      "bg-black/40 hover:bg-blue-900/20 transition-all duration-200",
                      "border border-gray-800 hover:border-blue-500/30",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                      "group",
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-sm text-white group-hover:text-blue-300 transition-colors">
                        {project.title}
                      </h3>
                      <span className="text-xs px-2 py-0.5 bg-blue-500/30 text-blue-200 rounded-full">
                        {project.aspectRatio || "16:9"}
                      </span>
                    </div>

                    {project.description && (
                      <p className="text-sm text-gray-300 line-clamp-2 mt-1 group-hover:text-gray-200 transition-colors">
                        {project.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Today</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Last edited 2h ago</span>
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <p className="text-gray-400 text-sm mt-4 w-full text-center">
            Synapse Studio - Advanced AI Video Editing Platform
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
