"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Flag,
  Loader2,
  MoreVertical,
  Pencil,
  Trash2,
  User as UserIcon
} from "lucide-react";
import { toast } from "sonner";
import { threadService } from '@/lib/services/threads';
import type { Comment } from '@/types/threads';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserAvatar } from "@/components/user-avatar";
import Link from "next/link";
import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CommentsProps {
  threadId: string;
}

export default function Comments({ threadId }: CommentsProps) {
  const { data: session, status } = useSession();
  const user = session?.user;
  const supabase = createBrowserSupabaseClient();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userReactions, setUserReactions] = useState<Record<string, 'like' | 'dislike' | null>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const isAuthenticated = status === "authenticated";

  useEffect(() => {
    fetchComments();
  }, [threadId]);

  useEffect(() => {
    if (user?.id && comments.length > 0) {
      fetchUserReactions();
    }
  }, [user?.id, comments]);

  const fetchUserReactions = async () => {
    if (!user?.id || comments.length === 0) return;
    
    try {
      // This would ideally be a single API call to get all reactions for the user
      // For now, we'll simulate by checking each comment individually
      const reactionsMap: Record<string, 'like' | 'dislike' | null> = {};
      
      for (const comment of comments) {
        try {
          const { data, error } = await supabase
            .from('reactions')
            .select('reaction_type')
            .eq('user_id', String(user.id))
            .eq('target_type', 'comment')
            .eq('target_id', comment.id)
            .single();
          
          if (error) {
            reactionsMap[comment.id] = null;
          } else if (data) {
            reactionsMap[comment.id] = data.reaction_type as 'like' | 'dislike';
          }
        } catch (error) {
          console.error('Error fetching reaction for comment:', comment.id, error);
          reactionsMap[comment.id] = null;
        }
      }
      
      setUserReactions(reactionsMap);
    } catch (error) {
      console.error('Error fetching user reactions:', error);
    }
  };

  const fetchComments = async () => {
    try {
      setLoading(true);
      const data = await threadService.getComments(threadId);
      setComments(data);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error("Error loading comments", {
        description: "Something went wrong. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (!user?.id) {
      toast.error("Authentication required", {
        description: "Please sign in to comment."
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await threadService.createComment({
        thread_id: threadId,
        user_id: user.id,
        content: newComment.trim(),
        status: 'active'
      });
      setNewComment("");
      fetchComments();
    } catch (error) {
      console.error('Error creating comment:', error);
      toast.error("Error creating comment", {
        description: "Something went wrong. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !replyTo) return;

    if (!user?.id) {
      toast.error("Authentication required", {
        description: "Please sign in to reply."
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await threadService.createComment({
        thread_id: threadId,
        user_id: user.id,
        parent_id: replyTo,
        content: replyContent.trim(),
        status: 'active'
      });
      setReplyTo(null);
      setReplyContent("");
      fetchComments();
    } catch (error) {
      console.error('Error creating reply:', error);
      toast.error("Error creating reply", {
        description: "Something went wrong. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReaction = async (commentId: string, type: 'like' | 'dislike') => {
    if (!user?.id) {
      toast.error("Authentication required", {
        description: "Please sign in to react to comments."
      });
      return;
    }

    const currentReaction = userReactions[commentId];

    try {
      if (currentReaction === type) {
        // User is clicking the same reaction again, remove it
        await threadService.removeReaction(user.id, 'comment', commentId);
        setUserReactions(prev => ({
          ...prev,
          [commentId]: null
        }));
      } else {
        // User is changing reaction or adding a new one
        await threadService.addReaction({
          user_id: user.id,
          target_type: 'comment',
          target_id: commentId,
          reaction_type: type
        });
        setUserReactions(prev => ({
          ...prev,
          [commentId]: type
        }));
      }
      
      // Update the comment in the UI immediately for better UX
      setComments(prevComments => 
        prevComments.map(comment => {
          if (comment.id === commentId) {
            const updatedComment = { ...comment };
            
            // If removing a reaction
            if (currentReaction === type) {
              if (type === 'like') {
                updatedComment.likes_count = Math.max(0, updatedComment.likes_count - 1);
              } else {
                updatedComment.dislikes_count = Math.max(0, updatedComment.dislikes_count - 1);
              }
            } 
            // If changing from one reaction to another
            else if (currentReaction && currentReaction !== type) {
              if (type === 'like') {
                updatedComment.likes_count += 1;
                updatedComment.dislikes_count = Math.max(0, updatedComment.dislikes_count - 1);
              } else {
                updatedComment.dislikes_count += 1;
                updatedComment.likes_count = Math.max(0, updatedComment.likes_count - 1);
              }
            } 
            // If adding a new reaction
            else {
              if (type === 'like') {
                updatedComment.likes_count += 1;
              } else {
                updatedComment.dislikes_count += 1;
              }
            }
            
            return updatedComment;
          }
          return comment;
        })
      );
      
      // Fetch updated comments in the background
      fetchComments();
    } catch (error) {
      console.error('Error handling reaction:', error);
      toast.error("Error with reaction", {
        description: "Something went wrong. Please try again."
      });
    }
  };

  const handleReport = async (commentId: string) => {
    if (!user?.id) {
      toast.error("Authentication required", {
        description: "Please sign in to report comments."
      });
      return;
    }

    try {
      await threadService.createReport({
        user_id: user.id,
        target_type: 'comment',
        target_id: commentId,
        reason: 'Inappropriate content'
      });
      toast.success("Comment reported", {
        description: "Thank you for helping us maintain a safe community."
      });
    } catch (error) {
      console.error('Error reporting comment:', error);
      toast.error("Error reporting comment", {
        description: "Something went wrong. Please try again."
      });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user?.id) {
      toast.error("Authentication required", {
        description: "Please sign in to delete comments."
      });
      return;
    }

    try {
      await threadService.deleteComment(commentId);
      toast.success("Comment deleted", {
        description: "Your comment has been deleted."
      });
      fetchComments();
      setDeleteDialogOpen(false);
      setCommentToDelete(null);
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error("Error deleting comment", {
        description: "Something went wrong. Please try again."
      });
    }
  };

  const renderComment = (comment: Comment, level: number = 0) => {
    const replies = comments.filter(c => c.parent_id === comment.id);
    const isCommentOwner = user?.id === comment.user_id;

    return (
      <motion.div
        key={comment.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
        style={{ marginLeft: `${level * 2}rem` }}
      >
        <div className="flex gap-4">
          <UserAvatar
            userId={comment.user_id}
            userName={comment.user?.user_name || `User ${comment.user_id.slice(0, 4)}`}
            avatarUrl={comment.user?.avatar_url || null}
            size="sm"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link href={`/user/${comment.user?.user_name || comment.user_id}`} className="font-medium hover:underline">
                  {comment.user?.user_name || `User ${comment.user_id.slice(0, 4)}`}
                </Link>
                <span className="text-xs text-gray-500">
                  {format(new Date(comment.created_at), "MMM d, yyyy 'at' h:mm a")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isAuthenticated ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleReport(comment.id)}
                    className="hover:scale-110 transition-transform"
                  >
                    <Flag className="w-4 h-4" />
                  </Button>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:scale-110 transition-transform"
                          disabled
                        >
                          <Flag className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Sign in to report this comment</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {isAuthenticated && isCommentOwner && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setCommentToDelete(comment.id);
                      setDeleteDialogOpen(true);
                    }}
                    className="hover:scale-110 transition-transform text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            <p className="mt-2 text-gray-700 dark:text-gray-300">{comment.content}</p>
            <div className="flex items-center gap-4 mt-2">
              {isAuthenticated ? (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`flex items-center gap-2 hover:scale-105 transition-transform ${
                    userReactions[comment.id] === 'like'
                      ? 'text-blue-500'
                      : 'text-gray-500 hover:text-blue-500'
                  } ${userReactions[comment.id] === 'dislike' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => handleReaction(comment.id, 'like')}
                >
                  <ThumbsUp className="w-4 h-4" />
                  {comment.likes_count}
                </motion.button>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        className="flex items-center gap-2 text-gray-500"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        {comment.likes_count}
                      </motion.button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Sign in to like this comment</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {isAuthenticated ? (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`flex items-center gap-2 hover:scale-105 transition-transform ${
                    userReactions[comment.id] === 'dislike'
                      ? 'text-red-500'
                      : 'text-gray-500 hover:text-red-500'
                  } ${userReactions[comment.id] === 'like' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => handleReaction(comment.id, 'dislike')}
                >
                  <ThumbsDown className="w-4 h-4" />
                  {comment.dislikes_count}
                </motion.button>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        className="flex items-center gap-2 text-gray-500"
                      >
                        <ThumbsDown className="w-4 h-4" />
                        {comment.dislikes_count}
                      </motion.button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Sign in to dislike this comment</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {isAuthenticated ? (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="flex items-center gap-2 hover:scale-105 transition-transform"
                  onClick={() => setReplyTo(comment.id)}
                >
                  <MessageCircle className="w-4 h-4" />
                  Reply
                </motion.button>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        className="flex items-center gap-2 text-gray-500"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Reply
                      </motion.button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Sign in to reply to this comment</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>

        {/* Reply Form */}
        {replyTo === comment.id && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmitReply}
            className="space-y-2"
          >
            <Textarea
              placeholder="Write a reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="min-h-[100px] glass"
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setReplyTo(null);
                  setReplyContent("");
                }}
                className="hover:scale-105 transition-transform"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !replyContent.trim()}
                className="hover:scale-105 transition-transform"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Replying...
                  </>
                ) : (
                  "Reply"
                )}
              </Button>
            </div>
          </motion.form>
        )}

        {/* Replies */}
        {replies.length > 0 && (
          <div className="space-y-4 mt-4">
            {replies.map(reply => renderComment(reply, level + 1))}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* New Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmitComment} className="space-y-4">
          <Textarea
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px] glass"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="hover:scale-105 transition-transform"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Commenting...
                </>
              ) : (
                "Comment"
              )}
            </Button>
          </div>
        </form>
      ) : (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="space-y-4">
                <Textarea
                  placeholder="Write a comment..."
                  disabled
                  className="min-h-[100px] glass cursor-not-allowed opacity-70"
                />
                <div className="flex justify-end">
                  <Button
                    disabled
                    className="opacity-70 cursor-not-allowed"
                  >
                    Comment
                  </Button>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Sign in to comment on this thread</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : comments.filter(comment => !comment.parent_id).length === 0 ? (
        <div className="flex justify-center items-center h-64 text-gray-500">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div className=" border border-gray-200 dark:border-gray-800 rounded-md">
          <ScrollArea className="max-h-[300px] overflow-y-auto w-full">
            <div className="space-y-6 p-4">
              {comments
                .filter(comment => !comment.parent_id)
                .map(comment => renderComment(comment))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => commentToDelete && handleDeleteComment(commentToDelete)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 