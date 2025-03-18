# Synapse Studio - Advanced AI Video Editor

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![Remotion](https://img.shields.io/badge/Remotion-latest-blue)](https://remotion.dev)

A powerful AI-driven video editing platform for creators and professionals. Synapse Studio combines cutting-edge AI technology with an intuitive interface to help you create stunning videos effortlessly.

![Synapse Studio](https://github.com/IDLEcreative/synapse-studio/blob/main/src/app/opengraph-image.png?raw=true)

## Features

- 🎬 **Browser-Native Video Processing**: Seamless video handling and composition in the browser
- 🤖 **AI-Powered Editing**: Advanced AI tools for enhancing and transforming your videos
  - Smart scene detection and transitions
  - Automated color correction and enhancement
  - AI-assisted content generation
- 🎵 **Advanced Media Capabilities**:
  - Multi-clip video composition
  - Audio track integration
  - Voiceover support
  - Extended video duration handling
- 🛠️ **Professional Tools**:
  - Custom effects and transitions
  - Advanced timeline editing
  - Real-time preview
  - High-quality export options

## Tech Stack

- [Next.js](https://nextjs.org) - React framework
- [Remotion](https://remotion.dev) - Video processing
- [IndexedDB](https://developer.mozilla.org/docs/Web/API/IndexedDB_API) - Browser-based storage (no cloud database required)
- [Vercel](https://vercel.com) - Deployment platform
- [UploadThing](https://uploadthing.com) - File upload
- [TailwindCSS](https://tailwindcss.com) - Styling

## Quick Start

1. Clone the repository:

```bash
git clone https://github.com/IDLEcreative/synapse-studio
cd synapse-studio
```

2. Install dependencies:

```bash
npm install
```

3. Set up your environment variables:

```bash
cp .env.example .env.local
```

4. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Documentation

Comprehensive documentation is available in the [docs](./docs) directory:

- [Video Models Overview](./docs/video-models.md) - Guide to the video generation models, their capabilities, and usage
- [Video Models Implementation](./docs/video-models-implementation.md) - Technical details about how video models are implemented
- [Adding New Models](./docs/adding-new-models.md) - Step-by-step guide on implementing new fal.ai models
- [Video Model Usage Examples](./docs/examples/video-model-usage.md) - Code examples for using video models programmatically
- [Fill & Inpaint Feature Guide](./docs/fill-inpaint-feature.md) - Comprehensive guide to using the Fill & Inpaint feature

## Deployment

The easiest way to deploy your application is through [Vercel](https://vercel.com).
