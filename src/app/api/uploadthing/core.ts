import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  fileUploader: f({
    /**
     * For full list of options and defaults, see the File Route API reference
     * @see https://docs.uploadthing.com/file-routes#route-config
     */
    image: {
      maxFileCount: 1,
      maxFileSize: "16MB",
    },
    video: {
      maxFileCount: 1,
      maxFileSize: "512MB",
    },
    audio: {
      maxFileCount: 1,
      maxFileSize: "64MB",
    },
  })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }) => {
      // This code runs on your server before upload
      const session = await getServerSession(authOptions);

      // If you throw, the user will not be able to upload
      if (!session?.user) throw new UploadThingError("Unauthorized");

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: session.user.id || "unknown" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      logger.info("Upload completed successfully", {
        userId: metadata.userId,
        fileUrl: file.url,
        fileSize: file.size,
        fileName: file.name,
        operation: "uploadthing_complete",
      });

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
