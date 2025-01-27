import { Skeleton } from "@/components/ui/skeleton";

export default function CharacterRealmLoading() {
  return (
    <div className="max-w-7xl mx-auto p-6 min-h-screen">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-48 rounded-full" />
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <Skeleton className="h-10 w-full rounded-full" />
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-20 rounded-full" />
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Character Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-[#bccff1] dark:bg-zinc-900 rounded-xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-700"
          >
            <Skeleton className="h-48 w-full" />
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <Skeleton className="h-6 w-32" />
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-1 justify-end">
                    {[1, 2].map((j) => (
                      <Skeleton key={j} className="h-5 w-16 rounded-full" />
                    ))}
                  </div>
                  <div className="flex gap-1 justify-end">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="flex justify-between items-center mt-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-24 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
