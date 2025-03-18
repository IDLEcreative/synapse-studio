# Fill & Inpaint Feature Guide

The Fill & Inpaint feature in Synapse Studio allows you to selectively modify parts of an image using AI-powered generation. This guide explains how to use this powerful feature effectively.

## What is Fill & Inpaint?

Fill & Inpaint combines two powerful image editing concepts:

- **Fill**: Replaces selected areas with AI-generated content based on your text prompt
- **Inpaint**: Intelligently blends the new content with the surrounding image for seamless results

## Common Use Cases

### Object Removal
Remove unwanted elements from your images:
- Tourists or people in the background
- Watermarks or text overlays
- Power lines, trash, or other distractions
- Blemishes or imperfections

### Content Replacement
Replace parts of an image with something new:
- Change the color or style of clothing
- Replace objects with different ones
- Modify facial features or expressions
- Transform backgrounds while keeping subjects intact

### Detail Enhancement
Improve specific areas of your image:
- Enhance facial details
- Improve texture quality in specific regions
- Add more definition to blurry or low-quality sections
- Refine small elements without affecting the entire image

### Background Editing
Modify or extend image backgrounds:
- Change plain backgrounds to more interesting scenes
- Extend the canvas beyond original boundaries
- Add atmospheric elements like clouds or lighting effects
- Create more context around the main subject

## How to Use Fill & Inpaint

1. **Select an Image**: First, generate an image in the Text-to-Image tab or select an existing image from your gallery.

2. **Draw a Mask**: Use the brush tool to paint over the areas you want to modify. The white mask indicates areas that will be changed.

3. **Adjust Brush Settings**:
   - Toggle between paint and erase modes using the toolbar buttons
   - Adjust brush size with the slider
   - Use undo/redo buttons to correct mistakes

4. **Enter a Prompt**: Describe what you want to generate in the masked area. Be specific and include style details for best results.

5. **Generate**: Click the Generate button to create your modified image.

## Pro Tips for Better Results

### Masking Tips
- Create clean, precise masks around the areas you want to modify
- Use a smaller brush size for detailed areas
- For object removal, include a small margin around the object
- For complex edits, work in smaller sections rather than large areas at once

### Prompt Tips
- Be specific about what you want to add (e.g., "a red rose" instead of just "flower")
- Include style details to match the original image (e.g., "photorealistic", "oil painting")
- Mention lighting and perspective to ensure consistency
- Reference colors or elements from the unmasked portions for better integration

### Advanced Techniques
- **Layered Editing**: Make multiple passes with different masks for complex changes
- **Iterative Refinement**: Generate, then mask and regenerate specific areas that need improvement
- **Style Matching**: Include descriptive terms that match the original image's style
- **Detail Focus**: For enhancing details, use smaller masks and more specific prompts

## Examples

### Example 1: Object Removal
- **Scenario**: Removing a person from a landscape photo
- **Mask**: Paint over the person and a small area around them
- **Prompt**: "Continuation of the natural landscape, grassy field with wildflowers, photorealistic"

### Example 2: Background Replacement
- **Scenario**: Changing a plain wall behind a portrait
- **Mask**: Paint over the entire background, carefully avoiding the subject
- **Prompt**: "Elegant bookshelf with antique books, warm lighting, shallow depth of field, matching the portrait's color palette"

### Example 3: Detail Enhancement
- **Scenario**: Improving a blurry face in a group photo
- **Mask**: Carefully paint over just the face
- **Prompt**: "Clear detailed face with the same expression, same lighting, photorealistic, matching the original person"

## Troubleshooting

- **Inconsistent Results**: Try using more specific prompts that describe the desired outcome in detail
- **Visible Seams**: Create a slightly larger mask that extends beyond the area you want to change
- **Unnatural Elements**: Include more context in your prompt about the surrounding image
- **Generation Errors**: Ensure your mask is clearly defined and try simplifying your prompt

---

Remember that Fill & Inpaint works best when you provide clear guidance through both your mask and prompt. Experiment with different approaches to discover the full potential of this powerful feature!
