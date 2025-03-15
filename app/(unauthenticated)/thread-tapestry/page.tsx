"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Info, HelpCircle, Sparkles, LogIn, Layers } from "lucide-react";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { CgFeed } from "react-icons/cg";
import Loading from "./loading";

export default function ThreadTapestryPage() {
  const [showCreateThread, setShowCreateThread] = useState(false);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const userId = session?.user?.id;
  const isAuthenticated = status === "authenticated";
  const router = useRouter();

  const promptLogin = () => {
    setIsLoginPromptOpen(true);
  };

  const handleThreadSelect = (threadId: string) => {
    if (!isAuthenticated) {
      // If user is not authenticated, show login prompt when trying to view comments
      promptLogin();
      return;
    }

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
    isLoading ? (
      <Loading />
    ) : (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 p-2 rounded-lg">
                <CgFeed className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">
                  Thread Tapestry
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm">
                  Weave stories through engaging discussions
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsHelpDialogOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <HelpCircle className="w-5 h-5" />
            </motion.button>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => isAuthenticated ? setShowCreateThread(!showCreateThread) : promptLogin()}
              className="px-5 py-2 bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 text-white rounded-full 
              hover:shadow-lg transform transition-all duration-300 font-medium flex items-center gap-2"
              size="sm"
            >
              {isAuthenticated ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  New Thread
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign in to Create
                </>
              )}
            </Button>
          </motion.div>
        </div>

        {/* Create Thread Form */}
        <AnimatePresence>
          {showCreateThread && isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-8"
            >
              <Card className="p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <CreateThread />
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <Card className="rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <Tabs defaultValue="feed" className="w-full">
            <div className="px-6 pt-6">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger 
                  value="feed" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:via-blue-500 data-[state=active]:to-teal-500 data-[state=active]:text-white rounded-md"
                >
                  Feed
                </TabsTrigger>
                <TabsTrigger 
                  value="friends" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:via-blue-500 data-[state=active]:to-teal-500 data-[state=active]:text-white rounded-md"
                  onClick={() => !isAuthenticated && promptLogin()}
                >
                  Friends
                </TabsTrigger>
                <TabsTrigger 
                  value="saved" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:via-blue-500 data-[state=active]:to-teal-500 data-[state=active]:text-white rounded-md"
                  onClick={() => !isAuthenticated && promptLogin()}
                >
                  Saved
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="feed" className="px-6 pb-6 focus-visible:outline-none focus-visible:ring-0">
              <ThreadFeed onThreadSelect={handleThreadSelect} isAuthenticated={isAuthenticated} />
            </TabsContent>

            <TabsContent value="friends" className="px-6 pb-6 focus-visible:outline-none focus-visible:ring-0">
              {isAuthenticated ? (
                <FriendsFeed onThreadSelect={handleThreadSelect} />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full mb-4">
                    <LogIn className="w-10 h-10 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Sign in to view your friends&apos; threads</h3>
                  <p className="text-gray-500 mb-6 max-w-md">
                    Connect with friends and see their latest discussions when you sign in to your account.
                  </p>
                  <Button 
                    onClick={() => router.push('/sign-in')}
                    className="bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 text-white"
                  >
                    Sign In
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="saved" className="px-6 pb-6 focus-visible:outline-none focus-visible:ring-0">
              {isAuthenticated ? (
                <SavedThreads onThreadSelect={handleThreadSelect} />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full mb-4">
                    <LogIn className="w-10 h-10 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Sign in to view saved threads</h3>
                  <p className="text-gray-500 mb-6 max-w-md">
                    Save your favorite threads for later when you sign in to your account.
                  </p>
                  <Button 
                    onClick={() => router.push('/sign-in')}
                    className="bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 text-white"
                  >
                    Sign In
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>

        {/* Comments Section */}
        {/* <AnimatePresence>
          {selectedThread && showComments && isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mt-6"
            >
              <Card className="p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                <h3 className="text-xl font-semibold mb-4">Comments</h3>
                <Comments threadId={selectedThread} />
              </Card>
            </motion.div>
          )}
        </AnimatePresence> */}
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
          </div>
          <DialogFooter>
            <Button 
              onClick={() => setIsHelpDialogOpen(false)}
              className="bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 text-white"
            >
              Got it!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Login Prompt Dialog */}
      <Dialog open={isLoginPromptOpen} onOpenChange={setIsLoginPromptOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Sign in Required</DialogTitle>
            <DialogDescription>
              You need to sign in to access this feature.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full mb-4">
              <LogIn className="w-10 h-10 text-blue-500" />
            </div>
            <p className="text-center text-gray-600 dark:text-gray-300 mb-4">
              Sign in to create threads, save content, and interact with the community.
            </p>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsLoginPromptOpen(false)}
              className="w-full sm:w-auto"
            >
              Maybe Later
            </Button>
            <Button 
              onClick={() => router.push('/sign-in')}
              className="w-full sm:w-auto bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 text-white"
            >
              Sign In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
  );
} 