"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Loader2, Bookmark, X } from 'lucide-react';
import ContentCard from './content-card';
import { Button } from '@/components/ui/button';
import { SearchResult } from '../_agents/types';

interface SavedContentProps {
  onContentRemoved?: () => void;
}

export default function SavedContent({ onContentRemoved }: SavedContentProps) {
  const { data: session } = useSession();
  const [savedContent, setSavedContent] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      fetchSavedContent();
    }
  }, [session?.user?.id]);

  const fetchSavedContent = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/lore-lens?userId=${session?.user?.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch saved content');
      }
      
      const data = await response.json();
      
      // Transform the data to match the SearchResult format
      const formattedContent = data.savedContent.map((item: any) => ({
        content: {
          id: item.id,
          name: item.name,
          type: item.type,
          description: item.description,
          release_year: item.release_year,
          rating: item.rating,
          studio: item.studio,
          genres: item.genres,
          image_url: item.image_url,
          views_count: item.views_count,
          likes_count: item.likes_count,
          comments_count: item.comments_count
        },
        explanation: "Saved content"
      }));
      
      setSavedContent(formattedContent);
    } catch (error) {
      console.error('Error fetching saved content:', error);
      toast.error('Failed to load saved content');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (contentId: string) => {
    try {
      const response = await fetch(`/api/lore-lens?contentId=${contentId}&userId=${session?.user?.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove content');
      }
      
      setSavedContent(prev => prev.filter(item => item.content.id !== contentId));
      toast.success('Content removed from saved items');
      
      if (onContentRemoved) {
        onContentRemoved();
      }
    } catch (error) {
      console.error('Error removing content:', error);
      toast.error('Failed to remove content');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (savedContent.length === 0) {
    return (
      <div className="text-center py-12">
        <Bookmark className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No saved content</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Save your favorite content to view it here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {savedContent.map((item) => (
          <div key={item.content.id} className="relative group">
            <ContentCard content={item.content} />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleRemove(item.content.id)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
} 