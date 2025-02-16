"use client";

import { useState, useEffect, useRef } from "react";
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
  HelpCircle,
  Search,
  Pencil,
  X,
  Upload,
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
import Image from "next/image";

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
  is_published: boolean;
  total_words: number;
  metadata?: any;
  is_public: boolean;
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
  const [editingNovel, setEditingNovel] = useState<Novel | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [novelImage, setNovelImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [removeImage, setRemoveImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newNovel, setNewNovel] = useState({
    title: "",
    genre: "fantasy",
    description: "",
    is_public: true,
    cover_image: "",
    // metadata: {
    //   target_audience: "",
    //   language: "English",
    //   themes: [""],
    // },
  });
  const [storyState, setStoryState] = useState<StoryState>({
    prompt: "",
    genre: "fantasy",
    generatedContent: "",
    isGenerating: false,
    error: null,
  });
  const supabase = createBrowserSupabaseClient();
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [filter, setFilter] = useState<"all" | "published" | "drafts">("all");

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

  const handleImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file (JPEG, PNG, etc.)",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image size should be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      setIsUploadingImage(true);
      try {
        // Create a temporary preview
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);

        // Simulate a delay to show loading state (remove in production)
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setNovelImage(file);
        setRemoveImage(false);
      } catch (error) {
        console.error("Error processing image:", error);
        toast({
          title: "Error",
          description: "Failed to process image. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  const handleRemoveImage = () => {
    setNovelImage(null);
    setImagePreview("");
    setRemoveImage(true);
  };

  const handleEditClick = (novel: Novel) => {
    setEditingNovel(novel);
    setNewNovel({
      title: novel.title,
      genre: novel.genre,
      description: novel.description,
      is_public: novel.is_public,
      cover_image: novel.cover_image || "",
    });
    setImagePreview(novel.cover_image || "");
    setIsEditDialogOpen(true);
  };

  const handleCreateNovel = async () => {
    if (!session?.user?.id) return;
    if (!newNovel.title.trim() || !newNovel.description.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingNovel(true);
    try {
      const formData = new FormData();
      formData.append("user_id", session.user.id);
      formData.append("title", newNovel.title);
      formData.append("genre", newNovel.genre);
      formData.append("description", newNovel.description);
      formData.append("is_public", "false");

      if (novelImage) {
        formData.append("cover_image", novelImage);
      }

      if (removeImage) {
        formData.append("removeImage", "true");
      }

      const url = editingNovel
        ? `/api/novels/${editingNovel.id}`
        : "/api/novels";
      const method = editingNovel ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save novel");
      }

      if (editingNovel) {
        setNovels(novels.map((n) => (n.id === editingNovel.id ? data : n)));
      } else {
        setNovels([data, ...novels]);
        toast({
          title: "Novel created",
          description:
            "Your novel has been created successfully. Once you publish it, an admin will review it to make it public.",
        });
      }

      setNewNovel({
        title: "",
        genre: "fantasy",
        description: "",
        is_public: false,
        cover_image: "",
      });
      setNovelImage(null);
      setImagePreview("");
      setRemoveImage(false);
      setIsDialogOpen(false);
      setIsEditDialogOpen(false);
      setEditingNovel(null);
    } catch (error) {
      console.error("Error saving novel:", error);
      toast({
        title: "Error",
        description: "Failed to save novel",
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

  const filteredNovels = novels.filter((novel) => {
    const matchesFilter =
      filter === "all"
        ? true
        : filter === "published"
          ? novel.is_published
          : !novel.is_published;

    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === "" ||
      novel.title.toLowerCase().includes(searchLower) ||
      novel.description.toLowerCase().includes(searchLower) ||
      novel.genre.toLowerCase().includes(searchLower);

    return matchesFilter && matchesSearch;
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

  if (status === "loading" || isLoading) {
    return <StoryWeaverLoading />;
  }

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
                Story Weaver
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Create and manage your collection of novels
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowHelpModal(true)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <HelpCircle className="w-6 h-6" />
            </motion.button>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Dialog
              open={isDialogOpen || isEditDialogOpen}
              onOpenChange={(open) => {
                if (open) {
                  setIsDialogOpen(true);
                } else {
                  setIsDialogOpen(false);
                  setIsEditDialogOpen(false);
                  setEditingNovel(null);
                  setNewNovel({
                    title: "",
                    genre: "fantasy",
                    description: "",
                    is_public: true,
                    cover_image: "",
                  });
                  setNovelImage(null);
                  setImagePreview("");
                  setRemoveImage(false);
                }
              }}
            >
              <DialogTrigger asChild>
                <button
                  className="px-6 py-3 bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 text-white rounded-full 
                  hover:shadow-lg transform transition-all duration-300 font-semibold flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Weave New Novel
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">
                    {editingNovel ? "Edit Novel" : "Weave New Novel"}
                  </DialogTitle>
                </DialogHeader>
                <motion.div
                  className="space-y-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {/* Cover Image Section */}
                  <motion.div
                    className="flex flex-col items-center space-y-4 p-6 bg-[#bccff1] dark:bg-zinc-900 rounded-lg"
                    whileHover={{ scale: 1.02 }}
                  >
                    <motion.div
                      className="relative"
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className="h-48 w-48 relative rounded-lg overflow-hidden border-2 border-white dark:border-gray-800">
                        {isUploadingImage ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="h-8 w-8 animate-spin text-white" />
                              <span className="text-sm text-white">
                                Processing image...
                              </span>
                            </div>
                          </div>
                        ) : null}
                        {imagePreview ? (
                          <Image
                            src={imagePreview}
                            alt="Novel cover"
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500">
                            <Book className="h-16 w-16 text-white" />
                          </div>
                        )}
                        {imagePreview && !isUploadingImage && (
                          <motion.button
                            type="button"
                            onClick={handleRemoveImage}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <X className="h-4 w-4" />
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                    <motion.div
                      className="flex items-center space-x-2"
                      whileHover={{ scale: 1.05 }}
                    >
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                          "px-4 py-2 bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 text-white rounded-full hover:shadow-lg",
                          "transition-all duration-300 flex items-center gap-2",
                          isUploadingImage && "opacity-50 cursor-not-allowed"
                        )}
                        disabled={isUploadingImage}
                      >
                        {isUploadingImage ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            {imagePreview
                              ? "Change Cover Image"
                              : "Upload Cover Image"}
                          </>
                        )}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        disabled={isUploadingImage}
                      />
                    </motion.div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Recommended: Square image, at least 300x300px
                    </p>
                  </motion.div>

                  {/* Novel Details Form */}
                  <div className="space-y-4">
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
                        required
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
                          <SelectItem value="thriller">Thriller</SelectItem>
                          <SelectItem value="historical">Historical</SelectItem>
                          <SelectItem value="literary">
                            Literary Fiction
                          </SelectItem>
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
                        required
                        className="h-32"
                      />
                    </div>

                    {/* <div className="grid gap-2">
                      <label className="text-sm font-medium">
                        Target Audience
                      </label>
                      <Input
                        value={newNovel.metadata.target_audience}
                        onChange={(e) =>
                          setNewNovel((prev) => ({
                            ...prev,
                            metadata: {
                              ...prev.metadata,
                              target_audience: e.target.value,
                            },
                          }))
                        }
                        placeholder="E.g., Young Adult, Adult, Children..."
                      />
                    </div> */}

                    {/* <div className="grid gap-2">
                      <label className="text-sm font-medium">Language</label>
                      <Select
                        value={newNovel.metadata.language}
                        onValueChange={(value) =>
                          setNewNovel((prev) => ({
                            ...prev,
                            metadata: { ...prev.metadata, language: value },
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="English">English</SelectItem>
                          <SelectItem value="Spanish">Spanish</SelectItem>
                          <SelectItem value="French">French</SelectItem>
                          <SelectItem value="German">German</SelectItem>
                          <SelectItem value="Chinese">Chinese</SelectItem>
                          <SelectItem value="Japanese">Japanese</SelectItem>
                        </SelectContent>
                      </Select>
                    </div> */}

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newNovel.is_public}
                        onChange={(e) =>
                          setNewNovel((prev) => ({
                            ...prev,
                            is_public: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 text-blue-500 dark:text-blue-400 border-gray-300 dark:border-gray-700 rounded focus:ring-blue-500 dark:focus:ring-blue-400"
                      />
                      <label className="text-sm font-medium">
                        Make this novel public
                      </label>
                    </div>
                  </div>

                  <Button
                    onClick={handleCreateNovel}
                    disabled={isCreatingNovel}
                    className="w-full py-6 bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 text-white hover:shadow-lg"
                  >
                    {isCreatingNovel ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>
                          {editingNovel ? "Updating..." : "Creating..."}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        <span>
                          {editingNovel ? "Update Novel" : "Create Novel"}
                        </span>
                      </div>
                    )}
                  </Button>
                </motion.div>
              </DialogContent>
            </Dialog>
          </motion.div>
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
            {["all", "published", "drafts"].map((filterType) => (
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
            transition-all duration-300 border border-gray-100 dark:border-gray-700 cursor-pointer"
            onClick={() => router.push(`/story-weaver/${novel.id}`)}
          >
            <div className="relative h-48 w-full p-[1px]">
              <div className="absolute inset-0 bg-dot-white/[0.2] dark:bg-dot-black/[0.2]"></div>
              <Image
                src={novel.cover_image || "/images/default-novel.png"}
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
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-1 justify-end">
                    <span
                      className="px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 
                      text-purple-800 dark:text-purple-300 rounded-full whitespace-nowrap capitalize"
                    >
                      {novel.genre}
                    </span>
                  </div>
                  <div className="flex gap-1 justify-end">
                    {novel.is_published && (
                      <span className="px-3 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full">
                        Published
                      </span>
                    )}
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(novel);
                        }}
                        className="p-1 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 
                        bg-blue-100 dark:bg-blue-900/30 rounded-full transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2 min-h-[3rem]">
                {novel.description}
              </p>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Book className="w-4 h-4" />
                  <span>{novel.chapter_count} chapters</span>
                  <span>•</span>
                  <span>{novel.total_words} words</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>
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
            <Book className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-300 text-lg mb-4">
              {filter === "drafts"
                ? "You don't have any draft novels yet."
                : filter === "published"
                  ? "You haven't published any novels yet."
                  : "No novels found."}
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsDialogOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 
              text-white rounded-full hover:shadow-lg transform transition-all duration-300"
            >
              Create Your First Novel
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Help Modal */}
      <Dialog open={showHelpModal} onOpenChange={setShowHelpModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 bg-clip-text text-transparent flex items-center gap-2">
              <Book className="w-6 h-6" />
              How to Use Story Weaver
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 p-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                What is Story Weaver?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Story Weaver is your creative writing companion that helps you
                craft and manage your novels. With AI-powered assistance, you
                can bring your stories to life chapter by chapter.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Key Features
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>Create and manage multiple novels</li>
                <li>AI-assisted chapter generation</li>
                <li>Track word count and progress</li>
                <li>Organize chapters and storylines</li>
                <li>Export your novels to various formats</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Getting Started
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>Click &quot;Weave New Novel&quot; to create your story</li>
                <li>Fill in the novel details and add a cover image</li>
                <li>Generate chapters with AI assistance</li>
                <li>Edit and refine your content</li>
                <li>Publish when you&apos;re ready to share</li>
              </ol>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Tips
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>Use the search bar to find specific novels</li>
                <li>Filter between all, published, and draft novels</li>
                <li>Add cover images to make your novels stand out</li>
                <li>Keep your chapters organized and well-structured</li>
                <li>Save your work regularly</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
