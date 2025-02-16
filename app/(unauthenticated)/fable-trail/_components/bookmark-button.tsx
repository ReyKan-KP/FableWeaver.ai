"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BookmarkButtonProps {
  novelId: string;
  chapterId?: string;
  chapterTitle?: string;
  variant?: "default" | "minimal";
}

interface Bookmark {
  id: string;
  note: string;
}

export default function BookmarkButton({
  novelId,
  chapterId,
  chapterTitle,
  variant = "default",
}: BookmarkButtonProps) {
  const { data: session } = useSession();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmark, setBookmark] = useState<Bookmark | null>(null);
  const [note, setNote] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (session) {
      fetchBookmark();
    }
  }, [session, novelId, chapterId]);

  const fetchBookmark = async () => {
    try {
      const params = new URLSearchParams({ novelId });
      if (chapterId) params.append("chapterId", chapterId);

      const response = await fetch(`/api/bookmarks?${params}`);
      if (!response.ok) throw new Error("Failed to fetch bookmark");

      const data = await response.json();
      if (data && data.length > 0) {
        setBookmark(data[0]);
        setNote(data[0].note || "");
        setIsBookmarked(true);
      } else {
        setBookmark(null);
        setNote("");
        setIsBookmarked(false);
      }
    } catch (error) {
      console.error("Error fetching bookmark:", error);
      toast.error("Failed to fetch bookmark status");
    }
  };

  const toggleBookmark = async () => {
    if (!session) {
      toast.error("Please sign in to bookmark");
      return;
    }

    setIsLoading(true);
    try {
      if (isBookmarked && bookmark) {
        // Remove bookmark
        const response = await fetch(`/api/bookmarks?id=${bookmark.id}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error("Failed to remove bookmark");

        setIsBookmarked(false);
        setBookmark(null);
        setNote("");
        toast.success("Bookmark removed");
      } else {
        // Add bookmark
        setIsDialogOpen(true);
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      toast.error("Failed to update bookmark");
    } finally {
      setIsLoading(false);
    }
  };

  const saveBookmark = async () => {
    if (!session) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/bookmarks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          novel_id: novelId,
          chapter_id: chapterId,
          note,
        }),
      });

      if (!response.ok) throw new Error("Failed to save bookmark");

      const data = await response.json();
      setBookmark(data);
      setIsBookmarked(true);
      setIsDialogOpen(false);
      toast.success("Bookmark saved");
    } catch (error) {
      console.error("Error saving bookmark:", error);
      toast.error("Failed to save bookmark");
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === "minimal") {
    return (
      <button
        onClick={toggleBookmark}
        disabled={isLoading}
        className={cn(
          "p-2 rounded-full transition-colors",
          isBookmarked
            ? "text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300"
            : "text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
        )}
      >
        <Bookmark className={cn("w-5 h-5", isBookmarked && "fill-current")} />
      </button>
    );
  }

  return (
    <>
      <Button
        variant={isBookmarked ? "default" : "outline"}
        size="sm"
        onClick={toggleBookmark}
        disabled={isLoading}
        className={cn(
          "gap-2",
          isBookmarked &&
            "bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700"
        )}
      >
        <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-current")} />
        {isBookmarked ? "Bookmarked" : "Bookmark"}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Bookmark</DialogTitle>
            {chapterTitle && (
              <DialogDescription>
                Adding bookmark for Chapter: {chapterTitle}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="Add a note about this bookmark (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={saveBookmark} disabled={isLoading}>
              Save Bookmark
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
