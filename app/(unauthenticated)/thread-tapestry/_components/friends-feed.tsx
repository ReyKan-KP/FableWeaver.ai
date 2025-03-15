"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Trash2,
  Bookmark,
  UserCheck,
  UserPlus,
  Search,
  X
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { threadService } from '@/lib/services/threads';
import type { Thread } from '@/types/threads';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import Comments from "./comments";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ThreadCard from "./thread-card";

interface FriendsFeedProps {
  onThreadSelect: (threadId: string) => void;
}

export default function FriendsFeed({ onThreadSelect }: FriendsFeedProps) {
  const { data: session, status } = useSession();
  const user = session?.user;
  const supabase = createBrowserSupabaseClient();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInputValue, setSearchInputValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest');
  const [userReactions, setUserReactions] = useState<Record<string, 'like' | 'dislike' | null>>({});
  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState<string | null>(null);
  const [savedThreads, setSavedThreads] = useState<Record<string, boolean>>({});
  const [friendIds, setFriendIds] = useState<string[]>([]);

  const categories = [
    "discussion",
    "question",
    "announcement",
    "story",
    "art",
    "gaming",
    "technology"
  ];

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setSearchQuery(query);
      if (friendIds.length > 0) {
        fetchThreads();
      }
    }, 500),
    [friendIds]
  );

  // Handle input change with debounce
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInputValue(value);
    debouncedSearch(value);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchInputValue("");
    setSearchQuery("");
    fetchThreads();
  };

  useEffect(() => {
    if (user?.id) {
      fetchFriends();
    }
  }, [user?.id]);

  useEffect(() => {
    if (friendIds.length > 0) {
      fetchThreads();
    }
  }, [friendIds, selectedCategory, sortBy]);

  useEffect(() => {
    if (user?.id) {
      fetchUserReactions();
      fetchSavedThreads();
    }
  }, [user?.id, threads]);

  const fetchFriends = async () => {
    if (!user?.id) return;
    
    try {
      // Fetch accepted friendships (friends)
      const { data: acceptedFriendships, error: friendsError } = await supabase
        .from("friendships")
        .select(`
          id,
          user_id,
          friend_id,
          status
        `)
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq("status", "accepted");
      
      if (friendsError) {
        console.error("Error fetching friends:", friendsError);
        return;
      }
      
      // Extract friend IDs
      const friendIdList = acceptedFriendships.map(friendship => {
        // Determine which user is the friend (not the current user)
        return friendship.user_id === user.id 
          ? friendship.friend_id 
          : friendship.user_id;
      });
      
      setFriendIds(friendIdList);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const fetchUserReactions = async () => {
    if (!user?.id || threads.length === 0) return;
    
    try {
      // This would ideally be a single API call to get all reactions for the user
      // For now, we'll simulate by checking each thread individually
      const reactionsMap: Record<string, 'like' | 'dislike' | null> = {};
      
      for (const thread of threads) {
        try {
          const { data, error } = await supabase
            .from('reactions')
            .select('reaction_type')
            .eq('user_id', String(user.id))
            .eq('target_type', 'thread')
            .eq('target_id', thread.id)
            .single();
          
          if (error) {
            reactionsMap[thread.id] = null;
          } else if (data) {
            reactionsMap[thread.id] = data.reaction_type as 'like' | 'dislike';
          }
        } catch (error) {
          console.error('Error fetching reaction for thread:', thread.id, error);
          reactionsMap[thread.id] = null;
        }
      }
      
      setUserReactions(reactionsMap);
    } catch (error) {
      console.error('Error fetching user reactions:', error);
    }
  };

  const fetchSavedThreads = async () => {
    if (!user?.id || threads.length === 0) return;
    
    try {
      const savedMap: Record<string, boolean> = {};
      
      for (const thread of threads) {
        try {
          const isSaved = await threadService.isThreadSaved(user.id, thread.id);
          savedMap[thread.id] = isSaved;
        } catch (error) {
          console.error('Error checking if thread is saved:', thread.id, error);
          savedMap[thread.id] = false;
        }
      }
      
      setSavedThreads(savedMap);
    } catch (error) {
      console.error('Error fetching saved threads:', error);
    }
  };

  const fetchThreads = async () => {
    if (friendIds.length === 0) {
      setThreads([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setIsSearching(!!searchQuery);
      
      // Get all threads
      const allThreads = await threadService.getThreads({
        category: selectedCategory || undefined,
        search: searchQuery || undefined,
        sort: sortBy,
        limit: 50 // Fetch more to filter
      });
      
      // Filter threads to only include those from friends
      const friendThreads = allThreads.filter(thread => 
        friendIds.includes(thread.user_id)
      );
      
      setThreads(friendThreads);
    } catch (error) {
      console.error('Error fetching threads:', error);
      toast.error("Error loading threads", {
        description: "Something went wrong. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInputValue);
    fetchThreads();
  };

  const handleReaction = async (threadId: string, type: 'like' | 'dislike') => {
    if (!user?.id) {
      toast.error("Authentication required", {
        description: "Please sign in to react to threads."
      });
      return;
    }

    const currentReaction = userReactions[threadId];
    const hasReacted = currentReaction === type;
    const oppositeReaction = currentReaction === (type === 'like' ? 'dislike' : 'like');

    try {
      if (hasReacted) {
        // Remove the reaction
        await threadService.removeReaction(user.id, 'thread', threadId);
        setUserReactions(prev => ({
          ...prev,
          [threadId]: null
        }));
        
        // Update thread counts
        setThreads(prevThreads => 
          prevThreads.map(thread => {
            if (thread.id === threadId) {
              return {
                ...thread,
                likes_count: type === 'like' ? Math.max(0, thread.likes_count - 1) : thread.likes_count,
                dislikes_count: type === 'dislike' ? Math.max(0, thread.dislikes_count - 1) : thread.dislikes_count
              };
            }
            return thread;
          })
        );
      } else {
        // Add or change the reaction
        await threadService.addReaction({
          user_id: user.id,
          target_type: 'thread',
          target_id: threadId,
          reaction_type: type
        });
        
        // Update user reactions state
        setUserReactions(prev => ({
          ...prev,
          [threadId]: type
        }));
        
        // Update thread counts
        setThreads(prevThreads => 
          prevThreads.map(thread => {
            if (thread.id === threadId) {
              const updatedThread = { ...thread };
              
              // If there was an opposite reaction, decrement its count
              if (oppositeReaction) {
                if (type === 'like') {
                  updatedThread.dislikes_count = Math.max(0, updatedThread.dislikes_count - 1);
                } else {
                  updatedThread.likes_count = Math.max(0, updatedThread.likes_count - 1);
                }
              }
              
              // Increment the new reaction count
              if (type === 'like') {
                updatedThread.likes_count += 1;
              } else {
                updatedThread.dislikes_count += 1;
              }
              
              return updatedThread;
            }
            return thread;
          })
        );
      }
      
      // Fetch updated threads in the background
      fetchThreads();
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

  const handleDeleteThread = async (threadId: string) => {
    if (!user?.id) {
      toast.error("Authentication required", {
        description: "Please sign in to delete threads."
      });
      return;
    }

    try {
      await threadService.deleteThread(threadId);
      toast.success("Thread deleted", {
        description: "Your thread has been deleted."
      });
      // Remove the thread from the local state
      setThreads(prevThreads => prevThreads.filter(thread => thread.id !== threadId));
      setDeleteDialogOpen(false);
      setThreadToDelete(null);
    } catch (error) {
      console.error('Error deleting thread:', error);
      toast.error("Error deleting thread", {
        description: "Something went wrong. Please try again."
      });
    }
  };

  const handleSave = async (threadId: string) => {
    if (!user?.id) {
      toast.error("Authentication required", {
        description: "Please sign in to save threads."
      });
      return;
    }

    try {
      if (savedThreads[threadId]) {
        await threadService.unsaveThread(user.id, threadId);
        toast.success("Thread unsaved", {
          description: "Thread has been removed from your saved items."
        });
      } else {
        await threadService.saveThread(user.id, threadId);
        toast.success("Thread saved", {
          description: "Thread has been added to your saved items."
        });
      }
      setSavedThreads(prev => ({ ...prev, [threadId]: !prev[threadId] }));
    } catch (error) {
      console.error('Error saving/unsaving thread:', error);
      toast.error("Error updating saved status", {
        description: "Something went wrong. Please try again."
      });
    }
  };

  const handleDeleteConfirmation = (threadId: string) => {
    setThreadToDelete(threadId);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <div className="relative">
            <Input
              placeholder="Search friends' threads..."
              value={searchInputValue}
              onChange={handleSearchInputChange}
              className="glass pr-16"
            />
            <div className="absolute right-0 top-0 h-full flex items-center pr-2">
              {searchInputValue && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleClearSearch}
                  className="h-8 w-8 mr-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <Button type="submit" variant="ghost" size="icon" className="h-8 w-8">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </form>
        <div className="flex gap-2">
          <Button
            variant={sortBy === 'latest' ? 'default' : 'outline'}
            onClick={() => setSortBy('latest')}
            className="hover:scale-105"
            size="sm"
          >
            Latest
          </Button>
          <Button
            variant={sortBy === 'popular' ? 'default' : 'outline'}
            onClick={() => setSortBy('popular')}
            className="hover:scale-105"
            size="sm"
          >
            Popular
          </Button>
        </div>
      </div>

      {/* Search Results Indicator */}
      {isSearching && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {threads.length === 0 
              ? "No results found" 
              : `Found ${threads.length} result${threads.length === 1 ? '' : 's'} for "${searchQuery}"`}
          </p>
          <Button variant="ghost" size="sm" onClick={handleClearSearch} className="text-xs">
            Clear search
          </Button>
        </div>
      )}

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={!selectedCategory ? 'default' : 'outline'}
          className="cursor-pointer hover:scale-105 transition-transform"
          onClick={() => setSelectedCategory(null)}
        >
          All
        </Badge>
        {categories.map((category) => (
          <Badge
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            className="cursor-pointer capitalize hover:scale-105 transition-transform"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Badge>
        ))}
      </div>

      {/* Threads */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : threads.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <UserCheck className="w-16 h-16 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300">No friend posts found</h3>
          <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
            Your friends haven&apos;t posted any threads yet, or you haven&apos;t added any friends.
            Add friends to see their posts here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Add Friends Card */}
          <Link href="/tale-tethers" className="block w-full max-w-md mx-auto mt-4">
            <Card className="p-6 hover:shadow-lg transition-all cursor-pointer border-dashed border-2 hover:border-blue-500 hover:scale-105 flex flex-col items-center justify-center gap-3">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                <UserPlus className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Connect with More Friends</h3>
              <p className="text-center text-gray-600 dark:text-gray-400">
                Discover and connect with more friends to see their threads and stories in your feed.
              </p>
              <Button variant="outline" className="mt-2 border-blue-500 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30">
                Find Friends
              </Button>
            </Card>
          </Link>
          
          {/* Thread Cards */}
          <div className="grid grid-cols-1 gap-4">
            {threads.map((thread) => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                onThreadSelect={onThreadSelect}
                userReaction={userReactions[thread.id] || null}
                isSaved={savedThreads[thread.id] || false}
                expandedThreadId={expandedThreadId}
                setExpandedThreadId={setExpandedThreadId}
                onReaction={handleReaction}
                onSave={handleSave}
                onReport={handleReport}
                onDelete={handleDeleteConfirmation}
              />
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Thread</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this thread? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => threadToDelete && handleDeleteThread(threadToDelete)}
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

// Helper function for debounce
function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout;
  return function(...args: any[]) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
} 