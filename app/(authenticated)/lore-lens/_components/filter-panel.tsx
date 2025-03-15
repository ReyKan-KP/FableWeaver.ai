"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Star, Calendar, Building2, Tag, X } from 'lucide-react';
import { SearchFilters } from '../_agents/types';

interface FilterPanelProps {
  filters: SearchFilters;
  setFilters: React.Dispatch<React.SetStateAction<SearchFilters>>;
}

export default function FilterPanel({ filters, setFilters }: FilterPanelProps) {
  const [genreInput, setGenreInput] = React.useState('');
  const [studioInput, setStudioInput] = React.useState('');

  const handleAddGenre = (e: React.FormEvent) => {
    e.preventDefault();
    if (genreInput.trim() && !filters.genres.includes(genreInput.trim())) {
      setFilters(prev => ({
        ...prev,
        genres: [...prev.genres, genreInput.trim()]
      }));
      setGenreInput('');
    }
  };

  const handleAddStudio = (e: React.FormEvent) => {
    e.preventDefault();
    if (studioInput.trim() && !filters.studios.includes(studioInput.trim())) {
      setFilters(prev => ({
        ...prev,
        studios: [...prev.studios, studioInput.trim()]
      }));
      setStudioInput('');
    }
  };

  const removeGenre = (genre: string) => {
    setFilters(prev => ({
      ...prev,
      genres: prev.genres.filter(g => g !== genre)
    }));
  };

  const removeStudio = (studio: string) => {
    setFilters(prev => ({
      ...prev,
      studios: prev.studios.filter(s => s !== studio)
    }));
  };

  return (
    <div className="space-y-6 py-4">
      {/* Rating Filter */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-500" />
          <Label>Minimum Rating</Label>
          <span className="ml-auto">{filters.minRating.toFixed(1)}</span>
        </div>
        <Slider
          value={[filters.minRating]}
          min={0}
          max={10}
          step={0.1}
          onValueChange={([value]) => setFilters(prev => ({ ...prev, minRating: value }))}
          className="w-full"
        />
      </div>

      {/* Year Range Filter */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <Label>Year Range</Label>
        </div>
        <div className="flex items-center gap-4">
          <Input
            type="number"
            value={filters.yearStart}
            onChange={(e) => setFilters(prev => ({ ...prev, yearStart: parseInt(e.target.value) || 1990 }))}
            min={1900}
            max={new Date().getFullYear()}
            className="w-28"
          />
          <span>to</span>
          <Input
            type="number"
            value={filters.yearEnd}
            onChange={(e) => setFilters(prev => ({ ...prev, yearEnd: parseInt(e.target.value) || new Date().getFullYear() }))}
            min={1900}
            max={new Date().getFullYear()}
            className="w-28"
          />
        </div>
      </div>

      {/* Genres Filter */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4" />
          <Label>Genres</Label>
        </div>
        <form onSubmit={handleAddGenre} className="flex gap-2">
          <Input
            value={genreInput}
            onChange={(e) => setGenreInput(e.target.value)}
            placeholder="Add a genre..."
            className="flex-1"
          />
          <Button type="submit" variant="outline" size="sm">
            Add
          </Button>
        </form>
        <div className="flex flex-wrap gap-2 mt-2">
          {filters.genres.map((genre) => (
            <Badge
              key={genre}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              {genre}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => removeGenre(genre)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      </div>

      {/* Studios Filter */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          <Label>Studios</Label>
        </div>
        <form onSubmit={handleAddStudio} className="flex gap-2">
          <Input
            value={studioInput}
            onChange={(e) => setStudioInput(e.target.value)}
            placeholder="Add a studio..."
            className="flex-1"
          />
          <Button type="submit" variant="outline" size="sm">
            Add
          </Button>
        </form>
        <div className="flex flex-wrap gap-2 mt-2">
          {filters.studios.map((studio) => (
            <Badge
              key={studio}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              {studio}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => removeStudio(studio)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
} 