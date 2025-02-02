"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { WavyBackground } from "@/components/ui/wavy-background";
import StoryWeaverLoading from "./loading";
import {
  Download,
  Book,
  Plus,
  ChevronRight,
  Loader2,
  Sparkles,
  BookOpen,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Novel {
  id: string;
  title: string;
  genre: string;
  description: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  chapter_count: number;
  cover_image?: string;
}

interface Chapter {
  id: string;
  novel_id: string;
  title: string;
  content: string;
  chapter_number: number;
  created_at: string;
  summary: string;
}

interface StoryState {
  prompt: string;
  genre: string;
  generatedContent: string;
  isGenerating: boolean;
  error: string | null;
}

const springTransition = {
  type: "spring",
  stiffness: 200,
  damping: 20,
};

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  hover: { scale: 1.02, transition: { duration: 0.2 } },
};

export default function StoryWeaver() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [novels, setNovels] = useState<Novel[]>([]);
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingNovel, setIsCreatingNovel] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newNovel, setNewNovel] = useState({
    title: "",
    genre: "fantasy",
    description: "",
  });
  const [storyState, setStoryState] = useState<StoryState>({
    prompt: "",
    genre: "fantasy",
    generatedContent: "",
    isGenerating: false,
    error: null,
  });
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/sign-in");
    } else if (session?.user?.id) {
      loadNovels();
    }
  }, [status, session]);

  const loadNovels = async () => {
    if (!session?.user?.id) return;

    try {
      const { data: novels, error } = await supabase
        .from("novels")
        .select("*")
        .eq("user_id", session.user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setNovels(novels || []);
    } catch (error) {
      console.error("Error loading novels:", error);
      toast({
        title: "Error",
        description: "Failed to load your novels",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadChapters = async (novelId: string) => {
    try {
      const { data: chapters, error } = await supabase
        .from("chapters")
        .select("*")
        .eq("novel_id", novelId)
        .order("chapter_number", { ascending: true });

      if (error) throw error;
      setChapters(chapters || []);
    } catch (error) {
      console.error("Error loading chapters:", error);
      toast({
        title: "Error",
        description: "Failed to load chapters",
        variant: "destructive",
      });
    }
  };

  const handleCreateNovel = async () => {
    if (!session?.user?.id) return;
    if (!newNovel.title.trim() || !newNovel.description.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingNovel(true);
    try {
      const { data: novel, error } = await supabase
        .from("novels")
        .insert([
          {
            title: newNovel.title,
            genre: newNovel.genre,
            description: newNovel.description,
            user_id: session.user.id,
            chapter_count: 0,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setNovels((prev) => [novel, ...prev]);
      setNewNovel({ title: "", genre: "fantasy", description: "" });
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Novel created successfully",
      });
    } catch (error) {
      console.error("Error creating novel:", error);
      toast({
        title: "Error",
        description: "Failed to create novel",
        variant: "destructive",
      });
    } finally {
      setIsCreatingNovel(false);
    }
  };

  const handleGenerateChapter = async () => {
    if (!selectedNovel || !storyState.prompt) return;

    setStoryState((prev) => ({
      ...prev,
      isGenerating: true,
      error: null,
    }));

    try {
      // Get previous chapter content for context
      const previousChapter = chapters[chapters.length - 1];

      const response = await fetch("/api/story-weaver/generate-chapter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          novelId: selectedNovel.id,
          prompt: storyState.prompt,
          previousChapter: previousChapter
            ? {
                content: previousChapter.content,
                summary: previousChapter.summary,
              }
            : null,
          chapterNumber: chapters.length + 1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate chapter");
      }

      // Update chapters list
      setChapters((prev) => [...prev, data.chapter]);

      // Reset state
      setStoryState((prev) => ({
        ...prev,
        prompt: "",
        generatedContent: data.chapter.content,
        isGenerating: false,
      }));

      toast({
        title: "Success",
        description: "New chapter generated successfully",
      });
    } catch (error) {
      console.error("Error generating chapter:", error);
      setStoryState((prev) => ({
        ...prev,
        isGenerating: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      }));
    }
  };

  if (status === "loading" || isLoading) {
    return <StoryWeaverLoading />;
  }

  return (
    // <WavyBackground className="min-h-screen py-8 bg-gradient-to-br from-background via-background/95 to-background/90">
    <div className="container mx-auto max-w-6xl py-16 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransition}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <motion.h1
            className="text-4xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 bg-clip-text text-transparent"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, ...springTransition }}
          >
            Story Weaver
          </motion.h1>
          <motion.p
            className="text-gray-600 dark:text-gray-300 mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Create and manage your novels with AI-powered storytelling
          </motion.p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                className="px-6 py-3 bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 text-white rounded-full 
                  hover:shadow-lg transform transition-all duration-300 font-semibold flex items-center gap-2
                  hover:brightness-110"
              >
                <Plus className="w-4 h-4" />
                Create New Novel
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 text-transparent bg-clip-text">
                Create New Novel
              </DialogTitle>
            </DialogHeader>
            <motion.div
              className="grid gap-4 py-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springTransition}
            >
              <div className="grid gap-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={newNovel.title}
                  onChange={(e) =>
                    setNewNovel((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="Enter novel title..."
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Genre</label>
                <Select
                  value={newNovel.genre}
                  onValueChange={(value) =>
                    setNewNovel((prev) => ({ ...prev, genre: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fantasy">Fantasy</SelectItem>
                    <SelectItem value="mystery">Mystery</SelectItem>
                    <SelectItem value="romance">Romance</SelectItem>
                    <SelectItem value="scifi">Science Fiction</SelectItem>
                    <SelectItem value="horror">Horror</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newNovel.description}
                  onChange={(e) =>
                    setNewNovel((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Enter novel description..."
                />
              </div>
              <Button
                onClick={handleCreateNovel}
                disabled={isCreatingNovel}
                className="w-full"
              >
                {isCreatingNovel ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating...</span>
                  </div>
                ) : (
                  "Create Novel"
                )}
              </Button>
            </motion.div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Novels List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={springTransition}
          className="space-y-4"
        >
          <motion.h2
            className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 bg-clip-text text-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Your Novels
          </motion.h2>
          <ScrollArea className="h-[600px] rounded-lg border border-gradient-to-r from-violet-500/20 via-blue-500/20 to-teal-500/20 p-4 bg-background/50 backdrop-blur-sm">
            <motion.div
              className="space-y-4"
              variants={staggerChildren}
              initial="initial"
              animate="animate"
            >
              {novels.map((novel) => (
                <motion.div
                  key={novel.id}
                  variants={cardVariants}
                  whileHover="hover"
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedNovel(novel);
                    loadChapters(novel.id);
                  }}
                >
                  <Card
                    className={cn(
                      "p-4 transition-all duration-300 bg-[#bccff1] dark:bg-zinc-900",
                      selectedNovel?.id === novel.id
                        ? " shadow-lg ring-2 ring-violet-500/20"
                        : "hover:border-violet-200 hover:shadow-md hover:bg-accent/5"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{novel.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {novel.genre} • {novel.chapter_count} chapters
                        </p>
                        <p className="text-sm mt-2 line-clamp-2">
                          {novel.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/story-weaver/${novel.id}`);
                          }}
                          className="h-8 w-8"
                        >
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </ScrollArea>
        </motion.div>

        {/* Chapter Generation and List */}
        <AnimatePresence mode="wait">
          {selectedNovel ? (
            <motion.div
              key="chapter-section"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={springTransition}
              className="space-y-4"
            >
              <div className="flex justify-between items-center">
                <motion.h2
                  className="text-2xl font-semibold bg-gradient-to-r from-violet-600 to-blue-600 text-transparent bg-clip-text"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  Chapters
                </motion.h2>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Button
                    variant="outline"
                    onClick={() => setSelectedNovel(null)}
                    className="text-sm hover:bg-accent/10"
                  >
                    Close Novel
                  </Button>
                </motion.div>
              </div>

              <Card className="p-4 bg-[#bccff1] dark:bg-zinc-900 backdrop-blur-sm border-gradient-to-r from-violet-500/20 via-blue-500/20 to-teal-500/20">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Chapter {chapters.length + 1} Prompt
                    </label>
                    <Textarea
                      placeholder="Describe what should happen in this chapter..."
                      value={storyState.prompt}
                      onChange={(e) =>
                        setStoryState((prev) => ({
                          ...prev,
                          prompt: e.target.value,
                        }))
                      }
                      className="h-32 bg-white/50 backdrop-blur-sm transition-all duration-200 focus:bg-white"
                    />
                  </div>

                  <Button
                    onClick={handleGenerateChapter}
                    disabled={storyState.isGenerating || !storyState.prompt}
                    className="w-full bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 text-white"
                  >
                    {storyState.isGenerating ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Generating chapter...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        <span>Generate Chapter</span>
                      </div>
                    )}
                  </Button>
                </div>
              </Card>

              <ScrollArea className="h-[400px] rounded-lg border border-gradient-to-r from-violet-500/20 via-blue-500/20 to-teal-500/20 p-4">
                <motion.div
                  className="space-y-4"
                  variants={staggerChildren}
                  initial="initial"
                  animate="animate"
                >
                  {chapters.map((chapter) => (
                    <motion.div
                      key={chapter.id}
                      variants={cardVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <Card className="p-4 hover:shadow-md transition-all duration-200 bg-[#bccff1] dark:bg-zinc-900">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold">
                            Chapter {chapter.chapter_number}
                          </h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Implement chapter view/edit functionality
                            }}
                          >
                            <BookOpen className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {chapter.summary}
                        </p>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </ScrollArea>
            </motion.div>
          ) : (
            <motion.div
              key="no-selection"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-full"
            >
              <motion.div
                className="text-center text-muted-foreground"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={springTransition}
              >
                <Book className="h-12 w-12 mx-auto mb-4 animate-pulse text-violet-500" />
                <p>Select a novel to view and create chapters</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    // </WavyBackground>
  );
}
