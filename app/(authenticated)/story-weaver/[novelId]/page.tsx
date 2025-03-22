"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence, AnimateSharedLayout } from "framer-motion";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Book,
  ChevronLeft,
  Download,
  Edit,
  History,
  Loader2,
  MoreVertical,
  Plus,
  Share,
  Sparkles,
  Tag,
  Trash,
  Users,
  BookOpen,
  ArrowLeft,
  Search,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  HelpCircle,
  Info,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import ChapterView from "./_components/chapter-view";
import ExportButton from "./_components/export-button";
import Collaborators from "./_components/collaboraters";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

interface Novel {
  id: string;
  title: string;
  genre: string;
  description: string;
  chapter_count: number;
  total_words: number;
  is_published: boolean;
  cover_image?: string;
  created_at: string;
  updated_at: string;
  last_chapter_at: string;
  metadata: any;
  is_public: boolean;
  status: string;
}

interface Chapter {
  id: string;
  novel_id: string;
  title: string;
  content: string;
  summary: string;
  chapter_number: number;
  word_count: number;
  is_published: boolean;
  version: number;
  created_at: string;
  updated_at: string;
  metadata: any;
  is_public: boolean;
}

interface ChapterRevision {
  id: string;
  chapter_id: string;
  content: string;
  summary: string;
  version: number;
  created_at: string;
  created_by: string;
}

interface Collaborator {
  id: string;
  user_id: string;
  role: "editor" | "viewer";
  created_at: string;
  user: {
    name: string;
    email: string;
    image?: string;
  };
}

interface Character {
  id: string;
  novel_id: string;
  name: string;
  role: 'main_character' | 'main_lead' | 'side_character' | 'extra';
  description: string;
  background: string;
  personality: string;
  physical_description: string;
  created_at: string;
  updated_at: string;
}

interface CharacterProgression {
  id: string;
  novel_id: string;
  chapter_id: string;
  character_id: string;
  development: string;
  relationships_changes: string;
  plot_impact: string;
  created_at: string;
  character: Character;
}

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

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

export default function NovelView() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [chapterRevisions, setChapterRevisions] = useState<ChapterRevision[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [showRevisionHistory, setShowRevisionHistory] = useState(false);
  const [suggestions, setSuggestions] = useState<{
    plotSuggestions: string[];
    characterSuggestions: string[];
    storyDirection: string;
  } | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredChapters, setFilteredChapters] = useState<Chapter[]>([]);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [sortField, setSortField] = useState<"chapter_number" | "updated_at">("updated_at");
  const [currentPage, setCurrentPage] = useState(1);
  const chaptersPerPage = 5;
  const supabase = createBrowserSupabaseClient();
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [characterProgressions, setCharacterProgressions] = useState<CharacterProgression[]>([]);
  const [showAddCharacter, setShowAddCharacter] = useState(false);
  const [newCharacter, setNewCharacter] = useState<Partial<Character>>({
    name: '',
    role: 'side_character',
    description: '',
    background: '',
    personality: '',
    physical_description: ''
  });
  const [publishFilter, setPublishFilter] = useState<"all" | "published" | "draft">("all");
  const [showPublishConfirmDialog, setShowPublishConfirmDialog] = useState(false);
  const [isPublishingNovel, setIsPublishingNovel] = useState(false);

  const loadChapterRevisions = async (chapterId: string) => {
    try {
      const { data: revisions, error } = await supabase
        .from("chapter_revisions")
        .select("*")
        .eq("chapter_id", chapterId)
        .order("version", { ascending: false });

      if (error) throw error;
      setChapterRevisions(revisions || []);
    } catch (error) {
      console.error("Error loading revisions:", error);
      toast.error("Failed to load chapter revisions", {
        description: "Failed to load chapter revisions",
      });
    }
  };

  const loadCharacters = async () => {
    try {
      const { data: charactersData, error: charactersError } = await supabase
        .from('novels_characters')
        .select('*')
        .eq('novel_id', params.novelId)
        .order('created_at', { ascending: true });

      if (charactersError) throw charactersError;
      setCharacters(charactersData || []);

      // Load character progressions
      const { data: progressionsData, error: progressionsError } = await supabase
        .from('character_progression')
        .select(`
          *,
          character:novels_characters(*)
        `)
        .eq('novel_id', params.novelId)
        .order('created_at', { ascending: true });

      if (progressionsError) throw progressionsError;
      setCharacterProgressions(progressionsData || []);
    } catch (error) {
      console.error('Error loading characters:', error);
      toast.error('Failed to load characters', {
        description: 'Failed to load character data',
      });
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/sign-in");
    } else if (session?.user?.id) {
      loadNovelData();
      loadCharacters();
    }
  }, [status, session, params.novelId]);

  useEffect(() => {
    if (!chapters) return;

    const filtered = chapters.filter((chapter) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        chapter.title.toLowerCase().includes(searchLower) ||
        chapter.content.toLowerCase().includes(searchLower) ||
        chapter.summary.toLowerCase().includes(searchLower)
      );
    });

    setFilteredChapters(filtered);
  }, [searchQuery, chapters]);

  const loadNovelData = async () => {
    try {
      // Load novel details
      const { data: novelData, error: novelError } = await supabase
        .from("novels")
        .select("*")
        .eq("id", params.novelId)
        .single();

      if (novelError) throw novelError;
      setNovel(novelData);

      // Load chapters
      const { data: chaptersData, error: chaptersError } = await supabase
        .from("chapters")
        .select("*")
        .eq("novel_id", params.novelId)
        .order("chapter_number", { ascending: true });

      if (chaptersError) throw chaptersError;
      setChapters(chaptersData || []);

      // Load tags
      const { data: tagsData, error: tagsError } = await supabase
        .from("novel_tags")
        .select("tag")
        .eq("novel_id", params.novelId);

      if (tagsError) throw tagsError;
      setTags(tagsData.map((t) => t.tag));
    } catch (error) {
      // console.error("Error loading novel data:", error);
      // toast({
      //   title: "Error",
      //   description: "Failed to load novel data",
      //   variant: "destructive",
      // });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateChapter = async () => {
    if (!prompt) return;

    setIsGenerating(true);
    try {
      const response = await fetch("/api/story-weaver/generate-chapter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          novelId: params.novelId,
          prompt,
          previousChapter: chapters[chapters.length - 1],
          chapterNumber: chapters.length + 1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate chapter");
      }

      setChapters((prev) => [...prev, data.chapter]);
      setPrompt("");
      toast.success("Chapter Generated", {
        description: "New chapter has been generated successfully",
      });
    } catch (error) {
      console.error("Error generating chapter:", error);
      toast.error("Generation Failed", {
        description: error instanceof Error ? error.message : "Failed to generate chapter",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddTag = async (tag: string) => {
    try {
      const { error } = await supabase.from("novel_tags").insert([
        {
          novel_id: params.novelId,
          tag,
        },
      ]);

      if (error) throw error;

      setTags((prev) => [...prev, tag]);
      toast.success("Tag added", {
        description: "Tag added successfully",
      });
    } catch (error) {
      console.error("Error adding tag:", error);
      toast.error("Failed to add tag", {
        description: "Failed to add tag",
      });
    }
  };

  const handleExportNovel = async () => {
    // Implement PDF export functionality
  };

  const handleChapterUpdate = () => {
    loadNovelData();
  };

  const handleChapterDelete = async (chapterId: string) => {
    await loadNovelData();
  };

  const handleGetSuggestions = async () => {
    setIsLoadingSuggestions(true);
    try {
      const response = await fetch("/api/story-weaver/get-suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          novelId: params.novelId,
          previousChapters: chapters,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get suggestions");
      }

      const data = await response.json();
      setSuggestions(data);
      toast.success("Suggestions Generated", {
        description: "New story suggestions have been generated successfully",
      });
    } catch (error) {
      console.error("Error getting suggestions:", error);
      toast.error("Generation Failed", {
        description: "Failed to get content suggestions. Please try again later.",
      });
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Add sorting and pagination logic
  const sortAndFilterChapters = () => {
    if (!chapters) return [];

    let filtered = [...chapters];

    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (chapter) =>
          chapter.title.toLowerCase().includes(searchLower) ||
          chapter.content.toLowerCase().includes(searchLower) ||
          chapter.summary.toLowerCase().includes(searchLower)
      );
    }

    // Apply publish status filter
    if (publishFilter !== "all") {
      filtered = filtered.filter(
        (chapter) => 
          (publishFilter === "published" && chapter.is_published) || 
          (publishFilter === "draft" && !chapter.is_published)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortField === "chapter_number") {
        return sortDirection === "asc" 
          ? a.chapter_number - b.chapter_number
          : b.chapter_number - a.chapter_number;
      } else {
        // Sort by updated_at
        const dateA = new Date(a.updated_at).getTime();
        const dateB = new Date(b.updated_at).getTime();
        return sortDirection === "asc" 
          ? dateA - dateB 
          : dateB - dateA;
      }
    });

    return filtered;
  };

  const paginateChapters = (chapters: Chapter[]) => {
    const startIndex = (currentPage - 1) * chaptersPerPage;
    const endIndex = startIndex + chaptersPerPage;
    return chapters.slice(startIndex, endIndex);
  };

  useEffect(() => {
    const filtered = sortAndFilterChapters();
    setFilteredChapters(filtered);
  }, [searchQuery, chapters, sortDirection, sortField, publishFilter]);

  // Calculate pagination values
  const totalChapters = filteredChapters.length;
  const totalPages = Math.ceil(totalChapters / chaptersPerPage);
  const paginatedChapters = paginateChapters(filteredChapters);

  const handleAddCharacter = async () => {
    try {
      if (!newCharacter.name?.trim()) {
        toast.error('Error', {
          description: 'Please enter a character name',
        });
        return;
      }

      const { data: character, error } = await supabase
        .from('novels_characters')
        .insert([
          {
            novel_id: params.novelId,
            ...newCharacter,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setCharacters((prev) => [...prev, character]);
      setNewCharacter({
        name: '',
        role: 'side_character',
        description: '',
        background: '',
        personality: '',
        physical_description: ''
      });
      setShowAddCharacter(false);
      toast.success('Character added', {
        description: 'Character added successfully',
      });
    } catch (error) {
      console.error('Error adding character:', error);
      toast.error('Failed to add character', {
        description: 'Failed to add character',
      });
    }
  };

  const handleDeleteCharacter = async (characterId: string) => {
    try {
      const { error } = await supabase
        .from('novels_characters')
        .delete()
        .eq('id', characterId);

      if (error) throw error;

      setCharacters((prev) => prev.filter((c) => c.id !== characterId));
      toast.success('Character deleted', {
        description: 'Character deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting character:', error);
      toast.error('Failed to delete character', {
        description: 'Failed to delete character',
      });
    }
  };

  const handlePublishNovel = async () => {
    if (!novel) return;
    
    setIsPublishingNovel(true);
    try {
      const { error } = await supabase
        .from("novels")
        .update({ 
          is_published: true,
          status: "pending" 
        })
        .eq("id", novel.id);

      if (error) throw error;

      setNovel((prev) =>
        prev
          ? { 
              ...prev, 
              is_published: true,
              status: "pending"
            }
          : null
      );
      
      toast.success("Novel submitted for review", {
        description: "Your novel has been submitted for admin review and will be published once approved.",
      });
    } catch (error) {
      console.error(
        "Error updating novel publish status:",
        error
      );
      toast.error("Failed to update novel publish status", {
        description: "Failed to update novel publish status",
      });
    } finally {
      setIsPublishingNovel(false);
      setShowPublishConfirmDialog(false);
    }
  };

  const handleUnpublishNovel = async () => {
    if (!novel) return;
    
    try {
      // Determine the status - if already approved, keep it as approved
      const newStatus = novel.status === "approved" ? "approved" : "draft";
      
      const { error } = await supabase
        .from("novels")
        .update({ 
          is_published: false,
          status: newStatus
        })
        .eq("id", novel.id);

      if (error) throw error;

      setNovel((prev) =>
        prev
          ? { 
              ...prev, 
              is_published: false,
              status: newStatus
            }
          : null
      );
      
      toast.success("Novel unpublished", {
        description: "Your novel is now unpublished. You can publish it again anytime.",
      });
    } catch (error) {
      console.error(
        "Error updating novel publish status:",
        error
      );
      toast.error("Failed to update novel publish status", {
        description: "Failed to update novel publish status",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading novel...</p>
        </div>
      </div>
    );
  }

  if (!novel) {
    return (
      <div className="container mx-auto py-16">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Novel not found</h1>
          <Button onClick={() => router.push("/story-weaver")} className="mt-4">
            Back to Story Weaver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className=""
    >
      {/* Sticky Header */}
      <motion.div
        variants={fadeIn}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={springTransition}
        className="sticky top-0 z-50  backdrop-blur-lg border-b border-primary/10 shadow-sm"
      >
        <div className="container mx-auto py-4">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Link
                    href="/story-weaver"
                    className="inline-flex items-center p-2 rounded-full transition-colors hover:bg-muted"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </Link>
                </motion.div>
                <div className="flex items-center gap-3">
                  <div>
                    <motion.h1
                      className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      {novel.title}
                    </motion.h1>
                    <motion.div
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <span className="px-2 py-0.5 rounded-full bg-primary/10">
                        {novel.genre}
                      </span>
                      <span>•</span>
                      <span>{chapters.length} chapters</span>
                      <span>•</span>
                      <span>{novel.total_words} words</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <span className="px-1.5 py-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 rounded-full text-xs">
                          {chapters.filter(ch => ch.is_published).length} published
                        </span>
                        <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 rounded-full text-xs">
                          {chapters.filter(ch => !ch.is_published).length} draft
                        </span>
                      </span>
                      <span>•</span>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <label className="text-sm">Public:</label>
                          <Switch
                            checked={novel.is_public}
                            onCheckedChange={async (checked) => {
                              try {
                                const { error } = await supabase
                                  .from("novels")
                                  .update({ is_public: checked })
                                  .eq("id", novel.id);

                                if (error) throw error;

                                setNovel((prev) =>
                                  prev ? { ...prev, is_public: checked } : null
                                );
                                toast.success(`Novel is now ${checked ? "public" : "private"}`, {
                                  description: `Novel is now ${checked ? "public" : "private"}`,
                                });
                              } catch (error) {
                                console.error(
                                  "Error updating novel visibility:",
                                  error
                                );
                                toast.error("Failed to update novel visibility", {
                                  description: "Failed to update novel visibility",
                                });
                              }
                            }}
                            disabled={!novel.is_published}
                          />
                          {novel.is_published && !novel.is_public && (
                            <span className="text-xs text-yellow-600 dark:text-yellow-500 ml-2">
                              Waiting for admin approval to make public
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm">Published:</label>
                          <Switch
                            checked={novel.is_published}
                            onCheckedChange={async (checked) => {
                              if (checked) {
                                if (novel.status === "approved") {
                                  // If already approved, allow direct publishing without confirmation
                                  try {
                                    const { error } = await supabase
                                      .from("novels")
                                      .update({ is_published: true })
                                      .eq("id", novel.id);
                                    
                                    if (error) throw error;
                                    
                                    setNovel((prev) => 
                                      prev ? { ...prev, is_published: true } : null
                                    );
                                    
                                    toast.success("Novel published", {
                                      description: "Your novel is now published and available to readers.",
                                    });
                                  } catch (error) {
                                    console.error("Error publishing novel:", error);
                                    toast.error("Failed to publish novel", {
                                      description: "Failed to update novel publish status",
                                    });
                                  }
                                } else {
                                  // For non-approved novels, show confirmation dialog
                                  setShowPublishConfirmDialog(true);
                                }
                              } else {
                                handleUnpublishNovel();
                              }
                            }}
                          />
                          <div className="ml-2">
                            {novel.status === "pending" && (
                              <div className="group relative">
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 rounded-md text-xs font-medium">
                                  Pending Review
                                </span>
                                <div className="absolute invisible group-hover:visible bg-black/80 text-white text-xs rounded px-2 py-1 left-0 mt-1 w-48 z-10">
                                  Your novel is awaiting admin review before it can be made public.
                                </div>
                              </div>
                            )}
                            {novel.status === "approved" && (
                              <div className="group relative">
                                <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 rounded-md text-xs font-medium">
                                  Approved
                                </span>
                                <div className="absolute invisible group-hover:visible bg-black/80 text-white text-xs rounded px-2 py-1 left-0 mt-1 w-48 z-10">
                                  Your novel has been approved and can be published or unpublished at any time.
                                </div>
                              </div>
                            )}
                            {novel.status === "rejected" && (
                              <div className="group relative">
                                <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 rounded-md text-xs font-medium">
                                  Rejected
                                </span>
                                <div className="absolute invisible group-hover:visible bg-black/80 text-white text-xs rounded px-2 py-1 left-0 mt-1 w-48 z-10">
                                  Your novel was not approved. Make changes and resubmit for review.
                                </div>
                              </div>
                            )}
                            {novel.status === "draft" && (
                              <div className="group relative">
                                <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100 rounded-md text-xs font-medium">
                                  Draft
                                </span>
                                <div className="absolute invisible group-hover:visible bg-black/80 text-white text-xs rounded px-2 py-1 left-0 mt-1 w-48 z-10">
                                  Your novel is in draft state. Publish it to submit for review.
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowHelpModal(true)}
                      className="rounded-full hover:bg-primary/10"
                    >
                      <HelpCircle className="w-5 h-5 text-muted-foreground" />
                    </Button>
                  </motion.div>
                </div>
              </div>
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <ExportButton novelId={params.novelId as string} />
              </motion.div>
            </div>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="relative max-w-2xl mx-auto w-full"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search chapters by title, content, or summary..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 h-10 w-full bg-white/50 dark:bg-zinc-800/50 backdrop-blur-sm border-primary/20 focus:border-primary/50 transition-all duration-300"
                />
                {searchQuery && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                    {filteredChapters.length} results
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Status Notifications */}
      {novel && novel.status === "pending" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="container mx-auto mt-4"
        >
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Info className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                  Your novel is pending admin review
                </h3>
                <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-500">
                  <p>
                    Your novel has been submitted for review. Once approved, it will be publicly available in the library.
                    This process typically takes 1-2 business days. You can continue to edit your novel during this time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {novel && novel.status === "rejected" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="container mx-auto mt-4"
        >
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Info className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
                  Your novel was not approved
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-500">
                  <p>
                    Your novel was reviewed but not approved for publishing. Please check your email for details on why it was rejected.
                    You can make the necessary changes and resubmit it for review.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {novel && novel.status === "approved" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="container mx-auto mt-4"
        >
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Info className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-400">
                  Your novel has been approved!
                </h3>
                <div className="mt-2 text-sm text-green-700 dark:text-green-500">
                  <p>
                    Congratulations! Your novel has been approved by our admins. You can now freely publish or unpublish it at any time 
                    without requiring additional review. Toggle the "Published" switch to control its visibility.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="container mx-auto py-8">
        <motion.div
          className="prose prose-sm dark:prose-invert max-w-none mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-lg leading-relaxed px-3">{novel.description}</p>
        </motion.div>

        <Tabs defaultValue="chapters" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="sticky top-24 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg rounded-lg shadow-sm"
          >
            <TabsList className="w-full justify-start gap-2 p-1 bg-gradient-to-r from-violet-500/5 via-blue-500/5 to-teal-500/5">
              <TabsTrigger
                value="chapters"
                className="flex-1 transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Chapters
              </TabsTrigger>
              <TabsTrigger
                value="characters"
                className="flex-1 transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
              >
                <Users className="h-4 w-4 mr-2" />
                Characters
              </TabsTrigger>
              <TabsTrigger
                value="suggestions"
                className="flex-1 transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-teal-500 data-[state=active]:text-white"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Suggestions
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="flex-1 transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-violet-500 data-[state=active]:text-white"
              >
                <History className="h-4 w-4 mr-2" />
                History
              </TabsTrigger>
              <TabsTrigger
                value="collaborators"
                className="flex-1 transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-teal-500 data-[state=active]:text-white"
              >
                <Users className="h-4 w-4 mr-2" />
                Collaborators
              </TabsTrigger>
              <TabsTrigger
                value="tags"
                className="flex-1 transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-violet-500 data-[state=active]:text-white"
              >
                <Tag className="h-4 w-4 mr-2" />
                Tags
              </TabsTrigger>
            </TabsList>
          </motion.div>

          <AnimatePresence mode="wait">
            <TabsContent value="chapters" className="space-y-6">
              <motion.div
                variants={staggerChildren}
                initial="initial"
                animate="animate"
                className="grid grid-cols-1 xl:grid-cols-3 gap-8"
              >
                <motion.div
                  variants={fadeIn}
                  transition={springTransition}
                  className="xl:col-span-2"
                >
                  <Card className="overflow-hidden border-2 bg-background">
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500">
                          Your Story Chapters
                        </h2>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center rounded-md border border-input bg-background p-1 mr-2">
                            <Button
                              variant={publishFilter === "all" ? "default" : "ghost"}
                              size="sm"
                              onClick={() => setPublishFilter("all")}
                              className="text-xs flex items-center gap-1"
                            >
                              All
                              <span className="ml-1 px-1.5 py-0.5 bg-primary/20 rounded-full text-[10px]">
                                {chapters.length}
                              </span>
                            </Button>
                            <Button
                              variant={publishFilter === "published" ? "default" : "ghost"}
                              size="sm"
                              onClick={() => setPublishFilter("published")}
                              className="text-xs flex items-center gap-1"
                            >
                              Published
                              <span className="ml-1 px-1.5 py-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 rounded-full text-[10px]">
                                {chapters.filter(ch => ch.is_published).length}
                              </span>
                            </Button>
                            <Button
                              variant={publishFilter === "draft" ? "default" : "ghost"}
                              size="sm"
                              onClick={() => setPublishFilter("draft")}
                              className="text-xs flex items-center gap-1"
                            >
                              Draft
                              <span className="ml-1 px-1.5 py-0.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 rounded-full text-[10px]">
                                {chapters.filter(ch => !ch.is_published).length}
                              </span>
                            </Button>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:bg-primary/10">
                                <ArrowUpDown className="h-4 w-4" />
                                <span>
                                  Sort by: {sortField === "chapter_number" ? "Chapter" : "Last Updated"}
                                  {" "}
                                  ({sortDirection === "asc" ? "Ascending" : "Descending"})
                                </span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Sort Field</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => setSortField("chapter_number")}>
                                Chapter Number
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setSortField("updated_at")}>
                                Last Updated
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Direction</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => setSortDirection("asc")}>
                                Ascending
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setSortDirection("desc")}>
                                Descending
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <ChapterView
                        chapters={paginatedChapters}
                        onChapterUpdate={handleChapterUpdate}
                        onChapterDelete={handleChapterDelete}
                      />

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="mt-6 flex justify-center items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="w-8 h-8 p-0"
                          >
                            <ChevronsLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCurrentPage((prev) => Math.max(1, prev - 1))
                            }
                            disabled={currentPage === 1}
                            className="w-8 h-8 p-0"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>

                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              Page {currentPage} of {totalPages}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              ({totalChapters}{" "}
                              {totalChapters === 1 ? "chapter" : "chapters"})
                            </span>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCurrentPage((prev) =>
                                Math.min(totalPages, prev + 1)
                              )
                            }
                            disabled={currentPage === totalPages}
                            className="w-8 h-8 p-0"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className="w-8 h-8 p-0"
                          >
                            <ChevronsRight className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>

                <motion.div variants={fadeIn} transition={springTransition}>
                  <Card className="sticky top-48 border-2 bg-background">
                    <div className="p-6">
                      <motion.h2
                        className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 mb-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        Generate New Chapter
                      </motion.h2>
                      <div className="space-y-6">
                        <Textarea
                          placeholder="Describe what should happen in this chapter..."
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          className="min-h-[200px] resize-none transition-all duration-300 focus:border-primary/50 focus:ring-primary/50 "
                        />
                        <Button
                          onClick={handleGenerateChapter}
                          disabled={isGenerating || !prompt}
                          className="w-full bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 text-white transition-all duration-300 hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isGenerating ? (
                            <motion.div
                              className="flex items-center gap-2"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Crafting your chapter...</span>
                            </motion.div>
                          ) : (
                            <motion.div
                              className="flex items-center gap-2"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Sparkles className="h-4 w-4" />
                              <span>Generate Chapter</span>
                            </motion.div>
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </motion.div>
            </TabsContent>

            <TabsContent value="characters">
              <motion.div
                variants={fadeIn}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={springTransition}
              >
                <Card className="p-6 border-2 border-gradient-to-r from-violet-500/20 via-blue-500/20 to-teal-500/20 bg-[#bccff1] dark:bg-zinc-900">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500">
                      Characters
                    </h2>
                    <Dialog open={showAddCharacter} onOpenChange={setShowAddCharacter}>
                      <DialogTrigger asChild>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button className="bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Character
                          </Button>
                        </motion.div>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Character</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Name</label>
                            <Input
                              type="text"
                              placeholder="Character name"
                              value={newCharacter.name}
                              onChange={(e) =>
                                setNewCharacter((prev) => ({
                                  ...prev,
                                  name: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Role</label>
                            <select
                              className="w-full p-2 border rounded-md"
                              value={newCharacter.role}
                              onChange={(e) =>
                                setNewCharacter((prev) => ({
                                  ...prev,
                                  role: e.target.value as Character['role'],
                                }))
                              }
                            >
                              <option value="main_character">Main Character</option>
                              <option value="main_lead">Main Lead</option>
                              <option value="side_character">Side Character</option>
                              <option value="extra">Extra</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <Textarea
                              placeholder="Brief description of the character"
                              value={newCharacter.description}
                              onChange={(e) =>
                                setNewCharacter((prev) => ({
                                  ...prev,
                                  description: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Background</label>
                            <Textarea
                              placeholder="Character's background story"
                              value={newCharacter.background}
                              onChange={(e) =>
                                setNewCharacter((prev) => ({
                                  ...prev,
                                  background: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Personality</label>
                            <Textarea
                              placeholder="Character's personality traits"
                              value={newCharacter.personality}
                              onChange={(e) =>
                                setNewCharacter((prev) => ({
                                  ...prev,
                                  personality: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Physical Description</label>
                            <Textarea
                              placeholder="Character's physical appearance"
                              value={newCharacter.physical_description}
                              onChange={(e) =>
                                setNewCharacter((prev) => ({
                                  ...prev,
                                  physical_description: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <Button className="w-full" onClick={handleAddCharacter}>
                            Add Character
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {characters.map((character) => (
                      <ScrollArea key={character.id} className="h-[500px]">
                      <motion.div
                        key={character.id}
                        variants={fadeIn}
                        className="bg-white/50 dark:bg-zinc-800/50 rounded-lg p-6 border border-primary/10 hover:border-primary/30 transition-all duration-300"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold">{character.name}</h3>
                            <span className="text-sm text-muted-foreground capitalize">
                              {character.role.replace('_', ' ')}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCharacter(character.id)}
                          >
                            <Trash className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>

                        <div className="space-y-4">
                          {character.description && (
                            <div>
                              <h4 className="text-sm font-medium mb-1">Description</h4>
                              <p className="text-sm text-muted-foreground">
                                {character.description}
                              </p>
                            </div>
                          )}

                          {character.background && (
                            <div>
                              <h4 className="text-sm font-medium mb-1">Background</h4>
                              <p className="text-sm text-muted-foreground">
                                {character.background}
                              </p>
                            </div>
                          )}

                          {character.personality && (
                            <div>
                              <h4 className="text-sm font-medium mb-1">Personality</h4>
                              <p className="text-sm text-muted-foreground">
                                {character.personality}
                              </p>
                            </div>
                          )}

                          {character.physical_description && (
                            <div>
                              <h4 className="text-sm font-medium mb-1">Physical Description</h4>
                              <p className="text-sm text-muted-foreground">
                                {character.physical_description}
                              </p>
                            </div>
                          )}

                          {/* Character Progression */}
                          <div>
                            <h4 className="text-sm font-medium mb-2">Recent Development</h4>
                            <ScrollArea className="h-[100px]">
                              <div className="space-y-2">
                                {characterProgressions
                                  .filter((prog) => prog.character_id === character.id)
                                  .slice(-3)
                                  .map((prog) => (
                                    <div
                                      key={prog.id}
                                      className="text-sm text-muted-foreground border-l-2 border-primary/20 pl-2"
                                    >
                                      {prog.development}
                                    </div>
                                  ))}
                              </div>
                            </ScrollArea>
                          </div>
                        </div>
                      </motion.div>
                      </ScrollArea>
                    ))}
                  </div>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="suggestions">
              <motion.div
                variants={fadeIn}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={springTransition}
                className="space-y-6"
              >
                <Card className="p-6 border-2 border-gradient-to-r from-violet-500/20 via-blue-500/20 to-teal-500/20 backdrop-blur-sm bg-gradient-to-br from-white/90 to-white/50 dark:from-zinc-900/90 dark:to-zinc-900/50">
                  <div className="flex justify-between items-center border-b border-primary/10 pb-4 mb-6">
                    <div className="space-y-1">
                      <h2 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500">
                        Story Development Assistant
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Get AI-powered suggestions for your next chapter
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleGetSuggestions}
                      disabled={isLoadingSuggestions}
                      className="hover:bg-primary/10 hover:scale-105 transition-all duration-300"
                    >
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2"
                      >
                        {isLoadingSuggestions ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                        <span>Generate New Ideas</span>
                      </motion.div>
                    </Button>
                  </div>

                  {isLoadingSuggestions ? (
                    <div className="flex items-center justify-center py-24">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center gap-4"
                      >
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 rounded-full animate-pulse" />
                          <Loader2 className="h-12 w-12 animate-spin text-primary relative z-10" />
                        </div>
                        <div className="text-center space-y-1">
                          <p className="font-medium text-primary">
                            Analyzing Your Story
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Crafting personalized suggestions based on your
                            novel&apos;s progression...
                          </p>
                        </div>
                      </motion.div>
                    </div>
                  ) : suggestions ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                            <Sparkles className="h-4 w-4 text-white" />
                          </div>
                          <h3 className="font-semibold text-lg bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-blue-500">
                            Plot Development Ideas
                          </h3>
                        </div>
                        <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                          <div className="space-y-4">
                            {suggestions.plotSuggestions.map((point, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => setPrompt(point)}
                                className="prose prose-sm dark:prose-invert max-w-none hover:bg-primary/5 p-3 rounded-lg cursor-pointer transition-all duration-300"
                              >
                                <div className="flex items-start gap-3">
                                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                                    {index + 1}
                                  </span>
                                  <div className="markdown-content">
                                    {point
                                      .split(/(\*\*.*?\*\*)/)
                                      .map((part, i) => {
                                        if (
                                          part.startsWith("**") &&
                                          part.endsWith("**")
                                        ) {
                                          return (
                                            <strong
                                              key={i}
                                              className="font-bold"
                                            >
                                              {part.slice(2, -2)}
                                            </strong>
                                          );
                                        }
                                        return <span key={i}>{part}</span>;
                                      })}
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center">
                            <Users className="h-4 w-4 text-white" />
                          </div>
                          <h3 className="font-semibold text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-500">
                            Character Development
                          </h3>
                        </div>
                        <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                          <div className="space-y-4">
                            {suggestions.characterSuggestions.map(
                              (idea, index) => (
                                <motion.div
                                  key={index}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 + 0.3 }}
                                  onClick={() => setPrompt(idea)}
                                  className="prose prose-sm dark:prose-invert max-w-none hover:bg-primary/5 p-3 rounded-lg cursor-pointer transition-all duration-300"
                                >
                                  <div className="flex items-start gap-3">
                                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                                      {index + 1}
                                    </span>
                                    <div className="markdown-content">
                                      {idea
                                        .split(/(\*\*.*?\*\*)/)
                                        .map((part, i) => {
                                          if (
                                            part.startsWith("**") &&
                                            part.endsWith("**")
                                          ) {
                                            return (
                                              <strong
                                                key={i}
                                                className="font-bold"
                                              >
                                                {part.slice(2, -2)}
                                              </strong>
                                            );
                                          }
                                          return <span key={i}>{part}</span>;
                                        })}
                                    </div>
                                  </div>
                                </motion.div>
                              )
                            )}
                          </div>
                        </ScrollArea>
                      </div>

                      <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-teal-500 flex items-center justify-center">
                            <Book className="h-4 w-4 text-white" />
                          </div>
                          <h3 className="font-semibold text-lg bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-teal-500">
                            Recommended Story Direction
                          </h3>
                        </div>
                        <div
                          onClick={() => setPrompt(suggestions.storyDirection)}
                          className="prose prose-sm dark:prose-invert max-w-none hover:bg-primary/5 p-6 rounded-lg cursor-pointer border transition-all duration-300"
                        >
                          <div className="markdown-content">
                            {suggestions.storyDirection
                              .split(/(\*\*.*?\*\*)/)
                              .map((part, i) => {
                                if (
                                  part.startsWith("**") &&
                                  part.endsWith("**")
                                ) {
                                  return (
                                    <strong key={i} className="font-bold">
                                      {part.slice(2, -2)}
                                    </strong>
                                  );
                                }
                                return <span key={i}>{part}</span>;
                              })}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-24 space-y-4"
                    >
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-500 to-teal-500 flex items-center justify-center opacity-50">
                        <Sparkles className="h-8 w-8 text-white" />
                      </div>
                      <div className="text-center space-y-2 max-w-md">
                        <h3 className="font-medium text-lg">
                          Ready to Explore New Ideas?
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Click &quot;Generate New Ideas&quot; to get AI-powered
                          suggestions for your next chapter&apos;s plot,
                          character development, and story direction.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="history">
              <motion.div
                variants={fadeIn}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={springTransition}
              >
                <Card className="p-6 border-2 border-gradient-to-r from-violet-500/20 via-blue-500/20 to-teal-500/20 bg-[#bccff1] dark:bg-zinc-900">
                  <h2 className="text-xl font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500">
                    Novel History
                  </h2>
                  <ScrollArea className="h-[500px]">
                    <motion.div
                      className="space-y-4"
                      variants={staggerChildren}
                    >
                      {chapters.map((chapter) => (
                        <motion.div
                          key={chapter.id}
                          variants={fadeIn}
                          className="border-b pb-4 hover:bg-gradient-to-r hover:from-violet-500/5 hover:via-blue-500/5 hover:to-teal-500/5 p-4 rounded-lg transition-all duration-300"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-medium">
                                Chapter {chapter.chapter_number}:{" "}
                                {chapter.title}
                              </h3>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                {sortField === "updated_at" && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                    <History className="h-3 w-3 mr-1" />
                                    Updated
                                  </span>
                                )}
                                Last updated: {formatDate(chapter.updated_at)}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => loadChapterRevisions(chapter.id)}
                            >
                              <History className="h-4 w-4 mr-2" />
                              View History
                            </Button>
                          </div>
                          {chapterRevisions.some(
                            (rev) => rev.chapter_id === chapter.id
                          ) && (
                            <div className="mt-2 pl-4 border-l-2">
                              {chapterRevisions
                                .filter((rev) => rev.chapter_id === chapter.id)
                                .map((revision) => (
                                  <div
                                    key={revision.id}
                                    className="text-sm text-muted-foreground mt-2"
                                  >
                                    <p>Version {revision.version}</p>
                                    <p>{formatDate(revision.created_at)}</p>
                                  </div>
                                ))}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </motion.div>
                  </ScrollArea>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="collaborators">
              <motion.div
                variants={fadeIn}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={springTransition}
              >
                <Collaborators novelId={params.novelId as string} />
              </motion.div>
            </TabsContent>

            <TabsContent value="tags">
              <motion.div
                variants={fadeIn}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={springTransition}
              >
                <Card className="p-6 border-2 border-gradient-to-r from-violet-500/20 via-blue-500/20 to-teal-500/20 bg-[#bccff1] dark:bg-zinc-900">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500">
                      Tags
                    </h2>
                    <Dialog>
                      <DialogTrigger asChild>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button className="bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Tag
                          </Button>
                        </motion.div>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Tag</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Tag</label>
                            <Input
                              type="text"
                              placeholder="Enter tag name"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  const input = e.target as HTMLInputElement;
                                  const tag = input.value.trim();
                                  if (tag) {
                                    handleAddTag(tag);
                                    input.value = "";
                                  }
                                }
                              }}
                            />
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <motion.div
                        key={tag}
                        variants={fadeIn}
                        className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-violet-500/10 via-blue-500/10 to-teal-500/10 border border-primary/20"
                      >
                        <span className="text-sm">{tag}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-transparent hover:text-destructive"
                          onClick={async () => {
                            try {
                              const { error } = await supabase
                                .from("novel_tags")
                                .delete()
                                .eq("novel_id", params.novelId)
                                .eq("tag", tag);

                              if (error) throw error;

                              setTags((prev) => prev.filter((t) => t !== tag));
                              toast.success("Tag removed", {
                                description: "Tag removed successfully",
                              });
                            } catch (error) {
                              console.error("Error removing tag:", error);
                              toast.error("Failed to remove tag", {
                                description: "Failed to remove tag",
                              });
                            }
                          }}
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </div>

      {/* Help Modal */}
      <Dialog open={showHelpModal} onOpenChange={setShowHelpModal}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-4xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 text-transparent bg-clip-text">
              Story Weaver Guide
            </DialogTitle>
          </DialogHeader>

          <div className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Chapter Management Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-[#bccff1] dark:bg-zinc-900 rounded-xl shadow-md overflow-hidden hover:shadow-xl 
                transition-all duration-300 border border-gray-100 dark:border-gray-700 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-blue-500">
                    Chapter Management
                  </h3>
                </div>
                <div className="space-y-3 text-gray-600 dark:text-gray-300">
                  <p>
                    • Create and organize chapters with an intuitive interface
                  </p>
                  <p>• Advanced search functionality across all chapters</p>
                  <p>• Flexible sorting and organization options</p>
                  <p>• Track word count and chapter statistics</p>
                  <p>• Control chapter visibility and publishing status</p>
                  <p>• AI-powered chapter generation with custom prompts</p>
                </div>
              </motion.div>

              {/* AI Assistant Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-[#bccff1] dark:bg-zinc-900 rounded-xl shadow-md overflow-hidden hover:shadow-xl 
                transition-all duration-300 border border-gray-100 dark:border-gray-700 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-500">
                    AI Writing Assistant
                  </h3>
                </div>
                <div className="space-y-3 text-gray-600 dark:text-gray-300">
                  <p>• Smart plot development suggestions</p>
                  <p>• Character arc and development ideas</p>
                  <p>• Story direction recommendations</p>
                  <p>• One-click prompt generation</p>
                  <p>• Context-aware content suggestions</p>
                  <p>• Multiple creative variations for each idea</p>
                </div>
              </motion.div>

              {/* Version Control Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-[#bccff1] dark:bg-zinc-900 rounded-xl shadow-md overflow-hidden hover:shadow-xl 
                transition-all duration-300 border border-gray-100 dark:border-gray-700 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-500 to-violet-500 flex items-center justify-center">
                    <History className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-violet-500">
                    Version History
                  </h3>
                </div>
                <div className="space-y-3 text-gray-600 dark:text-gray-300">
                  <p>• Comprehensive change tracking</p>
                  <p>• Version comparison and restoration</p>
                  <p>• Detailed update timestamps</p>
                  <p>• Collaborator activity tracking</p>
                  <p>• Automatic backup system</p>
                  <p>• Change history visualization</p>
                </div>
              </motion.div>

              {/* Collaboration Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-[#bccff1] dark:bg-zinc-900 rounded-xl shadow-md overflow-hidden hover:shadow-xl 
                transition-all duration-300 border border-gray-100 dark:border-gray-700 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-teal-500 flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-teal-500">
                    Team Collaboration
                  </h3>
                </div>
                <div className="space-y-3 text-gray-600 dark:text-gray-300">
                  <p>• Invite writers and collaborators</p>
                  <p>• Granular permission controls</p>
                  <p>• Real-time collaboration features</p>
                  <p>• Activity tracking and notifications</p>
                  <p>• Comment and feedback system</p>
                  <p>• Team management tools</p>
                </div>
              </motion.div>

              {/* Organization Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-[#bccff1] dark:bg-zinc-900 rounded-xl shadow-md overflow-hidden hover:shadow-xl 
                transition-all duration-300 border border-gray-100 dark:border-gray-700 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
                    <Tag className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-violet-500">
                    Smart Organization
                  </h3>
                </div>
                <div className="space-y-3 text-gray-600 dark:text-gray-300">
                  <p>• Custom tagging system</p>
                  <p>• Advanced content categorization</p>
                  <p>• Smart content filtering</p>
                  <p>• Automated content organization</p>
                  <p>• Tag-based navigation</p>
                  <p>• Content discovery tools</p>
                </div>
              </motion.div>

              {/* Publishing Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-[#bccff1] dark:bg-zinc-900 rounded-xl shadow-md overflow-hidden hover:shadow-xl 
                transition-all duration-300 border border-gray-100 dark:border-gray-700 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center">
                    <Share className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-blue-500">
                    Publishing & Sharing
                  </h3>
                </div>
                <div className="space-y-3 text-gray-600 dark:text-gray-300">
                  <p>• Multiple export formats (PDF, EPUB)</p>
                  <p>• Customizable sharing options</p>
                  <p>• Privacy controls and permissions</p>
                  <p>• Reader engagement analytics</p>
                  <p>• Publishing workflow management</p>
                  <p>• Distribution channel integration</p>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-8 p-6 bg-gradient-to-r from-violet-500/10 via-blue-500/10 to-teal-500/10 rounded-xl border border-primary/10"
            >
              <div className="flex items-center gap-3 mb-4">
                <Info className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-primary">
                  Need Help?
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Explore our comprehensive documentation for detailed guides and
                tutorials. For personalized assistance, reach out to our support
                team available 24/7 to help you make the most of Story Weaver.
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-8 flex justify-end"
          >
            <Button
              onClick={() => setShowHelpModal(false)}
              className="bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 text-white"
            >
              Got it, thanks!
            </Button>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Publish Confirmation Dialog */}
      <Dialog open={showPublishConfirmDialog} onOpenChange={setShowPublishConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Publish Novel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-400 flex items-center">
                <Info className="h-4 w-4 mr-2" />
                Admin Review Required
              </h3>
              <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-500">
                Publishing this novel will submit it for admin review. The status will be set to 'pending' until approved.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Once approved, your novel will be publicly available in the library. You can unpublish at any time.
            </p>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowPublishConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePublishNovel} disabled={isPublishingNovel} className="bg-gradient-to-r from-violet-500 to-blue-500 text-white">
              {isPublishingNovel ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit for Review"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
