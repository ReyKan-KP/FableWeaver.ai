"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimeRecommendation } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Play, Star } from "lucide-react";
import Image from "next/image";

interface AnimeModalProps {
  anime: AnimeRecommendation;
  isOpen: boolean;
  onClose: () => void;
}

export function AnimeModal({ anime, isOpen, onClose }: AnimeModalProps) {
  const [isMounted, setIsMounted] = useState(false);

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
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-video">
              <Image
                src={anime.image_url || "/placeholder.svg"}
                alt={anime.title}
                layout="fill"
                objectFit="cover"
                className="rounded-t-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 text-white hover:bg-white/20"
                onClick={onClose}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            <div className="p-6">
              <h2 className="text-3xl font-bold mb-2">{anime.title}</h2>
              <div className="flex items-center mb-4">
                <Star className="text-yellow-400 w-5 h-5 mr-1" />
                <span className="font-bold mr-4">
                  {anime.rating.toFixed(1)}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {anime.year} {anime.season}
                </span>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {anime.description}
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {anime.genres.map((genre) => (
                  <Badge
                    key={genre}
                    variant="secondary"
                    className="bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200"
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                <Play className="mr-2 h-4 w-4" /> Watch Now
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
