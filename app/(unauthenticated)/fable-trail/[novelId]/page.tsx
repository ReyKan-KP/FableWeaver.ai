"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Clock,
  BookText,
  ChevronLeft,
  ChevronRight,
  Eye,
  MessageSquare,
  Heart,
  Share2,
  Menu,
  ChevronUp,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import ReadingStatus from "../_components/reading-status";
import BookmarkButton from "../_components/bookmark-button";
import ReadingProgress from "../_components/reading-progress";
import CommentsSection from "../_components/comments-section";
import { toast } from "sonner";
import Loading from "./loading";  

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
  description: string;
  genre: string;
  cover_image: string;
  chapter_count: number;
  total_words: number;
  is_published: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
  chapters: Chapter[];
}

export default function NovelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [novel, setNovel] = useState<Novel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [readingStatus, setReadingStatus] = useState<string | undefined>();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [sortAscending, setSortAscending] = useState(true);
  const [views, setViews] = useState<{
    total_views: number;
    unique_users: number;
  } | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    const fetchNovel = async () => {
      try {
        const response = await fetch(`/api/novels/${params.novelId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Only check if the novel is public
        if (!data.is_public) {
          router.push("/fable-trail");
          return;
        }

        setNovel(data);

        // Record view
        await fetch("/api/novel-views", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            novel_id: data.id,
          }),
        });

        // Fetch views
        const viewsResponse = await fetch(
          `/api/novel-views?novelId=${data.id}&period=all`
        );
        if (viewsResponse.ok) {
          const viewsData = await viewsResponse.json();
          setViews(viewsData);
        }

        // Fetch reading status if logged in
        if (session) {
          const statusResponse = await fetch(
            `/api/reading-status?novelId=${data.id}`
          );
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            if (statusData && statusData.length > 0) {
              setReadingStatus(statusData[0].status);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching novel:", error);
        router.push("/fable-trail");
      } finally {
        setIsLoading(false);
      }
    };

    if (params.novelId) {
      fetchNovel();
    }
  }, [params.novelId, router, session]);

  const handleChapterClick = (chapter: Chapter) => {
    router.push(`/fable-trail/${novel?.id}/chapter/${chapter.id}`);
  };

  if (isLoading) {
    return (
      <Loading />
    );
  }

  if (!novel) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <p className="text-gray-600 dark:text-gray-300">No novel found</p>
          <Link
            href="/fable-trail"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Return to Sanctum
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="max-w-7xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-3 gap-8"
        >
          <div className="md:col-span-1">
            <div className="sticky top-6 space-y-6">
              <Link
                href="/fable-trail"
                className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
              >
                <ChevronLeft className="w-5 h-5" />
                Return to Sanctum
              </Link>
              <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden shadow-lg">
                <Image
                  src={novel?.cover_image || "/images/default-cover.png"}
                  alt={novel?.title || "Default Novel"}
                  className="object-cover"
                  fill
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0">
                  <div className="absolute bottom-4 left-4 right-4">
                    <Badge variant="secondary" className="mb-2">
                      {novel?.genre}
                    </Badge>
                    <h1 className="text-2xl font-bold text-white mb-2">
                      {novel?.title}
                    </h1>
                    <div className="flex items-center gap-3 text-white/80 text-sm">
                      <div className="flex items-center gap-1">
                        <BookText className="w-4 h-4" />
                        {novel?.chapter_count} Chapters
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {views?.total_views || 0} Views
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  <p
                    className={
                      !showFullDescription ? "line-clamp-3" : undefined
                    }
                  >
                    {novel?.description}
                  </p>
                  {novel?.description && novel.description.length > 200 && (
                    <button
                      onClick={() =>
                        setShowFullDescription(!showFullDescription)
                      }
                      className="text-blue-600 dark:text-blue-400 hover:underline mt-2 text-sm font-medium"
                    >
                      {showFullDescription ? "Show Less" : "Show More"}
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <ReadingStatus
                    novelId={novel.id}
                    initialStatus={readingStatus}
                    onStatusChange={setReadingStatus}
                  />
                  <BookmarkButton novelId={novel.id} />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => {
                        navigator
                          .share?.({
                            title: novel.title,
                            text: novel.description,
                            url: window.location.href,
                          })
                          .catch(() => {
                            navigator.clipboard.writeText(window.location.href);
                            toast.success("Link copied to clipboard");
                          });
                      }}
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => {
                        // Implement like functionality
                      }}
                    >
                      <Heart className="w-4 h-4" />
                      Like
                    </Button>
                  </div>
                </div>

                <ReadingProgress
                  novelId={novel.id}
                  totalChapters={novel.chapter_count}
                />
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold">Chapters</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSortAscending(!sortAscending)}
                  className="gap-2"
                >
                  <ChevronUp className={cn("w-4 h-4 transition-transform", !sortAscending && "rotate-180")} />
                  {sortAscending ? "Oldest First" : "Newest First"}
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  const firstChapter = novel.chapters.find(
                    (ch) => ch.is_published
                  );
                  if (firstChapter) {
                    router.push(
                      `/fable-trail/${novel.id}/chapter/${firstChapter.id}`
                    );
                  }
                }}
              >
                <BookOpen className="w-4 h-4" />
                Start Reading
              </Button>
            </div>

            <div className="space-y-4">
              {novel?.chapters
                .filter((chapter) => chapter.is_published)
                .sort((a, b) => 
                  sortAscending 
                    ? a.chapter_number - b.chapter_number
                    : b.chapter_number - a.chapter_number
                )
                .map((chapter) => (
                  <motion.div
                    key={chapter.id}
                    whileHover={{ scale: 1.01 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
                    onClick={() => handleChapterClick(chapter)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold">
                        Chapter {chapter.chapter_number}: {chapter.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        {new Date(chapter.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 line-clamp-2">
                      {chapter.summary}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <BookText className="w-4 h-4" />
                        {chapter.word_count} words
                      </div>
                      {/* <BookmarkButton
                        novelId={novel.id}
                        chapterId={chapter.id}
                        chapterTitle={chapter.title}
                      /> */}
                    </div>
                  </motion.div>
                ))}
            </div>

            <div className="mt-12 border-t pt-8">
              <CommentsSection novelId={novel.id} />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
