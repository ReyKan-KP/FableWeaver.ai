import { ChevronLeft, BookText, Clock } from "lucide-react";

export default function NovelDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto p-6 min-h-screen">
      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Sidebar */}
        <div className="md:col-span-1">
          <div className="sticky top-6 space-y-6">
            <div className="inline-flex items-center gap-2 text-gray-300 dark:text-gray-700 mb-4">
              <ChevronLeft className="w-5 h-5" />
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            </div>

            {/* Cover Image Skeleton */}
            <div className="relative aspect-[2/3] w-full">
              <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
            </div>

            {/* Novel Info Skeleton */}
            <div className="space-y-4">
              <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              <div className="h-6 w-24 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                <div className="h-4 w-4/6 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <BookText className="w-4 h-4 text-gray-300 dark:text-gray-700" />
                  <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-300 dark:text-gray-700" />
                  <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chapters List */}
        <div className="md:col-span-2 space-y-6">
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 animate-pulse"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-300 dark:text-gray-700" />
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                </div>
                <div className="space-y-2 mt-2">
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <BookText className="w-4 h-4 text-gray-300 dark:text-gray-700" />
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
