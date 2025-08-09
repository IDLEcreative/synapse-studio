"use client";

import { useJobCreator } from "@/data/mutations";
import { queryKeys, useProject } from "@/data/queries";
import { useProjectId, useVideoProjectStore } from "@/data/store";
import type { MediaItem } from "@/data/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingIcon } from "@/components/ui/icons";
import { SparklesIcon, UploadIcon } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUploadThing } from "@/lib/uploadthing";
import type { ClientUploadedFileData } from "uploadthing/types";
import { useQueryClient } from "@tanstack/react-query";
import { db } from "@/data/db";

export default function FinetuneEditor() {
  const projectId = useProjectId();
  const { data: project } = useProject(projectId);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const videoProjectStore = useVideoProjectStore((s) => s);
  const { generateData, setGenerateData } = videoProjectStore;

  const { startUpload } = useUploadThing("fileUploader");

  // Initialize default values if not already set
  const finetuneData = {
    data_url: generateData.data_url || "",
    mode: generateData.mode || "character",
    finetune_comment: generateData.finetune_comment || "",
    iterations: generateData.iterations || 300,
    learning_rate: generateData.learning_rate || 0.00001,
    priority: generateData.priority || "quality",
    captioning: generateData.captioning !== false,
    trigger_word: generateData.trigger_word || "TOK",
    lora_rank: generateData.lora_rank || 32,
    finetune_type: generateData.finetune_type || "full",
  };

  const createJob = useJobCreator({
    projectId,
    endpointId: "fal-ai/flux-pro-trainer",
    mediaType: "image",
    input: {
      data_url: finetuneData.data_url,
      mode: finetuneData.mode,
      finetune_comment: finetuneData.finetune_comment,
      iterations: finetuneData.iterations,
      learning_rate: finetuneData.learning_rate,
      priority: finetuneData.priority,
      captioning: finetuneData.captioning,
      trigger_word: finetuneData.trigger_word,
      lora_rank: finetuneData.lora_rank,
      finetune_type: finetuneData.finetune_type,
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsUploading(true);

    try {
      const uploadedFiles = await startUpload(Array.from(files));
      if (uploadedFiles) {
        await handleUploadComplete(uploadedFiles);
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast({
        title: "Failed to upload file",
        description: "Please try again",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadComplete = async (
    files: ClientUploadedFileData<{
      uploadedBy: string;
    }>[],
  ) => {
    if (files.length > 0) {
      const file = files[0];

      // Set the data_url to the uploaded file URL
      setGenerateData({ data_url: file.url });

      toast({
        title: "File uploaded successfully",
        description:
          "Your training data has been uploaded and is ready for finetuning.",
      });

      // Store the file in the media gallery
      const data: Omit<MediaItem, "id"> = {
        projectId,
        kind: "uploaded",
        createdAt: Date.now(),
        mediaType: "image",
        status: "completed",
        url: file.url,
      };

      await db.media.create(data);

      // Refresh the media gallery
      queryClient.invalidateQueries({
        queryKey: queryKeys.projectMediaItems(projectId),
      });
    }
  };

  const handleStartFinetuning = async () => {
    if (!finetuneData.data_url) {
      toast({
        title: "Missing training data",
        description: "Please upload your training data file",
      });
      return;
    }

    if (!finetuneData.finetune_comment) {
      toast({
        title: "Missing finetune comment",
        description: "Please provide a descriptive note for your fine-tune",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await createJob.mutateAsync();
      toast({
        title: "Finetuning started",
        description:
          "Your model is now being fine-tuned. This may take some time.",
      });
    } catch (error) {
      console.error("Finetuning error:", error);
      toast({
        title: "Finetuning failed",
        description:
          "There was an error starting the finetuning process. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">FLUX.1 Finetune [pro]</h2>
      </div>

      <div className="grid gap-6">
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="file-upload"
            className="text-sm font-medium text-gray-300"
          >
            Training Data
          </Label>
          <div className="relative w-full">
            <input
              type="file"
              id="file-upload"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={handleFileUpload}
              accept=".zip,.rar,.7zip,.jpg,.jpeg,.png,.webp,.gif"
            />
            <div className="flex items-center gap-2 w-full">
              <div className="flex-1 bg-black/50 border border-white/5 rounded-xl px-4 py-2 text-sm text-gray-400 truncate">
                {finetuneData.data_url
                  ? finetuneData.data_url.split("/").pop() || "Uploaded file"
                  : "No file selected"}
              </div>
              <Button
                type="button"
                variant="outline"
                className="bg-black/50 border-white/5 hover:bg-blue-500/10 hover:border-blue-500/30 rounded-xl"
                disabled={isUploading}
              >
                {isUploading ? (
                  <LoadingIcon className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <UploadIcon className="w-4 h-4 mr-1.5" />
                )}
                Upload
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Upload individual images or a ZIP file with multiple training images
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label
            htmlFor="finetune_comment"
            className="text-sm font-medium text-gray-300"
          >
            Finetune Comment
          </Label>
          <Input
            id="finetune_comment"
            placeholder="Descriptive note for your fine-tune"
            className="bg-black/50 border-white/5 rounded-xl"
            value={finetuneData.finetune_comment}
            onChange={(e) =>
              setGenerateData({ finetune_comment: e.target.value })
            }
          />
          <p className="text-xs text-gray-400">
            Add a descriptive note to identify your fine-tune
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="mode" className="text-sm font-medium text-gray-300">
              Finetuning Mode
            </Label>
            <Select
              value={finetuneData.mode}
              onValueChange={(value) =>
                setGenerateData({
                  mode: value as "character" | "product" | "style" | "general",
                })
              }
            >
              <SelectTrigger
                id="mode"
                className="bg-black/50 border-white/5 rounded-xl"
              >
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="character">Character</SelectItem>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="style">Style</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-400">
              Determines the finetuning approach
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="finetune_type"
              className="text-sm font-medium text-gray-300"
            >
              Finetune Type
            </Label>
            <Select
              value={finetuneData.finetune_type}
              onValueChange={(value) =>
                setGenerateData({ finetune_type: value as "full" | "lora" })
              }
            >
              <SelectTrigger
                id="finetune_type"
                className="bg-black/50 border-white/5 rounded-xl"
              >
                <SelectValue placeholder="Select finetune type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full</SelectItem>
                <SelectItem value="lora">LoRA</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-400">Full or LoRA training</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label
            htmlFor="iterations"
            className="text-sm font-medium text-gray-300"
          >
            Iterations: {finetuneData.iterations}
          </Label>
          <Slider
            id="iterations"
            defaultValue={[finetuneData.iterations]}
            value={[finetuneData.iterations]}
            onValueChange={(value) => setGenerateData({ iterations: value[0] })}
            max={1000}
            min={100}
            step={50}
            className="flex-1"
          />
          <p className="text-xs text-gray-400">
            Defines training duration (default: 300)
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label
            htmlFor="learning_rate"
            className="text-sm font-medium text-gray-300"
          >
            Learning Rate: {finetuneData.learning_rate.toExponential(6)}
          </Label>
          <Slider
            id="learning_rate"
            defaultValue={[finetuneData.learning_rate]}
            value={[finetuneData.learning_rate]}
            onValueChange={(value) =>
              setGenerateData({ learning_rate: value[0] })
            }
            max={0.0001}
            min={0.000001}
            step={0.000001}
            className="flex-1"
          />
          <p className="text-xs text-gray-400">
            Learning rate for training (default: 1e-5 for full, 1e-4 for LoRA)
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="priority"
              className="text-sm font-medium text-gray-300"
            >
              Priority
            </Label>
            <Select
              value={finetuneData.priority}
              onValueChange={(value) =>
                setGenerateData({
                  priority: value as "speed" | "quality" | "high_res_only",
                })
              }
            >
              <SelectTrigger
                id="priority"
                className="bg-black/50 border-white/5 rounded-xl"
              >
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="speed">Speed</SelectItem>
                <SelectItem value="quality">Quality</SelectItem>
                <SelectItem value="high_res_only">
                  High Resolution Only
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-400">Speed vs. quality tradeoff</p>
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="lora_rank"
              className="text-sm font-medium text-gray-300"
            >
              LoRA Rank
            </Label>
            <Select
              value={String(finetuneData.lora_rank)}
              onValueChange={(value) =>
                setGenerateData({ lora_rank: parseInt(value) })
              }
            >
              <SelectTrigger
                id="lora_rank"
                className="bg-black/50 border-white/5 rounded-xl"
              >
                <SelectValue placeholder="Select LoRA rank" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="32">32</SelectItem>
                <SelectItem value="16">16</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-400">
              16 for efficiency, 32 for quality
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="captioning"
              className="text-sm font-medium text-gray-300"
            >
              Automatic Captioning
            </Label>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400">
                {finetuneData.captioning ? "Enabled" : "Disabled"}
              </span>
              <Switch
                id="captioning"
                checked={finetuneData.captioning}
                onCheckedChange={(checked) =>
                  setGenerateData({ captioning: checked })
                }
              />
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Enables/disables automatic image captioning
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label
            htmlFor="trigger_word"
            className="text-sm font-medium text-gray-300"
          >
            Trigger Word
          </Label>
          <Input
            id="trigger_word"
            placeholder="Unique word/phrase for captions"
            className="bg-black/50 border-white/5 rounded-xl"
            value={finetuneData.trigger_word}
            onChange={(e) => setGenerateData({ trigger_word: e.target.value })}
          />
          <p className="text-xs text-gray-400">
            Unique word/phrase used in captions to reference new concepts
          </p>
        </div>

        <Button
          variant="default"
          size="lg"
          onClick={handleStartFinetuning}
          disabled={
            isSubmitting ||
            !finetuneData.data_url ||
            !finetuneData.finetune_comment
          }
          className="mt-4 w-full btn-accent rounded-xl"
        >
          {isSubmitting ? (
            <LoadingIcon className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <SparklesIcon className="mr-2 h-4 w-4" />
          )}
          Start Finetuning
        </Button>
      </div>
    </div>
  );
}
