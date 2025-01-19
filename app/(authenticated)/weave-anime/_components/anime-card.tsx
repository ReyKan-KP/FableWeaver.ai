"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { AnimeRecommendation } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, Star, Info, X, Play } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tilt } from "@/components/ui/tilt";
import { Spotlight } from "@/components/ui/spotlight";
import Image from "next/image";
import { AnimeModal } from "./anime-modal";

interface AnimeCardProps {
  anime: AnimeRecommendation;
}

export function AnimeCard({ anime }: AnimeCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const supabase = useSupabaseClient();

  const updateFeedback = async (isPositive: boolean) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("anime")
        .update({ feedback: isPositive ? 1 : -1 })
        .eq("id", anime.id);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating feedback:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <Tilt rotationFactor={15}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative"
          onClick={() => setIsModalOpen(true)}
        >
          <Spotlight
            className="hidden md:block"
            size={300}
            springOptions={{
              stiffness: 100,
              damping: 10,
            }}
          />
          <Card className="h-full flex flex-col overflow-hidden bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border-2 border-purple-300 dark:border-purple-700 cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-purple-500 dark:hover:border-purple-500">
            <CardHeader className="relative p-0">
              {anime.image_url && (
                <motion.div
                  className="relative aspect-video"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <Image
                    src={anime.image_url || "/placeholder.svg"}
                    alt={anime.title}
                    className="object-cover w-full h-[20vh] rounded-t-lg"
                    width={500}
                    height={500}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-t-lg" />
                </motion.div>
              )}
              <motion.div
                className="absolute bottom-2 left-2 right-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <CardTitle className="text-white line-clamp-1 text-xl font-bold">
                  {anime.title}
                </CardTitle>
                <p className="text-white/80 text-sm">
                  {anime.year} {anime.season}
                </p>
              </motion.div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-4">
              <motion.div
                className="flex items-center mb-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                <Star className="text-yellow-400 w-5 h-5 mr-1" />
                <span className="font-bold">{anime.rating.toFixed(1)}</span>
              </motion.div>
              <AnimatePresence mode="wait">
                {showFullDescription ? (
                  <motion.p
                    key="full-description"
                    className="text-sm mb-4 flex-grow"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {anime.description}
                  </motion.p>
                ) : (
                  <motion.p
                    key="truncated-description"
                    className="text-sm line-clamp-3 mb-4 flex-grow"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {anime.description}
                  </motion.p>
                )}
              </AnimatePresence>
              <Button
                variant="ghost"
                size="sm"
                className="self-start mb-2 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFullDescription(!showFullDescription);
                }}
              >
                {showFullDescription ? "Show less" : "Show more"}
              </Button>
              <motion.div
                className="flex flex-wrap gap-2 mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.3 }}
              >
                {anime.genres.map((genre) => (
                  <Badge
                    key={genre}
                    variant="secondary"
                    className="bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200"
                  >
                    {genre}
                  </Badge>
                ))}
              </motion.div>
              <motion.div
                className="mt-auto flex justify-end gap-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.3 }}
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateFeedback(true);
                        }}
                        disabled={isUpdating}
                        className="border-purple-400 dark:border-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900"
                      >
                        <ThumbsUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>This recommendation was helpful</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateFeedback(false);
                        }}
                        disabled={isUpdating}
                        className="border-purple-400 dark:border-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900"
                      >
                        <ThumbsDown className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>This recommendation was not helpful</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </Tilt>
      <AnimeModal
        anime={anime}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
