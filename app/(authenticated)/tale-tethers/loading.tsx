import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

export default function TaleTethersLoading() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>

      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="mb-4">
          <Skeleton className="h-10 w-24 rounded-md mr-1" />
          <Skeleton className="h-10 w-24 rounded-md" />
        </TabsList>

        <TabsContent value="friends" className="space-y-4">
          {/* Search bar */}
          <div className="flex gap-2 mb-6">
            <Skeleton className="h-10 flex-grow rounded-md" />
          </div>

          {/* Friends list */}
          <div className="space-y-3">
            {Array(8).fill(0).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-3 w-3 rounded-full" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <Skeleton className="h-9 w-9 rounded-full" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
