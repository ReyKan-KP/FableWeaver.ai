"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Search, UserPlus, UserMinus, MessageSquare, Clock, Users, AlertCircle } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { FriendChat } from "./friend-chat";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserAvatar } from "@/components/user-avatar";
import Link from "next/link";
import { format } from "date-fns";

type Friend = {
  user_id: string;
  user_name: string;
  avatar_url: string;
  is_active: boolean;
  last_seen: string;
  friendship_id: string;
  created_at: string;
  unread_messages?: number;
};

type FriendRequest = {
  is_active: boolean | undefined;
  friendship_id: string;
  user_id: string;
  user_name: string;
  avatar_url: string;
  created_at: string;
};

// Define types for Supabase responses
type UserData = {
  user_id: string;
  user_name: string;
  avatar_url: string;
  is_active: boolean;
  last_seen: string;
};

type FriendshipData = {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
  status: string;
  user: UserData;
  friend: UserData;
};

type UnreadMessageCount = {
  sender_id: string;
  unread_count: string;
};

interface FriendsListProps {
  onFriendSelect: (friend: {
    user_id: string;
    user_name: string;
    avatar_url: string;
    is_active: boolean;
  }) => void;
}

export const FriendsList = ({ onFriendSelect }: FriendsListProps) => {
  const { data: session } = useSession();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [activeChatFriend, setActiveChatFriend] = useState<Friend | null>(null);
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    if (!session?.user?.id) return;
    
    const fetchFriendsAndRequests = async () => {
      setIsLoading(true);
      
      // Fetch accepted friendships (friends)
      const { data: acceptedFriendships, error: friendsError } = await supabase
        .from("friendships")
        .select(`
          id,
          user_id,
          friend_id,
          created_at,
          status,
          user!friendships_user_id_fkey (
            user_id,
            user_name,
            avatar_url,
            is_active,
            last_seen
          ),
          friend:user!friendships_friend_id_fkey (
            user_id,
            user_name,
            avatar_url,
            is_active,
            last_seen
          )
        `)
        .or(`user_id.eq.${session.user.id},friend_id.eq.${session.user.id}`)
        .eq("status", "accepted");
      
      if (friendsError) {
        console.error("Error fetching friends:", friendsError);
      } else {
        // Process friends data
        const processedFriends = (acceptedFriendships as unknown as FriendshipData[] || []).map(friendship => {
          // Determine which user is the friend (not the current user)
          const friendData = friendship.user_id === session.user.id 
            ? friendship.friend 
            : friendship.user;
          
          return {
            user_id: friendData.user_id,
            user_name: friendData.user_name,
            avatar_url: friendData.avatar_url,
            is_active: friendData.is_active,
            last_seen: friendData.last_seen,
            friendship_id: friendship.id,
            created_at: friendship.created_at,
            unread_messages: 0
          };
        });
        
        // Fetch unread message counts for each friend
        if (processedFriends.length > 0) {
          const friendIds = processedFriends.map(friend => friend.user_id);
          
          // Use the unread_messages_view instead of trying to group in the query
          const { data: unreadCounts, error: unreadError } = await supabase
            .from("unread_messages_view")
            .select("*")
            .eq("receiver_id", session.user.id)
            .in("sender_id", friendIds);
          
          if (!unreadError && unreadCounts) {
            // Update unread counts
            const friendsWithUnreadCounts = processedFriends.map(friend => {
              const unreadCount = unreadCounts.find(count => count.sender_id === friend.user_id);
              return {
                ...friend,
                unread_messages: unreadCount ? parseInt(unreadCount.unread_count) : 0
              };
            });
            
            setFriends(friendsWithUnreadCounts);
          } else {
            setFriends(processedFriends);
          }
        } else {
          setFriends(processedFriends);
        }
      }
      
      // Fetch incoming friend requests
      const { data: incomingData, error: incomingError } = await supabase
        .from("friendships")
        .select(`
          id,
          created_at,
          user_id,
          user!friendships_user_id_fkey (
            user_id,
            user_name,
            avatar_url
          )
        `)
        .eq("friend_id", session.user.id)
        .eq("status", "pending");
      
      if (incomingError) {
        console.error("Error fetching incoming requests:", incomingError);
      } else {
        type IncomingRequestData = {
          id: string;
          created_at: string;
          user_id: string;
          user: {
            user_id: string;
            user_name: string;
            avatar_url: string;
          };
        };
        
        const processedIncoming = (incomingData as unknown as IncomingRequestData[] || []).map(request => ({
          friendship_id: request.id,
          user_id: request.user.user_id,
          user_name: request.user.user_name,
          avatar_url: request.user.avatar_url,
          created_at: request.created_at
        }));
        
        // Add is_active property to match FriendRequest type
        const processedIncomingWithActive = processedIncoming.map(request => ({
          ...request,
          is_active: true
        }));
        
        setIncomingRequests(processedIncomingWithActive);
      }
      
      // Fetch outgoing friend requests
      const { data: outgoingData, error: outgoingError } = await supabase
        .from("friendships")
        .select(`
          id,
          created_at,
          friend_id,
          friend:user!friendships_friend_id_fkey (
            user_id,
            user_name,
            avatar_url
          )
        `)
        .eq("user_id", session.user.id)
        .eq("status", "pending");
      
      if (outgoingError) {
        console.error("Error fetching outgoing requests:", outgoingError);
      } else {
        type OutgoingRequestData = {
          id: string;
          created_at: string;
          friend_id: string;
          friend: {
            user_id: string;
            user_name: string;
            avatar_url: string;
          };
        };
        
        const processedOutgoing = (outgoingData as unknown as OutgoingRequestData[] || []).map(request => ({
          friendship_id: request.id,
          user_id: request.friend.user_id,
          user_name: request.friend.user_name,
          avatar_url: request.friend.avatar_url,
          created_at: request.created_at
        }));
        
        // Add is_active property to match FriendRequest type
        const processedOutgoingWithActive = processedOutgoing.map(request => ({
          ...request,
          is_active: true
        }));
        
        setOutgoingRequests(processedOutgoingWithActive);
      }
      
      setIsLoading(false);
    };
    
    fetchFriendsAndRequests();

    // Subscribe to new messages for unread count updates
    const subscription = supabase
      .channel("friend_messages_count")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "friend_messages",
          filter: `receiver_id=eq.${session.user.id}`,
        },
        (payload) => {
          const newMessage = payload.new as { sender_id: string; is_read: boolean };
          
          // Only update count if the message is unread and not from the active chat
          if (!newMessage.is_read && (!activeChatFriend || newMessage.sender_id !== activeChatFriend.user_id)) {
            setFriends(prev => 
              prev.map(friend => 
                friend.user_id === newMessage.sender_id
                  ? { ...friend, unread_messages: (friend.unread_messages || 0) + 1 }
                  : friend
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [session?.user?.id, supabase, activeChatFriend]);
  
  const handleAcceptFriendRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from("friendships")
        .update({ status: "accepted", updated_at: new Date().toISOString() })
        .eq("id", friendshipId);
      
      if (error) throw error;
      
      // Find the accepted request
      const acceptedRequest = incomingRequests.find(req => req.friendship_id === friendshipId);
      
      if (acceptedRequest) {
        // Add to friends list
        setFriends(prev => [...prev, {
          user_id: acceptedRequest.user_id,
          user_name: acceptedRequest.user_name,
          avatar_url: acceptedRequest.avatar_url,
          is_active: false, // We don't have this info from the request
          last_seen: "", // We don't have this info from the request
          friendship_id: acceptedRequest.friendship_id,
          created_at: new Date().toISOString(),
          unread_messages: 0
        }]);
        
        // Remove from incoming requests
        setIncomingRequests(prev => prev.filter(req => req.friendship_id !== friendshipId));
      }
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  };
  
  const handleRejectFriendRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", friendshipId);
      
      if (error) throw error;
      
      // Remove from incoming requests
      setIncomingRequests(prev => prev.filter(req => req.friendship_id !== friendshipId));
    } catch (error) {
      console.error("Error rejecting friend request:", error);
    }
  };
  
  const handleCancelFriendRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", friendshipId);
      
      if (error) throw error;
      
      // Remove from outgoing requests
      setOutgoingRequests(prev => prev.filter(req => req.friendship_id !== friendshipId));
    } catch (error) {
      console.error("Error canceling friend request:", error);
    }
  };
  
  const handleRemoveFriend = async () => {
    if (!selectedFriendId) return;
    
    try {
      const friendToRemove = friends.find(friend => friend.user_id === selectedFriendId);
      
      if (!friendToRemove) return;
      
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", friendToRemove.friendship_id);
      
      if (error) throw error;
      
      // Remove from friends list
      setFriends(prev => prev.filter(friend => friend.user_id !== selectedFriendId));
      setIsRemoveDialogOpen(false);
      setSelectedFriendId(null);
      
      // If the removed friend was in active chat, close the chat
      if (activeChatFriend && activeChatFriend.user_id === selectedFriendId) {
        setActiveChatFriend(null);
      }
    } catch (error) {
      console.error("Error removing friend:", error);
    }
  };

  const handleStartChat = (friend: Friend) => {
    setActiveChatFriend(friend);
    
    // Reset unread count for this friend
    setFriends(prev => 
      prev.map(f => 
        f.user_id === friend.user_id 
          ? { ...f, unread_messages: 0 } 
          : f
      )
    );
  };
  
  const filteredFriends = friends.filter(friend => 
    friend.user_name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  // If a chat is active, show the chat interface
  if (activeChatFriend) {
    return (
      <FriendChat 
        friend={activeChatFriend} 
        onBack={() => setActiveChatFriend(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="friends" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Tethers {friends.length > 0 && `(${friends.length})`}</span>
          </TabsTrigger>
          <TabsTrigger value="incoming" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            <span>Incoming {incomingRequests.length > 0 && `(${incomingRequests.length})`}</span>
          </TabsTrigger>
          <TabsTrigger value="outgoing" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Outgoing {outgoingRequests.length > 0 && `(${outgoingRequests.length})`}</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="friends" className="mt-6">
          <div className="relative mb-4">
            <Input
              placeholder="Search tethers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    </div>
                  </div>
                </Card>
              ))
            ) : filteredFriends.length > 0 ? (
              filteredFriends.map((friend, index) => (
                <motion.div
                  key={friend.user_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onFriendSelect(friend)}
                >
                  <div className="relative">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Avatar className="h-12 w-12">
                            <img 
                              src={friend.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + friend.user_name} 
                              alt={friend.user_name}
                              className="object-cover"
                            />
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{friend.is_active ? "Online" : "Offline"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    {friend.is_active && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-800" />
                    )}
                    {(friend.unread_messages || 0) > 0 && (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 border-2 border-white dark:border-gray-800 flex items-center justify-center text-white text-xs font-bold"
                      >
                        {friend.unread_messages}
                      </motion.span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{friend.user_name}</h3>
                      {!friend.is_active && friend.last_seen && (
                        <span className="text-xs text-gray-500">
                          {getTimeAgo(friend.last_seen)}
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Tethered since {new Date(friend.created_at).toLocaleDateString()}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="flex items-center gap-1 text-blue-500 hover:text-blue-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartChat(friend);
                                }}
                              >
                                <MessageSquare className="h-4 w-4" />
                                {(friend.unread_messages || 0) > 0 && (
                                  <motion.span 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="text-xs font-bold"
                                  >
                                    {friend.unread_messages}
                                  </motion.span>
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Start a conversation</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="text-red-500 hover:text-red-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedFriendId(friend.user_id);
                                  setIsRemoveDialogOpen(true);
                                }}
                              >
                                <UserMinus className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Remove connection</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-gray-500"
              >
                No friends found. Start connecting with other storytellers!
              </motion.div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="incoming" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    </div>
                  </div>
                </Card>
              ))
            ) : incomingRequests.length > 0 ? (
              incomingRequests.map((request) => (
                <motion.div
                  key={request.friendship_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="p-4 hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <img 
                          src={request.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + request.user_name} 
                          alt={request.user_name}
                          className="object-cover"
                        />
                      </Avatar>
                      
                      <div className="flex-1">
                        <h3 className="font-medium">{request.user_name}</h3>
                        <p className="text-xs text-gray-500">
                          Sent {getTimeAgo(request.created_at)}
                        </p>
                        
                        <div className="mt-3 flex space-x-2">
                          <Button 
                            size="sm" 
                            className="flex-1 bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 text-white hover:from-violet-700 hover:via-blue-700 hover:to-teal-600 transition-all duration-300 dark:bg-gradient-to-r dark:from-violet-600 dark:via-blue-600 dark:to-teal-500 dark:hover:from-violet-700 dark:hover:via-blue-700 dark:hover:to-teal-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcceptFriendRequest(request.friendship_id);
                            }}
                          >
                            Accept
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="flex-1 bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 text-white hover:from-violet-700 hover:via-blue-700 hover:to-teal-600 transition-all duration-300 dark:bg-gradient-to-r dark:from-violet-600 dark:via-blue-600 dark:to-teal-500 dark:hover:from-violet-700 dark:hover:via-blue-700 dark:hover:to-teal-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRejectFriendRequest(request.friendship_id);
                            }}
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No pending friend requests.</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="outgoing" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    </div>
                  </div>
                </Card>
              ))
            ) : outgoingRequests.length > 0 ? (
              outgoingRequests.map((request) => (
                <motion.div
                  key={request.friendship_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="p-4 hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center space-x-4">
                      <UserAvatar
                        userId={request.user_id}
                        userName={request.user_name}
                        avatarUrl={request.avatar_url}
                        size="md"
                        showStatus
                        isActive={request.is_active}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{request.user_name}</h3>
                          <Badge variant="outline" className="bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 text-white hover:from-violet-700 hover:via-blue-700 hover:to-teal-600 transition-all duration-300 dark:bg-gradient-to-r dark:from-violet-600 dark:via-blue-600 dark:to-teal-500 dark:hover:from-violet-700 dark:hover:via-blue-700 dark:hover:to-teal-600">Pending</Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Sent {getTimeAgo(request.created_at)}
                        </p>
                        
                        <div className="mt-3">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="w-full bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 text-white hover:from-violet-700 hover:via-blue-700 hover:to-teal-600 transition-all duration-300 dark:bg-gradient-to-r dark:from-violet-600 dark:via-blue-600 dark:to-teal-500 dark:hover:from-violet-700 dark:hover:via-blue-700 dark:hover:to-teal-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelFriendRequest(request.friendship_id);
                            }}
                          >
                            Cancel Request
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No outgoing friend requests.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      <AlertDialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Untether Connection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this connection? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveFriend} className="bg-red-500 hover:bg-red-600">
              Untether
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
