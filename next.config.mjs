/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'randomuser.me',
      'fal.ai',
      'storage.googleapis.com',
      'cdn.fal.ai',
      'replicate.delivery',
      'pbxt.replicate.delivery',
      'uploadthing.com',
      'utfs.io'
    ],
  },
  env: {
    // Enable the settings button in the header
    NEXT_PUBLIC_CUSTOM_KEY: 'true',
  },
};

export default nextConfig;
