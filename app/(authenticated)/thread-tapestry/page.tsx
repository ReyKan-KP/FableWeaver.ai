"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Info, HelpCircle, Sparkles } from "lucide-react";
import ThreadFeed from "./_components/feed";
import CreateThread from "./_components/create-thread";
import Comments from "./_components/comments";
import SavedThreads from "./_components/saved-threads";
import FriendsFeed from "./_components/friends-feed";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ThreadTapestryPage() {
  const [showCreateThread, setShowCreateThread] = useState(false);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);

  const handleThreadSelect = (threadId: string) => {
    if (selectedThread === threadId) {
      // Toggle comments visibility if clicking the same thread
      setShowComments(!showComments);
    } else {
      // Select new thread and show comments
      setSelectedThread(threadId);
      setShowComments(true);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">
                Thread Tapestry
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Weave stories through engaging discussions
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsHelpDialogOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <HelpCircle className="w-6 h-6" />
            </motion.button>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => setShowCreateThread(!showCreateThread)}
              className="px-6 py-3 bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 text-white rounded-full 
              hover:shadow-lg transform transition-all duration-300 font-semibold flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              New Thread
            </Button>
          </motion.div>
        </div>

        {/* Create Thread Form */}
        <AnimatePresence>
          {showCreateThread && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <CreateThread />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className=" rounded-xl shadow-md p-6">
          <Tabs defaultValue="feed" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="feed" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:via-blue-500 data-[state=active]:to-teal-500 data-[state=active]:text-white">
                Feed
              </TabsTrigger>
              <TabsTrigger value="friends" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:via-blue-500 data-[state=active]:to-teal-500 data-[state=active]:text-white">
                Friends
              </TabsTrigger>
              <TabsTrigger value="saved" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:via-blue-500 data-[state=active]:to-teal-500 data-[state=active]:text-white">
                Saved
              </TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="space-y-6">
              <ThreadFeed onThreadSelect={handleThreadSelect} />
            </TabsContent>

            <TabsContent value="friends">
              <FriendsFeed onThreadSelect={handleThreadSelect} />
            </TabsContent>

            <TabsContent value="saved">
              <SavedThreads onThreadSelect={handleThreadSelect} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Comments Section */}
        <AnimatePresence>
          {selectedThread && showComments && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mt-6"
            >
              <Comments threadId={selectedThread} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Help Dialog */}
      <Dialog open={isHelpDialogOpen} onOpenChange={setIsHelpDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">
              How Thread Tapestry Works
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                What is Thread Tapestry?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Thread Tapestry is your space for engaging in meaningful discussions and weaving stories through collaborative conversations. Create threads, share ideas, and connect with other storytellers in our community.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Key Features
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>Create and participate in engaging discussion threads</li>
                <li>Follow your favorite threads and storytellers</li>
                <li>Save threads for later reference</li>
                <li>Discover trending topics and discussions</li>
                <li>Build meaningful connections with other community members</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                How to Use
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>Click &quot;New Thread&quot; to start a discussion</li>
                <li>Browse through different tabs (Feed, Friends, Saved)</li>
                <li>Engage with threads by commenting and sharing</li>
                <li>Follow interesting threads and storytellers</li>
                <li>Save threads you want to revisit later</li>
              </ol>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Tips
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>Use clear and engaging titles for your threads</li>
                <li>Add relevant tags to help others discover your threads</li>
                <li>Engage meaningfully with other community members</li>
                <li>Follow threads that interest you to stay updated</li>
                <li>Save valuable threads for future reference</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 