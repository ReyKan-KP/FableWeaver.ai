"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BookOpen,
  Clock,
  BookText,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import BookmarkButton from "../../../_components/bookmark-button";
import CommentsSection from "../../../_components/comments-section";
import { toast } from "sonner";

interface Chapter {
  id: string;
  title: string;
  content: string;
  summary: string;
  chapter_number: number;
  word_count: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface Novel {
  id: string;
  title: string;
  chapters: Chapter[];
}

export default function ChapterPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch novel data
        const novelResponse = await fetch(`/api/novels/${params.novelId}`);
        if (!novelResponse.ok) throw new Error("Failed to fetch novel");
        const novelData = await novelResponse.json();
        setNovel(novelData);

        // Fetch chapter data
        const chapterResponse = await fetch(
          `/api/novels/${params.novelId}/chapters/${params.chapterId}`
        );
        if (!chapterResponse.ok) {
          const error = await chapterResponse.json();
          throw new Error(error.error || "Failed to fetch chapter");
        }
        const chapterData = await chapterResponse.json();
        setChapter(chapterData);

        // Update reading status and progress if user is logged in
        if (session?.user) {
          await Promise.all([
            updateReadingStatus(
              params.novelId as string,
              params.chapterId as string
            ),
            updateReadingProgress(
              params.novelId as string,
              params.chapterId as string
            ),
          ]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load chapter");
        router.push(`/fable-trail/${params.novelId}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.novelId && params.chapterId) {
      fetchData();
    }
  }, [params.novelId, params.chapterId, router, session]);

  // Function to update reading status
  const updateReadingStatus = async (novelId: string, chapterId: string) => {
    try {
      const response = await fetch("/api/reading-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          novel_id: novelId,
          status: "reading",
          last_read_chapter_id: chapterId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update reading status");
      }
    } catch (error) {
      console.error("Error updating reading status:", error);
      toast.error("Failed to update reading progress");
    }
  };

  // Function to update reading progress
  const updateReadingProgress = async (novelId: string, chapterId: string) => {
    try {
      const response = await fetch("/api/reading-progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          novel_id: novelId,
          chapter_id: chapterId,
          progress_percentage: 0, // Start at 0% when opening chapter
          last_position: "start", // Initial position
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update reading progress");
      }
    } catch (error) {
      console.error("Error updating reading progress:", error);
      toast.error("Failed to update reading progress");
    }
  };

  // Function to update progress while reading
  const updateProgress = async (percentage: number, position: string) => {
    if (!session?.user || !novel || !chapter) return;

    try {
      const response = await fetch("/api/reading-progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          novel_id: novel.id,
          chapter_id: chapter.id,
          progress_percentage: percentage,
          last_position: position,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update reading progress");
      }
    } catch (error) {
      console.error("Error updating reading progress:", error);
      // Don't show toast for progress updates to avoid spamming
    }
  };

  const navigateChapter = async (direction: "prev" | "next") => {
    if (!chapter || !novel || !session?.user) return;

    const currentIndex = novel.chapters.findIndex((ch) => ch.id === chapter.id);
    const nextIndex =
      direction === "next" ? currentIndex + 1 : currentIndex - 1;

    if (nextIndex >= 0 && nextIndex < novel.chapters.length) {
      const nextChapter = novel.chapters[nextIndex];

      // Update reading status and progress before navigation
      await Promise.all([
        updateReadingStatus(novel.id, nextChapter.id),
        updateReadingProgress(novel.id, nextChapter.id),
      ]);

      // Navigate to next chapter
      router.push(`/fable-trail/${novel.id}/chapter/${nextChapter.id}`);
    }
  };

  // Handle chapter selection from sidebar
  const handleChapterSelect = async (chapterId: string) => {
    if (!novel || !session?.user) return;

    // Update reading status and progress before navigation
    await Promise.all([
      updateReadingStatus(novel.id, chapterId),
      updateReadingProgress(novel.id, chapterId),
    ]);

    // Navigate to selected chapter
    router.push(`/fable-trail/${novel.id}/chapter/${chapterId}`);
    setIsSidebarOpen(false);
  };

  // Add scroll event listener to track reading progress
  useEffect(() => {
    if (!session?.user || !chapter) return;

    const handleScroll = () => {
      const element = document.documentElement;
      const totalHeight = element.scrollHeight - element.clientHeight;
      const scrollPosition = element.scrollTop;
      const percentage = Math.round((scrollPosition / totalHeight) * 100);

      // Update progress when scrolling
      if (percentage > 0) {
        updateProgress(percentage, `scroll_position_${scrollPosition}`);
      }
    };

    // Throttle the scroll event to avoid too many updates
    let timeoutId: NodeJS.Timeout;
    const throttledScroll = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, 1000); // Update every second while scrolling
    };

    window.addEventListener("scroll", throttledScroll);

    // Update to 100% when reaching the bottom
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            updateProgress(100, "completed");
          }
        });
      },
      { threshold: 1.0 }
    );

    const footer = document.querySelector("footer");
    if (footer) {
      observer.observe(footer);
    }

    return () => {
      window.removeEventListener("scroll", throttledScroll);
      if (footer) {
        observer.unobserve(footer);
      }
    };
  }, [session, chapter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading chapter...</p>
        </div>
      </div>
    );
  }

  if (!novel || !chapter) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <p className="text-gray-600 dark:text-gray-300">Chapter not found</p>
          <Link
            href={`/fable-trail/${params.novelId}`}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Back to Novel
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <header className="z-50 sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href={`/fable-trail/${novel.id}`}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Novel
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateChapter("prev")}
              disabled={
                novel.chapters[0]?.chapter_number === chapter.chapter_number
              }
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-gray-600 dark:text-gray-300">
              Chapter {chapter.chapter_number}
            </span>
            <button
              onClick={() => navigateChapter("next")}
              disabled={
                novel.chapters[novel.chapters.length - 1]?.chapter_number ===
                chapter.chapter_number
              }
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[540px]">
              <SheetHeader>
                <SheetTitle>Chapters</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-5rem)] mt-4">
                <div className="space-y-4">
                  {novel.chapters
                    .filter((ch) => ch.is_published)
                    .map((ch) => (
                      <motion.div
                        key={ch.id}
                        whileHover={{ scale: 1.01 }}
                        className={cn(
                          "p-4 rounded-lg cursor-pointer",
                          ch.id === chapter.id
                            ? "bg-blue-50 dark:bg-blue-900/20"
                            : "bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800"
                        )}
                        onClick={() => {
                          handleChapterSelect(ch.id);
                        }}
                      >
                        <h3 className="text-lg font-semibold mb-2">
                          Chapter {ch.chapter_number}: {ch.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                          {ch.summary}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
                          <BookText className="w-4 h-4" />
                          {ch.word_count} words
                        </div>
                      </motion.div>
                    ))}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-20 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <h1 className="text-3xl font-bold text-center mb-2">
              {chapter.title}
            </h1>
            <div className="flex justify-center items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-8">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {new Date(chapter.updated_at).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <BookText className="w-4 h-4" />
                {chapter.word_count} words
              </div>
              <BookmarkButton
                novelId={novel.id}
                chapterId={chapter.id}
                chapterTitle={chapter.title}
              />
            </div>
            <div className="whitespace-pre-wrap leading-relaxed">
              {chapter.content}
            </div>
          </div>

          <div className="mt-12 border-t pt-8">
            <CommentsSection chapterId={chapter.id} />
          </div>
        </motion.div>
      </main>
    </div>
  );
}
