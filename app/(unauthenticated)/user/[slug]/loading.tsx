import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function UserProfileLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Card className="p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
          {/* User avatar */}
          <Skeleton className="h-32 w-32 rounded-full" />
          
          <div className="flex-1 space-y-4 text-center md:text-left">
            {/* User name */}
            <Skeleton className="h-8 w-64 mx-auto md:mx-0" />
            
            {/* User stats */}
            <div className="flex justify-center md:justify-start gap-6 mt-2">
              <div className="text-center">
                <Skeleton className="h-6 w-16 mx-auto mb-1" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="text-center">
                <Skeleton className="h-6 w-16 mx-auto mb-1" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="text-center">
                <Skeleton className="h-6 w-16 mx-auto mb-1" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            
            {/* User bio */}
            <div className="max-w-2xl">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6 mb-2" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28 rounded-md" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>
      </Card>
      
      {/* Content tabs */}
      <Tabs defaultValue="threads" className="w-full">
        <TabsList className="mb-6">
          <Skeleton className="h-10 w-24 rounded-md mr-1" />
          <Skeleton className="h-10 w-24 rounded-md mr-1" />
          <Skeleton className="h-10 w-24 rounded-md" />
        </TabsList>
        
        <TabsContent value="threads" className="space-y-6">
          {/* Thread cards */}
          {Array(3).fill(0).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6 mb-2" />
              <Skeleton className="h-4 w-4/6 mb-4" />
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
