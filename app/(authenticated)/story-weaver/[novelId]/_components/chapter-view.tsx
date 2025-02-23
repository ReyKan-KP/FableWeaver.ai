"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2, Edit2, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ChapterEditor from "./chapter-editor";

interface Chapter {
  id: string;
  title: string;
  content: string;
  summary: string;
  chapter_number: number;
  version: number;
  created_at: string;
  is_published: boolean;
  is_public: boolean;
}

interface ChapterRevision {
  id: string;
  content: string;
  summary: string;
  version: number;
  created_at: string;
}

interface ChapterViewProps {
  chapters: Chapter[];
  onChapterUpdate: () => void;
  onChapterDelete: (chapterId: string) => void;
}

export default function ChapterView({
  chapters,
  onChapterUpdate,
  onChapterDelete,
}: ChapterViewProps) {
  const params = useParams();
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [revisions, setRevisions] = useState<ChapterRevision[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [chapterToDelete, setChapterToDelete] = useState<Chapter | null>(null);
  const supabase = createBrowserSupabaseClient();

  const loadRevisions = async (chapterId: string) => {
    try {
      const { data, error } = await supabase
        .from("chapter_revisions")
        .select("*")
        .eq("chapter_id", chapterId)
        .order("version", { ascending: false });

      if (error) throw error;
      setRevisions(data || []);
    } catch (error) {
      console.error("Error loading revisions:", error);
      toast.error("Failed to load chapter revisions", {
        description: "Please try again later.",
      });
    }
  };

  const handleDeleteChapter = async () => {
    if (!chapterToDelete) return;

    try {
      const { error } = await supabase
        .from("chapters")
        .delete()
        .eq("id", chapterToDelete.id);

      if (error) throw error;

      onChapterDelete(chapterToDelete.id);
      toast("Chapter Deleted", {
        description: "The chapter has been successfully deleted",
      });
    } catch (error) {
      console.error("Error deleting chapter:", error);
      toast.error("Deletion Failed", {
        description: "Failed to delete chapter. Please try again.",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setChapterToDelete(null);
    }
  };

  const handlePublishChapter = async (chapter: Chapter) => {
    try {
      const { error } = await supabase
        .from("chapters")
        .update({ is_published: !chapter.is_published })
        .eq("id", chapter.id);

      if (error) throw error;

      onChapterUpdate();
      toast("Status Updated", {
        description: chapter.is_published ? "Chapter unpublished" : "Chapter published successfully",
      });
    } catch (error) {
      console.error("Error updating chapter status:", error);
      toast.error("Update Failed", {
        description: "Failed to update chapter status. Please try again.",
      });
    }
  };

  const handleEditChapter = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    loadRevisions(chapter.id);
    setIsEditorOpen(true);
  };

  const toggleChapter = (chapterId: string) => {
    setExpandedChapter((prev) => (prev === chapterId ? null : chapterId));
  };

  return (
    <div className="space-y-8">
      <ScrollArea className="h-[600px] rounded-md border p-4">
        <div className="space-y-4">
          {chapters.map((chapter) => (
            <Card
              key={chapter.id}
              className="p-4 transition-all duration-200 bg-[#bccff1] dark:bg-zinc-900 "
            >
              <div
                className="flex justify-between items-start cursor-pointer rounded-sm p-2"
                onClick={() => toggleChapter(chapter.id)}
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold">
                      Chapter {chapter.chapter_number}: {chapter.title}
                    </h3>
                    {expandedChapter === chapter.id ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {chapter.summary}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    {/* <div
                      className="flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <label className="text-sm text-muted-foreground">
                        Public:
                      </label>
                      <Switch
                        checked={chapter.is_public}
                        onCheckedChange={async (checked) => {
                          try {
                            const { error } = await supabase
                              .from("chapters")
                              .update({ is_public: checked })
                              .eq("id", chapter.id);

                            if (error) throw error;

                            onChapterUpdate();
                            toast({
                              title: "Success",
                              description: `Chapter is now ${checked ? "public" : "private"}`,
                            });
                          } catch (error) {
                            console.error(
                              "Error updating chapter visibility:",
                              error
                            );
                            toast({
                              title: "Error",
                              description:
                                "Failed to update chapter visibility",
                              variant: "destructive",
                            });
                          }
                        }}
                      />
                    </div> */}
                    <div
                      className="flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <label className="text-sm text-muted-foreground">
                        Published:
                      </label>
                      <Switch
                        checked={chapter.is_published}
                        onCheckedChange={() => handlePublishChapter(chapter)}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditChapter(chapter);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDeleteDialogOpen(true);
                      setChapterToDelete(chapter);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <AnimatePresence>
                {expandedChapter === chapter.id && (
                  <motion.div
                    key={`content-${chapter.id}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 pt-4 border-t prose prose-sm max-w-none dark:prose-invert">
                      {chapter.content.split("\n").map((paragraph, i) => (
                        <p key={i} className="mb-4">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          ))}
        </div>
      </ScrollArea>

      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-4xl">
          {selectedChapter && (
            <ChapterEditor
              chapter={selectedChapter}
              revisions={revisions}
              onClose={() => setIsEditorOpen(false)}
              onUpdate={() => {
                onChapterUpdate();
                setIsEditorOpen(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-4xl">
          <h2 className="text-2xl font-semibold mb-4">Confirm Deletion</h2>
          <p>Are you sure you want to delete this chapter?</p>
          <div className="mt-4 space-x-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteChapter}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
