"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Loader2,
  Bookmark
} from "lucide-react";
import { toast } from "sonner";
import { threadService } from '@/lib/services/threads';
import type { SavedThread } from '@/types/threads';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import ThreadCard from "./thread-card";

interface SavedThreadsProps {
  onThreadSelect: (threadId: string) => void;
}

export default function SavedThreads({ onThreadSelect }: SavedThreadsProps) {
  const { data: session, status } = useSession();
  const user = session?.user;
  const supabase = createBrowserSupabaseClient();
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
      toast.error("Error loading saved threads", {
        description: "Something went wrong. Please try again."
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
      toast.error("Authentication required", {
        description: "Please sign in to manage saved threads."
      });
      return;
    }

    try {
      await threadService.unsaveThread(user.id, threadId);
      toast.success("Thread unsaved", {
        description: "Thread has been removed from your saved items."
      });
      // Remove the thread from the local state
      setSavedThreads(prevThreads => prevThreads.filter(saved => saved.thread_id !== threadId));
    } catch (error) {
      console.error('Error unsaving thread:', error);
      toast.error("Error removing saved thread", {
        description: "Something went wrong. Please try again."
      });
    }
  };

  const handleReaction = async (threadId: string, reactionType: 'like' | 'dislike') => {
    if (!user?.id) {
      toast.error("Authentication required", {
        description: "Please sign in to react to threads."
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
      toast.error("Error with reaction", {
        description: "Something went wrong. Please try again."
      });
    }
  };

  const handleReport = async (threadId: string) => {
    if (!user?.id) {
      toast.error("Authentication required", {
        description: "Please sign in to report threads."
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
      toast.success("Thread reported", {
        description: "Thank you for helping us maintain a safe community."
      });
    } catch (error) {
      console.error('Error reporting thread:', error);
      toast.error("Error reporting thread", {
        description: "Something went wrong. Please try again."
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
      <div className="grid grid-cols-1 gap-4">
        {savedThreads.map((savedThread) => {
          const thread = savedThread.thread;
          if (!thread) return null;

          return (
            <ThreadCard
              key={thread.id}
              thread={thread}
              onThreadSelect={onThreadSelect}
              userReaction={userReactions[thread.id] || null}
              isSaved={true} // All threads here are saved
              expandedThreadId={expandedThreadId}
              setExpandedThreadId={setExpandedThreadId}
              onReaction={handleReaction}
              onSave={handleUnsave} // For saved threads, this will unsave
              onReport={handleReport}
              className="animate-fadeIn"
            />
          );
        })}
      </div>
    </div>
  );
} 