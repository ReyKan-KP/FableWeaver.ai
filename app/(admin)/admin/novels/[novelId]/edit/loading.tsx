import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function NovelEditLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Header with back button and title */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-32 w-full" />
              </div>
            </div>
            
            {/* Cover Image Section */}
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              
              <div className="flex flex-col md:flex-row gap-6">
                <Skeleton className="h-64 w-48 rounded-md" />
                <div className="flex-1 space-y-4">
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-4 w-full max-w-[400px]" />
                </div>
              </div>
            </div>
            
            {/* Categories Section */}
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Tags Section */}
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <div className="flex flex-wrap gap-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-8 w-20" />
                  ))}
                </div>
              </div>
            </div>
            
            {/* Publishing Settings */}
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-4 w-32" />
                </div>
                
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-4">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 