import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function LoadingStoryWeaver() {
  return (
    <div className="container mx-auto max-w-6xl py-16 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-72" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Novels List Section */}
        <div className="space-y-4">
          <Skeleton className="h-8 w-32 mb-4" />
          <div className="border rounded-lg p-4 space-y-4">
            {/* Novel Cards */}
            {[...Array(5)].map((_, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-5 w-5" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Chapters Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-9 w-28" />
          </div>

          {/* Chapter Generation Card */}
          <Card className="p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-32 w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          </Card>

          {/* Chapters List */}
          <div className="border rounded-lg p-4 space-y-4">
            {[...Array(4)].map((_, index) => (
              <Card key={index} className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start mb-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
