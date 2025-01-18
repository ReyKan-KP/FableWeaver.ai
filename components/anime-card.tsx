"use client";

import { AnimeRecommendation } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, Star, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";
// import { toggleWatchedAnime } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

interface AnimeCardProps {
  anime: AnimeRecommendation;
  isWatched?: boolean;
}

export function AnimeCard({ anime, isWatched = false }: AnimeCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [watched, setWatched] = useState(isWatched);
  const { toast } = useToast();

  // const handleToggleWatched = async () => {
  //   setIsUpdating(true);
  //   try {
  //     const result = await toggleWatchedAnime(anime.id);
  //     if (result.error) {
  //       throw new Error(result.error);
  //     }
  //     setWatched(result.watched);
  //     toast({
  //       title: result.watched
  //         ? "Added to watched list"
  //         : "Removed from watched list",
  //       description: anime.title,
  //     });
  //   } catch (error) {
  //     toast({
  //       title: "Error",
  //       description: error instanceof Error ? error.message : "An error occurred",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setIsUpdating(false);
  //   }
  // };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.05 }}
    >
      <Card className="h-full flex flex-col overflow-hidden bg-white dark:bg-gray-800 border-purple-200 dark:border-purple-900">
        <CardHeader className="relative p-0">
          <div className="relative aspect-video">
            {anime.image_url ? (
              <Image
                src={anime.image_url}
                alt={anime.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-gray-400 dark:text-gray-500">
                  No Image
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
          <div className="absolute bottom-2 left-2 right-2">
            <CardTitle className="text-white line-clamp-1">
              {anime.title}
            </CardTitle>
            <CardDescription className="text-white/80">
              {anime.year} {anime.season}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Star className="text-yellow-400 w-5 h-5 mr-1" />
              <span className="font-bold">{anime.rating.toFixed(1)}</span>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    // onClick={handleToggleWatched}
                    disabled={isUpdating}
                    className={`${
                      watched
                        ? "text-purple-600 dark:text-purple-400"
                        : "text-gray-400 dark:text-gray-600"
                    }`}
                  >
                    {watched ? (
                      <Eye className="h-5 w-5" />
                    ) : (
                      <EyeOff className="h-5 w-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{watched ? "Mark as unwatched" : "Mark as watched"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-sm line-clamp-3 mb-4 flex-grow text-gray-600 dark:text-gray-300">
            {anime.description}
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {anime.genres.map((genre) => (
              <Badge
                key={genre}
                variant="secondary"
                className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200"
              >
                {genre}
              </Badge>
            ))}
          </div>
          <div className="mt-auto flex justify-end gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900"
                  >
                    <ThumbsUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This thread resonates with me</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900"
                  >
                    <ThumbsDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This thread doesn&apos;t resonate with me</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
