# FAL API Models Documentation

This document provides information about the AI models hosted on FAL.ai that are integrated with our application.

## Table of Contents

- [Veo 2 Text-to-Video](#veo-2-text-to-video)
- [Other FAL Models](#other-fal-models)
- [API Integration](#api-integration)

## Veo 2 Text-to-Video

### Overview

Veo 2 is Google's text-to-video generation model that creates high-quality videos from descriptive text prompts. The model excels at generating natural motion and realistic animations.

### Capabilities

- **Resolution**: 720p output resolution
- **Duration**: 5-8 seconds at 24 FPS
- **Aspect Ratios**: Both 16:9 (landscape) and 9:16 (portrait)
- **Safety Filters**: Prevents generation of inappropriate content

### Prompt Engineering

For best results, prompts should be descriptive and clear. Include:

- **Subject**: What you want in the video (object, person, animal, scenery)
- **Context**: The background/setting
- **Action**: What the subject is doing
- **Style**: Film style keywords (horror, noir, cartoon etc.)
- **Camera motion** (optional): aerial view, tracking shot etc.
- **Composition** (optional): wide shot, close-up etc.
- **Ambiance** (optional): Color and lighting details

### Example Prompt

```
The camera floats gently through rows of pastel-painted wooden beehives, buzzing honeybees gliding in and out of frame. The motion settles on the refined farmer standing at the center, his pristine white beekeeping suit gleaming in the golden afternoon light. He lifts a jar of honey, tilting it slightly to catch the light. Behind him, tall sunflowers sway rhythmically in the breeze, their petals glowing in the warm sunlight. The camera tilts upward to reveal a retro farmhouse with mint-green shutters, its walls dappled with shadows from swaying trees. Shot with a 35mm lens on Kodak Portra 400 film, the golden light creates rich textures on the farmer's gloves, marmalade jar, and weathered wood of the beehives.
```

### API Schema

#### Input Parameters

| Parameter | Type | Description | Default | Possible Values |
|-----------|------|-------------|---------|-----------------|
| prompt | string | The text prompt describing the video you want to generate | (required) | Any descriptive text |
| aspect_ratio | string | The aspect ratio of the generated video | "16:9" | "16:9", "9:16" |
| duration | string | The duration of the generated video in seconds | "5s" | "5s", "6s", "7s", "8s" |

#### Example Input

```json
{
  "prompt": "The camera floats gently through rows of pastel-painted wooden beehives...",
  "aspect_ratio": "16:9",
  "duration": "5s"
}
```

#### Output

| Field | Type | Description |
|-------|------|-------------|
| video | File | The generated video file |

#### Example Output

```json
{
  "video": {
    "url": "https://v3.fal.media/files/tiger/83-YzufmOlsnhqq5ed382_output.mp4"
  }
}
```

## Other FAL Models

Our application integrates with FAL.ai models:

- **Flux Pro 1.1 Ultra**: Premium image quality with enhanced detail

## API Integration

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

Or configure it in your client:

```javascript
import { fal } from "@fal-ai/client";

fal.config({
  credentials: "YOUR_FAL_KEY"
});
```

> **Security Note**: When running code on the client-side (browser, mobile app, GUI applications), do not expose your FAL_KEY. Use a server-side proxy to make requests to the API.

### Making Requests

#### Synchronous Requests

```javascript
import { fal } from "@fal-ai/client";

const result = await fal.subscribe("fal-ai/veo2", {
  input: {
    prompt: "Your detailed prompt here...",
    aspect_ratio: "16:9",
    duration: "5s"
  },
  logs: true,
  onQueueUpdate: (update) => {
    if (update.status === "IN_PROGRESS") {
      update.logs.map((log) => log.message).forEach(console.log);
    }
  },
});
console.log(result.data);
console.log(result.requestId);
```

#### Queue-Based Requests (Recommended for Video Generation)

For long-running requests like video generation, use the queue-based approach:

```javascript
import { fal } from "@fal-ai/client";

// Submit the request
const { request_id } = await fal.queue.submit("fal-ai/veo2", {
  input: {
    prompt: "Your detailed prompt here...",
    aspect_ratio: "16:9",
    duration: "5s"
  },
  webhookUrl: "https://optional.webhook.url/for/results",
});

// Check status
const status = await fal.queue.status("fal-ai/veo2", {
  requestId: request_id,
  logs: true,
});

// Get result when completed
const result = await fal.queue.result("fal-ai/veo2", {
  requestId: request_id
});
console.log(result.data);
```

### File Handling

For models that accept file inputs:

```javascript
import { fal } from "@fal-ai/client";

// Upload a file
const file = new File(["Hello, World!"], "hello.txt", { type: "text/plain" });
const url = await fal.storage.upload(file);

// Use the URL in your request
const result = await fal.subscribe("model-endpoint", {
  input: {
    file_url: url
  }
});
```

## Server-Side Implementation

In our application, we use a server-side proxy to handle API requests securely. This is implemented in `/api/fal/route.ts` which manages authentication and request handling.
