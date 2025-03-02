# Video Models Implementation in Synapse Studio

This document provides a technical overview of how video models are implemented in Synapse Studio, focusing on the codebase structure, data flow, and integration with the fal.ai API.

## Code Structure

The video model implementation is distributed across several key files:

### 1. Model Definitions (`src/lib/fal.ts`)

This file defines all available AI endpoints, including video models, in the `AVAILABLE_ENDPOINTS` array:

```typescript
export const AVAILABLE_ENDPOINTS: ApiInfo[] = [
  // Image models
  // ...
  
  // Video models
  {
    endpointId: "fal-ai/minimax/video-01-live",
    label: "Minimax Video 01 Live",
    description: "High quality video, realistic motion and physics",
    cost: "",
    category: "video",
    inputAsset: ["image"],
  },
  {
    endpointId: "fal-ai/hunyuan-video",
    label: "Hunyuan",
    description: "High visual quality, motion diversity and text alignment",
    cost: "",
    category: "video",
  },
  // Additional video models...
];
```

Each model is defined with properties:
- `endpointId`: Unique identifier for the fal.ai endpoint
- `label`: Human-readable name
- `description`: Brief description of capabilities
- `cost`: Cost information (currently empty)
- `category`: Type of media generated ("video")
- `inputAsset`: Optional array specifying required input assets (e.g., ["image"])
- `cameraControl`: Boolean indicating if the model supports camera movement controls

### 2. API Client Configuration (`src/lib/fal.ts`)

The same file also configures the fal.ai client:

```typescript
export const fal = createFalClient({
  credentials: () => localStorage?.getItem("falKey") as string,
  proxyUrl: "/api/fal",
});
```

This client is configured to:
- Use the API key stored in localStorage
- Proxy requests through the `/api/fal` endpoint to avoid exposing the API key

### 3. API Proxy (`src/app/api/fal/route.ts`)

This file sets up a Next.js API route to proxy requests to fal.ai:

```typescript
import { route } from "@fal-ai/server-proxy/nextjs";

export const { GET, POST, PUT } = route;
```

The `@fal-ai/server-proxy/nextjs` package handles the details of proxying requests securely.

### 4. State Management (`src/data/store.ts`)

The application uses Zustand for state management. The store includes state related to video generation:

```typescript
export type GenerateData = {
  prompt: string;
  image?: File | string | null;
  video_url?: File | string | null;
  audio_url?: File | string | null;
  duration: number;
  voice: string;
  [key: string]: any;
};

interface VideoProjectState extends VideoProjectProps {
  // ...
  generateMediaType: MediaType;
  generateData: GenerateData;
  endpointId: string;
  // ...
  setGenerateMediaType: (mediaType: MediaType) => void;
  openGenerateDialog: (mediaType?: MediaType) => void;
  closeGenerateDialog: () => void;
  setGenerateData: (generateData: Partial<GenerateData>) => void;
  setEndpointId: (endpointId: string) => void;
  onGenerate: () => void;
}
```

Key state elements include:
- `generateMediaType`: Current media type (image, video, voiceover, music)
- `generateData`: Input data for generation (prompt, reference media, etc.)
- `endpointId`: Selected model endpoint ID

### 5. UI Implementation (`src/components/right-panel.tsx`)

This component implements the "Generate Media" dialog, which allows users to:
- Select a media type
- Choose a model
- Configure generation parameters
- Initiate generation

Key sections include:

#### Model Selection

```typescript
function ModelEndpointPicker({
  mediaType,
  ...props
}: ModelEndpointPickerProps) {
  const endpoints = useMemo(
    () =>
      AVAILABLE_ENDPOINTS.filter((endpoint) => endpoint.category === mediaType),
    [mediaType],
  );
  return (
    <Select {...props}>
      <SelectTrigger className="text-base w-full minw-56 font-semibold">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {endpoints.map((endpoint) => (
          <SelectItem key={endpoint.endpointId} value={endpoint.endpointId}>
            <div className="flex flex-row gap-2 items-center">
              <span>{endpoint.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

#### Input Configuration

The component dynamically renders input fields based on the selected model's requirements:

```typescript
{endpoint?.inputAsset?.map((asset, index) => (
  <div key={getAssetType(asset)} className="flex w-full">
    <div className="flex flex-col w-full" key={getAssetType(asset)}>
      <div className="flex justify-between">
        <h4 className="capitalize text-muted-foreground mb-2">
          {getAssetType(asset)} Reference
        </h4>
        {/* ... */}
      </div>
      {/* Input fields for reference media */}
    </div>
  </div>
))}

<Textarea
  className="text-base shadow-none focus:!ring-0 placeholder:text-base w-full h-32 resize-none"
  placeholder="Imagine..."
  value={generateData.prompt}
  rows={3}
  onChange={(e) => setGenerateData({ prompt: e.target.value })}
/>

{/* Additional model-specific parameters */}
{endpoint?.cameraControl && (
  <CameraMovement
    value={generateData.advanced_camera_control}
    onChange={(val) =>
      setGenerateData({
        advanced_camera_control: val
          ? {
              movement_value: val.value,
              movement_type: val.movement,
            }
          : undefined,
      })
    }
  />
)}
```

#### Generation Process

The component prepares the input data and initiates generation:

```typescript
const handleOnGenerate = async () => {
  await createJob.mutateAsync({} as any, {
    onSuccess: async () => {
      if (!createJob.isError) {
        handleOnOpenChange(false);
      }
    },
  });
};
```

### 6. Camera Control Component (`src/components/camera-control.tsx`)

For models that support camera movement, this component provides UI controls:

```typescript
export default function CameraMovement({
  value,
  onChange,
}: {
  value?: { movement_value: number; movement_type: string };
  onChange: (value: { value: number; movement: string } | undefined) => void;
}) {
  // Implementation of camera movement controls
}
```

## Data Flow

The video generation process follows this flow:

1. **User Interaction**:
   - User selects "Video" media type
   - User chooses a specific video model
   - User configures parameters (prompt, reference media, etc.)
   - User clicks "Generate"

2. **State Updates**:
   - `setGenerateMediaType("video")` updates the media type
   - `setEndpointId(selectedEndpointId)` sets the chosen model
   - `setGenerateData({ prompt, image, ... })` updates generation parameters

3. **API Request Preparation**:
   - `handleOnGenerate()` is called when the user clicks "Generate"
   - Input data is prepared based on the selected model's requirements
   - For image-to-video models, the endpoint is modified to include `/image-to-video`

4. **API Request Execution**:
   - `createJob.mutateAsync()` initiates the API request
   - The request is proxied through `/api/fal` to the fal.ai API
   - The fal.ai API processes the request and generates the video

5. **Result Handling**:
   - On success, the dialog is closed
   - The generated video is added to the project's media gallery
   - The user can then use the video in their project

## Integration with fal.ai

### API Authentication

The application uses a proxy approach for API authentication:

1. The user's API key is stored in localStorage as "falKey"
2. The fal.ai client is configured to use this key
3. Requests are proxied through `/api/fal` to avoid exposing the key

### Error Handling

API errors are handled at multiple levels:

1. **UI Level**: The component shows loading states and error messages
2. **API Level**: The `createJob` mutation includes error handling
3. **Proxy Level**: The fal.ai server proxy handles API-level errors

## Customization and Extension

### Adding New Models

To add a new video model:

1. Add a new entry to the `AVAILABLE_ENDPOINTS` array in `src/lib/fal.ts`:

```typescript
{
  endpointId: "fal-ai/new-video-model",
  label: "New Video Model",
  description: "Description of capabilities",
  cost: "",
  category: "video",
  inputAsset: ["image"], // if needed
  cameraControl: true, // if supported
}
```

2. If the model requires special parameters, update the input preparation logic in `right-panel.tsx`

### Modifying Existing Models

To modify an existing model:

1. Find the model in the `AVAILABLE_ENDPOINTS` array
2. Update its properties as needed
3. Test the changes to ensure compatibility with the fal.ai API

## Performance Considerations

Video generation can be resource-intensive. The application handles this by:

1. Showing loading states during generation
2. Closing the generation dialog after successful generation
3. Storing generated videos in the project's media gallery for reuse

## Security Considerations

The application addresses security concerns by:

1. Using a proxy approach for API authentication
2. Not exposing the API key in client-side code
3. Validating input data before sending it to the API

## Future Improvements

Potential areas for improvement include:

1. Adding more detailed error messages for specific API errors
2. Implementing retry logic for failed generations
3. Adding progress indicators for long-running generations
4. Supporting more advanced parameters for specific models
