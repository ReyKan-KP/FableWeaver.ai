"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/user-avatar";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  MessageSquare, 
  Users, 
  PenTool, 
  UserPlus, 
  UserCheck,
  Clock,
  Loader2,
  Heart,
  MessageCircle,
  Calendar,
  Mail,
  Share2,
  BookMarked,
  Award,
  UserMinus,
  Sparkles
} from "lucide-react";

interface UserProfileProps {
  user: {
    user_id: string;
    user_name: string;
    user_email: string;
    avatar_url: string | null;
    created_at: string;
    is_active: boolean;
  };
  statistics: {
    stories_count: number;
    chapters_count: number;
    characters_count: number;
    total_words: number;
    published_stories: number;
  } | null;
  publicStories: {
    id: string;
    title: string;
    genre: string;
    cover_image: string | null;
    created_at: string;
    is_published: boolean;
    is_public: boolean;
  }[] | null;
  recentThreads: {
    id: string;
    title: string;
    content: string;
    created_at: string;
    category: string;
    likes_count: number;
    comments_count: number;
    user: {
      user_id: string;
      user_name: string;
      avatar_url: string | null;
    };
  }[] | null;
  userCharacters: {
    id: string;
    name: string;
    description: string;
    content_source: string;
    content_types: string[];
    image_url: string | null;
    created_at: string;
    is_public: boolean;
    is_active: boolean;
  }[] | null;
  friendshipStatus: "none" | "pending_sent" | "pending_received" | "friends" | null;
  isOwnProfile: boolean;
}

export function UserProfile({
  user,
  statistics,
  publicStories,
  recentThreads,
  userCharacters,
  friendshipStatus: initialFriendshipStatus,
  isOwnProfile,
}: UserProfileProps) {
  const { data: session } = useSession();
  const supabase = createBrowserSupabaseClient();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("stories");
  const [currentFriendshipStatus, setCurrentFriendshipStatus] = useState(initialFriendshipStatus);

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  // Set up real-time subscription to friendship changes
  useEffect(() => {
    if (!session?.user?.id) return;

    // Subscribe to changes in the friendships table
    const friendshipChannel = supabase
      .channel('friendship-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `or(and(user_id.eq.${session.user.id},friend_id.eq.${user.user_id}),and(user_id.eq.${user.user_id},friend_id.eq.${session.user.id}))`,
        },
        async (payload) => {
          // Fetch the current friendship status after a change
          await refreshFriendshipStatus();
        }
      )
      .subscribe();

    // Initial fetch of friendship status
    refreshFriendshipStatus();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(friendshipChannel);
    };
  }, [session?.user?.id, user.user_id]);

  // Function to refresh the friendship status from the database
  const refreshFriendshipStatus = async () => {
    if (!session?.user?.id) return;

    try {
      // Check for friendship where current user is the requester
      const { data: sentRequest, error: sentError } = await supabase
        .from("friendships")
        .select("status")
        .eq("user_id", session.user.id)
        .eq("friend_id", user.user_id)
        .maybeSingle();

      if (sentError) throw sentError;

      // Check for friendship where current user is the recipient
      const { data: receivedRequest, error: receivedError } = await supabase
        .from("friendships")
        .select("status")
        .eq("user_id", user.user_id)
        .eq("friend_id", session.user.id)
        .maybeSingle();

      if (receivedError) throw receivedError;

      // Determine friendship status
      if (sentRequest?.status === "accepted" || receivedRequest?.status === "accepted") {
        setCurrentFriendshipStatus("friends");
      } else if (sentRequest?.status === "pending") {
        setCurrentFriendshipStatus("pending_sent");
      } else if (receivedRequest?.status === "pending") {
        setCurrentFriendshipStatus("pending_received");
      } else {
        setCurrentFriendshipStatus("none");
      }
    } catch (error) {
      console.error("Error refreshing friendship status:", error);
    }
  };

  const handleFriendAction = async () => {
    if (!session?.user?.id) {
      toast({
        title: "Authentication required",
        description: "Please sign in to manage friendships.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      switch (currentFriendshipStatus) {
        case "none":
          // Send friend request
          const { error: sendError } = await supabase
            .from("friendships")
            .insert({
              user_id: session.user.id,
              friend_id: user.user_id,
              status: "pending",
              created_at: new Date().toISOString(),
            });

          if (sendError) throw sendError;
          setCurrentFriendshipStatus("pending_sent");
          toast({
            title: "Friend request sent",
            description: "Your friend request has been sent.",
          });
          break;

        case "pending_received":
          // Accept friend request
          const { error: acceptError } = await supabase
            .from("friendships")
            .update({ status: "accepted", updated_at: new Date().toISOString() })
            .eq("user_id", user.user_id)
            .eq("friend_id", session.user.id);

          if (acceptError) throw acceptError;
          setCurrentFriendshipStatus("friends");
          toast({
            title: "Friend request accepted",
            description: "You are now friends!",
          });
          break;

        case "pending_sent":
          // Cancel friend request
          const { error: cancelError } = await supabase
            .from("friendships")
            .delete()
            .eq("user_id", session.user.id)
            .eq("friend_id", user.user_id);

          if (cancelError) throw cancelError;
          setCurrentFriendshipStatus("none");
          toast({
            title: "Friend request cancelled",
            description: "Your friend request has been cancelled.",
          });
          break;

        case "friends":
          // Remove friend
          const { error: removeError } = await supabase
            .from("friendships")
            .delete()
            .or(
              `and(user_id.eq.${session.user.id},friend_id.eq.${user.user_id}),and(user_id.eq.${user.user_id},friend_id.eq.${session.user.id})`
            );

          if (removeError) throw removeError;
          setCurrentFriendshipStatus("none");
          toast({
            title: "Friend removed",
            description: "This user has been removed from your friends list.",
          });
          break;
      }
      
      // Refresh friendship status to ensure UI is in sync with database
      await refreshFriendshipStatus();
    } catch (error) {
      console.error("Error managing friendship:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectFriendRequest = async () => {
    if (!session?.user?.id) {
      toast({
        title: "Authentication required",
        description: "Please sign in to manage friendships.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Reject friend request
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("user_id", user.user_id)
        .eq("friend_id", session.user.id);

      if (error) throw error;
      setCurrentFriendshipStatus("none");
      toast({
        title: "Friend request rejected",
        description: "The friend request has been rejected.",
      });
      
      // Refresh friendship status to ensure UI is in sync with database
      await refreshFriendshipStatus();
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getFriendButtonText = () => {
    switch (currentFriendshipStatus) {
      case "none":
        return "Add Friend";
      case "pending_sent":
        return "Cancel Request";
      case "pending_received":
        return "Accept Request";
      case "friends":
        return "Remove Friend";
      default:
        return "Add Friend";
    }
  };

  const getFriendButtonIcon = () => {
    switch (currentFriendshipStatus) {
      case "none":
        return <UserPlus className="w-4 h-4 mr-2" />;
      case "pending_sent":
        return <Clock className="w-4 h-4 mr-2" />;
      case "pending_received":
        return <UserCheck className="w-4 h-4 mr-2" />;
      case "friends":
        return <UserCheck className="w-4 h-4 mr-2" />;
      default:
        return <UserPlus className="w-4 h-4 mr-2" />;
    }
  };

  const getFriendButtonVariant = () => {
    return currentFriendshipStatus === "friends" ? "destructive" : "default";
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-700 p-6"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <motion.div whileHover={{ scale: 1.05 }}>
            <UserAvatar
              userId={user.user_id}
              userName={user.user_name}
              avatarUrl={user.avatar_url}
              size="lg"
              showStatus
              isActive={user.is_active}
            />
          </motion.div>
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">
                {user.user_name}
              </h1>
              {/* {user.is_active ? (
                <Badge variant="default" className="flex items-center gap-1 bg-green-500 hover:bg-green-600">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  Online
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Offline
                </Badge>
              )} */}
            </div>
            <div className="flex items-center gap-4 mt-2 text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  Joined {format(new Date(user.created_at), "MMMM yyyy")}
                </span>
              </div>
              {!isOwnProfile && (
                <div className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">
                    {user.user_email}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            {!isOwnProfile && (
              <>
                {currentFriendshipStatus === "pending_received" ? (
                  <div className="flex gap-2">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={handleFriendAction}
                        disabled={isLoading}
                        className="min-w-[120px] bg-gradient-to-r from-green-500 to-teal-500 hover:shadow-lg transition-all duration-300"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <UserCheck className="w-4 h-4 mr-2" />
                            Accept
                          </>
                        )}
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={handleRejectFriendRequest}
                        disabled={isLoading}
                        variant="destructive"
                        className="min-w-[120px]"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <UserMinus className="w-4 h-4 mr-2" />
                            Reject
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                ) : (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={handleFriendAction}
                      disabled={isLoading}
                      variant={getFriendButtonVariant()}
                      className={`min-w-[140px] ${
                        currentFriendshipStatus === "friends" 
                          ? "bg-red-500 hover:bg-red-600" 
                          : "bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500"
                      } hover:shadow-lg transition-all duration-300`}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          {getFriendButtonIcon()}
                          {getFriendButtonText()}
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </>
            )}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="outline" size="icon">
                <Share2 className="w-4 h-4" />
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className=" rounded-xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-700 p-6"
      >
        <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">
          Author Statistics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <motion.div whileHover={{ scale: 1.05 }} className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
              <BookOpen className="w-5 h-5 text-violet-500 dark:text-violet-400" />
              <span className="text-sm">Stories</span>
            </div>
            <p className="text-2xl font-bold mt-1">{statistics?.stories_count || 0}</p>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
              <PenTool className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              <span className="text-sm">Chapters</span>
            </div>
            <p className="text-2xl font-bold mt-1">{statistics?.chapters_count || 0}</p>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
              <Users className="w-5 h-5 text-teal-500 dark:text-teal-400" />
              <span className="text-sm">Characters</span>
            </div>
            <p className="text-2xl font-bold mt-1">{statistics?.characters_count || 0}</p>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
              <MessageSquare className="w-5 h-5 text-purple-500 dark:text-purple-400" />
              <span className="text-sm">Words</span>
            </div>
            <p className="text-2xl font-bold mt-1">{statistics?.total_words || 0}</p>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
              <BookMarked className="w-5 h-5 text-green-500 dark:text-green-400" />
              <span className="text-sm">Published</span>
            </div>
            <p className="text-2xl font-bold mt-1">{statistics?.published_stories || 0}</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Content Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className=" rounded-xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-700 p-6"
      >
        <Tabs 
          defaultValue="stories" 
          className="space-y-6"
          onValueChange={(value) => setActiveTab(value)}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">
              {activeTab === "stories" 
                ? "Public Stories" 
                : activeTab === "threads" 
                  ? "Recent Threads" 
                  : "Characters"}
            </h2>
            <TabsList className="bg-white/50 dark:bg-gray-800/50">
              <TabsTrigger 
                value="stories"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:via-blue-500 data-[state=active]:to-teal-500 data-[state=active]:text-white"
              >
                Stories
              </TabsTrigger>
              <TabsTrigger 
                value="threads"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:via-blue-500 data-[state=active]:to-teal-500 data-[state=active]:text-white"
              >
                Threads
              </TabsTrigger>
              <TabsTrigger 
                value="characters"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:via-blue-500 data-[state=active]:to-teal-500 data-[state=active]:text-white"
              >
                Characters
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="stories">
            <AnimatePresence>
              {publicStories && publicStories.length > 0 ? (
                <motion.div
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {publicStories.map((story) => (
                    <motion.div
                      key={story.id}
                      variants={item}
                      whileHover={{ scale: 1.03 }}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700"
                    >
                      <Link href={`/fable-trail/${story.id}`}>
                        <div className="relative aspect-[3/4]">
                          <div className="absolute inset-0 bg-dot-white/[0.2] dark:bg-dot-black/[0.2]"></div>
                          <Image
                            src={story.cover_image || "/images/default-cover.png"}
                            alt={story.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold line-clamp-2 bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">
                            {story.title}
                          </h3>
                          <div className="flex justify-between items-center mt-2">
                            <Badge variant="outline" className="capitalize">
                              {story.genre}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {format(new Date(story.created_at), "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-8 text-center"
                >
                  <p className="text-gray-600 dark:text-gray-300 text-lg">
                    No public stories yet.
                  </p>
                  {isOwnProfile && (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="mt-4">
                      <Link
                        href="/create-story"
                        className="inline-block px-6 py-3 bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 
                        text-white rounded-full hover:shadow-lg transform transition-all duration-300"
                      >
                        Create Your First Story
                      </Link>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="threads">
            <AnimatePresence>
              {recentThreads && recentThreads.length > 0 ? (
                <motion.div
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="space-y-4"
                >
                  {recentThreads.map((thread) => (
                    <motion.div
                      key={thread.id}
                      variants={item}
                      whileHover={{ scale: 1.02 }}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700"
                    >
                      <Link href={`/thread-tapestry/${thread.id}`}>
                        <div className="p-4">
                          <div className="flex items-start gap-4">
                            <UserAvatar
                              userId={thread.user.user_id}
                              userName={thread.user.user_name}
                              avatarUrl={thread.user.avatar_url}
                              size="sm"
                            />
                            <div className="flex-1">
                              <h3 className="font-semibold line-clamp-2 bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">
                                {thread.title}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                                {thread.content}
                              </p>
                              <div className="flex flex-wrap items-center gap-4 mt-3">
                                <Badge variant="outline" className="capitalize">
                                  {thread.category}
                                </Badge>
                                <div className="flex items-center gap-1 text-gray-500">
                                  <Heart className="w-4 h-4" />
                                  <span className="text-xs">{thread.likes_count}</span>
                                </div>
                                <div className="flex items-center gap-1 text-gray-500">
                                  <MessageCircle className="w-4 h-4" />
                                  <span className="text-xs">{thread.comments_count}</span>
                                </div>
                                <span className="text-xs text-gray-500 ml-auto">
                                  {format(new Date(thread.created_at), "MMM d, yyyy")}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-8 text-center"
                >
                  <p className="text-gray-600 dark:text-gray-300 text-lg">
                    No threads yet.
                  </p>
                  {isOwnProfile && (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="mt-4">
                      <Link
                        href="/thread-tapestry/create"
                        className="inline-block px-6 py-3 bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 
                        text-white rounded-full hover:shadow-lg transform transition-all duration-300"
                      >
                        Create Your First Thread
                      </Link>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="characters">
            <AnimatePresence>
              {userCharacters && userCharacters.length > 0 ? (
                <motion.div
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {userCharacters.map((character) => (
                    <motion.div
                      key={character.id}
                      variants={item}
                      whileHover={{ scale: 1.02 }}
                      className="bg-[#bccff1] dark:bg-zinc-900 rounded-xl shadow-md overflow-hidden hover:shadow-xl 
                      transition-all duration-300 border border-gray-100 dark:border-gray-700"
                    >
                      <div className="relative h-48 w-full p-[1px]">
                        <div className="absolute inset-0 bg-dot-white/[0.2] dark:bg-dot-black/[0.2]"></div>
                        <Image
                          src={character.image_url || "/images/default-character.png"}
                          alt={character.name}
                          className="w-full h-full object-contain"
                          width={500}
                          height={500}
                        />
                      </div>
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <h2 className="text-xl font-semibold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">
                            {character.name}
                          </h2>
                          <div className="flex flex-col gap-2">
                            <div className="flex flex-wrap gap-1 justify-end">
                              {character.content_types &&
                                character.content_types.map(
                                  (type, index) =>
                                    type && (
                                      <span
                                        key={index}
                                        className="px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 
                                        text-purple-800 dark:text-purple-300 rounded-full whitespace-nowrap"
                                      >
                                        {type}
                                      </span>
                                    )
                                )}
                            </div>
                            <div className="flex gap-1 justify-end">
                              {character.is_public && (
                                <span className="px-3 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full">
                                  Public
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2 min-h-[3rem]">
                          {character.description}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                            From: {character.content_source}
                          </span>
                          <motion.a
                            href={`/chatbot/${character.id}`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-4 py-2 bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 text-white 
                                rounded-full hover:shadow-lg transform transition-all duration-300 flex items-center gap-2"
                          >
                            <Sparkles className="w-4 h-4" />
                            Chat Now
                          </motion.a>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-8 text-center"
                >
                  <p className="text-gray-600 dark:text-gray-300 text-lg">
                    No characters yet.
                  </p>
                  {isOwnProfile && (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="mt-4">
                      <Link
                        href="/character-realm"
                        className="inline-block px-6 py-3 bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 
                        text-white rounded-full hover:shadow-lg transform transition-all duration-300"
                      >
                        Create Your First Character
                      </Link>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
} 