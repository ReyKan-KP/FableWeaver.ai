import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function LoadingCard() {
  return (
    <Card className="h-[400px] bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
      <CardHeader className="p-0">
        <Skeleton className="h-48 rounded-t-lg" />
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-20 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}
