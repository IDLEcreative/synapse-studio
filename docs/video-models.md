# Video Models in Synapse Studio

This document provides an overview of the video generation models available in Synapse Studio, their capabilities, and how to use them.

## Overview

Synapse Studio integrates with several AI video generation models through the [fal.ai](https://fal.ai) platform. These models enable various video creation capabilities, including:

- Text-to-video generation
- Image-to-video conversion
- Audio synchronization
- Lip-sync animation
- Camera movement control

The models are defined in `src/lib/fal.ts` within the `AVAILABLE_ENDPOINTS` array and are accessible through the "Generate Media" dialog in the application.

## Available Video Models

### 1. Minimax Video 01 Live (`fal-ai/minimax/video-01-live`)

**Description**: High quality video with realistic motion and physics

**Capabilities**:
- Image-to-video conversion
- Transforms static images into dynamic videos

**Input Parameters**:
- `prompt`: Text description of the desired video
- `image_url`: Reference image to animate

**Example Use Case**:
Converting a still photo of coffee beans into a video of coffee beans being ground or roasted.

### 2. Hunyuan Video (`fal-ai/hunyuan-video`)

**Description**: High visual quality, motion diversity and text alignment

**Capabilities**:
- Text-to-video generation
- Creates videos directly from text descriptions

**Input Parameters**:
- `prompt`: Detailed description of the desired video

**Example Use Case**:
Creating a video of a sunset over mountains or waves crashing on a beach from a text description.

### 3. Kling 1.5 Pro (`fal-ai/kling-video/v1.5/pro`)

**Description**: High quality video

**Capabilities**:
- Image-to-video conversion
- Enhanced quality compared to standard version

**Input Parameters**:
- `prompt`: Text description of the desired video
- `image_url`: Reference image to animate

**Example Use Case**:
Creating a professional-quality video animation from a product image.

### 4. Kling 1.0 Standard (`fal-ai/kling-video/v1/standard/text-to-video`)

**Description**: High quality video

**Capabilities**:
- Text-to-video generation
- Camera control options

**Input Parameters**:
- `prompt`: Text description of the desired video
- `advanced_camera_control`: Camera movement settings
  - `movement_type`: Type of camera movement (zoom, pan, etc.)
  - `movement_value`: Intensity of the movement

**Example Use Case**:
Creating a video with specific camera movements like zooming in on a subject or panning across a scene.

### 5. Luma Dream Machine 1.5 (`fal-ai/luma-dream-machine`)

**Description**: High quality video

**Capabilities**:
- Image-to-video conversion
- Dreamlike visual aesthetics

**Input Parameters**:
- `prompt`: Text description of the desired video
- `image_url`: Reference image to animate

**Example Use Case**:
Creating artistic, dreamlike animations from photographs or artwork.

### 6. MMAudio V2 (`fal-ai/mmaudio-v2`)

**Description**: Generates synchronized audio given video and/or text inputs

**Capabilities**:
- Audio generation for videos
- Can be combined with other video models

**Input Parameters**:
- `prompt`: Description of the desired audio
- `video_url`: Video to generate audio for

**Example Use Case**:
Adding ambient sounds or background music to a video that matches the visual content.

### 7. sync.so -- lipsync 1.8.0 (`fal-ai/sync-lipsync`)

**Description**: Generate realistic lipsync animations from audio

**Capabilities**:
- Lip synchronization for character videos
- Makes characters appear to speak the provided audio

**Input Parameters**:
- `video_url`: Video of a character/person
- `audio_url`: Speech audio to synchronize with

**Example Use Case**:
Making a character video appear to speak a voiceover or dialogue.

### 8. Veo 2 (`fal-ai/veo2`)

**Description**: Creates videos with realistic motion and high quality output, up to 4K

**Capabilities**:
- High-resolution video generation
- Realistic motion and physics

**Input Parameters**:
- `prompt`: Detailed description of the desired video

**Example Use Case**:
Creating high-definition videos for professional presentations or marketing materials.

## How to Use Video Models in the Application

### Accessing the Generation Interface

1. Open a project in Synapse Studio
2. Click the "Generate" button in the left panel
3. Select "Video" from the media type options
4. Choose a video model from the "Using" dropdown

### Basic Generation Process

1. Select the desired video model
2. Enter a descriptive prompt
3. If required by the model, upload or select a reference image
4. Configure additional parameters (if available):
   - For models with camera control, set movement type and intensity
   - Adjust duration if needed
5. Click "Generate" to create the video

### Tips for Effective Video Generation

- **Detailed Prompts**: Be specific in your text descriptions. Include details about subjects, actions, lighting, and style.
- **Quality Reference Images**: When using image-to-video models, use high-quality, clear images with good lighting.
- **Aspect Ratio**: The generated video will follow the project's aspect ratio (16:9, 9:16, or 1:1).
- **Combining Models**: For best results, you can generate a video with one model, then enhance it with audio using MMAudio V2.

## Implementation Details

The video model integration is implemented across several files:

- `src/lib/fal.ts`: Defines all available AI endpoints, including video models
- `src/components/right-panel.tsx`: Implements the UI for the "Generate Media" dialog
- `src/data/store.ts`: Manages state for the generation process using Zustand
- `src/app/api/fal/route.ts`: Proxies API calls to fal.ai

### API Authentication

To use these models, you need to set up a fal.ai API key:

1. Create an account at [fal.ai](https://fal.ai)
2. Get an API key from the dashboard
3. Add the key to your `.env.local` file as `FAL_KEY`

## Troubleshooting

### Common Issues

1. **401 Unauthorized Errors**: Ensure your fal.ai API key is correctly set in the `.env.local` file.
2. **Generation Failures**: Some models have specific requirements for input images or prompts. Check the model documentation for details.
3. **Slow Generation**: Video generation can be computationally intensive. Be patient, especially with longer or higher-quality videos.

### Getting Help

If you encounter issues with the video models, check:
- The fal.ai documentation for the specific model
- The console logs for detailed error messages
- The GitHub repository issues section for known problems
