import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function ThreadDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Threads
      </Button>
      
      {/* Thread card */}
      <Card className="p-6 space-y-4">
        {/* Thread header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        
        {/* Thread content */}
        <div className="space-y-3 py-2">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-5/6" />
          <Skeleton className="h-6 w-4/6" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/6" />
        </div>
        
        {/* Thread actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex gap-3">
            <div className="flex items-center gap-1">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-5 w-8" />
            </div>
            <div className="flex items-center gap-1">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-5 w-8" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      </Card>
      
      {/* Comments section */}
      <div className="space-y-4 mt-8">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-10 w-28 rounded-md" />
        </div>
        
        {/* Comment input */}
        <Card className="p-4 mb-6">
          <div className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-20 w-full rounded-md mb-2" />
              <div className="flex justify-end">
                <Skeleton className="h-9 w-24 rounded-md" />
              </div>
            </div>
          </div>
        </Card>
        
        {/* Comments list */}
        {Array(3).fill(0).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="flex gap-4 mt-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
