import Header from "@/components/header";
import { Skeleton } from "@/components/ui/skeleton";

export default function SharePageLoading() {
  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <main className="flex overflow-hidden h-full">
        <div className="container mx-auto py-8 h-full">
          <div className="flex flex-col gap-8 items-center justify-center h-full">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full max-w-3xl" />
            <div className="max-w-4xl w-full">
              <Skeleton className="w-full aspect-video" />
            </div>
            <div className="flex flex-row gap-2 items-center justify-center">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
