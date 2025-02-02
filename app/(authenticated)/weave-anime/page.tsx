"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { StoryThreads } from "@/app/(authenticated)/weave-anime/_components/story-threads";
import { AnimeGrid } from "@/app/(authenticated)/weave-anime/_components/anime-grid";
import { AnimeRecommendation } from "@/lib/types";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

const ITEMS_PER_PAGE = 9;

export default function WeaveAnime() {
  const [recommendations, setRecommendations] = useState<AnimeRecommendation[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/sign-in");
    }
  }, [status, router]);

  const handleSubmit = async (formData: any, isHistory: boolean) => {
    setIsLoading(true);
    try {
      const endpoint = isHistory
        ? "/api/history-recommendation"
        : "/api/recommendation";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          user_id: session?.user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch recommendations");
      }

      const data = await response.json();
      setRecommendations(data);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalPages = Math.ceil(recommendations.length / ITEMS_PER_PAGE);
  const paginatedRecommendations = recommendations.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (status === "loading") return null;
  if (!session) return null;

  return (
    <motion.main
      className="min-h-screen bg-gradient-to-b from-background to-background/80 relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 space-y-8 sm:space-y-10 lg:space-y-12">
        <motion.div
          className="text-center space-y-3 sm:space-y-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-teal-500 text-transparent bg-clip-text">
            WeaveAnime
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl sm:max-w-2xl mx-auto px-4 sm:px-0">
            Discover personalized anime recommendations based on your story
            preferences and viewing history
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="relative"
        >
          <StoryThreads onSubmit={handleSubmit} isLoading={isLoading} />
        </motion.div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-12"
            >
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </motion.div>
          ) : recommendations.length > 0 ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <AnimeGrid
                recommendations={paginatedRecommendations}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.main>
  );
}
