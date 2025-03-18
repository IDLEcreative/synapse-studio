import { Button } from "@/components/ui/button";
import { fetchSharedVideo } from "@/lib/share";
import { DownloadIcon } from "lucide-react";
import { ShareVideoParams } from "@/lib/share";
import { Skeleton } from "@/components/ui/skeleton";

interface VideoContentProps {
  shareData: ShareVideoParams;
}

export default function VideoContent({ shareData }: VideoContentProps) {
  return (
    <>
      <h1 className="font-semibold text-2xl">{shareData.title}</h1>
      <p className="text-muted-foreground max-w-3xl w-full sm:w-3xl text-center">
        {shareData.description}
      </p>
      <div className="max-w-4xl">
        <video
          src={shareData.videoUrl}
          poster={shareData.thumbnailUrl}
          controls
          className="w-full h-full aspect-video"
        />
      </div>
      <div className="flex flex-row gap-2 items-center justify-center">
        <Button variant="secondary" asChild size="lg">
          <a href={shareData.videoUrl} download>
            <DownloadIcon className="w-4 h-4 opacity-50" />
            Download
          </a>
        </Button>
        <Button variant="secondary" size="lg" asChild>
          <a href="/">Start your project</a>
        </Button>
      </div>
    </>
  );
}
