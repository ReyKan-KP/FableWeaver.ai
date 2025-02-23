"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { Loader2, Save, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDate } from "@/lib/utils";

interface ChapterEditorProps {
  chapter: {
    id: string;
    title: string;
    content: string;
    summary: string;
    chapter_number: number;
    version: number;
  };
  revisions: Array<{
    id: string;
    content: string;
    summary: string;
    version: number;
    created_at: string;
  }>;
  onClose: () => void;
  onUpdate: () => void;
}

const springTransition = {
  type: "spring",
  stiffness: 200,
  damping: 20,
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export default function ChapterEditor({
  chapter,
  revisions,
  onClose,
  onUpdate,
}: ChapterEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showRevisions, setShowRevisions] = useState(false);
  const [editedChapter, setEditedChapter] = useState({
    title: chapter.title,
    content: chapter.content,
    summary: chapter.summary,
  });
  const supabase = createBrowserSupabaseClient();

  const handleSave = async () => {
    if (!editedChapter.title.trim()) {
      toast.error("Title Required", {
        description: "Please enter a title for your chapter",
      });
      return;
    }

    if (!editedChapter.content.trim()) {
      toast.error("Content Required", {
        description: "Please add some content to your chapter",
      });
      return;
    }

    if (!editedChapter.summary.trim()) {
      toast.error("Summary Required", {
        description: "Please provide a brief summary of your chapter",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Save current version to revisions
      const { error: revisionError } = await supabase
        .from("chapter_revisions")
        .insert([
          {
            chapter_id: chapter.id,
            content: chapter.content,
            summary: chapter.summary,
            version: chapter.version,
          },
        ]);

      if (revisionError) {
        console.error("Error saving revision:", revisionError);
        toast("Warning", {
          description: "Failed to save revision history, but proceeding with update",
        });
      }

      const wordCount = editedChapter.content.split(/\s+/).length;
      const { error } = await supabase
        .from("chapters")
        .update({
          title: editedChapter.title,
          content: editedChapter.content,
          summary: editedChapter.summary,
          word_count: wordCount,
          version: chapter.version + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", chapter.id);

      if (error) throw error;

      toast("Chapter Saved", {
        description: `Successfully updated chapter ${chapter.chapter_number} with ${wordCount} words`,
      });

      onUpdate();
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating chapter:", error);
      toast.error("Save Failed", {
        description: error instanceof Error ? error.message : "Failed to save chapter. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const restoreRevision = async (revision: (typeof revisions)[0]) => {
    try {
      setEditedChapter({
        ...editedChapter,
        content: revision.content,
        summary: revision.summary,
      });
      setShowRevisions(false);
      setIsEditing(true);
      
      toast("Revision Restored", {
        description: `Restored version ${revision.version} from ${formatDate(revision.created_at)}. Save your changes to keep this version.`,
      });
    } catch (error) {
      console.error("Error restoring revision:", error);
      toast.error("Restore Failed", {
        description: "Failed to restore the selected revision. Please try again.",
      });
    }
  };

  const handleStartEditing = () => {
    setIsEditing(true);
    toast("Editing Mode", {
      description: "You can now edit your chapter. Don't forget to save your changes!",
    });
  };

  const handleCancelEditing = () => {
    if (
      editedChapter.title !== chapter.title ||
      editedChapter.content !== chapter.content ||
      editedChapter.summary !== chapter.summary
    ) {
      const confirmCancel = window.confirm("You have unsaved changes. Are you sure you want to cancel?");
      if (!confirmCancel) return;
    }
    
    setEditedChapter({
      title: chapter.title,
      content: chapter.content,
      summary: chapter.summary,
    });
    setIsEditing(false);
    
    toast("Editing Cancelled", {
      description: "Your changes have been discarded",
    });
  };

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springTransition}
    >
      <motion.div
        className="flex justify-between items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, ...springTransition }}
      >
        <div className="space-y-1">
          <motion.h3
            className="text-2xl font-semibold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 text-transparent bg-clip-text"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            Chapter {chapter.chapter_number}
          </motion.h3>
          <motion.p
            className="text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Version {chapter.version}
          </motion.p>
        </div>
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            variant="outline"
            onClick={() => setShowRevisions(!showRevisions)}
            className="hover:bg-accent/10 transition-colors duration-200"
          >
            <History className="h-4 w-4 mr-2" />
            History
          </Button>
          {!isEditing ? (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleStartEditing}
                className="bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 text-white hover:brightness-110"
              >
                Edit
              </Button>
            </motion.div>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={handleCancelEditing}
                className="hover:bg-accent/10"
              >
                Cancel
              </Button>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 text-white hover:brightness-110"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </motion.div>
            </>
          )}
        </motion.div>
      </motion.div>

      <AnimatePresence mode="wait">
        {showRevisions ? (
          <motion.div
            key="revisions"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-4"
          >
            <motion.h4
              className="font-medium bg-gradient-to-r from-violet-600 to-blue-600 text-transparent bg-clip-text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              Revision History
            </motion.h4>
            <ScrollArea className="h-[500px] rounded-md border border-gradient-to-r from-violet-500/20 via-blue-500/20 to-teal-500/20 p-4 bg-background/50 backdrop-blur-sm">
              <motion.div
                className="space-y-4"
                variants={{
                  animate: {
                    transition: {
                      staggerChildren: 0.1,
                    },
                  },
                }}
                initial="initial"
                animate="animate"
              >
                {revisions.map((revision) => (
                  <motion.div
                    key={revision.id}
                    variants={fadeInUp}
                    className="p-4 border rounded-lg hover:bg-accent/50 transition-all duration-300 hover:shadow-md"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium bg-gradient-to-r from-violet-600 to-blue-600 text-transparent bg-clip-text">
                          Version {revision.version}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(revision.created_at)}
                        </p>
                      </div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => restoreRevision(revision)}
                          className="hover:bg-accent/10"
                        >
                          Restore
                        </Button>
                      </motion.div>
                    </div>
                    <div className="mt-2 space-y-2">
                      <p className="text-sm font-medium">Summary</p>
                      <p className="text-sm text-muted-foreground">
                        {revision.summary}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </ScrollArea>
          </motion.div>
        ) : (
          <motion.div
            key="editor"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-4"
          >
            <div className="space-y-2">
              <motion.label
                className="text-sm font-medium"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                Title
              </motion.label>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Input
                  value={editedChapter.title}
                  onChange={(e) =>
                    setEditedChapter((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  disabled={!isEditing}
                  placeholder="Chapter title..."
                  className="transition-all duration-200 focus:ring-2 focus:ring-violet-500/20"
                />
              </motion.div>
            </div>

            <div className="space-y-2">
              <motion.label
                className="text-sm font-medium"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                Summary
              </motion.label>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Textarea
                  value={editedChapter.summary}
                  onChange={(e) =>
                    setEditedChapter((prev) => ({
                      ...prev,
                      summary: e.target.value,
                    }))
                  }
                  disabled={!isEditing}
                  placeholder="Chapter summary..."
                  className="h-24 transition-all duration-200 focus:ring-2 focus:ring-violet-500/20"
                />
              </motion.div>
            </div>

            <div className="space-y-2">
              <motion.label
                className="text-sm font-medium"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                Content
              </motion.label>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Textarea
                  value={editedChapter.content}
                  onChange={(e) =>
                    setEditedChapter((prev) => ({
                      ...prev,
                      content: e.target.value,
                    }))
                  }
                  disabled={!isEditing}
                  placeholder="Chapter content..."
                  className="h-[400px] font-mono transition-all duration-200 focus:ring-2 focus:ring-violet-500/20"
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
