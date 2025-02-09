import { ChevronLeft, Clock, BookText } from "lucide-react";

export default function ChapterLoading() {
  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen">
      <div className="space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 text-gray-300 dark:text-gray-700">
            <ChevronLeft className="w-5 h-5" />
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-4">
            <ChevronLeft className="w-5 h-5 text-gray-300 dark:text-gray-700" />
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            <ChevronLeft className="w-5 h-5 text-gray-300 dark:text-gray-700 rotate-180" />
          </div>
        </div>

        {/* Chapter Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          {/* Title */}
          <div className="h-10 w-3/4 mx-auto bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-4" />

          {/* Metadata */}
          <div className="flex justify-center items-center gap-4 mb-8">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-gray-300 dark:text-gray-700" />
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-1">
              <BookText className="w-4 h-4 text-gray-300 dark:text-gray-700" />
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            </div>
          </div>

          {/* Content Paragraphs */}
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                <div className="h-4 w-[95%] bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                <div className="h-4 w-[90%] bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
