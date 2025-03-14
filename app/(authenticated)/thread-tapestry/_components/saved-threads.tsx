"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Share2,
  Flag,
  Loader2,
  User as UserIcon,
  Bookmark
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { threadService } from '@/lib/services/threads';
import type { SavedThread } from '@/types/threads';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import Comments from "./comments";

interface SavedThreadsProps {
  onThreadSelect: (threadId: string) => void;
}

export default function SavedThreads({ onThreadSelect }: SavedThreadsProps) {
  const { data: session, status } = useSession();
  const user = session?.user;
  const supabase = createBrowserSupabaseClient();
  const { toast } = useToast();
  const [savedThreads, setSavedThreads] = useState<SavedThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [userReactions, setUserReactions] = useState<Record<string, 'like' | 'dislike' | null>>({});
  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchSavedThreads();
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id && savedThreads.length > 0) {
      fetchUserReactions();
    }
  }, [user?.id, savedThreads]);

  const fetchSavedThreads = async () => {
    try {
      setLoading(true);
      const data = await threadService.getSavedThreads(user!.id);
      setSavedThreads(data);
    } catch (error) {
      console.error('Error fetching saved threads:', error);
      toast({
        title: "Error loading saved threads",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserReactions = async () => {
    if (!user?.id || savedThreads.length === 0) return;
    
    try {
      const reactionsMap: Record<string, 'like' | 'dislike' | null> = {};
      
      for (const savedThread of savedThreads) {
        if (!savedThread.thread) continue;
        
        try {
          const { data, error } = await supabase
            .from('reactions')
            .select('reaction_type')
            .eq('user_id', String(user.id))
            .eq('target_type', 'thread')
            .eq('target_id', savedThread.thread.id)
            .single();
          
          if (error) {
            reactionsMap[savedThread.thread.id] = null;
          } else if (data) {
            reactionsMap[savedThread.thread.id] = data.reaction_type as 'like' | 'dislike';
          }
        } catch (error) {
          console.error('Error fetching reaction for thread:', savedThread.thread.id, error);
          reactionsMap[savedThread.thread.id] = null;
        }
      }
      
      setUserReactions(reactionsMap);
    } catch (error) {
      console.error('Error fetching user reactions:', error);
    }
  };

  const handleUnsave = async (threadId: string) => {
    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "Please sign in to unsave threads.",
        variant: "destructive",
      });
      return;
    }

    try {
      await threadService.unsaveThread(user.id, threadId);
      toast({
        title: "Thread unsaved",
        description: "Thread has been removed from your saved items.",
      });
      // Remove the thread from the local state
      setSavedThreads(prevThreads => prevThreads.filter(st => st.thread?.id !== threadId));
    } catch (error) {
      console.error('Error unsaving thread:', error);
      toast({
        title: "Error unsaving thread",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReaction = async (threadId: string, reactionType: 'like' | 'dislike') => {
    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "Please sign in to react to threads.",
        variant: "destructive",
      });
      return;
    }

    try {
      const currentReaction = userReactions[threadId];
      
      if (currentReaction === reactionType) {
        // Remove reaction if clicking the same button
        await threadService.removeReaction(user.id, 'thread', threadId);
        setUserReactions(prev => ({ ...prev, [threadId]: null }));
      } else {
        // Add or change reaction
        await threadService.addReaction({
          user_id: user.id,
          target_type: 'thread',
          target_id: threadId,
          reaction_type: reactionType
        });
        setUserReactions(prev => ({ ...prev, [threadId]: reactionType }));
      }
      
      // Refresh saved threads to update counts
      fetchSavedThreads();
    } catch (error) {
      console.error('Error handling reaction:', error);
      toast({
        title: "Error updating reaction",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReport = async (threadId: string) => {
    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "Please sign in to report threads.",
        variant: "destructive",
      });
      return;
    }

    try {
      await threadService.createReport({
        user_id: user.id,
        target_type: 'thread',
        target_id: threadId,
        reason: 'Inappropriate content'
      });
      toast({
        title: "Thread reported",
        description: "Thank you for helping us maintain a safe community.",
      });
    } catch (error) {
      console.error('Error reporting thread:', error);
      toast({
        title: "Error reporting thread",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (savedThreads.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 max-w-md mx-auto">
          <Bookmark className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-300 text-lg mb-4">
            No saved threads yet
          </p>
          <p className="text-gray-500 dark:text-gray-400">
            Save threads you want to revisit later by clicking the bookmark icon
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {savedThreads.map((savedThread) => {
        const thread = savedThread.thread;
        if (!thread) return null;

        return (
          <motion.div
            key={thread.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => onThreadSelect(thread.id)}>
              <div className="space-y-4">
                {/* Thread Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={thread.user?.avatar_url} alt={thread.user?.user_name} />
                      <AvatarFallback>
                        <UserIcon className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{thread.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Posted by {thread.user?.user_name || 'Anonymous'}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 text-blue-500 hover:text-blue-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnsave(thread.id);
                    }}
                  >
                    <Bookmark className="w-5 h-5" />
                  </motion.button>
                </div>

                {/* Thread Content */}
                <div className="prose dark:prose-invert max-w-none">
                  <p>{thread.content}</p>
                </div>

                {/* Thread Images */}
                {thread.images && thread.images.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {thread.images.map((image, index) => (
                      <div key={index} className="relative aspect-video">
                        <Image
                          src={image}
                          alt={`Thread image ${index + 1}`}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Thread Tags */}
                {thread.tags && thread.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {thread.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Thread Actions */}
                <div className="flex items-center gap-4 pt-4 border-t">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`flex items-center gap-2 ${
                      userReactions[thread.id] === 'like' ? 'text-blue-500' : 'hover:text-blue-500'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReaction(thread.id, 'like');
                    }}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    {thread.likes_count}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`flex items-center gap-2 ${
                      userReactions[thread.id] === 'dislike' ? 'text-red-500' : 'hover:text-red-500'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReaction(thread.id, 'dislike');
                    }}
                  >
                    <ThumbsDown className="w-4 h-4" />
                    {thread.dislikes_count}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`flex items-center gap-2 hover:text-blue-500 ${
                      expandedThreadId === thread.id ? 'text-blue-500' : ''
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedThreadId(expandedThreadId === thread.id ? null : thread.id);
                    }}
                  >
                    <MessageCircle className="w-4 h-4" />
                    {thread.comments_count}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex items-center gap-2 hover:text-blue-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Implement share functionality
                      toast({
                        title: "Share coming soon",
                        description: "We're working on sharing functionality.",
                      });
                    }}
                  >
                    <Share2 className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex items-center gap-2 hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReport(thread.id);
                    }}
                  >
                    <Flag className="w-4 h-4" />
                  </motion.button>
                </div>

                {/* Comments Section */}
                {expandedThreadId === thread.id && (
                  <div className="mt-4 pt-4 border-t">
                    <Comments threadId={thread.id} />
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
} 