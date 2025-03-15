"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, X, Save, UserCircle, Settings, Sparkles, Info, Tv, Film, BookOpen, BookType } from 'lucide-react';
import { toast } from 'sonner';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Content types definition
const contentTypes = [
  { id: 'anime', label: 'Anime', icon: <Tv className="w-4 h-4" /> },
  { id: 'movie', label: 'Movies', icon: <Film className="w-4 h-4" /> },
  { id: 'webseries', label: 'Web Series', icon: <Tv className="w-4 h-4" /> },
  { id: 'webnovel', label: 'Web Novels', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'manga', label: 'Manga', icon: <BookType className="w-4 h-4" /> },
  { id: 'manhua', label: 'Manhua', icon: <BookType className="w-4 h-4" /> },
  { id: 'manhwa', label: 'Manhwa', icon: <BookType className="w-4 h-4" /> },
  { id: 'lightnovel', label: 'Light Novels', icon: <BookOpen className="w-4 h-4" /> },
];

interface UserPreferencesProps {
  onPreferencesUpdated?: () => void;
}

interface UserPreference {
  user_id: string;
  favorite_genres: string[];
  favorite_studios: string[];
  min_rating: number;
  preferred_content_types: string[];
  created_at?: string;
  updated_at?: string;
}

const UserPreferences: React.FC<UserPreferencesProps> = ({ onPreferencesUpdated }) => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<UserPreference>({
    user_id: '',
    favorite_genres: [],
    favorite_studios: [],
    min_rating: 7,
    preferred_content_types: [],
  });
  
  const [newGenre, setNewGenre] = useState('');
  const [newStudio, setNewStudio] = useState('');

  // Popular genres and studios for suggestions
  const popularGenres = [
    'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 
    'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life', 
    'Thriller', 'Historical', 'Supernatural', 'Sports', 'Mecha'
  ];
  
  const popularStudios = [
    'Studio Ghibli', 'MAPPA', 'Ufotable', 'Kyoto Animation', 'Madhouse',
    'Bones', 'A-1 Pictures', 'Production I.G', 'Wit Studio', 'Toei Animation',
    'Marvel Studios', 'Warner Bros.', 'Netflix', 'Disney', 'HBO'
  ];

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserPreferences();
    } else {
      setLoading(false);
    }
  }, [session]);

  const fetchUserPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user-preferences');
      
      if (!response.ok) {
        throw new Error('Failed to fetch preferences');
      }
      
      const data = await response.json();
      
      // Ensure all arrays are initialized even if they're missing from the response
      setPreferences({
        user_id: session?.user?.id || '',
        favorite_genres: Array.isArray(data.favorite_genres) ? data.favorite_genres : [],
        favorite_studios: Array.isArray(data.favorite_studios) ? data.favorite_studios : [],
        min_rating: typeof data.min_rating === 'number' ? data.min_rating : 7,
        preferred_content_types: Array.isArray(data.preferred_content_types) ? data.preferred_content_types : [],
      });
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      toast.error('Failed to load your preferences');
      
      // Set default values on error
      setPreferences({
        user_id: session?.user?.id || '',
        favorite_genres: [],
        favorite_studios: [],
        min_rating: 7,
        preferred_content_types: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      
      // Ensure all arrays are initialized before sending
      const dataToSend = {
        ...preferences,
        favorite_genres: preferences.favorite_genres || [],
        favorite_studios: preferences.favorite_studios || [],
        preferred_content_types: preferences.preferred_content_types || [],
      };
      
      const response = await fetch('/api/user-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }
      
      toast.success('Preferences saved successfully');
      if (onPreferencesUpdated) {
        onPreferencesUpdated();
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save your preferences');
    } finally {
      setSaving(false);
    }
  };

  const addGenre = () => {
    if (newGenre && !preferences.favorite_genres.includes(newGenre)) {
      setPreferences({
        ...preferences,
        favorite_genres: [...(preferences.favorite_genres || []), newGenre],
      });
      setNewGenre('');
    }
  };

  const removeGenre = (genre: string) => {
    setPreferences({
      ...preferences,
      favorite_genres: (preferences.favorite_genres || []).filter(g => g !== genre),
    });
  };

  const addStudio = () => {
    if (newStudio && !preferences.favorite_studios.includes(newStudio)) {
      setPreferences({
        ...preferences,
        favorite_studios: [...(preferences.favorite_studios || []), newStudio],
      });
      setNewStudio('');
    }
  };

  const removeStudio = (studio: string) => {
    setPreferences({
      ...preferences,
      favorite_studios: (preferences.favorite_studios || []).filter(s => s !== studio),
    });
  };

  const handleContentTypeToggle = (typeId: string) => {
    setPreferences(prev => {
      const currentTypes = prev.preferred_content_types || [];
      const newTypes = currentTypes.includes(typeId)
        ? currentTypes.filter(t => t !== typeId)
        : [...currentTypes, typeId];
      
      return {
        ...prev,
        preferred_content_types: newTypes
      };
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Your Content Preferences</h2>
        </div>
        <Button 
          onClick={savePreferences} 
          disabled={saving}
          className="bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 text-white"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Preferences
        </Button>
      </div>

      <Card className="p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div className="space-y-6">
          {/* Preferred Content Types */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center">
              <span>Preferred Content Types</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 ml-2 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Select the types of content you enjoy the most</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </h2>
            <div className="flex flex-wrap gap-2">
              {contentTypes.map((type) => (
                <TooltipProvider key={type.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => handleContentTypeToggle(type.id)}
                        variant={(preferences.preferred_content_types || []).includes(type.id) ? 'default' : 'outline'}
                        className="flex items-center gap-2"
                      >
                        {type.icon}
                        {type.label}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{(preferences.preferred_content_types || []).includes(type.id) ? `Remove ${type.label} from preferences` : `Add ${type.label} to preferences`}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>

          {/* Minimum Rating */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-base font-medium">Minimum Rating</Label>
              <span className="text-sm font-medium">{preferences.min_rating.toFixed(1)}</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Only show content with ratings at or above this value
            </p>
            <Slider
              value={[preferences.min_rating]}
              min={0}
              max={10}
              step={0.1}
              onValueChange={(value) => setPreferences({ ...preferences, min_rating: value[0] })}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>

          {/* Favorite Genres */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Favorite Genres</Label>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Add genres you enjoy to get better recommendations
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {(preferences.favorite_genres || []).map((genre) => (
                <Badge key={genre} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                  {genre}
                  <button onClick={() => removeGenre(genre)} className="ml-1 text-gray-500 hover:text-gray-700">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a genre..."
                value={newGenre}
                onChange={(e) => setNewGenre(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addGenre()}
                list="genre-suggestions"
              />
              <datalist id="genre-suggestions">
                {popularGenres.map(genre => (
                  <option key={genre} value={genre} />
                ))}
              </datalist>
              <Button onClick={addGenre} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
          </div>

          {/* Favorite Studios */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Favorite Studios/Creators</Label>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Add studios or creators whose work you enjoy
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {(preferences.favorite_studios || []).map((studio) => (
                <Badge key={studio} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                  {studio}
                  <button onClick={() => removeStudio(studio)} className="ml-1 text-gray-500 hover:text-gray-700">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a studio or creator..."
                value={newStudio}
                onChange={(e) => setNewStudio(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addStudio()}
                list="studio-suggestions"
              />
              <datalist id="studio-suggestions">
                {popularStudios.map(studio => (
                  <option key={studio} value={studio} />
                ))}
              </datalist>
              <Button onClick={addStudio} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-blue-500 mt-0.5" />
        <div>
          <h3 className="font-medium text-blue-800 dark:text-blue-300">Personalized Recommendations</h3>
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
            Your preferences help us tailor content recommendations just for you. The more information you provide, the better our suggestions will be!
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserPreferences; 