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
  Filter,
  SortAsc,
  Grid,
  List,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import Loading from "./loading";
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

type ViewMode = "grid" | "list";
type SortOption = "latest" | "popular" | "updated" | "chapters";

export default function ReadNovelPage() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "trending" | "latest">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("latest");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
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

  const allGenres = Array.from(new Set(novels.map((novel) => novel.genre)));

  const sortNovels = (novels: Novel[]) => {
    switch (sortBy) {
      case "popular":
        return [...novels].sort((a, b) => b.total_words - a.total_words);
      case "updated":
        return [...novels].sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      case "chapters":
        return [...novels].sort((a, b) => b.chapter_count - a.chapter_count);
      case "latest":
      default:
        return [...novels].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }
  };

  const filteredNovels = sortNovels(
    novels.filter((novel) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "trending" && novel.total_words > 10000) ||
        (filter === "latest" &&
          new Date(novel.created_at) >
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

      const matchesGenres =
        selectedGenres.length === 0 || selectedGenres.includes(novel.genre);

      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        novel.title.toLowerCase().includes(searchLower) ||
        novel.description.toLowerCase().includes(searchLower) ||
        novel.genre.toLowerCase().includes(searchLower);

      return matchesFilter && matchesSearch && matchesGenres && novel.is_public;
    })
  );

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
    isLoading ? (
      <Loading />
    ) : (
      <div className="">
        <div className="max-w-7xl mx-auto p-6">
          <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 p-2 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">
                  Fable Sanctum
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Discover Endless Stories in Our Sacred Library
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

          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <motion.div
                className="relative flex-1 w-full"
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
                  transition-all duration-300 bg-white dark:bg-gray-800 dark:text-gray-200"
                />
              </motion.div>

              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Filter className="w-4 h-4" />
                      Filter
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="p-2">
                      <h3 className="font-semibold mb-2">Genres</h3>
                      <div className="flex flex-wrap gap-2">
                        {allGenres.map((genre) => (
                          <Badge
                            key={genre}
                            variant={
                              selectedGenres.includes(genre)
                                ? "default"
                                : "outline"
                            }
                            className="cursor-pointer"
                            onClick={() => {
                              setSelectedGenres((prev) =>
                                prev.includes(genre)
                                  ? prev.filter((g) => g !== genre)
                                  : [...prev, genre]
                              );
                            }}
                          >
                            {genre}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setFilter("all")}
                      className={cn(filter === "all" && "bg-accent")}
                    >
                      All Novels
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setFilter("trending")}
                      className={cn(filter === "trending" && "bg-accent")}
                    >
                      Trending
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setFilter("latest")}
                      className={cn(filter === "latest" && "bg-accent")}
                    >
                      Latest
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <SortAsc className="w-4 h-4" />
                      Sort
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setSortBy("latest")}
                      className={cn(sortBy === "latest" && "bg-accent")}
                    >
                      Latest
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSortBy("popular")}
                      className={cn(sortBy === "popular" && "bg-accent")}
                    >
                      Most Popular
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSortBy("updated")}
                      className={cn(sortBy === "updated" && "bg-accent")}
                    >
                      Recently Updated
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSortBy("chapters")}
                      className={cn(sortBy === "chapters" && "bg-accent")}
                    >
                      Most Chapters
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setViewMode(viewMode === "grid" ? "list" : "grid")
                  }
                  className="gap-2"
                >
                  {viewMode === "grid" ? (
                    <Grid className="w-4 h-4" />
                  ) : (
                    <List className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[calc(100vh-12rem)]">
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className={cn(
                  "gap-6",
                  viewMode === "grid"
                    ? "grid md:grid-cols-2 lg:grid-cols-3"
                    : "space-y-4"
                )}
              >
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden",
                          viewMode === "list" && "flex gap-4"
                        )}
                      >
                        <Skeleton
                          className={cn(
                            "bg-gray-200 dark:bg-gray-700",
                            viewMode === "grid"
                              ? "h-48 w-full"
                              : "h-32 w-24 rounded-l-xl"
                          )}
                        />
                        <div className="p-4 flex-1">
                          <Skeleton className="h-6 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-1/4 mb-4" />
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-2/3" />
                        </div>
                      </div>
                    ))
                  : filteredNovels.map((novel) => (
                      <motion.div
                        key={novel.id}
                        variants={item}
                        className={cn(
                          "bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300",
                          viewMode === "list" && "flex gap-4"
                        )}
                      >
                        <Link
                          href={`/fable-trail/${novel.id}`}
                          className={cn(
                            "block relative",
                            viewMode === "grid"
                              ? "h-48 w-full"
                              : "h-32 w-24 flex-shrink-0"
                          )}
                        >
                          <Image
                            src={
                              novel.cover_image || "/images/default-cover.png"
                            }
                            alt={novel.title}
                            className="object-contain"
                            fill
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
                            <div className="absolute bottom-2 left-2 right-2">
                              <span className="text-white text-sm font-medium">
                                Read Now
                              </span>
                            </div>
                          </div>
                        </Link>
                        <div className="p-4 flex-1">
                          <div className="flex justify-between items-start gap-2">
                            <Link
                              href={`/fable-trail/${novel.id}`}
                              className="text-lg font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1"
                            >
                              {novel.title}
                            </Link>
                            <Badge variant="secondary">{novel.genre}</Badge>
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                            {novel.description}
                          </p>
                          <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <BookText className="w-4 h-4" />
                              {publishedChapterCounts[novel.id] || 0} Chapters
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(novel.updated_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
              </motion.div>
            </ScrollArea>
          </div>
        </motion.div>
      </div>

      <Dialog open={isHelpDialogOpen} onOpenChange={setIsHelpDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">
              Welcome to Fable Sanctum
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">About Fable Sanctum</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Fable Sanctum is your gateway to a world of captivating stories.
                Discover, read, and immerse yourself in a diverse collection of
                novels from talented writers around the globe.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Features</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex items-start gap-2">
                  <Search className="w-5 h-5 text-blue-500 mt-1" />
                  <div>
                    <h4 className="font-medium">Smart Search</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Find novels by title, genre, or description
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Filter className="w-5 h-5 text-purple-500 mt-1" />
                  <div>
                    <h4 className="font-medium">Advanced Filters</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Filter by genre, popularity, and more
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <BookOpen className="w-5 h-5 text-teal-500 mt-1" />
                  <div>
                    <h4 className="font-medium">Reading Progress</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Track your reading journey
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <BookText className="w-5 h-5 text-amber-500 mt-1" />
                  <div>
                    <h4 className="font-medium">Chapter Navigation</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Easy access to all chapters
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Getting Started</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>Browse through our collection using filters and search</li>
                <li>Click on a novel to view its details</li>
                <li>Start reading from any chapter</li>
                <li>Track your progress and bookmark favorite chapters</li>
                <li>Join the community by leaving comments</li>
              </ol>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
  );
}
