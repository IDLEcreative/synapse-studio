import type { Config } from "tailwindcss";

/**
 * Integrates uploadthing with Tailwind CSS v4
 *
 * This is a replacement for the withUt wrapper from uploadthing/tw
 * which was designed for Tailwind CSS v3. This function adds the
 * necessary content paths for uploadthing components.
 *
 * @param config The Tailwind CSS v4 configuration
 * @returns The modified configuration with uploadthing paths
 */
export function withUploadThing(config: Config): Config {
  // Add uploadthing paths to the content configuration
  const uploadthingPaths = [
    "./node_modules/@uploadthing/react/dist/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@uploadthing/react/src/**/*.{js,ts,jsx,tsx}",
  ];

  // Create a new config with the uploadthing paths
  return {
    ...config,
    content: [
      ...(Array.isArray(config.content) ? config.content : []),
      ...uploadthingPaths,
    ],
  };
}
