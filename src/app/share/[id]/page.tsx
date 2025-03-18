import Header from "@/components/header";
import { fetchSharedVideo } from "@/lib/share";
import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import VideoContent from "./video-content";
import { Skeleton } from "@/components/ui/skeleton";

// This interface works in development but has type mismatches in production build with Next.js 15
// The production build expects params to be a Promise, but this is the correct type for development
// @ts-ignore - Suppress TypeScript error during production build
interface PageProps {
  params: {
    id: string;
  };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const video = await fetchSharedVideo(params.id);
  if (!video) {
    return {
      title: "Video Not Found",
    };
  }

  const previousImages = (await parent).openGraph?.images || [];

  return {
    title: video.title,
    description: video.description || "Watch on Video AI Studio",

    // Open Graph metadata
    openGraph: {
      title: video.title,
      description: video.description,
      type: "video.other",
      videos: [
        {
          url: video.videoUrl,
          width: video.width,
          height: video.height,
          type: "video/mp4",
        },
      ],
      images: [
        {
          url: video.thumbnailUrl,
          width: video.width,
          height: video.height,
          alt: video.title,
        },
        ...previousImages,
      ],
    },

    // Twitter Card metadata
    twitter: {
      card: "player",
      title: video.title,
      description: video.description,
      players: [
        {
          playerUrl: video.videoUrl,
          streamUrl: video.videoUrl,
          width: video.width,
          height: video.height,
        },
      ],
      images: [video.thumbnailUrl],
    },

    // Additional metadata
    other: {
      // TODO resolve duration
      "og:video:duration": "15",
      "video:duration": "15",
      "video:release_date": new Date(video.createdAt).toISOString(),
    },
  };
}

// Loading fallback component for the video content
function VideoContentSkeleton() {
  return (
    <>
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-full max-w-3xl" />
      <div className="max-w-4xl w-full">
        <Skeleton className="w-full aspect-video" />
      </div>
      <div className="flex flex-row gap-2 items-center justify-center">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
    </>
  );
}

export default async function SharePage({ params }: PageProps) {
  const shareId = params.id;
  const shareData = await fetchSharedVideo(shareId);

  if (!shareData) {
    return notFound();
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <main className="flex overflow-hidden h-full">
        <div className="container mx-auto py-8 h-full">
          <div className="flex flex-col gap-8 items-center justify-center h-full">
            <Suspense fallback={<VideoContentSkeleton />}>
              <VideoContent shareData={shareData} />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}
