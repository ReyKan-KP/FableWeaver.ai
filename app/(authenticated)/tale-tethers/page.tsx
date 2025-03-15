"use client";

import { useState } from "react";
import { FriendChatModal } from "./_components/friend-chat-modal";
import { FriendsList } from "./_components/friends-list";
import { UserList } from "./_components/user-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { Users, UserPlus, HelpCircle, Handshake } from "lucide-react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Loading from "./loading";
const FriendsPage = () => {
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<{
    user_id: string;
    user_name: string;
    avatar_url: string;
    is_active: boolean;
  } | null>(null);
  const { status } = useSession();
  const isLoading = status === "loading";

  const handleOpenChat = (friend: {
    user_id: string;
    user_name: string;
    avatar_url: string;
    is_active: boolean;
  }) => {
    setSelectedFriend(friend);
  };

  const handleCloseChat = () => {
    setSelectedFriend(null);
  };

  return (
    isLoading ? (
      <Loading />
    ) : (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
    >
      <div className="flex flex-col space-y-2">
        <div className="flex items-center gap-3">
          
            <div className="bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 p-2 rounded-lg">
              <Handshake className="w-6 h-6 text-white" />
            </div>
            <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">Tale Tethers</h1>
            <p className="text-muted-foreground">
              Connect with fellow storytellers and readers in your literary journey.
            </p>
            </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsHelpDialogOpen(true)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <HelpCircle className="w-6 h-6" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Learn more about TaleTethers</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <Tabs defaultValue="my-friends" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="my-friends" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>My Tethers</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>View and manage your connections</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="discover" className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  <span>Discover Storytellers</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Find new storytellers to connect with</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TabsList>
        
        <AnimatePresence mode="wait">
          <TabsContent value="my-friends">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <FriendsList onFriendSelect={handleOpenChat} />
            </motion.div>
          </TabsContent>
          
          <TabsContent value="discover">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <UserList />
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>

      <AnimatePresence>
        {selectedFriend && (
          <FriendChatModal
            isOpen={!!selectedFriend}
            onClose={handleCloseChat}
            friend={selectedFriend}
          />
        )}
      </AnimatePresence>

      <Dialog open={isHelpDialogOpen} onOpenChange={setIsHelpDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">
              Welcome to TaleTethers
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-lg font-semibold">About TaleTethers</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Tale Tethers is your social hub within FableWeaver.ai, connecting you with fellow storytellers and readers who share your passion for narratives and creative writing.
              </p>
            </motion.div>

            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <h3 className="text-lg font-semibold">Features</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <motion.div 
                  className="flex items-start gap-2"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Users className="w-5 h-5 text-blue-500 mt-1" />
                  <div>
                    <h4 className="font-medium">Connect with Storytellers</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Find and connect with other creative minds
                    </p>
                  </div>
                </motion.div>
                <motion.div 
                  className="flex items-start gap-2"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <UserPlus className="w-5 h-5 text-purple-500 mt-1" />
                  <div>
                    <h4 className="font-medium">Friend Requests</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Send and manage connection requests
                    </p>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <h3 className="text-lg font-semibold">Getting Started</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>Browse through Discover Storytellers to find other users</li>
                <li>Send friend requests to users you&apos;d like to connect with</li>
                <li>Accept or decline incoming requests in My Tethers</li>
                <li>View your connections and their online status</li>
                <li>Message your friends to discuss stories and collaborate</li>
              </ol>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>
      </motion.div>
    )
  );
};

export default FriendsPage;