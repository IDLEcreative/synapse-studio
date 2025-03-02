# Adding New fal.ai Models to Synapse Studio

This guide explains how to implement new AI models from the fal.ai platform into Synapse Studio.

## Finding New Models on fal.ai

1. Visit the [fal.ai models page](https://fal.ai/models) to discover available models.
2. Look for models that fit your use case (video generation, image generation, audio generation, etc.).
3. Note the model's endpoint ID, which typically follows the format `fal-ai/model-name`.
4. Review the model's documentation to understand its capabilities, parameters, and requirements.

> **Note**: The fal.ai platform requires authentication to access their models page. You'll need to create an account and obtain an API key from their dashboard to use these models in Synapse Studio.

## Adding a New Model to Synapse Studio

### Step 1: Add the Model to AVAILABLE_ENDPOINTS

Open `src/lib/fal.ts` and add a new entry to the `AVAILABLE_ENDPOINTS` array:

```typescript
export const AVAILABLE_ENDPOINTS: ApiInfo[] = [
  // Existing models...
  
  // Add your new model here
  {
    endpointId: "fal-ai/new-model-name", // Replace with the actual endpoint ID
    label: "Human-Friendly Model Name", // A user-friendly name for the UI
    description: "Brief description of the model's capabilities",
    cost: "", // Optional cost information
    category: "video", // Category: "image", "video", "music", or "voiceover"
    inputAsset: ["image"], // Optional: Required input assets (if any)
    cameraControl: false, // Optional: Set to true if the model supports camera control
  },
];
```

### Step 2: Handle Special Parameters (If Needed)

If the model requires special parameters or has unique input requirements, you may need to modify the input preparation logic in `src/components/right-panel.tsx`.

Look for the section where input data is prepared:

```typescript
// Find this section in right-panel.tsx
const input: InputType = {
  prompt: generateData.prompt,
  image_url: undefined,
  image_size: imageAspectRatio,
  aspect_ratio: videoAspectRatio,
  seconds_total: generateData.duration ?? undefined,
  // Add any special parameters for your new model here
};

// If your model needs special handling, you might add conditional logic:
if (endpointId === "fal-ai/new-model-name") {
  input.special_parameter = generateData.specialValue;
}
```

### Step 3: Add UI Controls for Special Parameters (If Needed)

If your model requires special parameters that need user input, add the necessary UI controls in `src/components/right-panel.tsx`:

```tsx
{endpoint?.endpointId === "fal-ai/new-model-name" && (
  <div className="flex flex-col gap-2">
    <label htmlFor="specialParameter">Special Parameter</label>
    <Input
      id="specialParameter"
      value={generateData.specialValue || ""}
      onChange={(e) => setGenerateData({ specialValue: e.target.value })}
      placeholder="Enter special parameter..."
    />
  </div>
)}
```

### Step 4: Update Type Definitions (If Needed)

If your model requires new parameter types, update the `GenerateData` type in `src/data/store.ts`:

```typescript
export type GenerateData = {
  prompt: string;
  image?: File | string | null;
  video_url?: File | string | null;
  audio_url?: File | string | null;
  duration: number;
  voice: string;
  // Add your new parameter types here
  specialValue?: string;
  [key: string]: any;
};
```

## Example: Adding a New Video Model

Let's walk through an example of adding a hypothetical new video model called "fal-ai/next-gen-video":

### 1. Add the Model to AVAILABLE_ENDPOINTS

```typescript
// In src/lib/fal.ts
export const AVAILABLE_ENDPOINTS: ApiInfo[] = [
  // Existing models...
  
  {
    endpointId: "fal-ai/next-gen-video",
    label: "NextGen Video",
    description: "Next generation video model with enhanced quality and motion",
    cost: "",
    category: "video",
    inputAsset: ["image"], // Supports image-to-video
    cameraControl: true, // Supports camera control
  },
];
```

### 2. Handle Special Parameters

If the model requires a special "style" parameter:

```typescript
// In src/components/right-panel.tsx
// Find the input preparation section
if (endpointId === "fal-ai/next-gen-video") {
  input.style = generateData.videoStyle || "cinematic";
}
```

### 3. Add UI Controls

```tsx
// In src/components/right-panel.tsx
{endpoint?.endpointId === "fal-ai/next-gen-video" && (
  <div className="flex flex-col gap-2">
    <label htmlFor="videoStyle">Video Style</label>
    <Select
      id="videoStyle"
      value={generateData.videoStyle || "cinematic"}
      onValueChange={(value) => setGenerateData({ videoStyle: value })}
    >
      <SelectItem value="cinematic">Cinematic</SelectItem>
      <SelectItem value="anime">Anime</SelectItem>
      <SelectItem value="3d">3D Rendered</SelectItem>
    </Select>
  </div>
)}
```

### 4. Update Type Definitions

```typescript
// In src/data/store.ts
export type GenerateData = {
  // Existing properties...
  videoStyle?: string;
  [key: string]: any;
};
```

## Testing Your New Model

After adding a new model, you should test it to ensure it works correctly:

1. Start the development server with `npm run dev`
2. Open the application in your browser
3. Create a new project or open an existing one
4. Click the "Generate" button
5. Select "Video" as the media type
6. Your new model should appear in the dropdown list
7. Configure the parameters and click "Generate"
8. Verify that the model works as expected

## Troubleshooting

### Model Not Appearing in the UI

- Check that you've added the model to the `AVAILABLE_ENDPOINTS` array with the correct `category` property
- Verify that the `endpointId` matches exactly what's on the fal.ai website
- Restart the development server to ensure changes are applied

### API Errors

- Check the browser console for error messages
- Verify that your fal.ai API key is correctly set in the `.env.local` file
- Ensure that you have access to the model on fal.ai (some models may require specific permissions)
- Verify that you're passing the correct parameters to the model

### Parameter Issues

- Check the fal.ai documentation for the model to ensure you're using the correct parameter names
- Verify that the parameter values are in the expected format
- Add console logs to debug the input data being sent to the API

## Best Practices

### Model Selection

- Choose models that align with the application's purpose and user needs
- Consider the model's performance, quality, and cost
- Test the model thoroughly before adding it to production

### Parameter Handling

- Provide sensible defaults for all parameters
- Add validation to ensure parameters are within acceptable ranges
- Use clear labels and descriptions for UI controls

### Documentation

- Update the documentation to include information about the new model
- Document any special parameters or requirements
- Provide examples of how to use the model effectively

## Advanced: Creating Custom Model Wrappers

For more complex models or custom integrations, you might want to create a dedicated wrapper:

1. Create a new file in `src/lib/models/` for your model:

```typescript
// src/lib/models/next-gen-video.ts
import { fal } from "@/lib/fal";

export async function generateNextGenVideo(
  prompt: string,
  imageUrl?: string,
  style?: string
) {
  const endpointId = "fal-ai/next-gen-video";
  
  const input = {
    prompt,
    image_url: imageUrl,
    style: style || "cinematic",
    // Other parameters...
  };
  
  try {
    const result = await fal.subscribe(endpointId, input);
    return result;
  } catch (error) {
    console.error("Error generating video with NextGen model:", error);
    throw error;
  }
}
```

2. Use this wrapper in your components:

```typescript
import { generateNextGenVideo } from "@/lib/models/next-gen-video";

// In your component
const handleGenerate = async () => {
  try {
    const result = await generateNextGenVideo(
      generateData.prompt,
      generateData.image,
      generateData.videoStyle
    );
    
    // Handle the result...
  } catch (error) {
    // Handle errors...
  }
};
```

This approach provides better type safety, reusability, and separation of concerns.

## Implementing Flux Pro Tools

Flux Pro is a suite of specialized image generation tools from fal.ai that provide advanced control over the generation process. These tools include:

1. **Canny** - Edge-guided image generation with structural conditioning
2. **Depth** - Depth-guided image generation for 3D-aware results
3. **Redux** - Generate stylistic variations from a base image
4. **Fill** - Advanced inpainting and outpainting

Each Flux Pro tool requires specific parameters to control its behavior. Here's how to implement these tools:

### Step 1: Add Flux Pro Models to AVAILABLE_ENDPOINTS

The Flux Pro models should be added to the `AVAILABLE_ENDPOINTS` array in `src/lib/fal.ts`:

```typescript
// Canny models
{
  endpointId: "fal-ai/flux-pro/v1/canny",
  label: "FLUX.1 [pro] Canny",
  description: "Edge-guided image generation with structural conditioning",
  cost: "",
  category: "image",
  inputAsset: ["image"],
},
{
  endpointId: "fal-ai/flux-pro/v1/canny-fine-tuned",
  label: "FLUX.1 [pro] Canny Fine-tuned",
  description: "Enhanced edge-guided image generation with improved detail",
  cost: "",
  category: "image",
  inputAsset: ["image"],
},

// Depth models
{
  endpointId: "fal-ai/flux-pro/v1/depth",
  label: "FLUX.1 [pro] Depth",
  description: "Depth-guided image generation for 3D-aware results",
  cost: "",
  category: "image",
  inputAsset: ["image"],
},
{
  endpointId: "fal-ai/flux-pro/v1/depth-fine-tuned",
  label: "FLUX.1 [pro] Depth Fine-tuned",
  description: "Enhanced depth-guided image generation with improved detail",
  cost: "",
  category: "image",
  inputAsset: ["image"],
},

// Redux models
{
  endpointId: "fal-ai/flux-pro/v1/redux",
  label: "FLUX.1 [pro] Redux",
  description: "Generate stylistic variations from a base image",
  cost: "",
  category: "image",
  inputAsset: ["image"],
},
{
  endpointId: "fal-ai/flux-pro/v1.1/redux",
  label: "FLUX 1.1 [pro] Redux",
  description: "Generate stylistic variations from a base image",
  cost: "",
  category: "image",
  inputAsset: ["image"],
},

// Fill models
{
  endpointId: "fal-ai/flux-pro/v1/fill",
  label: "FLUX.1 [pro] Fill",
  description: "Advanced inpainting and outpainting with state-of-the-art results",
  cost: "",
  category: "image",
  inputAsset: ["image"],
},
{
  endpointId: "fal-ai/flux-pro/v1/fill-fine-tuned",
  label: "FLUX.1 [pro] Fill Fine-tuned",
  description: "Enhanced inpainting with improved detail and coherence",
  cost: "",
  category: "image",
  inputAsset: ["image"],
},
```

### Step 2: Add Flux Pro Parameters to GenerateData Type

Update the `GenerateData` type in `src/data/store.ts` to include the Flux Pro tool parameters:

```typescript
export type GenerateData = {
  prompt: string;
  image?: File | string | null;
  video_url?: File | string | null;
  audio_url?: File | string | null;
  duration: number;
  voice: string;
  // Flux Pro tool parameters
  edgeStrength?: number;    // For Canny models
  depthStrength?: number;   // For Depth models
  maskImage?: string | File | null;  // For Fill models (mask area)
  variationStrength?: number; // For Redux models
  // ... other parameters
  [key: string]: any;
};
```

### Step 3: Add Input Mapping for Flux Pro Parameters

In `src/components/right-panel.tsx`, add the parameter mapping for Flux Pro tools:

```typescript
// Add Flux Pro tool parameters
if (endpointId === "fal-ai/flux-pro/v1/canny" || endpointId === "fal-ai/flux-pro/v1/canny-fine-tuned") {
  if (generateData.edgeStrength !== undefined) {
    input.edge_strength = generateData.edgeStrength;
  }
}

if (endpointId === "fal-ai/flux-pro/v1/depth" || endpointId === "fal-ai/flux-pro/v1/depth-fine-tuned") {
  if (generateData.depthStrength !== undefined) {
    input.depth_strength = generateData.depthStrength;
  }
}

if (endpointId === "fal-ai/flux-pro/v1/redux" || endpointId === "fal-ai/flux-pro/v1.1/redux") {
  if (generateData.variationStrength !== undefined) {
    input.variation_strength = generateData.variationStrength;
  }
}

if (endpointId === "fal-ai/flux-pro/v1/fill" || endpointId === "fal-ai/flux-pro/v1/fill-fine-tuned") {
  if (generateData.maskImage) {
    input.mask_image_url = generateData.maskImage;
  }
}
```

### Step 4: Add UI Controls for Flux Pro Tools

Add UI controls for the Flux Pro tools in `src/components/right-panel.tsx`:

```tsx
{/* Flux Pro Tool Controls Section Header */}
{(endpointId.includes("flux-pro") && (
  endpointId === "fal-ai/flux-pro/v1/canny" || 
  endpointId === "fal-ai/flux-pro/v1/canny-fine-tuned" ||
  endpointId === "fal-ai/flux-pro/v1/depth" || 
  endpointId === "fal-ai/flux-pro/v1/depth-fine-tuned" ||
  endpointId === "fal-ai/flux-pro/v1/redux" || 
  endpointId === "fal-ai/flux-pro/v1.1/redux" ||
  endpointId === "fal-ai/flux-pro/v1/fill" || 
  endpointId === "fal-ai/flux-pro/v1/fill-fine-tuned"
)) && (
  <div className="flex items-center gap-2 mt-2">
    <h3 className="text-sm font-medium text-blue-400">Flux Pro Tools</h3>
    <div className="sidebar-gradient-divider"></div>
  </div>
)}

{/* Canny model controls */}
{(endpointId === "fal-ai/flux-pro/v1/canny" || endpointId === "fal-ai/flux-pro/v1/canny-fine-tuned") && (
  <div className="flex flex-col gap-2 bg-gray-800/30 rounded-lg p-3 border border-gray-700">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
        <SparklesIcon className="w-4 h-4 text-blue-400" />
        Edge Strength
      </h3>
    </div>
    <div className="flex items-center gap-4">
      <Slider
        defaultValue={[generateData.edgeStrength || 0.5]}
        value={[generateData.edgeStrength || 0.5]}
        onValueChange={(value) => setGenerateData({ edgeStrength: value[0] })}
        max={1}
        min={0}
        step={0.1}
        className="flex-1"
      />
      <div className="bg-neutral-900 px-3 py-2 text-xs rounded-md text-white inline-flex tabular-nums w-10 items-center justify-center text-center">
        {generateData.edgeStrength?.toFixed(1) || "0.5"}
      </div>
    </div>
    <p className="text-xs text-gray-400 mt-1">
      Controls the strength of edge detection for structural guidance
    </p>
  </div>
)}

{/* Depth model controls */}
{(endpointId === "fal-ai/flux-pro/v1/depth" || endpointId === "fal-ai/flux-pro/v1/depth-fine-tuned") && (
  <div className="flex flex-col gap-2 bg-gray-800/30 rounded-lg p-3 border border-gray-700">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
        <SparklesIcon className="w-4 h-4 text-blue-400" />
        Depth Strength
      </h3>
    </div>
    <div className="flex items-center gap-4">
      <Slider
        defaultValue={[generateData.depthStrength || 0.5]}
        value={[generateData.depthStrength || 0.5]}
        onValueChange={(value) => setGenerateData({ depthStrength: value[0] })}
        max={1}
        min={0}
        step={0.1}
        className="flex-1"
      />
      <div className="bg-neutral-900 px-3 py-2 text-xs rounded-md text-white inline-flex tabular-nums w-10 items-center justify-center text-center">
        {generateData.depthStrength?.toFixed(1) || "0.5"}
      </div>
    </div>
    <p className="text-xs text-gray-400 mt-1">
      Controls the influence of depth information on the generated image
    </p>
  </div>
)}

{/* Redux model controls */}
{(endpointId === "fal-ai/flux-pro/v1/redux" || endpointId === "fal-ai/flux-pro/v1.1/redux") && (
  <div className="flex flex-col gap-2 bg-gray-800/30 rounded-lg p-3 border border-gray-700">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
        <SparklesIcon className="w-4 h-4 text-blue-400" />
        Variation Strength
      </h3>
    </div>
    <div className="flex items-center gap-4">
      <Slider
        defaultValue={[generateData.variationStrength || 0.5]}
        value={[generateData.variationStrength || 0.5]}
        onValueChange={(value) => setGenerateData({ variationStrength: value[0] })}
        max={1}
        min={0}
        step={0.1}
        className="flex-1"
      />
      <div className="bg-neutral-900 px-3 py-2 text-xs rounded-md text-white inline-flex tabular-nums w-10 items-center justify-center text-center">
        {generateData.variationStrength?.toFixed(1) || "0.5"}
      </div>
    </div>
    <p className="text-xs text-gray-400 mt-1">
      Controls how much the generated image varies from the reference
    </p>
  </div>
)}

{/* Fill model controls */}
{(endpointId === "fal-ai/flux-pro/v1/fill" || endpointId === "fal-ai/flux-pro/v1/fill-fine-tuned") && (
  <div className="flex flex-col gap-2 bg-gray-800/30 rounded-lg p-3 border border-gray-700">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
        <SparklesIcon className="w-4 h-4 text-blue-400" />
        Mask Image (Optional)
      </h3>
    </div>
    {!generateData.maskImage ? (
      <Button
        variant="outline"
        className="flex items-center justify-center gap-1.5 bg-gray-800/50 border-gray-700 hover:border-purple-500/50 transition-colors"
        asChild
      >
        <label htmlFor="maskImageUpload">
          <Input
            id="maskImageUpload"
            type="file"
            className="hidden"
            onChange={(e) => {
              const files = e.target.files;
              if (!files || !files[0]) return;
              
              const file = files[0];
              setGenerateData({ maskImage: file });
            }}
            accept="image/*"
          />
          <UploadIcon className="w-4 h-4 text-purple-400 mr-1.5" />
          <span className="text-gray-300 text-xs">Upload Mask Image</span>
        </label>
      </Button>
    ) : (
      <div className="relative w-full">
        <div className="overflow-hidden relative w-full flex flex-col items-center justify-center border border-gray-700 rounded-md bg-gray-800/50 p-2">
          <div className="absolute top-2 right-2 z-10 flex gap-1">
            <WithTooltip tooltip="Remove mask image">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full bg-black/70 hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                onClick={() => setGenerateData({ maskImage: null })}
              >
                <TrashIcon className="w-3 h-3" />
              </Button>
            </WithTooltip>
          </div>
          <p className="text-xs text-gray-400 mt-1 text-center">
            Mask image uploaded
          </p>
        </div>
      </div>
    )}
    <p className="text-xs text-gray-400 mt-1">
      Upload a mask image to define areas to be filled or modified
    </p>
  </div>
)}
```

### Using Flux Pro Tools

To use the Flux Pro tools:

1. Select "Image" as the media type
2. Choose one of the Flux Pro models from the dropdown:
   - FLUX.1 [pro] Canny or FLUX.1 [pro] Canny Fine-tuned
   - FLUX.1 [pro] Depth or FLUX.1 [pro] Depth Fine-tuned
   - FLUX.1 [pro] Redux or FLUX 1.1 [pro] Redux
   - FLUX.1 [pro] Fill or FLUX.1 [pro] Fill Fine-tuned
3. Adjust the specific parameters for the selected model:
   - Edge Strength for Canny models
   - Depth Strength for Depth models
   - Variation Strength for Redux models
   - Upload a mask image for Fill models
4. Enter a prompt and click "Generate"

The Flux Pro tools provide advanced control over the image generation process, allowing for more precise and creative results.

## Conclusion

Adding new fal.ai models to Synapse Studio is a straightforward process that involves updating the `AVAILABLE_ENDPOINTS` array and handling any special parameters or UI requirements. By following this guide, you can extend the application with the latest AI models from fal.ai to provide new capabilities to your users.
