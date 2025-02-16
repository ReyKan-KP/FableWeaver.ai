"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollText, ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReadingProgressProps {
  novelId: string;
  chapterId?: string;
  totalChapters: number;
}

interface ReadingProgress {
  id: string;
  user_id: string;
  novel_id: string;
  chapter_id: string;
  progress_percentage: number;
  last_position: string;
  chapter: {
    id: string;
    title: string;
    chapter_number: number;
  };
}

interface ReadingStatus {
  id: string;
  user_id: string;
  novel_id: string;
  status: string;
  last_read_chapter_id: string;
  last_read_at: string;
}

interface Chapter {
  id: string;
  title: string;
  chapter_number: number;
}

export default function ReadingProgress({
  novelId,
  chapterId,
  totalChapters,
}: ReadingProgressProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [progress, setProgress] = useState<ReadingProgress[]>([]);
  const [readingStatus, setReadingStatus] = useState<ReadingStatus | null>(
    null
  );
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session) {
      Promise.all([
        fetchProgress(),
        fetchReadingStatus(),
        fetchChapters(),
      ]).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [session, novelId, chapterId]);

  const fetchProgress = async () => {
    try {
      const response = await fetch(`/api/reading-progress?novelId=${novelId}`);
      if (!response.ok) throw new Error("Failed to fetch progress");

      const data = await response.json();
      setProgress(data);
    } catch (error) {
      console.error("Error fetching progress:", error);
      toast.error("Failed to load reading progress");
    }
  };

  const fetchReadingStatus = async () => {
    try {
      const response = await fetch(`/api/reading-status?novelId=${novelId}`);
      if (!response.ok) throw new Error("Failed to fetch reading status");

      const data = await response.json();
      setReadingStatus(data[0] || null);
    } catch (error) {
      console.error("Error fetching reading status:", error);
      toast.error("Failed to load reading status");
    }
  };

  const fetchChapters = async () => {
    try {
      const response = await fetch(`/api/chapters?novelId=${novelId}`);
      if (!response.ok) throw new Error("Failed to fetch chapters");

      const data = await response.json();
      setChapters(data);
    } catch (error) {
      console.error("Error fetching chapters:", error);
      toast.error("Failed to load chapters");
    }
  };

  const calculateOverallProgress = () => {
    if (progress.length === 0 || chapters.length === 0) return 0;

    const completedChapters = progress.filter(
      (p) => p.progress_percentage === 100
    ).length;
    return Math.round((completedChapters / chapters.length) * 100);
  };

  const findNextChapter = () => {
    if (chapters.length === 0) return null;

    // Sort chapters by chapter number
    const sortedChapters = [...chapters].sort(
      (a, b) => a.chapter_number - b.chapter_number
    );

    // Get completed chapter IDs
    const completedChapterIds = new Set(
      progress
        .filter((p) => p.progress_percentage === 100)
        .map((p) => p.chapter_id)
    );

    // Find the first chapter that's not completed
    const nextChapter = sortedChapters.find(
      (chapter) => !completedChapterIds.has(chapter.id)
    );

    // If there's a chapter in progress, prioritize that
    const inProgressChapter = progress.find(
      (p) => p.progress_percentage > 0 && p.progress_percentage < 100
    );

    return inProgressChapter?.chapter || nextChapter || null;
  };

  const continueReading = () => {
    const nextChapter = findNextChapter();
    if (nextChapter) {
      router.push(`/fable-trail/${novelId}/chapter/${nextChapter.id}`);
    } else {
      toast.info("You've completed all chapters!");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-2 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ScrollText className="w-5 h-5" />
          <span className="font-medium">Reading Progress</span>
        </div>
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Sign in to track your reading progress
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/sign-in")}
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const overallProgress = calculateOverallProgress();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScrollText className="w-5 h-5" />
          <span className="font-medium">Reading Progress</span>
        </div>
        <span
          className={cn(
            "text-sm font-medium",
            overallProgress === 100
              ? "text-green-500 dark:text-green-400"
              : "text-muted-foreground"
          )}
        >
          {overallProgress}% Complete
        </span>
      </div>

      <Progress
        value={overallProgress}
        className={cn(
          "h-2",
          overallProgress === 100 &&
            "bg-green-100 dark:bg-green-900/20 [&>div]:bg-green-500 dark:[&>div]:bg-green-400"
        )}
      />

      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {progress.filter((p) => p.progress_percentage === 100).length} of{" "}
          {chapters.length} chapters read
        </div>
        <Button
          onClick={continueReading}
          className="gap-2"
          size="sm"
          disabled={overallProgress === 100}
        >
          {overallProgress === 100 ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Completed
            </>
          ) : (
            <>
              Continue Reading
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>

      {progress.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-3">Recent Progress</h3>
          <ScrollArea className="h-[200px]">
            <div className="space-y-3 pr-4">
              {progress
                .sort(
                  (a, b) => b.chapter.chapter_number - a.chapter.chapter_number
                )
                .map((p) => (
                  <div
                    key={p.chapter_id}
                    className="bg-muted/50 rounded-lg p-3 space-y-2 cursor-pointer hover:bg-muted/70 transition-colors"
                    onClick={() =>
                      router.push(
                        `/fable-trail/${novelId}/chapter/${p.chapter_id}`
                      )
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          Chapter {p.chapter.chapter_number}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "text-xs font-medium",
                          p.progress_percentage === 100
                            ? "text-green-500 dark:text-green-400"
                            : "text-muted-foreground"
                        )}
                      >
                        {p.progress_percentage}%
                      </span>
                    </div>
                    <h4 className="text-sm line-clamp-1">{p.chapter.title}</h4>
                    <Progress
                      value={p.progress_percentage}
                      className={cn(
                        "h-1",
                        p.progress_percentage === 100 &&
                          "bg-green-100 dark:bg-green-900/20 [&>div]:bg-green-500 dark:[&>div]:bg-green-400"
                      )}
                    />
                  </div>
                ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
