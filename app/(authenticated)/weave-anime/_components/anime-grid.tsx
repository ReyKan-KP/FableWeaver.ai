"use client";

import { AnimeRecommendation } from "@/lib/types";
import { AnimeCard } from "./anime-card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AnimeGridProps {
  recommendations: AnimeRecommendation[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function AnimeGrid({
  recommendations,
  currentPage,
  totalPages,
  onPageChange,
}: AnimeGridProps) {
  return (
    <div className="space-y-8 sm:space-y-12">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
      >
        <AnimatePresence mode="wait">
          {recommendations.map((anime, index) => (
            <motion.div
              key={anime.id}
              variants={item}
              layout
              className="relative group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{
                layout: { duration: 0.3 },
                scale: { duration: 0.2 },
              }}
            >
              <div className="relative overflow-hidden rounded-xl">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
                <AnimeCard anime={anime} />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {totalPages > 1 && (
        <motion.div
          className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <div className="flex items-center gap-1 sm:gap-2 bg-background/50 backdrop-blur-lg p-1.5 sm:p-2 rounded-full shadow-lg">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="hover:bg-background/80 transition-colors duration-200 w-8 h-8 sm:w-9 sm:h-9"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>

            <div className="flex items-center gap-1 sm:gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "ghost"}
                    size="icon"
                    onClick={() => onPageChange(page)}
                    className={`
                    w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-all duration-200 text-sm sm:text-base
                    ${
                      currentPage === page
                        ? "bg-primary text-primary-foreground scale-110"
                        : "hover:bg-background/80"
                    }
                  `}
                  >
                    {page}
                  </Button>
                )
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="hover:bg-background/80 transition-colors duration-200 w-8 h-8 sm:w-9 sm:h-9"
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
