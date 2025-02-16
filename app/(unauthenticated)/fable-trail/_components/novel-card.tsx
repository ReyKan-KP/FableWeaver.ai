"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { BookText, Clock, Eye, MessageSquare } from "lucide-react";
import { formatDistance } from "date-fns";
import ReadingStatus from "./reading-status";
import BookmarkButton from "./bookmark-button";

interface Novel {
  id: string;
  title: string;
  description: string;
  genre: string;
  cover_image: string;
  chapter_count: number;
  total_words: number;
  created_at: string;
  updated_at: string;
  is_public: boolean;
}

interface NovelCardProps {
  novel: Novel;
}

export default function NovelCard({ novel }: NovelCardProps) {
  const { data: session } = useSession();
  const [views, setViews] = useState<{
    total_views: number;
    unique_users: number;
  } | null>(null);
  const [commentsCount, setCommentsCount] = useState(0);
  const [readingStatus, setReadingStatus] = useState<string | undefined>();

  useEffect(() => {
    fetchViews();
    fetchComments();
    if (session) {
      fetchReadingStatus();
    }
  }, [novel.id, session]);

  const fetchViews = async () => {
    try {
      const response = await fetch(
        `/api/novel-views?novelId=${novel.id}&period=all`
      );
      if (!response.ok) throw new Error("Failed to fetch views");

      const data = await response.json();
      setViews(data);
    } catch (error) {
      console.error("Error fetching views:", error);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/comments?novelId=${novel.id}`);
      if (!response.ok) throw new Error("Failed to fetch comments");

      const data = await response.json();
      setCommentsCount(data.length);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const fetchReadingStatus = async () => {
    try {
      const response = await fetch(`/api/reading-status?novelId=${novel.id}`);
      if (!response.ok) throw new Error("Failed to fetch reading status");

      const data = await response.json();
      if (data && data.length > 0) {
        setReadingStatus(data[0].status);
      }
    } catch (error) {
      console.error("Error fetching reading status:", error);
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-[#bccff1] dark:bg-zinc-900 rounded-xl shadow-md overflow-hidden hover:shadow-xl 
            transition-all duration-300 border border-gray-100 dark:border-gray-700"
    >
      <Link href={`/fable-trail/${novel.id}`}>
        <div className="relative h-48 w-full p-[1px]">
          <div className="absolute inset-0 bg-dot-white/[0.2] dark:bg-dot-black/[0.2]" />
          <Image
            src={novel.cover_image || "/images/default-cover.png"}
            alt={novel.title}
            className="w-full h-full object-contain"
            width={500}
            height={500}
          />
        </div>
      </Link>

      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <Link href={`/fable-trail/${novel.id}`}>
            <h2 className="text-xl font-semibold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">
              {novel.title}
            </h2>
          </Link>
          <span className="px-3 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full">
            {novel.genre}
          </span>
        </div>

        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2 min-h-[3rem]">
          {novel.description}
        </p>

        <div className="flex flex-wrap gap-4 items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
          <div className="flex items-center gap-2">
            <BookText className="w-4 h-4" />
            {novel.chapter_count} Chapters
          </div>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            {views?.total_views || 0} Views
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            {commentsCount} Comments
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Updated{" "}
            {formatDistance(new Date(novel.updated_at), new Date(), {
              addSuffix: true,
            })}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <ReadingStatus
            novelId={novel.id}
            initialStatus={readingStatus}
            onStatusChange={setReadingStatus}
          />
          <BookmarkButton novelId={novel.id} />
        </div>
      </div>
    </motion.div>
  );
}
