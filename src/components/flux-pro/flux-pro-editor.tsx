"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { fal, ApiInfo } from "@/lib/fal";
import {
  SparklesIcon,
  ImageIcon,
  DownloadIcon,
  BookmarkIcon,
  ClockIcon,
  WandIcon,
  LightbulbIcon,
  LayoutIcon,
  SlidersIcon,
  XIcon,
  PlusIcon,
  InfoIcon,
  RefreshCwIcon,
  CopyIcon,
  SaveIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Resolution options (combining image size and aspect ratio)
const RESOLUTION_OPTIONS = [
  // Square formats
  {
    value: "square_hd",
    label: "Square HD (1024×1024)",
    aspectRatio: "1:1",
    resolution: "1024×1024",
  },
  {
    value: "square",
    label: "Square (512×512)",
    aspectRatio: "1:1",
    resolution: "512×512",
  },

  // Landscape formats
  {
    value: "landscape_16_9_hd",
    label: "Landscape 16:9 HD (1920×1080)",
    aspectRatio: "16:9",
    resolution: "1920×1080",
  },
  {
    value: "landscape_16_9",
    label: "Landscape 16:9 (1024×576)",
    aspectRatio: "16:9",
    resolution: "1024×576",
  },
  {
    value: "landscape_3_2",
    label: "Landscape 3:2 (1024×683)",
    aspectRatio: "3:2",
    resolution: "1024×683",
  },
  {
    value: "landscape_4_3",
    label: "Landscape 4:3 (1024×768)",
    aspectRatio: "4:3",
    resolution: "1024×768",
  },
  {
    value: "landscape_21_9",
    label: "Ultrawide 21:9 (1920×820)",
    aspectRatio: "21:9",
    resolution: "1920×820",
  },

  // Portrait formats
  {
    value: "portrait_9_16_hd",
    label: "Portrait 9:16 HD (1080×1920)",
    aspectRatio: "9:16",
    resolution: "1080×1920",
  },
  {
    value: "portrait_9_16",
    label: "Portrait 9:16 (576×1024)",
    aspectRatio: "9:16",
    resolution: "576×1024",
  },
  {
    value: "portrait_2_3",
    label: "Portrait 2:3 (683×1024)",
    aspectRatio: "2:3",
    resolution: "683×1024",
  },
  {
    value: "portrait_3_4",
    label: "Portrait 3:4 (768×1024)",
    aspectRatio: "3:4",
    resolution: "768×1024",
  },
  {
    value: "portrait_9_21",
    label: "Tall 9:21 (384×896)",
    aspectRatio: "9:21",
    resolution: "384×896",
  },
];

// Style presets for quick selection
const STYLE_PRESETS = [
  {
    value: "photorealistic",
    label: "Photorealistic",
    description: "Highly detailed and realistic imagery",
    prompt: "photorealistic, highly detailed, sharp focus, 8k resolution",
  },
  {
    value: "cinematic",
    label: "Cinematic",
    description: "Movie-like quality with dramatic lighting",
    prompt:
      "cinematic, film grain, dramatic lighting, shallow depth of field, movie still",
  },
  {
    value: "anime",
    label: "Anime",
    description: "Japanese animation style",
    prompt: "anime style, vibrant colors, clean lines, detailed",
  },
  {
    value: "digital_art",
    label: "Digital Art",
    description: "Modern digital illustration",
    prompt:
      "digital art, vibrant colors, detailed, illustration, trending on artstation",
  },
  {
    value: "oil_painting",
    label: "Oil Painting",
    description: "Traditional oil painting style",
    prompt: "oil painting, textured, detailed brushstrokes, artistic, canvas",
  },
  {
    value: "watercolor",
    label: "Watercolor",
    description: "Soft watercolor painting style",
    prompt:
      "watercolor painting, soft colors, flowing, artistic, paper texture",
  },
  {
    value: "3d_render",
    label: "3D Render",
    description: "Computer-generated 3D imagery",
    prompt:
      "3D render, octane render, global illumination, subsurface scattering, highly detailed",
  },
  {
    value: "pixel_art",
    label: "Pixel Art",
    description: "Retro pixel-based art style",
    prompt: "pixel art, 16-bit, retro game style, clear pixels, vibrant",
  },
  {
    value: "fantasy",
    label: "Fantasy",
    description: "Magical and fantastical imagery",
    prompt:
      "fantasy art, magical, ethereal, detailed, mystical, vibrant colors",
  },
  {
    value: "cyberpunk",
    label: "Cyberpunk",
    description: "Futuristic dystopian aesthetic",
    prompt:
      "cyberpunk, neon lights, futuristic, dystopian, high tech, low life, detailed",
  },
];

// Safety tolerance options
const SAFETY_TOLERANCE_OPTIONS = [
  { value: "1", label: "Very Strict" },
  { value: "2", label: "Strict (Default)" },
  { value: "3", label: "Moderate" },
  { value: "4", label: "Permissive" },
  { value: "5", label: "Very Permissive" },
  { value: "6", label: "Experimental" },
];

// Safety tolerance descriptions with proper TypeScript typing
const SAFETY_TOLERANCE_DESCRIPTIONS: Record<string, string> = {
  "1": "Highest level of filtering, may over-filter some safe content",
  "2": "Standard filtering level, balances safety and creativity",
  "3": "Moderate filtering, allows more creative freedom",
  "4": "Minimal filtering, prioritizes creative freedom",
  "5": "Very minimal filtering, may allow some edge cases",
  "6": "Experimental mode with minimal safety filtering. Use with caution as it may generate content that violates terms of service.",
};

// Output format options
const OUTPUT_FORMAT_OPTIONS = [
  { value: "jpeg", label: "JPEG" },
  { value: "png", label: "PNG" },
];

// Prompt template categories
const PROMPT_TEMPLATE_CATEGORIES = [
  { value: "all", label: "All Templates" },
  { value: "landscapes", label: "Landscapes" },
  { value: "portraits", label: "Portraits" },
  { value: "concepts", label: "Concept Art" },
  { value: "products", label: "Product Shots" },
  { value: "abstract", label: "Abstract" },
];

// Prompt templates
const PROMPT_TEMPLATES = [
  {
    id: "landscape1",
    category: "landscapes",
    title: "Epic Mountain Vista",
    prompt:
      "Epic mountain landscape at sunset, golden hour lighting, majestic peaks, crystal clear lake reflection, dramatic clouds, photorealistic, 8k, ultra detailed",
    thumbnail:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&q=80",
  },
  {
    id: "landscape2",
    category: "landscapes",
    title: "Tropical Beach",
    prompt:
      "Tropical beach paradise, crystal clear turquoise water, white sand, palm trees, sunny day, photorealistic, 8k, ultra detailed",
    thumbnail:
      "https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&q=80",
  },
  {
    id: "portrait1",
    category: "portraits",
    title: "Professional Portrait",
    prompt:
      "Professional portrait of a person in business attire, neutral background, studio lighting, high quality, photorealistic, 8k, ultra detailed",
    thumbnail:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&q=80",
  },
  {
    id: "portrait2",
    category: "portraits",
    title: "Artistic Portrait",
    prompt:
      "Artistic portrait with dramatic lighting, shallow depth of field, moody atmosphere, cinematic, photorealistic, 8k, ultra detailed",
    thumbnail:
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&q=80",
  },
  {
    id: "concept1",
    category: "concepts",
    title: "Futuristic City",
    prompt:
      "Futuristic city skyline, neon lights, flying vehicles, cyberpunk style, night scene, rain, reflections, detailed, 8k, ultra detailed",
    thumbnail:
      "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&q=80",
  },
  {
    id: "concept2",
    category: "concepts",
    title: "Fantasy Castle",
    prompt:
      "Fantasy castle on a floating island, magical atmosphere, waterfalls, dragons flying in the distance, sunset lighting, detailed, 8k, ultra detailed",
    thumbnail:
      "https://images.unsplash.com/photo-1515890435782-59a5bb6ec191?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&q=80",
  },
  {
    id: "product1",
    category: "products",
    title: "Product Showcase",
    prompt:
      "Professional product photography of a sleek modern device on a minimalist background, studio lighting, commercial quality, photorealistic, 8k, ultra detailed",
    thumbnail:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&q=80",
  },
  {
    id: "product2",
    category: "products",
    title: "Food Photography",
    prompt:
      "Gourmet food photography, professional lighting, shallow depth of field, appetizing, commercial quality, photorealistic, 8k, ultra detailed",
    thumbnail:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&q=80",
  },
  {
    id: "abstract1",
    category: "abstract",
    title: "Fluid Abstract",
    prompt:
      "Abstract fluid art, vibrant colors, flowing patterns, high contrast, artistic, detailed, 8k, ultra detailed",
    thumbnail:
      "https://images.unsplash.com/photo-1541701494587-cb58502866ab?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&q=80",
  },
  {
    id: "abstract2",
    category: "abstract",
    title: "Geometric Abstract",
    prompt:
      "Abstract geometric composition, bold colors, sharp lines, minimalist style, detailed, 8k, ultra detailed",
    thumbnail:
      "https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&q=80",
  },
];

// Prompt enhancement suggestions
const PROMPT_ENHANCEMENT_SUGGESTIONS = [
  { type: "detail", text: "highly detailed" },
  { type: "detail", text: "intricate details" },
  { type: "detail", text: "ultra realistic" },
  { type: "detail", text: "8k resolution" },
  { type: "detail", text: "sharp focus" },
  { type: "lighting", text: "dramatic lighting" },
  { type: "lighting", text: "soft lighting" },
  { type: "lighting", text: "golden hour" },
  { type: "lighting", text: "studio lighting" },
  { type: "style", text: "photorealistic" },
  { type: "style", text: "cinematic" },
  { type: "style", text: "digital art" },
  { type: "style", text: "oil painting" },
  { type: "style", text: "watercolor" },
  { type: "composition", text: "rule of thirds" },
  { type: "composition", text: "wide angle" },
  { type: "composition", text: "portrait shot" },
  { type: "composition", text: "landscape view" },
];

// Type for prompt history items
interface PromptHistoryItem {
  id: string;
  prompt: string;
  negativePrompt: string;
  timestamp: number;
  thumbnail?: string;
}

interface FluxProEditorProps {
  onComplete: (result: { url: string; metadata: any }) => void;
  proTools?: ApiInfo[];
}

export default function FluxProEditor({
  onComplete,
  proTools,
}: FluxProEditorProps) {
  // State for form inputs
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [resolution, setResolution] = useState<string>("landscape_16_9");
  const [numImages, setNumImages] = useState<number>(1);
  const [enableSafetyChecker, setEnableSafetyChecker] = useState<boolean>(true);
  const [safetyTolerance, setSafetyTolerance] = useState<string>("2");
  const [outputFormat, setOutputFormat] = useState<string>("jpeg");
  const [seed, setSeed] = useState<number | null>(null);
  const [useSeed, setUseSeed] = useState<boolean>(false);
  const [rawMode, setRawMode] = useState<boolean>(false);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);

  // State for prompt builder
  const [subject, setSubject] = useState("");
  const [action, setAction] = useState("");
  const [setting, setSetting] = useState("");
  const [lighting, setLighting] = useState("");
  const [style, setStyle] = useState("");
  const [mood, setMood] = useState("");
  const [details, setDetails] = useState("");

  // State for prompt templates
  const [templateCategory, setTemplateCategory] = useState("all");
  const [promptHistory, setPromptHistory] = useState<PromptHistoryItem[]>([]);
  const [showPromptEnhancer, setShowPromptEnhancer] = useState(false);

  // State for generation
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>("simple");

  // Refs
  const resultContainerRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  // Load prompt history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("promptHistory");
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory) as PromptHistoryItem[];
        setPromptHistory(parsedHistory);
      } catch (e) {
        console.error("Failed to parse prompt history:", e);
      }
    }
  }, []);

  // Save prompt history to localStorage when it changes
  useEffect(() => {
    if (promptHistory.length > 0) {
      localStorage.setItem("promptHistory", JSON.stringify(promptHistory));
    }
  }, [promptHistory]);

  // Generate a random seed
  const generateRandomSeed = () => {
    return Math.floor(Math.random() * 2147483647);
  };

  // Get safety tolerance description
  const getSafetyToleranceDescription = (level: string): string => {
    return SAFETY_TOLERANCE_DESCRIPTIONS[level] || "Unknown safety level";
  };

  // Apply a style preset
  const applyStylePreset = (presetValue: string) => {
    const preset = STYLE_PRESETS.find((p) => p.value === presetValue);
    if (preset) {
      setSelectedStyle(presetValue);
      // Append the style prompt to the existing prompt, or set it if empty
      if (prompt.trim()) {
        setPrompt(prompt.trim() + ", " + preset.prompt);
      } else {
        setPrompt(preset.prompt);
      }
    }
  };

  // Apply a prompt template
  const applyPromptTemplate = (templateId: string) => {
    const template = PROMPT_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setPrompt(template.prompt);
      // Focus and scroll to the end of the prompt textarea
      if (promptRef.current) {
        promptRef.current.focus();
        promptRef.current.setSelectionRange(
          template.prompt.length,
          template.prompt.length,
        );
      }
    }
  };

  // Add a prompt enhancement suggestion
  const addPromptEnhancement = (suggestion: string) => {
    if (prompt.trim()) {
      setPrompt(prompt.trim() + ", " + suggestion);
    } else {
      setPrompt(suggestion);
    }
    // Focus and scroll to the end of the prompt textarea
    if (promptRef.current) {
      promptRef.current.focus();
      promptRef.current.setSelectionRange(
        (prompt.trim() + ", " + suggestion).length,
        (prompt.trim() + ", " + suggestion).length,
      );
    }
  };

  // Build prompt from structured fields
  const buildPromptFromFields = () => {
    const parts = [];
    if (subject) parts.push(subject);
    if (action) parts.push(action);
    if (setting) parts.push(`in ${setting}`);
    if (lighting) parts.push(`with ${lighting} lighting`);
    if (mood) parts.push(`${mood} mood`);
    if (style) parts.push(`${style} style`);
    if (details) parts.push(details);

    const builtPrompt = parts.join(", ");
    setPrompt(builtPrompt);
    setActiveTab("simple");
  };

  // Save current prompt to history
  const saveToPromptHistory = (imageUrl?: string) => {
    if (!prompt.trim()) return;

    const newHistoryItem: PromptHistoryItem = {
      id: Date.now().toString(),
      prompt: prompt,
      negativePrompt: negativePrompt,
      timestamp: Date.now(),
      thumbnail: imageUrl,
    };

    setPromptHistory([newHistoryItem, ...promptHistory.slice(0, 19)]); // Keep only the 20 most recent items
  };

  // Load a prompt from history
  const loadFromPromptHistory = (historyItem: PromptHistoryItem) => {
    setPrompt(historyItem.prompt);
    setNegativePrompt(historyItem.negativePrompt);

    // Focus and scroll to the end of the prompt textarea
    if (promptRef.current) {
      promptRef.current.focus();
      promptRef.current.setSelectionRange(
        historyItem.prompt.length,
        historyItem.prompt.length,
      );
    }
  };

  // Clear prompt history
  const clearPromptHistory = () => {
    if (
      confirm(
        "Are you sure you want to clear your prompt history? This cannot be undone.",
      )
    ) {
      setPromptHistory([]);
      localStorage.removeItem("promptHistory");
    }
  };

  // Handle generation
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImages([]);

    try {
      // Prepare the input parameters
      // Find the selected resolution option to get its aspect ratio
      const selectedResolution = RESOLUTION_OPTIONS.find(
        (option) => option.value === resolution,
      );

      const input: any = {
        prompt: prompt.trim(),
        image_size: resolution,
        aspect_ratio: selectedResolution?.aspectRatio || "16:9",
        num_images: numImages,
        enable_safety_checker: enableSafetyChecker,
        safety_tolerance: safetyTolerance,
        output_format: outputFormat,
        raw: rawMode,
      };

      // Add negative prompt if provided
      if (negativePrompt.trim()) {
        input.negative_prompt = negativePrompt.trim();
      }

      // Add seed if enabled
      if (useSeed && seed !== null) {
        input.seed = seed;
      } else if (useSeed) {
        // Generate a random seed if useSeed is true but no seed is set
        const randomSeed = generateRandomSeed();
        setSeed(randomSeed);
        input.seed = randomSeed;
      }

      // Call the API using the falClient - using the Ultra model
      const result = await fal.subscribe("fal-ai/flux-pro/v1.1-ultra", {
        input,
        logs: true,
        onQueueUpdate: (update: any) => {
          if (update.status === "IN_PROGRESS") {
            update.logs?.map((log: any) => log.message).forEach(console.log);
          }
        },
      });

      // Process the result
      if (result.data?.images && result.data.images.length > 0) {
        const images = result.data.images.map((img: any) => img.url);
        setGeneratedImages(images);
        setSelectedImageIndex(0);

        // Save to prompt history
        saveToPromptHistory(images[0]);

        // Call onComplete with the first image
        onComplete({
          url: images[0],
          metadata: {
            prompt: prompt,
            negativePrompt: negativePrompt,
            model: "fal-ai/flux-pro/v1.1-ultra",
            seed: result.data.seed,
          },
        });

        // Scroll to results
        if (resultContainerRef.current) {
          resultContainerRef.current.scrollIntoView({ behavior: "smooth" });
        }
      } else {
        setError("No images were generated. Please try again.");
      }
    } catch (err) {
      console.error("Error generating with Flux Pro:", err);
      setError("An error occurred during generation. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle image selection
  const handleImageSelect = (index: number) => {
    setSelectedImageIndex(index);

    // Call onComplete with the selected image
    if (generatedImages.length > 0) {
      onComplete({
        url: generatedImages[index],
        metadata: {
          prompt: prompt,
          negativePrompt: negativePrompt,
          model: "fal-ai/flux-pro/v1.1-ultra",
          seed: seed,
        },
      });
    }
  };

  // Handle image download
  const handleDownload = (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `flux-pro-${Date.now()}.${outputFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 bg-gray-900/30 rounded-lg mb-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Text-to-Image
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => {
                // Toggle between compact and expanded view
                document
                  .getElementById("text-to-image-container")
                  ?.classList.toggle("compact-view");
              }}
              title="Toggle compact view"
            >
              <LayoutIcon className="w-3.5 h-3.5 mr-1" />
              {document
                .getElementById("text-to-image-container")
                ?.classList.contains("compact-view")
                ? "Expand"
                : "Compact"}
            </Button>
          </div>
        </div>

        {/* Tabs for different prompt input methods */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList className="grid grid-cols-3 mb-3">
            <TabsTrigger value="simple">Simple</TabsTrigger>
            <TabsTrigger value="builder">Prompt Builder</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          {/* Simple prompt input */}
          <TabsContent value="simple">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="prompt" className="text-sm text-gray-300">
                    Prompt
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-gray-400 hover:text-white"
                      onClick={() => setShowPromptEnhancer(!showPromptEnhancer)}
                    >
                      <LightbulbIcon className="w-3 h-3 mr-1" />
                      Enhance
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-gray-400 hover:text-white"
                      onClick={() => setPrompt("")}
                    >
                      <XIcon className="w-3 h-3 mr-1" />
                      Clear
                    </Button>
                  </div>
                </div>
                <Textarea
                  id="prompt"
                  ref={promptRef}
                  placeholder="Describe the image you want to generate..."
                  className="min-h-[100px] bg-gray-800/50 border-gray-700 resize-none"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />

                {/* Prompt enhancer suggestions */}
                {showPromptEnhancer && (
                  <div className="mt-2 p-3 bg-gray-800/50 rounded-md border border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium text-gray-300">
                        Prompt Enhancers
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-gray-400 hover:text-white"
                        onClick={() => setShowPromptEnhancer(false)}
                      >
                        <XIcon className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {PROMPT_ENHANCEMENT_SUGGESTIONS.map(
                        (suggestion, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="text-xs py-1 px-2 h-auto bg-gray-800/50 hover:bg-gray-700/50"
                            onClick={() =>
                              addPromptEnhancement(suggestion.text)
                            }
                          >
                            {suggestion.text}
                          </Button>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label
                  htmlFor="negative-prompt"
                  className="text-sm text-gray-300 mb-2 block"
                >
                  Negative Prompt (what to exclude)
                </Label>
                <Textarea
                  id="negative-prompt"
                  placeholder="Elements to exclude from the image..."
                  className="min-h-[60px] bg-gray-800/50 border-gray-700 resize-none"
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                />
              </div>

              {/* Style presets */}
              <div>
                <Label className="text-sm text-gray-300 mb-2 block">
                  Style Presets
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {STYLE_PRESETS.map((preset) => (
                    <Button
                      key={preset.value}
                      variant={
                        selectedStyle === preset.value ? "default" : "outline"
                      }
                      size="sm"
                      className={`text-xs py-1 px-2 h-auto ${
                        selectedStyle === preset.value
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-gray-800/50 hover:bg-gray-700/50"
                      }`}
                      onClick={() => applyStylePreset(preset.value)}
                      title={preset.description}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Prompt history */}
              {promptHistory.length > 0 && (
                <Accordion type="single" collapsible className="mt-4">
                  <AccordionItem value="history">
                    <AccordionTrigger className="text-sm text-gray-300 hover:text-white">
                      <div className="flex items-center">
                        <ClockIcon className="w-4 h-4 mr-2" />
                        Prompt History
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 mt-2">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-gray-400">
                            Recent prompts
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-gray-400 hover:text-white"
                            onClick={clearPromptHistory}
                          >
                            <XIcon className="w-3 h-3 mr-1" />
                            Clear History
                          </Button>
                        </div>
                        <div className="max-h-40 overflow-y-auto space-y-2">
                          {promptHistory.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-start gap-2 p-2 rounded-md bg-gray-800/30 hover:bg-gray-800/50 cursor-pointer"
                              onClick={() => loadFromPromptHistory(item)}
                            >
                              {item.thumbnail && (
                                <img
                                  src={item.thumbnail}
                                  alt="Thumbnail"
                                  className="w-10 h-10 object-cover rounded-sm"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-300 truncate">
                                  {item.prompt}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {new Date(item.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </div>
          </TabsContent>

          {/* Prompt builder */}
          <TabsContent value="builder">
            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="subject"
                  className="text-sm text-gray-300 mb-2 block"
                >
                  Subject
                </Label>
                <Input
                  id="subject"
                  placeholder="Main subject of the image"
                  className="bg-gray-800/50 border-gray-700"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div>
                <Label
                  htmlFor="action"
                  className="text-sm text-gray-300 mb-2 block"
                >
                  Action
                </Label>
                <Input
                  id="action"
                  placeholder="What the subject is doing"
                  className="bg-gray-800/50 border-gray-700"
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                />
              </div>

              <div>
                <Label
                  htmlFor="setting"
                  className="text-sm text-gray-300 mb-2 block"
                >
                  Setting
                </Label>
                <Input
                  id="setting"
                  placeholder="Location or environment"
                  className="bg-gray-800/50 border-gray-700"
                  value={setting}
                  onChange={(e) => setSetting(e.target.value)}
                />
              </div>

              <div>
                <Label
                  htmlFor="lighting"
                  className="text-sm text-gray-300 mb-2 block"
                >
                  Lighting
                </Label>
                <Input
                  id="lighting"
                  placeholder="Lighting conditions"
                  className="bg-gray-800/50 border-gray-700"
                  value={lighting}
                  onChange={(e) => setLighting(e.target.value)}
                />
              </div>

              <div>
                <Label
                  htmlFor="style"
                  className="text-sm text-gray-300 mb-2 block"
                >
                  Style
                </Label>
                <Input
                  id="style"
                  placeholder="Artistic style"
                  className="bg-gray-800/50 border-gray-700"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                />
              </div>

              <div>
                <Label
                  htmlFor="mood"
                  className="text-sm text-gray-300 mb-2 block"
                >
                  Mood
                </Label>
                <Input
                  id="mood"
                  placeholder="Emotional tone"
                  className="bg-gray-800/50 border-gray-700"
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                />
              </div>

              <div>
                <Label
                  htmlFor="details"
                  className="text-sm text-gray-300 mb-2 block"
                >
                  Additional Details
                </Label>
                <Textarea
                  id="details"
                  placeholder="Any other details to include"
                  className="min-h-[60px] bg-gray-800/50 border-gray-700 resize-none"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                />
              </div>

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={buildPromptFromFields}
              >
                <WandIcon className="w-4 h-4 mr-2" />
                Build Prompt
              </Button>
            </div>
          </TabsContent>

          {/* Prompt templates */}
          <TabsContent value="templates">
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-gray-300 mb-2 block">
                  Template Category
                </Label>
                <Select
                  value={templateCategory}
                  onValueChange={setTemplateCategory}
                >
                  <SelectTrigger className="bg-gray-800/50 border-gray-700">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROMPT_TEMPLATE_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {PROMPT_TEMPLATES.filter(
                  (template) =>
                    templateCategory === "all" ||
                    template.category === templateCategory,
                ).map((template) => (
                  <div
                    key={template.id}
                    className="p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-blue-500 cursor-pointer"
                    onClick={() => applyPromptTemplate(template.id)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <img
                        src={template.thumbnail}
                        alt={template.title}
                        className="w-12 h-12 object-cover rounded-md"
                      />
                      <h4 className="text-sm font-medium text-gray-200">
                        {template.title}
                      </h4>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2">
                      {template.prompt}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Resolution selection */}
        <div className="mb-6">
          <Label
            htmlFor="resolution"
            className="text-sm text-gray-300 mb-2 block"
          >
            Resolution & Aspect Ratio
          </Label>
          <Select value={resolution} onValueChange={setResolution}>
            <SelectTrigger
              id="resolution"
              className="bg-gray-800/50 border-gray-700"
            >
              <SelectValue placeholder="Select resolution" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                value="heading-square"
                disabled
                className="font-semibold text-gray-400"
              >
                Square Formats
              </SelectItem>
              {RESOLUTION_OPTIONS.filter(
                (option) => option.aspectRatio === "1:1",
              ).map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}

              <SelectItem
                value="heading-landscape"
                disabled
                className="font-semibold text-gray-400 mt-2"
              >
                Landscape Formats
              </SelectItem>
              {RESOLUTION_OPTIONS.filter(
                (option) =>
                  ["16:9", "3:2", "4:3", "21:9"].includes(option.aspectRatio) &&
                  !option.value.startsWith("portrait_"),
              ).map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}

              <SelectItem
                value="heading-portrait"
                disabled
                className="font-semibold text-gray-400 mt-2"
              >
                Portrait Formats
              </SelectItem>
              {RESOLUTION_OPTIONS.filter((option) =>
                option.value.startsWith("portrait_"),
              ).map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-400 mt-1">
            Select the resolution and aspect ratio for your generated image
          </p>
        </div>

        {/* Number of images */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <Label htmlFor="num-images" className="text-sm text-gray-300">
              Number of Images
            </Label>
            <span className="text-sm text-gray-400">{numImages}</span>
          </div>
          <Slider
            id="num-images"
            defaultValue={[numImages]}
            value={[numImages]}
            onValueChange={(value) => setNumImages(value[0])}
            max={4}
            min={1}
            step={1}
            className="flex-1"
          />
        </div>

        {/* Seed control */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="use-seed" className="text-sm text-gray-300">
              Use Specific Seed
            </Label>
            <Switch
              id="use-seed"
              checked={useSeed}
              onCheckedChange={setUseSeed}
            />
          </div>

          {useSeed && (
            <div className="mt-2 flex gap-2">
              <input
                type="number"
                value={seed !== null ? seed : ""}
                onChange={(e) =>
                  setSeed(e.target.value ? parseInt(e.target.value) : null)
                }
                placeholder="Enter seed number"
                className="flex-1 bg-gray-800/50 border border-gray-700 rounded-md px-3 py-2 text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSeed(generateRandomSeed())}
                className="whitespace-nowrap"
              >
                Random Seed
              </Button>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Using the same seed with the same prompt will produce the same image
          </p>
        </div>

        {/* Safety settings */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="safety-checker" className="text-sm text-gray-300">
              Enable Safety Checker
            </Label>
            <Switch
              id="safety-checker"
              checked={enableSafetyChecker}
              onCheckedChange={setEnableSafetyChecker}
            />
          </div>

          {enableSafetyChecker && (
            <div className="mt-2">
              <Label
                htmlFor="safety-tolerance"
                className="text-sm text-gray-300 mb-2 block"
              >
                Safety Tolerance
              </Label>
              <Select
                value={safetyTolerance}
                onValueChange={setSafetyTolerance}
              >
                <SelectTrigger
                  id="safety-tolerance"
                  className="bg-gray-800/50 border-gray-700"
                >
                  <SelectValue placeholder="Select safety tolerance" />
                </SelectTrigger>
                <SelectContent>
                  {SAFETY_TOLERANCE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400 mt-2">
                {getSafetyToleranceDescription(safetyTolerance)}
              </p>
            </div>
          )}
        </div>

        {/* Output format */}
        <div className="mb-6">
          <Label
            htmlFor="output-format"
            className="text-sm text-gray-300 mb-2 block"
          >
            Output Format
          </Label>
          <Select value={outputFormat} onValueChange={setOutputFormat}>
            <SelectTrigger
              id="output-format"
              className="bg-gray-800/50 border-gray-700"
            >
              <SelectValue placeholder="Select output format" />
            </SelectTrigger>
            <SelectContent>
              {OUTPUT_FORMAT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Raw mode toggle */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="raw-mode" className="text-sm text-gray-300">
              Raw Mode
            </Label>
            <Switch
              id="raw-mode"
              checked={rawMode}
              onCheckedChange={setRawMode}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Generate less processed, more natural-looking images
          </p>
        </div>

        {/* Generate button */}
        <Button
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/20 py-6 text-lg font-bold flux-pro-generate-button"
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
        >
          {isGenerating ? (
            <>
              <span className="animate-spin mr-2">⟳</span>
              Generating...
            </>
          ) : (
            <>
              <SparklesIcon className="w-6 h-6 mr-2" />
              Generate Image
            </>
          )}
        </Button>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 bg-red-900/30 border border-red-700 rounded-md text-red-400 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Results section */}
      {generatedImages.length > 0 && (
        <div ref={resultContainerRef} className="p-6 bg-gray-900/30 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-200">
            Generated Images
          </h3>

          {/* Main selected image */}
          <div className="relative mb-4 bg-gray-800/50 rounded-lg overflow-hidden">
            <img
              src={generatedImages[selectedImageIndex]}
              alt={`Generated image ${selectedImageIndex + 1}`}
              className="w-full h-auto object-contain"
            />
            <Button
              variant="outline"
              size="sm"
              className="absolute top-2 right-2 bg-gray-900/70"
              onClick={() =>
                handleDownload(generatedImages[selectedImageIndex])
              }
            >
              <DownloadIcon className="w-4 h-4" />
            </Button>
          </div>

          {/* Thumbnails for multiple images */}
          {generatedImages.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {generatedImages.map((img, index) => (
                <div
                  key={index}
                  className={`relative cursor-pointer rounded-md overflow-hidden border-2 ${
                    index === selectedImageIndex
                      ? "border-blue-500"
                      : "border-transparent"
                  }`}
                  onClick={() => handleImageSelect(index)}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-auto object-cover aspect-square"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Generation info */}
          <div className="mt-4 p-3 bg-gray-800/50 rounded-md">
            <h4 className="text-sm font-medium text-gray-300 mb-1">
              Generation Details
            </h4>
            <p className="text-xs text-gray-400">
              <strong>Prompt:</strong> {prompt}
            </p>
            {negativePrompt && (
              <p className="text-xs text-gray-400">
                <strong>Negative Prompt:</strong> {negativePrompt}
              </p>
            )}
            <p className="text-xs text-gray-400">
              <strong>Seed:</strong> {seed || "Random"}
            </p>
            <p className="text-xs text-gray-400">
              <strong>Model:</strong> Flux Pro 1.1 Ultra
            </p>
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs py-1 px-2 h-auto bg-gray-800/50 hover:bg-gray-700/50"
                onClick={() => {
                  navigator.clipboard.writeText(prompt);
                }}
                title="Copy prompt to clipboard"
              >
                <CopyIcon className="w-3 h-3 mr-1" />
                Copy Prompt
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs py-1 px-2 h-auto bg-gray-800/50 hover:bg-gray-700/50"
                onClick={() => {
                  // Generate a new image with the same settings
                  handleGenerate();
                }}
                title="Generate a new image with the same settings"
              >
                <RefreshCwIcon className="w-3 h-3 mr-1" />
                Regenerate
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
