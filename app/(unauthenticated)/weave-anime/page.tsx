"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { StoryThreads } from "@/components/story-threads";
import { AnimeGrid } from "@/components/anime-grid";
import { AnimeRecommendation } from "@/lib/types";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

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
      router.push("/login");
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
    <main className="container mx-auto px-4 py-24">
      <motion.h1
        className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-purple-600 via-blue-600 to-teal-500 text-transparent bg-clip-text"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        WeaveAnime
      </motion.h1>
      <StoryThreads onSubmit={handleSubmit} isLoading={isLoading} />
      {recommendations.length > 0 && (
        <AnimeGrid
          recommendations={paginatedRecommendations}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </main>
  );
}
