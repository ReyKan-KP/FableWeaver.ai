import { Skeleton } from "@/components/ui/skeleton";

export default function CharacterChatLoading() {
  return (
    <div className="max-w-5xl mx-auto p-4 py-6 min-h-screen">
      {/* Header Section */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div>
              <Skeleton className="h-6 w-32 mb-1" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>

      {/* Chat Container */}
      <div className="w-full max-w-7xl mx-auto h-[80vh] bg-[#bccff1] dark:bg-zinc-900 border-none shadow-lg rounded-lg">
        {/* Chat Messages Area */}
        <div className="h-[73vh] px-4 py-6 dark:bg-dot-white/[0.2] bg-dot-black/[0.2]">
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`flex ${
                  i % 2 === 0 ? "justify-end" : "justify-start"
                }`}
              >
                {i % 2 !== 0 && (
                  <Skeleton className="w-[55px] h-[55px] rounded-full mr-2 flex-shrink-0" />
                )}
                <div
                  className={`flex flex-row rounded-full border p-2 items-center space-x-2 ${
                    i % 2 === 0 ? "ml-auto" : ""
                  }`}
                >
                  <div className="bg-background rounded-full px-10 py-2">
                    <div className="flex flex-col">
                      <Skeleton className="h-3 w-20 mb-1" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  </div>
                </div>
                {i % 2 === 0 && (
                  <Skeleton className="w-[55px] h-[55px] rounded-full ml-2 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm flex gap-2">
          <div className="flex-1">
            <Skeleton className="h-10 w-full rounded-full" />
          </div>
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>
    </div>
  );
}
