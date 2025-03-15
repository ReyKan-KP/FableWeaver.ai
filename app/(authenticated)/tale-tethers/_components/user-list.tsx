"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserAvatar } from "@/components/user-avatar";
import Link from "next/link";
import { format } from "date-fns";

type User = {
  user_id: string;
  user_name: string;
  avatar_url: string;
  is_active: boolean;
  last_seen: string;
  friendship_status?: "none" | "pending_sent" | "pending_received" | "friends";
};

export const UserList = () => {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    if (!session?.user?.id) return;
    
    const fetchUsers = async () => {
      setIsLoading(true);
      
      // Fetch all users except the current user
      const { data: allUsers, error: usersError } = await supabase
        .from("user")
        .select("user_id, user_name, avatar_url, is_active, last_seen")
        .neq("user_id", session.user.id);
      
      if (usersError) {
        console.error("Error fetching users:", usersError);
        setIsLoading(false);
        return;
      }
      
      // Fetch friend relationships for the current user
      const { data: friendships, error: friendshipsError } = await supabase
        .from("friendships")
        .select("*")
        .or(`user_id.eq.${session.user.id},friend_id.eq.${session.user.id}`);
      
      if (friendshipsError) {
        console.error("Error fetching friendships:", friendshipsError);
        setIsLoading(false);
        return;
      }
      
      // Map friendship status to each user
      const usersWithFriendshipStatus = allUsers.map((user: User) => {
        const sentRequest = friendships?.find(
          f => f.user_id === session.user.id && f.friend_id === user.user_id
        );
        
        const receivedRequest = friendships?.find(
          f => f.user_id === user.user_id && f.friend_id === session.user.id
        );
        
        let status: User["friendship_status"] = "none";
        
        if (sentRequest) {
          status = sentRequest.status === "accepted" ? "friends" : "pending_sent";
        } else if (receivedRequest) {
          status = receivedRequest.status === "accepted" ? "friends" : "pending_received";
        }
        
        return {
          ...user,
          friendship_status: status
        };
      });
      
      setUsers(usersWithFriendshipStatus);
      setIsLoading(false);
    };
    
    fetchUsers();
  }, [session?.user?.id, supabase]);
  
  const handleSendFriendRequest = async (userId: string) => {
    if (!session?.user?.id) return;
    
    try {
      const { error } = await supabase
        .from("friendships")
        .insert({
          user_id: session.user.id,
          friend_id: userId,
          status: "pending",
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.user_id === userId 
            ? { ...user, friendship_status: "pending_sent" } 
            : user
        )
      );
    } catch (error) {
      console.error("Error sending friend request:", error);
    }
  };
  
  const handleAcceptFriendRequest = async (userId: string) => {
    if (!session?.user?.id) return;
    
    try {
      const { error } = await supabase
        .from("friendships")
        .update({ status: "accepted", updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("friend_id", session.user.id);
      
      if (error) throw error;
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.user_id === userId 
            ? { ...user, friendship_status: "friends" } 
            : user
        )
      );
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  };
  
  const handleRejectFriendRequest = async (userId: string) => {
    if (!session?.user?.id) return;
    
    try {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("user_id", userId)
        .eq("friend_id", session.user.id);
      
      if (error) throw error;
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.user_id === userId 
            ? { ...user, friendship_status: "none" } 
            : user
        )
      );
    } catch (error) {
      console.error("Error rejecting friend request:", error);
    }
  };
  
  const handleCancelFriendRequest = async (userId: string) => {
    if (!session?.user?.id) return;
    
    try {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("user_id", session.user.id)
        .eq("friend_id", userId);
      
      if (error) throw error;
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.user_id === userId 
            ? { ...user, friendship_status: "none" } 
            : user
        )
      );
    } catch (error) {
      console.error("Error canceling friend request:", error);
    }
  };
  
  const filteredUsers = users.filter(user => 
    user.user_name.toLowerCase().includes(searchQuery.toLowerCase())
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

  return (
    <div className="space-y-6">
      <div className="relative">
        <Input
          placeholder="Search storytellers..."
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
        ) : filteredUsers.length > 0 ? (
          filteredUsers.map((user, index) => (
            <motion.div
              key={user.user_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card className="p-4 hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center space-x-4">
                  <UserAvatar
                    userId={user.user_id}
                    userName={user.user_name}
                    avatarUrl={user.avatar_url}
                    size="md"
                    showStatus
                    isActive={user.is_active}
                  />
                  <div className="flex-1">
                    <Link href={`/user/${user.user_name}`} className="font-medium hover:underline">
                      {user.user_name}
                    </Link>
                    <p className="text-sm text-gray-500">
                      {user.is_active ? "Online" : `Last seen ${format(new Date(user.last_seen), "MMM d, yyyy")}`}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-gray-500"
          >
            No users found matching your search.
          </motion.div>
        )}
      </div>
    </div>
  );
};
