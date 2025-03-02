# Video Model Usage Examples

This document provides code examples for using the video models in Synapse Studio programmatically.

## Basic Video Generation

### Text-to-Video Generation

This example shows how to generate a video from a text prompt using the Hunyuan model:

```typescript
import { fal } from "@/lib/fal";

async function generateVideoFromText(prompt: string) {
  try {
    // Select the Hunyuan model for text-to-video generation
    const endpointId = "fal-ai/hunyuan-video";
    
    // Prepare the input data
    const input = {
      prompt: prompt,
      aspect_ratio: "16:9", // Options: "16:9", "9:16", "1:1"
    };
    
    // Call the fal.ai API
    // Note: In Synapse Studio, this is done using fal.queue.submit
    const result = await fal.queue.submit(endpointId, { input });
    
    // In a real application, you would need to poll for the result
    // This is a simplified example
    return result.video_url;
  } catch (error) {
    console.error("Error generating video:", error);
    throw error;
  }
}

// Usage
generateVideoFromText("A serene mountain landscape with flowing rivers and snow-capped peaks")
  .then(videoUrl => {
    console.log("Generated video URL:", videoUrl);
    // Use the video URL in your application
  })
  .catch(error => {
    console.error("Failed to generate video:", error);
  });
```

### Image-to-Video Generation

This example demonstrates how to convert an image to a video using the Minimax model:

```typescript
import { fal } from "@/lib/fal";

async function generateVideoFromImage(prompt: string, imageUrl: string) {
  try {
    // Select the Minimax model for image-to-video conversion
    const endpointId = "fal-ai/minimax/video-01-live/image-to-video";
    
    // Prepare the input data
    const input = {
      prompt: prompt,
      image_url: imageUrl,
      aspect_ratio: "16:9", // Options: "16:9", "9:16", "1:1"
    };
    
    // Call the fal.ai API
    // Note: In Synapse Studio, this is done using fal.queue.submit
    const result = await fal.queue.submit(endpointId, { input });
    
    // In a real application, you would need to poll for the result
    // This is a simplified example
    return result.video_url;
  } catch (error) {
    console.error("Error generating video:", error);
    throw error;
  }
}

// Usage
const imageUrl = "https://example.com/my-image.jpg";
generateVideoFromImage("Coffee beans being roasted with steam rising", imageUrl)
  .then(videoUrl => {
    console.log("Generated video URL:", videoUrl);
    // Use the video URL in your application
  })
  .catch(error => {
    console.error("Failed to generate video:", error);
  });
```

## Advanced Video Generation

### Video with Camera Control

This example shows how to generate a video with camera movement using the Kling 1.0 Standard model:

```typescript
import { fal } from "@/lib/fal";

async function generateVideoWithCameraControl(
  prompt: string, 
  movementType: string, 
  movementValue: number
) {
  try {
    // Select the Kling model with camera control
    const endpointId = "fal-ai/kling-video/v1/standard/text-to-video";
    
    // Prepare the input data
    const input = {
      prompt: prompt,
      aspect_ratio: "16:9",
      advanced_camera_control: {
        movement_type: movementType, // Options: "zoom_in", "zoom_out", "pan_left", "pan_right"
        movement_value: movementValue, // Value between 0 and 100
      },
    };
    
    // Call the fal.ai API
    const result = await fal.subscribe(endpointId, input);
    
    // The result contains the generated video URL
    return result.video_url;
  } catch (error) {
    console.error("Error generating video:", error);
    throw error;
  }
}

// Usage
generateVideoWithCameraControl(
  "A forest path with sunlight filtering through the trees", 
  "zoom_in", 
  50
)
  .then(videoUrl => {
    console.log("Generated video URL:", videoUrl);
    // Use the video URL in your application
  })
  .catch(error => {
    console.error("Failed to generate video:", error);
  });
```

### High-Resolution Video Generation

This example demonstrates how to generate a high-resolution video using the Veo 2 model:

```typescript
import { fal } from "@/lib/fal";

async function generateHighResVideo(prompt: string) {
  try {
    // Select the Veo 2 model for high-resolution video
    const endpointId = "fal-ai/veo2";
    
    // Prepare the input data
    const input = {
      prompt: prompt,
      // Additional parameters for high-resolution output
      aspect_ratio: "16:9",
    };
    
    // Call the fal.ai API
    const result = await fal.subscribe(endpointId, input);
    
    // The result contains the generated video URL
    return result.video_url;
  } catch (error) {
    console.error("Error generating video:", error);
    throw error;
  }
}

// Usage
generateHighResVideo("An aerial view of a bustling city with skyscrapers and traffic")
  .then(videoUrl => {
    console.log("Generated high-res video URL:", videoUrl);
    // Use the video URL in your application
  })
  .catch(error => {
    console.error("Failed to generate video:", error);
  });
```

## Integration with Application Components

### Using Video Models in a React Component

This example shows how to integrate video generation into a React component:

```tsx
import React, { useState } from "react";
import { fal } from "@/lib/fal";
import { Button, Input, Select } from "@/components/ui";

const VideoGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("fal-ai/hunyuan-video");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const input = {
        prompt,
        aspect_ratio: aspectRatio,
      };
      
      const result = await fal.subscribe(model, input);
      setVideoUrl(result.video_url);
    } catch (err) {
      setError("Failed to generate video. Please try again.");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <h2 className="text-xl font-bold">Video Generator</h2>
      
      <div className="flex flex-col gap-2">
        <label htmlFor="model">Model</label>
        <Select
          id="model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        >
          <option value="fal-ai/hunyuan-video">Hunyuan (Text-to-Video)</option>
          <option value="fal-ai/minimax/video-01-live/image-to-video">Minimax (Image-to-Video)</option>
          <option value="fal-ai/veo2">Veo 2 (High Resolution)</option>
        </Select>
      </div>
      
      <div className="flex flex-col gap-2">
        <label htmlFor="prompt">Prompt</label>
        <Input
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the video you want to generate..."
        />
      </div>
      
      <div className="flex flex-col gap-2">
        <label htmlFor="aspectRatio">Aspect Ratio</label>
        <Select
          id="aspectRatio"
          value={aspectRatio}
          onChange={(e) => setAspectRatio(e.target.value)}
        >
          <option value="16:9">Landscape (16:9)</option>
          <option value="9:16">Portrait (9:16)</option>
          <option value="1:1">Square (1:1)</option>
        </Select>
      </div>
      
      <Button
        onClick={handleGenerate}
        disabled={isGenerating || !prompt}
      >
        {isGenerating ? "Generating..." : "Generate Video"}
      </Button>
      
      {error && (
        <div className="text-red-500">{error}</div>
      )}
      
      {videoUrl && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Generated Video</h3>
          <video
            src={videoUrl}
            controls
            className="w-full rounded-md"
          />
        </div>
      )}
    </div>
  );
};

export default VideoGenerator;
```

## Error Handling and Best Practices

### Handling API Errors

```typescript
import { fal } from "@/lib/fal";

async function generateVideoWithErrorHandling(prompt: string) {
  try {
    const endpointId = "fal-ai/hunyuan-video";
    const input = { prompt };
    
    const result = await fal.subscribe(endpointId, input);
    return result.video_url;
  } catch (error: any) {
    // Handle specific error types
    if (error.status === 401) {
      console.error("Authentication error: Check your API key");
      // Handle authentication errors
    } else if (error.status === 400) {
      console.error("Invalid input:", error.message);
      // Handle invalid input errors
    } else if (error.status === 429) {
      console.error("Rate limit exceeded. Try again later.");
      // Handle rate limiting
    } else {
      console.error("Unexpected error:", error);
      // Handle other errors
    }
    throw error;
  }
}
```

### Optimizing Prompts for Better Results

```typescript
// Function to enhance prompts for better video generation results
function enhancePrompt(basePrompt: string): string {
  // Add details about lighting, camera angle, style, etc.
  const enhancedPrompt = `${basePrompt}, high quality, detailed, cinematic lighting, smooth motion, 4K resolution`;
  return enhancedPrompt;
}

// Usage
const basePrompt = "A cat playing with a ball of yarn";
const enhancedPrompt = enhancePrompt(basePrompt);
generateVideoFromText(enhancedPrompt)
  .then(videoUrl => {
    console.log("Generated video URL:", videoUrl);
  });
```

## Working with the Job API

For longer-running video generation tasks, you can use the job API to create a job and then check its status:

```typescript
import { fal } from "@/lib/fal";

async function createVideoGenerationJob(prompt: string) {
  try {
    const endpointId = "fal-ai/veo2";
    const input = { prompt };
    
    // Create a job
    const job = await fal.submit(endpointId, input);
    console.log("Job created with ID:", job.id);
    
    // Return the job ID for status checking
    return job.id;
  } catch (error) {
    console.error("Error creating job:", error);
    throw error;
  }
}

async function checkJobStatus(jobId: string) {
  try {
    // Check the status of the job
    const status = await fal.status(jobId);
    return status;
  } catch (error) {
    console.error("Error checking job status:", error);
    throw error;
  }
}

// Usage
createVideoGenerationJob("A timelapse of a blooming flower")
  .then(jobId => {
    // Poll for job status
    const intervalId = setInterval(async () => {
      const status = await checkJobStatus(jobId);
      console.log("Job status:", status.status);
      
      if (status.status === "COMPLETED") {
        clearInterval(intervalId);
        console.log("Video generated:", status.result.video_url);
      } else if (status.status === "FAILED") {
        clearInterval(intervalId);
        console.error("Job failed:", status.error);
      }
    }, 5000); // Check every 5 seconds
  });
```

These examples demonstrate various ways to use the video models in Synapse Studio programmatically. You can adapt them to your specific use case and integrate them into your application as needed.
