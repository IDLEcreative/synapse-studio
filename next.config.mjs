import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Import bundle analyzer
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
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
      bodySizeLimit: "2mb", // Increased limit for video processing
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
    // Get allowed origins from environment or default to localhost
    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : ["http://localhost:3000"];

    return [
      {
        // Apply security headers to all routes
        source: "/:path*",
        headers: [
          // Security headers
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self'; connect-src 'self' https://*.fal.ai https://*.supabase.co https://uploadthing.com https://api.uploadthing.com wss://*.supabase.co; media-src 'self' blob: https:;",
          },
        ],
      },
      {
        // CORS headers only for API routes
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: allowedOrigins[0], // For now, use first origin
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "X-Requested-With, Content-Type, Authorization",
          },
          {
            key: "Access-Control-Allow-Credentials",
            value: "true",
          },
        ],
      },
    ];
  },
};

// Export with bundle analyzer wrapper
export default withBundleAnalyzer(nextConfig);
