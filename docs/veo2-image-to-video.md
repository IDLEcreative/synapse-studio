# Veo 2 Image-to-Video Model

This document provides detailed information about Google's Veo 2 Image-to-Video model, which allows you to animate existing images with natural motion and realistic animations.

## Overview

The Veo 2 Image-to-Video model is a specialized variant of the Veo 2 text-to-video model that takes an input image and animates it based on a text prompt. This model is particularly useful for bringing static images to life with realistic motion.

## Capabilities

- **Input**: Accepts images up to 8MB in size
- **Output Resolution**: 720p videos
- **Aspect Ratios**: Supports both 16:9 (landscape) and 9:16 (portrait)
- **Duration**: 5-8 seconds at 24 FPS
- **Motion Quality**: Natural motion and realistic animations
- **Safety Filters**: Applied to both input images and generated content

## Prompt Engineering

When using the Image-to-Video model, your prompt should focus on describing how to animate the input image. Include:

- **Action**: How the image should be animated
- **Style**: Desired animation style
- **Camera motion** (optional): How the camera should move
- **Ambiance** (optional): Desired mood and atmosphere

### Example Prompt

For an image of a lego chef:

```
A lego chef cooking eggs with steam rising, camera slowly zooming in, warm morning light
```

## API Schema

### Input Parameters

| Parameter | Type | Description | Default | Possible Values |
|-----------|------|-------------|---------|-----------------|
| prompt | string | The text prompt describing how to animate the image | (required) | Any descriptive text |
| image_url | string | URL of the input image to animate | (required) | Valid image URL |
| aspect_ratio | string | The aspect ratio of the generated video | "auto" | "auto", "16:9", "9:16" |
| duration | string | The duration of the generated video in seconds | "5s" | "5s", "6s", "7s", "8s" |

### Example Input

```json
{
  "prompt": "A lego chef cooking eggs with steam rising, camera slowly zooming in, warm morning light",
  "image_url": "https://fal.media/files/elephant/6fq8JDSjb1osE_c3J_F2H.png",
  "aspect_ratio": "auto",
  "duration": "5s"
}
```

### Output

| Field | Type | Description |
|-------|------|-------------|
| video | File | The generated video file |

### Example Output

```json
{
  "video": {
    "url": "https://v3.fal.media/files/zebra/uNu-1qkbNt8be8iHA1hiB_output.mp4"
  }
}
```

## Implementation

### Client Setup

Install the FAL client:

```bash
npm install --save @fal-ai/client
```

### Authentication

Set your FAL API key as an environment variable:

```bash
export FAL_KEY="YOUR_API_KEY"
```

### Making Requests

For image-to-video generation, we recommend using the queue-based approach since these are typically longer-running requests:

```javascript
import { fal } from "@fal-ai/client";

// Submit the request
const { request_id } = await fal.queue.submit("fal-ai/veo2/image-to-video", {
  input: {
    prompt: "A lego chef cooking eggs with steam rising, camera slowly zooming in, warm morning light",
    image_url: "https://fal.media/files/elephant/6fq8JDSjb1osE_c3J_F2H.png",
    aspect_ratio: "auto",
    duration: "5s"
  }
});

// Check status
const status = await fal.queue.status("fal-ai/veo2/image-to-video", {
  requestId: request_id,
  logs: true,
});

// Get result when completed
const result = await fal.queue.result("fal-ai/veo2/image-to-video", {
  requestId: request_id
});
console.log(result.data);
```

### Uploading Images

If you need to upload an image to use with the model:

```javascript
import { fal } from "@fal-ai/client";

// Upload an image file
const file = new File([imageData], "input-image.jpg", { type: "image/jpeg" });
const imageUrl = await fal.storage.upload(file);

// Use the URL in your request
const { request_id } = await fal.queue.submit("fal-ai/veo2/image-to-video", {
  input: {
    prompt: "Your animation prompt here...",
    image_url: imageUrl,
    aspect_ratio: "auto",
    duration: "5s"
  }
});
```

## Best Practices

1. **Image Quality**: Use high-quality images (at least 720p) for best results
2. **Clear Subjects**: Images with clear, well-defined subjects work best
3. **Descriptive Prompts**: Be specific about how you want the image to be animated
4. **Camera Instructions**: Include camera motion instructions for more dynamic results
5. **Aspect Ratio**: Use "auto" to preserve the original image's aspect ratio, or specify "16:9" or "9:16" for specific formats

## Limitations

- Very complex scenes may not animate as expected
- Text in images may not be preserved perfectly in the animation
- Extreme camera movements may cause distortion
- Animation is limited to 5-8 seconds

## Integration with Our Application

In our application, the Veo 2 Image-to-Video model is integrated into the right panel under the Video generation section. Users can:

1. Upload an image
2. Provide a prompt describing how to animate it
3. Select aspect ratio and duration
4. Generate the animated video

The implementation handles all the API communication, file uploads, and result display automatically.
