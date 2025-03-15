"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Star,
  Calendar,
  Building2,
  BookmarkPlus,
  BookmarkCheck,
  ThumbsUp,
  Eye,
  MessageCircle,
  Share2
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { ContentItem } from '../_agents/types';

interface ContentCardProps {
  content: ContentItem;
  onSaveStatusChange?: (contentId: string, isSaved: boolean) => void;
}

export default function ContentCard({ content, onSaveStatusChange }: ContentCardProps) {
  const { data: session } = useSession();
  const [isSaved, setIsSaved] = useState(content.is_saved || false);

  // Update isSaved if content.is_saved changes
  useEffect(() => {
    setIsSaved(content.is_saved || false);
  }, [content.is_saved]);

  const handleSave = async () => {
    if (!session) {
      toast.error('Please sign in to save content');
      return;
    }

    try {
      const response = await fetch('/api/lore-lens', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: content.id,
          userId: session.user.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to save content');
      
      const newSavedStatus = !isSaved;
      setIsSaved(newSavedStatus);
      
      if (onSaveStatusChange) {
        onSaveStatusChange(content.id, newSavedStatus);
      }
      
      toast.success(newSavedStatus ? 'Added to saved' : 'Removed from saved');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to update saved status');
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/lore-lens/content/${content.id}`
      );
      toast.success('Link copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card className="h-full flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <div className="relative aspect-[2/3] overflow-hidden">
          <img
            src={content.image_url || content.cover_image || '/images/placeholder.jpg'}
            alt={content.name}
            className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
          />
          <div className="absolute top-2 right-2 flex gap-1">
            <Badge variant="secondary" className="flex items-center gap-1 bg-black/70 text-white">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              {content.rating.toFixed(1)}
            </Badge>
          </div>
        </div>

        <CardContent className="flex-1 p-4">
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold line-clamp-1">{content.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                {content.description}
              </p>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>{content.release_year}</span>
              </div>
              {content.studio && (
                <div className="flex items-center gap-1">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="truncate">{content.studio}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-1">
              {content.genres.map((genre) => (
                <Badge key={genre} variant="outline" className="text-xs">
                  {genre}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 flex justify-between items-center border-t">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{content.views_count}</span>
            </div>
            <div className="flex items-center gap-1">
              <ThumbsUp className="w-4 h-4" />
              <span>{content.likes_count}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              <span>{content.comments_count}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${isSaved ? 'text-blue-500' : ''}`}
              onClick={handleSave}
            >
              {isSaved ? (
                <BookmarkCheck className="w-4 h-4" />
              ) : (
                <BookmarkPlus className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
} 