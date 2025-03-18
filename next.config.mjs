import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Import bundle analyzer
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: "randomuser.me" },
      { hostname: "fal.ai" },
      { hostname: "storage.googleapis.com" },
      { hostname: "cdn.fal.ai" },
      { hostname: "replicate.delivery" },
      { hostname: "pbxt.replicate.delivery" },
      { hostname: "uploadthing.com" },
      { hostname: "utfs.io" },
      { hostname: "v2.fal.media" },
    ],
    formats: ["image/avif", "image/webp"], // Prioritize modern formats
  },
  env: {
    // Enable the settings button in the header
    NEXT_PUBLIC_CUSTOM_KEY: "true",
  },
  // Add experimental features
  experimental: {
    // ppr: true, // Requires canary version of Next.js
    serverActions: {
      bodySizeLimit: '2mb', // Increased limit for video processing
    },
    optimizePackageImports: [
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-accordion",
      "@radix-ui/react-collapsible",
      "@radix-ui/react-popover",
      "@radix-ui/react-select",
      "@radix-ui/react-slider",
      "@radix-ui/react-switch",
      "@radix-ui/react-tabs",
      "@radix-ui/react-toast",
      "@radix-ui/react-toggle",
      "@radix-ui/react-toggle-group",
      "@radix-ui/react-tooltip",
      "lucide-react",
    ],
  },
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: "/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "X-Requested-With, Content-Type, Authorization",
          },
        ],
      },
    ];
  },
};

// Export with bundle analyzer wrapper
export default withBundleAnalyzer(nextConfig);
