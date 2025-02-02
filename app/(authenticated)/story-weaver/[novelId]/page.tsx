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
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChapterView from "./_components/chapter-view";
import ExportButton from "./_components/export-button";
import Image from "next/image";
import Link from "next/link";

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
  const { toast } = useToast();
  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [chapterRevisions, setChapterRevisions] = useState<ChapterRevision[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [showRevisionHistory, setShowRevisionHistory] = useState(false);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [newCollaborator, setNewCollaborator] = useState<{
    email: string;
    role: "editor" | "viewer";
  }>({
    email: "",
    role: "viewer",
  });
  const supabase = createBrowserSupabaseClient();

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
      toast({
        title: "Error",
        description: "Failed to load chapter revisions",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/sign-in");
    } else if (session?.user?.id) {
      loadNovelData();
    }
  }, [status, session, params.novelId]);

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

      // Load collaborators
      const { data: collaboratorsData, error: collabError } = await supabase
        .from("novel_collaborators")
        .select(
          `
          *,
          user:users(
            name,
            email,
            image
          )
        `
        )
        .eq("novel_id", params.novelId);

      if (collabError) throw collabError;
      setCollaborators(collaboratorsData || []);

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
      toast({
        title: "Success",
        description: "New chapter generated successfully",
      });
    } catch (error) {
      console.error("Error generating chapter:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to generate chapter",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    try {
      const { error } = await supabase
        .from("novel_collaborators")
        .delete()
        .eq("id", collaboratorId);

      if (error) throw error;

      setCollaborators((prev) => prev.filter((c) => c.id !== collaboratorId));
      toast({
        title: "Success",
        description: "Collaborator removed successfully",
      });
    } catch (error) {
      console.error("Error removing collaborator:", error);
      toast({
        title: "Error",
        description: "Failed to remove collaborator",
        variant: "destructive",
      });
    }
  };

  const handleAddCollaborator = async () => {
    if (!newCollaborator.email.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    try {
      // First, get the user ID for the email
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("email", newCollaborator.email)
        .single();

      if (userError) throw userError;

      if (!userData) {
        toast({
          title: "Error",
          description: "User not found",
          variant: "destructive",
        });
        return;
      }

      const { data: collaborator, error } = await supabase
        .from("novel_collaborators")
        .insert([
          {
            novel_id: params.novelId,
            user_id: userData.id,
            role: newCollaborator.role,
          },
        ])
        .select(
          `
          *,
          user:users(
            name,
            email,
            image
          )
        `
        )
        .single();

      if (error) throw error;

      setCollaborators((prev) => [...prev, collaborator]);
      setNewCollaborator({ email: "", role: "viewer" });
      setShowCollaborators(false);
      toast({
        title: "Success",
        description: "Collaborator added successfully",
      });
    } catch (error) {
      console.error("Error adding collaborator:", error);
      toast({
        title: "Error",
        description: "Failed to add collaborator",
        variant: "destructive",
      });
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
      toast({
        title: "Success",
        description: "Tag added successfully",
      });
    } catch (error) {
      console.error("Error adding tag:", error);
      toast({
        title: "Error",
        description: "Failed to add tag",
        variant: "destructive",
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
      className="container mx-auto py-16 space-y-8"
    >
      <motion.div
        variants={fadeIn}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={springTransition}
        className="space-y-4"
      >
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-4">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Link
                  href="/story-weaver"
                  className="inline-flex items-center p-2 rounded-full transition-colors hover:bg-muted"
                >
                  <ArrowLeft className="w-6 h-6" />
                </Link>
              </motion.div>
              <div>
                <motion.h1
                  className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {novel.title}
                </motion.h1>
                <motion.p
                  className="text-lg text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {novel.genre}
                </motion.p>
              </div>
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
        <motion.p
          className="text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {novel.description}
        </motion.p>
      </motion.div>

      <Tabs defaultValue="chapters" className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <TabsList className="bg-gradient-to-r from-violet-500/10 via-blue-500/10 to-teal-500/10 backdrop-blur-sm">
            <TabsTrigger
              value="chapters"
              className="transition-all duration-300 hover:text-primary"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Chapters
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="transition-all duration-300 hover:text-primary"
            >
              <History className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
            <TabsTrigger
              value="collaborators"
              className="transition-all duration-300 hover:text-primary"
            >
              <Users className="h-4 w-4 mr-2" />
              Collaborators
            </TabsTrigger>
            <TabsTrigger
              value="tags"
              className="transition-all duration-300 hover:text-primary"
            >
              <Tag className="h-4 w-4 mr-2" />
              Tags
            </TabsTrigger>
          </TabsList>
        </motion.div>

        <AnimatePresence mode="wait">
          <TabsContent value="chapters" className="space-y-4">
            <motion.div
              variants={staggerChildren}
              initial="initial"
              animate="animate"
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <motion.div variants={fadeIn} transition={springTransition}>
                <ChapterView
                  chapters={chapters}
                  onChapterUpdate={handleChapterUpdate}
                  onChapterDelete={handleChapterDelete}
                />
              </motion.div>

              <motion.div variants={fadeIn} transition={springTransition}>
                <Card className="p-6 border-2 border-gradient-to-r from-violet-500/20 via-blue-500/20 to-teal-500/20 backdrop-blur-sm bg-[#bccff1] dark:bg-zinc-900">
                  <motion.h2
                    className="text-2xl font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    Generate New Chapter
                  </motion.h2>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Describe what should happen in this chapter..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="h-32 transition-all duration-300 focus:border-primary/50 focus:ring-primary/50"
                    />
                    <Button
                      onClick={handleGenerateChapter}
                      disabled={isGenerating || !prompt}
                      className="w-full bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 text-white transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                    >
                      {isGenerating ? (
                        <motion.div
                          className="flex items-center gap-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Generating chapter...</span>
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
                </Card>
              </motion.div>
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
                  <motion.div className="space-y-4" variants={staggerChildren}>
                    {chapters.map((chapter) => (
                      <motion.div
                        key={chapter.id}
                        variants={fadeIn}
                        className="border-b pb-4 hover:bg-gradient-to-r hover:from-violet-500/5 hover:via-blue-500/5 hover:to-teal-500/5 p-4 rounded-lg transition-all duration-300"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium">
                              Chapter {chapter.chapter_number}: {chapter.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
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
              <Card className="p-6 border-2 border-gradient-to-r from-violet-500/20 via-blue-500/20 to-teal-500/20 bg-[#bccff1] dark:bg-zinc-900">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500">
                    Collaborators
                  </h2>
                  <Dialog
                    open={showCollaborators}
                    onOpenChange={setShowCollaborators}
                  >
                    <DialogTrigger asChild>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button className="bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 text-white">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Collaborator
                        </Button>
                      </motion.div>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Collaborator</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Email</label>
                          <Input
                            type="email"
                            placeholder="Enter collaborator's email"
                            value={newCollaborator.email}
                            onChange={(e) =>
                              setNewCollaborator((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Role</label>
                          <select
                            className="w-full p-2 border rounded-md"
                            value={newCollaborator.role}
                            onChange={(e) =>
                              setNewCollaborator((prev) => ({
                                ...prev,
                                role: e.target.value as "editor" | "viewer",
                              }))
                            }
                          >
                            <option value="viewer">Viewer</option>
                            <option value="editor">Editor</option>
                          </select>
                        </div>
                        <Button
                          className="w-full"
                          onClick={handleAddCollaborator}
                        >
                          Add Collaborator
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="space-y-4">
                  {collaborators.map((collaborator) => (
                    <motion.div
                      key={collaborator.id}
                      variants={fadeIn}
                      className="flex justify-between items-center p-4 border rounded-lg hover:bg-gradient-to-r hover:from-violet-500/5 hover:via-blue-500/5 hover:to-teal-500/5 transition-all duration-300"
                    >
                      <div className="flex items-center gap-4">
                        {collaborator.user.image && (
                          <Image
                            src={collaborator.user.image}
                            alt={collaborator.user.name}
                            className="w-10 h-10 rounded-full"
                            width={40}
                            height={40}
                          />
                        )}
                        <div>
                          <p className="font-medium">
                            {collaborator.user.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {collaborator.user.email}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {collaborator.role}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleRemoveCollaborator(collaborator.id)
                        }
                      >
                        <Trash className="h-4 w-4 text-destructive" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </Card>
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
                            toast({
                              title: "Success",
                              description: "Tag removed successfully",
                            });
                          } catch (error) {
                            console.error("Error removing tag:", error);
                            toast({
                              title: "Error",
                              description: "Failed to remove tag",
                              variant: "destructive",
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
    </motion.div>
  );
}
