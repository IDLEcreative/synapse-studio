# Implementing Veo 2 Models in the Application

This document provides a technical guide for implementing Google's Veo 2 models (text-to-video and image-to-video) in our Next.js application.

## Overview

The Veo 2 implementation consists of two main components:

1. **Text-to-Video**: Generates videos from text prompts
2. **Image-to-Video**: Animates existing images based on text prompts

Both models are integrated through the FAL.ai API and require specific handling for their asynchronous nature.

## Implementation Steps

### 1. Register the Models in `fal.ts`

Add the Veo 2 models to the `AVAILABLE_ENDPOINTS` array in `src/lib/fal.ts`:

```typescript
// Text-to-Video model
{
  endpointId: "fal-ai/veo2",
  label: "Veo 2",
  description:
    "Generate videos using Google's Veo 2 model. Can create videos from text prompts or animate existing images with natural motion and realistic animations.",
  cost: "",
  category: "video",
  inputAsset: ["image"],
  initialInput: {
    aspect_ratio: "auto",
    duration_string: "5s"
  }
},
// Image-to-Video model
{
  endpointId: "fal-ai/veo2/image-to-video",
  label: "Veo 2 Image-to-Video",
  description:
    "Animate an input image using Google's Veo 2 model with natural motion and realistic animations.",
  cost: "",
  category: "video",
  inputAsset: ["image"],
  initialInput: {
    aspect_ratio: "auto",
    duration_string: "5s"
  }
}
```

### 2. Update Data Types in `store.ts`

Add the Veo 2 specific parameters to the `GenerateData` type in `src/data/store.ts`:

```typescript
export type GenerateData = {
  // Existing parameters...
  
  // Veo 2 parameters
  aspect_ratio?: string; // For Veo 2 model (auto, 16:9, 9:16)
  duration_string?: string; // For Veo 2 model (5s, 6s, 7s, 8s)
  
  // Other parameters...
};
```

Also update the `resetGenerateData` and `DEFAULT_PROPS` functions to include default values for these parameters:

```typescript
resetGenerateData: () =>
  set({
    generateData: {
      // Existing reset values...
      
      // Reset Veo 2 specific parameters
      aspect_ratio: "auto",
      duration_string: "5s",
    },
  }),

// In DEFAULT_PROPS
generateData: {
  // Existing default values...
  
  // Default values for Veo 2 parameters
  aspect_ratio: "auto",
  duration_string: "5s",
}
```

### 3. Modify the API Route in `fal/route.ts`

Update the API route to handle the queue-based processing required by Veo 2 models:

```typescript
// Special handling for Veo 2 endpoints
if (body.endpoint === "fal-ai/veo2" || body.endpoint === "fal-ai/veo2/image-to-video") {
  console.log("Using Veo 2 endpoint:", body.endpoint);
  console.log("With input:", JSON.stringify(body.input, null, 2));
  
  // For Veo 2, we need to use queue.submit
  const queueResult = await directClient.queue.submit(body.endpoint, {
    input: body.input,
  });
  
  console.log("Veo 2 queue result:", queueResult);
  
  // Return a standardized response
  return new NextResponse(
    JSON.stringify({
      requestId: queueResult.request_id,
      status: "IN_PROGRESS",
    }),
    { status: 202 }
  );
}
```

Also enhance the GET handler to properly check job status:

```typescript
// First check the status to see if it's completed
const status = await directClient.queue.status("", { requestId, logs: true });
console.log("Job status:", status);

if (status.status === "COMPLETED") {
  // If completed, get the result
  console.log("Job completed, fetching result");
  const result = await directClient.queue.result("", { requestId });
  console.log("Job result:", result.data);
  return new NextResponse(JSON.stringify(result.data), { status: 200 });
} else {
  // If not completed, return the current status
  // Safely handle logs which might not exist on all status types
  const responseData: any = { 
    status: status.status, 
    requestId 
  };
  
  // Only include logs if they exist
  if ('logs' in status && status.logs) {
    responseData.logs = status.logs;
  }
  
  return new NextResponse(
    JSON.stringify(responseData),
    { status: 202 },
  );
}
```

### 4. Implement UI Components in `right-panel.tsx`

Add the Veo 2 specific UI components to the right panel:

```tsx
{/* Veo 2 specific controls */}
{(endpointId === "fal-ai/veo2" || endpointId === "fal-ai/veo2/image-to-video") && (
  <div className="flex flex-col gap-4 mt-4">
    {/* Image Upload Section */}
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-gray-100">Input Image</h3>
      <div className="relative">
        <label
          htmlFor="image-upload"
          className="flex flex-col items-center justify-center w-full h-32 bg-black/30 border border-white/10 hover:border-white/20 rounded-xl cursor-pointer overflow-hidden"
        >
          {generateData.image ? (
            <div className="w-full h-full relative">
              <img
                src={typeof generateData.image === 'string' ? generateData.image : URL.createObjectURL(generateData.image)}
                alt="Uploaded image"
                className="w-full h-full object-contain"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-1"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setGenerateData({ image: null });
                }}
              >
                <TrashIcon className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-300">
              <UploadIcon className="w-8 h-8 mb-2" />
              <span className="text-sm">Upload an image to animate</span>
              <span className="text-xs text-gray-400 mt-1">Click to browse or drag and drop</span>
            </div>
          )}
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                try {
                  // Show loading state
                  setGenerateData({ image: file });
                  
                  // Upload the file to get a proper URL
                  const uploadedFiles = await startUpload([file]);
                  if (uploadedFiles && uploadedFiles.length > 0) {
                    // Set the uploaded image URL in the generateData
                    setGenerateData({ image: uploadedFiles[0].url });
                    toast({
                      title: "Image uploaded",
                      description: "Your image is ready to be animated.",
                    });
                  }
                } catch (err) {
                  console.warn(`ERROR! ${err}`);
                  toast({
                    title: "Failed to upload image",
                    description: "Please try again",
                  });
                }
              }
            }}
          />
        </label>
      </div>
      <p className="text-xs text-gray-300">
        Optional: Upload an image to animate, or leave empty to generate from text prompt
      </p>
    </div>
    
    {/* Aspect Ratio Selector */}
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-gray-100">Aspect Ratio</h3>
      <Select
        value={generateData.aspect_ratio || "auto"}
        onValueChange={(value) => setGenerateData({ aspect_ratio: value })}
      >
        <SelectTrigger className="bg-black/30 border-white/10 hover:border-white/20 rounded-xl text-white">
          <SelectValue placeholder="Select aspect ratio" />
        </SelectTrigger>
        <SelectContent className="bg-black border-white/10">
          <SelectItem value="auto" className="text-white">Auto (from image)</SelectItem>
          <SelectItem value="16:9" className="text-white">Landscape (16:9)</SelectItem>
          <SelectItem value="9:16" className="text-white">Portrait (9:16)</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs text-gray-300">
        Choose the aspect ratio for your generated video
      </p>
    </div>

    {/* Duration Selector */}
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-gray-100">
        Duration
      </h3>
      <Select
        value={generateData.duration_string || "5s"}
        onValueChange={(value) =>
          setGenerateData({ duration_string: value })
        }
      >
        <SelectTrigger className="bg-black/30 border-white/10 hover:border-white/20 rounded-xl text-white">
          <SelectValue placeholder="Select duration" />
        </SelectTrigger>
        <SelectContent className="bg-black border-white/10">
          <SelectItem value="5s" className="text-white">5 seconds</SelectItem>
          <SelectItem value="6s" className="text-white">6 seconds</SelectItem>
          <SelectItem value="7s" className="text-white">7 seconds</SelectItem>
          <SelectItem value="8s" className="text-white">8 seconds</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs text-gray-300">
        Select the duration of your generated video
      </p>
    </div>
  </div>
)}
```

### 5. Add Prompt Guidance with Tooltip

Add a tooltip to help users write effective prompts:

```tsx
{endpointId === "fal-ai/veo2" && (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <InfoIcon className="w-3.5 h-3.5 text-gray-400 hover:text-gray-300 cursor-help" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs bg-black border border-white/10 text-white p-3">
        <p className="font-medium mb-1">Effective Veo 2 Prompts:</p>
        <ul className="list-disc pl-4 text-xs space-y-1">
          <li><strong>Action:</strong> Describe how the image/scene should be animated</li>
          <li><strong>Style:</strong> Specify the visual style (realistic, cartoon, etc.)</li>
          <li><strong>Camera:</strong> Describe camera movements (zoom, pan, tracking)</li>
          <li><strong>Ambiance:</strong> Set the mood and atmosphere</li>
        </ul>
        <p className="text-xs mt-1 italic">Example: "A lego chef cooking eggs with steam rising, camera slowly zooming in, warm morning light"</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
)}
```

### 6. Implement Dynamic Endpoint Selection

Add logic to automatically select the correct endpoint based on whether an image is provided:

```typescript
// Determine the correct endpoint for Veo 2 based on whether an image is provided
const effectiveEndpointId = useMemo(() => {
  if (endpointId === "fal-ai/veo2" && generateData.image && typeof generateData.image === 'string') {
    // Use the image-to-video endpoint when an image is provided
    return "fal-ai/veo2/image-to-video";
  }
  // Otherwise use the standard endpoint
  return endpointId;
}, [endpointId, generateData.image]);

// Use the effective endpoint in the job creator
const createJob = useJobCreator({
  projectId,
  endpointId: effectiveEndpointId,
  mediaType,
  input: prepareJobInput(),
});
```

### 7. Prepare Job Input

Implement a function to prepare the input data for the job:

```typescript
// Prepare the input data for the job
const prepareJobInput = () => {
  // Start with the initial input from the endpoint
  const baseInput = {
    ...(endpoint?.initialInput || {}),
    ...mapInputKey(generateData, endpoint?.inputMap || {})
  };

  // For Veo 2, handle the special case of image-to-video
  if (endpointId === "fal-ai/veo2") {
    // Create a new object with the base input
    const veoInput: Record<string, any> = {
      prompt: generateData.prompt,
      aspect_ratio: generateData.aspect_ratio || "auto",
      duration: generateData.duration_string || "5s",
    };

    // Only include image_url if we have an image and it's a string URL
    if (generateData.image && typeof generateData.image === 'string') {
      console.log("Using image URL for Veo 2:", generateData.image);
      veoInput.image_url = generateData.image;
    }

    console.log("Final Veo 2 input:", veoInput);
    return veoInput;
  }

  // For all other cases, return the base input
  return baseInput;
};
```

### 8. Add User Feedback

Provide feedback to the user about which mode is being used:

```typescript
// Show a toast to indicate the mode being used
if (generateData.image && typeof generateData.image === 'string') {
  toast({
    title: "Using Image-to-Video Mode",
    description: "Animating your uploaded image based on the prompt.",
  });
} else {
  toast({
    title: "Using Text-to-Video Mode",
    description: "Generating video from your text prompt.",
  });
}
```

## Testing the Implementation

To test the Veo 2 implementation:

1. Select "Video" in the media type selector
2. Choose "Veo 2" from the model dropdown
3. Enter a descriptive prompt
4. (Optional) Upload an image to animate
5. Select aspect ratio and duration
6. Click "Generate Video"

The system will automatically determine whether to use text-to-video or image-to-video mode based on whether an image is provided.

## Troubleshooting

### Common Issues

1. **Job Status Not Updating**: Ensure the GET handler in the API route is correctly checking job status
2. **Image Upload Failures**: Check that the uploadthing configuration is properly set up
3. **Parameter Naming**: Ensure the parameter names match the API expectations (e.g., `duration` not `duration_string`)
4. **Endpoint Selection**: Verify that the correct endpoint is being selected based on image presence

### Debugging

Add console logs at key points:

```typescript
console.log("Generating with input:", prepareJobInput());
console.log("Base endpoint:", endpointId);
console.log("Effective endpoint:", effectiveEndpointId);
console.log("Image data:", generateData.image);
```

Check the browser console and server logs for these messages to diagnose issues.

## Future Improvements

1. **Progress Tracking**: Implement a progress bar for video generation
2. **Preview Thumbnails**: Show preview thumbnails during generation
3. **Batch Processing**: Allow batch processing of multiple images
4. **Advanced Options**: Add more advanced options like seed values or guidance scale
5. **Result History**: Implement a history panel to view past generations
