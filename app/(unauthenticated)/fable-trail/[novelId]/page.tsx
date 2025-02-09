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
  Info,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";

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
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [isChapterView, setIsChapterView] = useState(false);
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
  }, [params.novelId, router]);

  const handleChapterClick = (chapter: Chapter) => {
    setCurrentChapter(chapter);
    setIsChapterView(true);
  };

  const handleBackToChapters = () => {
    setIsChapterView(false);
    setCurrentChapter(null);
  };

  const navigateChapter = (direction: "prev" | "next") => {
    if (!currentChapter || !novel) return;

    const currentIndex = novel.chapters.findIndex(
      (ch) => ch.id === currentChapter.id
    );
    const nextIndex =
      direction === "next" ? currentIndex + 1 : currentIndex - 1;

    if (nextIndex >= 0 && nextIndex < novel.chapters.length) {
      setCurrentChapter(novel.chapters[nextIndex]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading novel...</p>
        </div>
      </div>
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

  if (isChapterView && currentChapter) {
    return (
      <div className="max-w-4xl mx-auto p-6 min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={handleBackToChapters}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Back to Chapters
            </button>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigateChapter("prev")}
                disabled={
                  novel?.chapters[0]?.chapter_number ===
                  currentChapter.chapter_number
                }
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-gray-600 dark:text-gray-300">
                Chapter {currentChapter.chapter_number}
              </span>
              <button
                onClick={() => navigateChapter("next")}
                disabled={
                  novel?.chapters[novel?.chapters.length - 1]
                    ?.chapter_number === currentChapter.chapter_number
                }
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <h1 className="text-3xl font-bold text-center mb-2">
              {currentChapter.title}
            </h1>
            <div className="flex justify-center items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-8">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {new Date(currentChapter.updated_at).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <BookText className="w-4 h-4" />
                {currentChapter.word_count} words
              </div>
            </div>
            <div className="whitespace-pre-wrap">{currentChapter.content}</div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 min-h-screen">
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
              Back to Sanctum
            </Link>
            <div className="relative aspect-[2/3] w-full">
              <Image
                src={novel?.cover_image || "/images/default-cover.png"}
                alt={novel?.title || "Default Novel"}
                className="rounded-lg object-cover"
                fill
              />
            </div>
            <div className="space-y-4">
              <h1 className="text-2xl font-bold">{novel?.title}</h1>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full">
                  {novel?.genre}
                </span>
              </div>

              <p className="text-gray-600 dark:text-gray-300">
                {novel?.description}
              </p>
              <div className="flex flex-col gap-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <BookText className="w-4 h-4" />
                  {novel?.chapter_count} Chapters
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Updated{" "}
                  {new Date(novel?.updated_at || "").toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold">Chapters</h2>
          <div className="space-y-4">
            {(novel?.chapters || [])
              .filter((chapter) => chapter.is_published)
              .map((chapter) => (
                <motion.div
                  key={chapter.id}
                  whileHover={{ scale: 1.01 }}
                  className="bg-[#bccff1] dark:bg-zinc-900 rounded-lg p-4 cursor-pointer"
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
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
                    <BookText className="w-4 h-4" />
                    {chapter.word_count} words
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
