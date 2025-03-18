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
  },
  env: {
    // Enable the settings button in the header
    NEXT_PUBLIC_CUSTOM_KEY: "true",
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

export default nextConfig;
