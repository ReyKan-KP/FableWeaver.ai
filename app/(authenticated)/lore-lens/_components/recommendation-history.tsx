"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Loader2, History, X, ChevronLeft, ChevronRight } from 'lucide-react';
import ContentCard from './content-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ContentItem } from '../_agents/types';

interface RecommendationHistoryProps {
  onContentRemoved?: () => void;
}

interface Recommendation {
  recommendationId: string;
  score: number;
  reason: string;
  createdAt: string;
  content: ContentItem;
}

export default function RecommendationHistory({ onContentRemoved }: RecommendationHistoryProps) {
  const { data: session } = useSession();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(9);

  useEffect(() => {
    if (session?.user?.id) {
      fetchRecommendations();
    }
  }, [session?.user?.id, currentPage]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const offset = (currentPage - 1) * limit;
      const response = await fetch(`/api/lore-lens/recommendations?userId=${session?.user?.id}&limit=${limit}&offset=${offset}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }
      
      const data = await response.json();
      setRecommendations(data.recommendations);
      setTotalCount(data.count);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast.error('Failed to load recommendation history');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (recommendationId: string) => {
    try {
      const response = await fetch(`/api/lore-lens/recommendations?userId=${session?.user?.id}&recommendationId=${recommendationId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove recommendation');
      }
      
      setRecommendations(prev => prev.filter(item => item.recommendationId !== recommendationId));
      setTotalCount(prev => prev - 1);
      toast.success('Recommendation removed from history');
      
      if (onContentRemoved) {
        onContentRemoved();
      }
    } catch (error) {
      console.error('Error removing recommendation:', error);
      toast.error('Failed to remove recommendation');
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-12">
        <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No recommendation history</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Search for content to see your recommendation history
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((item) => (
          <div key={item.recommendationId} className="relative group">
            <ContentCard content={item.content} />
            <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
              Score: {item.score.toFixed(2)}
            </div>
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleRemove(item.recommendationId)}
            >
              <X className="w-4 h-4" />
            </Button>
            <div className="absolute bottom-16 left-0 right-0 bg-black/70 p-2 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="line-clamp-2">{item.reason}</p>
              <p className="mt-1 text-gray-300">
                {new Date(item.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
} 