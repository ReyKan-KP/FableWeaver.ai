"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageSquare,
  MoreVertical,
  Edit,
  Trash,
  Reply,
  ThumbsUp,
  Send,
  Flag,
  Pin,
  ThumbsUp as ThumbsUpFilled,
  ThumbsDown,
  ThumbsDown as ThumbsDownFilled,
} from "lucide-react";
import { formatDistance } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Comment {
  id: string;
  content: string;
  likes_count: number;
  dislikes_count: number;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  is_deleted: boolean;
  is_pinned: boolean;
  is_approved: boolean;
  reported_count: number;
  report_reason?: string;
  user_id: string;
  novel_id?: string;
  chapter_id?: string;
  user: {
    user_id: string;
    user_name: string;
    avatar_url: string;
  };
  has_liked: boolean;
  has_disliked: boolean;
  replies?: Comment[];
}

interface CommentsSectionProps {
  novelId?: string;
  chapterId?: string;
}

export default function CommentsSection({
  novelId,
  chapterId,
}: CommentsSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sectionKey = novelId || chapterId;

  useEffect(() => {
    if (!sectionKey) return;
    fetchComments();
    setNewComment("");
    setReplyTo(null);
    setEditingComment(null);
    setReportReason("");
  }, [sectionKey]);

  const fetchComments = async () => {
    if (!sectionKey) return;

    try {
      const params = new URLSearchParams();
      if (novelId) params.append("novelId", novelId);
      if (chapterId) params.append("chapterId", chapterId);

      const response = await fetch(`/api/comments?${params}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        console.error("Invalid response format:", data);
        throw new Error("Invalid response format from server");
      }

      setComments(data);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load comments"
      );
      setComments([]);
    }
  };

  const submitComment = async () => {
    if (!session) {
      toast.error("Please sign in to comment");
      return;
    }

    if (!newComment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(novelId ? { novel_id: novelId } : { chapter_id: chapterId }),
          content: newComment,
          parent_comment_id: replyTo?.id || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to post comment");
      }

      setNewComment("");
      setReplyTo(null);
      await fetchComments();
      toast.success("Comment posted successfully");
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to post comment"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const updateComment = async (comment: Comment) => {
    if (!session) return;

    if (!newComment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        id: comment.id,
        comment_type: novelId ? "novel" : "chapter",
      });

      const response = await fetch(`/api/comments?${params}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newComment,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update comment");
      }

      setNewComment("");
      setEditingComment(null);
      await fetchComments();
      toast.success("Comment updated successfully");
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update comment"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const deleteComment = async (comment: Comment) => {
    if (!session) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        id: comment.id,
        comment_type: novelId ? "novel" : "chapter",
      });

      const response = await fetch(`/api/comments?${params}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete comment");
      }

      await fetchComments();
      toast.success("Comment deleted successfully");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete comment"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReaction = async (
    comment: Comment,
    action: "like" | "dislike"
  ) => {
    if (!session) {
      toast.error("Please sign in to react to comments");
      return;
    }

    setIsLoading(true);
    try {
      const hasReacted =
        action === "like" ? comment.has_liked : comment.has_disliked;
      const oppositeReaction =
        action === "like" ? comment.has_disliked : comment.has_liked;

      if (hasReacted) {
        const params = new URLSearchParams({
          comment_id: comment.id,
          comment_type: novelId ? "novel" : "chapter",
          action,
        });

        const response = await fetch(`/api/comments/like?${params}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update reaction");
        }

        await fetchComments();
        toast.success(`${action} removed`);
      } else {
        const params = new URLSearchParams({
          comment_id: comment.id,
          comment_type: novelId ? "novel" : "chapter",
          action,
        });

        const response = await fetch(`/api/comments/like?${params}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update reaction");
        }

        await fetchComments();
        toast.success(
          oppositeReaction
            ? `Reaction changed to ${action}`
            : `Comment ${action}d`
        );
      }
    } catch (error) {
      console.error(`Error updating ${action}:`, error);
      toast.error(
        error instanceof Error ? error.message : `Failed to update ${action}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReport = async (comment: Comment) => {
    if (!session) {
      toast.error("Please sign in to report comments");
      return;
    }

    if (!reportReason.trim()) {
      toast.error("Please provide a reason for reporting");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/comments/report/${comment.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment_type: novelId ? "novel" : "chapter",
          reason: reportReason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to report comment");
      }

      setReportReason("");
      await fetchComments();
      toast.success("Comment reported successfully");
    } catch (error) {
      console.error("Error reporting comment:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to report comment"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div
      key={comment.id}
      className={cn(
        "group relative",
        isReply
          ? "ml-12"
          : "border-b border-gray-100 dark:border-gray-800 pb-4",
        comment.is_pinned && "bg-muted/50 p-4 rounded-lg"
      )}
    >
      {comment.is_pinned && (
        <div className="absolute -left-2 top-2">
          <Pin className="w-4 h-4 text-primary" />
        </div>
      )}
      <div className="flex gap-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={comment.user.avatar_url} />
          <AvatarFallback>
            {comment.user.user_name?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">{comment.user.user_name}</span>
              <span className="text-sm text-muted-foreground">
                {formatDistance(new Date(comment.created_at), new Date(), {
                  addSuffix: true,
                })}
              </span>
              {comment.is_edited && (
                <span className="text-sm text-muted-foreground">(edited)</span>
              )}
            </div>
            {session?.user?.id === comment.user_id && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setEditingComment(comment);
                      setNewComment(comment.content);
                    }}
                    className="gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => deleteComment(comment)}
                    className="gap-2 text-destructive focus:text-destructive"
                  >
                    <Trash className="w-4 h-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          {editingComment?.id === comment.id ? (
            <div className="space-y-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingComment(null);
                    setNewComment("");
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => updateComment(comment)}
                  disabled={isLoading}
                >
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {comment.content}
            </p>
          )}
          <div className="flex items-center gap-4 mt-2">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-2 text-muted-foreground hover:text-foreground",
                comment.has_liked && "text-primary hover:text-primary"
              )}
              onClick={() => handleReaction(comment, "like")}
              disabled={!session || isLoading || comment.has_disliked}
            >
              {comment.has_liked ? (
                <ThumbsUpFilled className="w-4 h-4 mr-1 fill-current" />
              ) : (
                <ThumbsUp className="w-4 h-4 mr-1" />
              )}
              {comment.likes_count}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-2 text-muted-foreground hover:text-foreground",
                comment.has_disliked &&
                  "text-destructive hover:text-destructive"
              )}
              onClick={() => handleReaction(comment, "dislike")}
              disabled={!session || isLoading || comment.has_liked}
            >
              {comment.has_disliked ? (
                <ThumbsDownFilled className="w-4 h-4 mr-1 fill-current" />
              ) : (
                <ThumbsDown className="w-4 h-4 mr-1" />
              )}
              {comment.dislikes_count}
            </Button>
            {!isReply && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-muted-foreground hover:text-foreground"
                onClick={() => setReplyTo(comment)}
              >
                <Reply className="w-4 h-4 mr-1" />
                Reply
              </Button>
            )}
            {session && session.user.id !== comment.user_id && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-muted-foreground hover:text-foreground"
                  >
                    <Flag className="w-4 h-4 mr-1" />
                    Report
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Report Comment</DialogTitle>
                    <DialogDescription>
                      Please provide a reason for reporting this comment.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <Textarea
                      placeholder="Enter your reason for reporting..."
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      rows={4}
                    />
                    <Button
                      onClick={() => handleReport(comment)}
                      disabled={isLoading || !reportReason.trim()}
                    >
                      Submit Report
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>
      {replyTo?.id === comment.id && !isReply && (
        <div className="mt-4 ml-12 space-y-4">
          <div className="flex gap-3">
            {session?.user?.image && (
              <Avatar className="w-8 h-8">
                <AvatarImage src={session.user.image} />
                <AvatarFallback>
                  {session.user.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="flex-1 space-y-2">
              <div className="relative">
                <Textarea
                  placeholder={
                    session
                      ? `Reply to ${comment.user.user_name}...`
                      : "Please sign in to reply"
                  }
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  disabled={!session || isLoading}
                  className="pr-12 resize-none"
                />
                <div className="absolute bottom-2 right-2 flex gap-2">
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setReplyTo(null);
                      setNewComment("");
                    }}
                    disabled={!session || isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={submitComment}
                    disabled={!session || isLoading || !newComment.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {comment.replies?.map((reply) => renderComment(reply, true))}
    </div>
  );

  return (
    <div className="space-y-6" key={sectionKey}>
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5" />
        <h2 className="text-lg font-semibold">
          {novelId ? "Novel Comments" : "Chapter Comments"}
        </h2>
      </div>

      {!sectionKey ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Comments section not available
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {!replyTo && (
              <div className="flex gap-3">
                {session?.user?.image && (
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={session.user.image} />
                    <AvatarFallback>
                      {session.user.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="flex-1 space-y-2">
                  <div className="relative">
                    <Textarea
                      placeholder={
                        session
                          ? "Write a comment..."
                          : "Please sign in to comment"
                      }
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                      disabled={!session || isLoading}
                      className="pr-12 resize-none"
                    />
                    <button
                      type="button"
                      className="absolute bottom-2 right-2 transition-none hover:transform-none hover:transition-none"
                      onClick={submitComment}
                      disabled={!session || isLoading || !newComment.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-6">
              {comments.length > 0 ? (
                comments.map((comment) => renderComment(comment))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No comments yet. Be the first to comment!
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  );
}
