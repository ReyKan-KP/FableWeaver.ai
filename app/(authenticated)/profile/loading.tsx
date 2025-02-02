import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10 py-8 px-4 sm:px-6 lg:px-8">
      <div className="container max-w-6xl mx-auto space-y-8">
        {/* Profile Header */}
        <div className="flex items-center space-x-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-[200px]" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
        </div>

        {/* Profile Content */}
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[400px] rounded-lg" />
          <div className="space-y-6">
            <Skeleton className="h-[200px] rounded-lg" />
            <Skeleton className="h-[200px] rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
