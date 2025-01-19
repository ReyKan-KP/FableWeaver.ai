"use client";

import { AnimeRecommendation } from "@/lib/types";
import { AnimeCard } from "./anime-card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface AnimeGridProps {
  recommendations: AnimeRecommendation[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function AnimeGrid({
  recommendations,
  currentPage,
  totalPages,
  onPageChange,
}: AnimeGridProps) {
  return (
    <div className="space-y-12">
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {recommendations.map((anime, index) => (
          <motion.div
            key={anime.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
          >
            <AnimeCard anime={anime} />
          </motion.div>
        ))}
      </motion.div>

      {totalPages > 1 && (
        <motion.div
          className="flex justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="bg-white/50 dark:bg-black/50 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-black/70"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="icon"
                onClick={() => onPageChange(page)}
                className={`${
                  currentPage === page
                    ? "bg-purple-500 text-white"
                    : "bg-white/50 dark:bg-black/50 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-black/70"
                }`}
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="bg-white/50 dark:bg-black/50 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-black/70"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}
