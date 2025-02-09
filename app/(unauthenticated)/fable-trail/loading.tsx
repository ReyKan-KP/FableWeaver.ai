import { motion } from "framer-motion";
import { Search, HelpCircle } from "lucide-react";

export default function NovelListingLoading() {
  return (
    <div className="max-w-7xl mx-auto p-6 min-h-screen">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div>
              <div className="h-10 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
              <div className="h-6 w-64 bg-gray-200 dark:bg-gray-800 rounded-lg mt-2 animate-pulse" />
            </div>
            <div className="p-2">
              <HelpCircle className="w-6 h-6 text-gray-300 dark:text-gray-700" />
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300 dark:text-gray-700" />
            <div className="w-full h-10 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-24 h-10 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-gray-100 dark:bg-gray-800 rounded-xl shadow-md overflow-hidden animate-pulse"
          >
            <div className="h-48 bg-gray-200 dark:bg-gray-700" />
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
              <div className="flex justify-between items-center">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
