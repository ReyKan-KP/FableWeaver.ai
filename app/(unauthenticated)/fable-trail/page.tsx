"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  BookOpen,
  Clock,
  BookText,
  Info,
  HelpCircle,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
}

export default function ReadNovelPage() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "trending" | "latest">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const { data: session } = useSession();

  // Add state for published chapter counts
  const [publishedChapterCounts, setPublishedChapterCounts] = useState<{
    [key: string]: number;
  }>({});

  useEffect(() => {
    const fetchNovels = async () => {
      try {
        setError(null);
        const response = await fetch("/api/novels");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setNovels(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching novels:", error);
        setError("Failed to load novels. Please try again later.");
        setNovels([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNovels();
  }, []);

  // Fetch published chapter counts
  useEffect(() => {
    const fetchPublishedChapterCounts = async () => {
      try {
        const response = await fetch("/api/novels/published-chapters");
        const data = await response.json();
        setPublishedChapterCounts(data);
      } catch (error) {
        console.error("Error fetching published chapter counts:", error);
      }
    };

    if (novels.length > 0) {
      fetchPublishedChapterCounts();
    }
  }, [novels]);

  const filteredNovels = novels.filter((novel) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "trending" && novel.total_words > 10000) ||
      (filter === "latest" &&
        new Date(novel.created_at) >
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === "" ||
      novel.title.toLowerCase().includes(searchLower) ||
      novel.description.toLowerCase().includes(searchLower) ||
      novel.genre.toLowerCase().includes(searchLower);

    return matchesFilter && matchesSearch && novel.is_public;
  });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  return (
    <div className="max-w-7xl mx-auto p-6 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">
                Fable Sanctum
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                The Sacred Space Between Stories
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsHelpDialogOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <HelpCircle className="w-6 h-6" />
            </motion.button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center">
          <motion.div
            className="relative flex-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search novels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 
              focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent 
              transition-all duration-300 bg-white dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-400"
            />
          </motion.div>
          <motion.div
            className="flex gap-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            {["all", "trending", "latest"].map((filterType) => (
              <motion.button
                key={filterType}
                onClick={() => setFilter(filterType as typeof filter)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "px-4 py-2 rounded-full transition-all duration-300",
                  filter === filterType
                    ? "bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                )}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </motion.button>
            ))}
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        {filteredNovels.map((novel) => (
          <motion.div
            key={novel.id}
            variants={item}
            whileHover={{ scale: 1.02 }}
            className="bg-[#bccff1] dark:bg-zinc-900 rounded-xl shadow-md overflow-hidden hover:shadow-xl 
            transition-all duration-300 border border-gray-100 dark:border-gray-700"
          >
            <Link href={`/fable-trail/${novel.id}`}>
              <div className="relative h-48 w-full p-[1px]">
                <div className="absolute inset-0 bg-dot-white/[0.2] dark:bg-dot-black/[0.2]"></div>
                <Image
                  src={novel.cover_image || "/images/default-cover.png"}
                  alt={novel.title}
                  className="w-full h-full object-contain"
                  width={500}
                  height={500}
                />
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">
                    {novel.title}
                  </h2>
                  <span className="px-3 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full">
                    {novel.genre}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2 min-h-[3rem]">
                  {novel.description}
                </p>
                <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <BookText className="w-4 h-4" />
                    {publishedChapterCounts[novel.id] || 0} Published Chapters
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {new Date(novel.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {filteredNovels.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 max-w-md mx-auto">
            <p className="text-gray-600 dark:text-gray-300 text-lg mb-4">
              No novels found matching your criteria.
            </p>
          </div>
        </motion.div>
      )}

      {/* Help Dialog */}
      <Dialog open={isHelpDialogOpen} onOpenChange={setIsHelpDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">
              How Novel Library Works
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                What is Novel Library?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Novel Library is your gateway to discovering and reading amazing
                stories from talented writers. Browse through our collection of
                public novels and immerse yourself in captivating narratives!
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Features
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>Browse through a diverse collection of novels</li>
                <li>Filter by trending or latest releases</li>
                <li>Search for specific titles, genres, or descriptions</li>
                <li>Track reading progress</li>
                <li>Access chapter-by-chapter content</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                How to Use
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>Browse the available novels</li>
                <li>Use filters to find novels that interest you</li>
                <li>Click on a novel to start reading</li>
                <li>Navigate through chapters</li>
                <li>Track your reading progress automatically</li>
              </ol>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Tips
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>Use the search bar to find specific novels</li>
                <li>Check the &quot;Trending&quot; filter for popular reads</li>
                <li>Use the &quot;Latest&quot; filter for new releases</li>
                <li>Click on genres to discover similar novels</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
