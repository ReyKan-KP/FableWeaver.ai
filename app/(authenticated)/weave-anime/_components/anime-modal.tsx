"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimeRecommendation } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Play, Star, Calendar, Clock, Tag, Heart } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface AnimeModalProps {
  anime: AnimeRecommendation;
  isOpen: boolean;
  onClose: () => void;
}

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 300,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: 20,
    transition: {
      duration: 0.2,
    },
  },
};

export function AnimeModal({ anime, isOpen, onClose }: AnimeModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isMounted) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white dark:bg-zinc-900 rounded-lg sm:rounded-xl shadow-2xl max-w-3xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[16/10] sm:aspect-video group">
              <Image
                src={anime.image_url || "/placeholder.svg"}
                alt={anime.title}
                layout="fill"
                objectFit="cover"
                className="group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
              <motion.div
                className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
                  {anime.title}
                </h2>
                <div className="flex items-center gap-2 sm:gap-4 text-white/90 text-sm sm:text-base">
                  <div className="flex items-center">
                    <Star className="text-yellow-400 w-4 h-4 sm:w-5 sm:h-5 mr-1" />
                    <span className="font-semibold">
                      {anime.rating.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                    <span>{anime.year}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                    <span>{anime.season}</span>
                  </div>
                </div>
              </motion.div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 sm:top-4 right-2 sm:right-4 text-white hover:bg-white/20 transition-colors"
                onClick={onClose}
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            </div>
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto">
              <motion.p
                className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {anime.description}
              </motion.p>
              <motion.div
                className="space-y-3 sm:space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500" />
                  <span className="text-sm sm:text-base font-semibold">
                    Genres
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {anime.genres.map((genre) => (
                    <Badge
                      key={genre}
                      variant="secondary"
                      className="text-xs sm:text-sm bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors cursor-pointer"
                    >
                      {genre}
                    </Badge>
                  ))}
                </div>
              </motion.div>
              <motion.div
                className="flex gap-2 sm:gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button className="flex-1 text-sm sm:text-base bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                  <Play className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Watch Now
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "border-2 transition-all duration-300",
                    isLiked
                      ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                      : "border-gray-300 dark:border-gray-700"
                  )}
                  onClick={() => setIsLiked(!isLiked)}
                >
                  <Heart
                    className={cn(
                      "h-4 w-4 sm:h-5 sm:w-5 transition-colors duration-300",
                      isLiked
                        ? "text-red-500 fill-red-500"
                        : "text-gray-500 dark:text-gray-400"
                    )}
                  />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
