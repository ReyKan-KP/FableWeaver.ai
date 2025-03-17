"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Search,
  Filter,
  Sparkles,
  BookOpen,
  Film,
  Tv,
  BookType,
  Star,
  Calendar,
  Building2,
  Layers,
  UserCircle,
  Info,
  Loader2,
  BookmarkCheck,
  History,
  HelpCircle,
  Wand2,
  Settings
} from 'lucide-react';
import { GiMicroscopeLens } from "react-icons/gi";
import ContentCard from './_components/content-card';
import FilterPanel from './_components/filter-panel';
import SavedContent from './_components/saved-content';
import RecommendationHistory from './_components/recommendation-history';
import { useSession } from 'next-auth/react';
import { SearchFilters, SearchResult } from './_agents/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,

} from "@/components/ui/tooltip";
import { useRouter } from 'next/navigation';
import Loading from "./loading";
import UserPreferences from './_components/user-preferences';
import { TextShimmerWave } from '@/components/ui/text-shimmer-wave';

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

export default function LoreLensPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPersonalized, setIsPersonalized] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeTab, setActiveTab] = useState('discover');
  const [refreshSavedContent, setRefreshSavedContent] = useState(0);
  const [refreshPreferences, setRefreshPreferences] = useState(0);
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    minRating: 8,
    yearStart: 2010,
    yearEnd: new Date().getFullYear(),
    genres: [],
    studios: []
  });

  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";

  const promptLogin = () => {
    setIsLoginPromptOpen(true);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() && selectedTypes.length === 0) {
      toast.error('Please enter a search query or select content types', {
        description: 'You need to provide at least one search criteria',
        position: 'top-center',
      });
      return;
    }

    setLoading(true);
    try {
      const requestBody = {
        query: searchQuery,
        contentTypes: selectedTypes,
        filters,
        isPersonalized,
        userId: session?.user?.id
      };
      console.log('Search Request:', requestBody);

      const response = await fetch('/api/lore-lens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Search failed:', errorData);
        throw new Error(`Search failed: ${errorData}`);
      }
      
      const data = await response.json();
      console.log('Search Results:', data);
      setResults(data.results);
      
      toast.success('Search completed successfully', {
        description: `Found ${data.results.length} results matching your criteria`,
        position: 'top-center',
      });
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to fetch results', {
        description: 'Please try again or refine your search',
        position: 'top-center',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStatusChange = (contentId: string, isSaved: boolean) => {
    // Update the saved status in the results
    setResults(prev => 
      prev.map(result => 
        result.content.id === contentId 
          ? { ...result, content: { ...result.content, is_saved: isSaved } }
          : result
      )
    );
    
    // Trigger a refresh of the saved content tab
    setRefreshSavedContent(prev => prev + 1);
  };

  const handlePreferencesUpdated = () => {
    setRefreshPreferences(prev => prev + 1);
    toast.success('Preferences updated successfully', {
      description: 'Your content preferences have been saved',
      position: 'top-center',
    });
  };

  return (
    isLoading ? (
      <Loading />
    ) : (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 p-2 rounded-lg">
              <Wand2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">
                Lore Lens
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm">
                Discover your next favorite story
              </p>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsHelpDialogOpen(true)}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <HelpCircle className="w-5 h-5" />
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Learn how to use Lore Lens</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Tabs */}
        <Card className="rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden mb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-6 pt-6">
              <TabsList className="grid w-full max-w-md grid-cols-4">
                <TabsTrigger 
                  value="discover" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:via-blue-500 data-[state=active]:to-teal-500 data-[state=active]:text-white rounded-md"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Discover
                </TabsTrigger>
                <TabsTrigger 
                  value="saved" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:via-blue-500 data-[state=active]:to-teal-500 data-[state=active]:text-white rounded-md"
                  onClick={() => !isAuthenticated && promptLogin()}
                >
                  <BookmarkCheck className="w-4 h-4 mr-2" />
                  Saved
                </TabsTrigger>
                <TabsTrigger 
                  value="history" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:via-blue-500 data-[state=active]:to-teal-500 data-[state=active]:text-white rounded-md"
                  onClick={() => !isAuthenticated && promptLogin()}
                >
                  <History className="w-4 h-4 mr-2" />
                  History
                </TabsTrigger>
                <TabsTrigger 
                  value="preferences" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:via-blue-500 data-[state=active]:to-teal-500 data-[state=active]:text-white rounded-md"
                  onClick={() => !isAuthenticated && promptLogin()}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Preferences
                </TabsTrigger>
              </TabsList>
            </div>
          
            <TabsContent value="discover" className="px-6 pb-6 focus-visible:outline-none focus-visible:ring-0">
              {/* Content Type Selection */}
              <Card className="p-6 mb-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <span>Select Content Types</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 ml-2 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Choose one or more content types to narrow your search</p>
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
                            onClick={() => {
                              setSelectedTypes(prev =>
                                prev.includes(type.id)
                                  ? prev.filter(t => t !== type.id)
                                  : [...prev, type.id]
                              );
                            }}
                            variant={selectedTypes.includes(type.id) ? 'default' : 'outline'}
                            className="flex items-center gap-2"
                          >
                            {type.icon}
                            {type.label}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{selectedTypes.includes(type.id) ? `Remove ${type.label} from selection` : `Add ${type.label} to selection`}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </Card>

              {/* Search and Filters */}
              <Card className="p-6 mb-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Input
                        placeholder="Search by title, genre, studio..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pr-10"
                      />
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2"
                          >
                            <Filter className="w-4 h-4" />
                            Filters
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{showFilters ? 'Hide advanced filters' : 'Show advanced filters'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    {status === 'authenticated' && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2">
                              <Switch
                                id="personalized"
                                checked={isPersonalized}
                                onCheckedChange={setIsPersonalized}
                              />
                              <Label htmlFor="personalized">Personalized</Label>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Get recommendations based on your preferences</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        type="submit" 
                        disabled={loading} 
                        className="min-w-[100px] bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 text-white"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <span className="flex items-center gap-2">
                            <Search className="w-4 h-4" />
                            Search
                          </span>
                        )}
                      </Button>
                    </motion.div>
                  </div>

                  <AnimatePresence>
                    {showFilters && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <FilterPanel filters={filters} setFilters={setFilters} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </Card>

              {/* Results */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <TextShimmerWave
                    className='[--base-color:#0D74CE] [--base-gradient-color:#5EB1EF]'
                    duration={1}
                    spread={1}
                    zDistance={1}
                    scaleDistance={1.1}
                    rotateYDistance={20}
                  >
                    Creating the perfect recommendation for you...
                  </TextShimmerWave>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.map((result) => (
                    <ContentCard 
                      key={result.content.id} 
                      content={result.content} 
                      onSaveStatusChange={handleSaveStatusChange}
                    />
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!loading && results.length === 0 && (
                <div className="text-center py-12">
                  <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No results found</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Try adjusting your search or filters
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedTypes([]);
                      setFilters({
                        minRating: 0,
                        yearStart: 1990,
                        yearEnd: new Date().getFullYear(),
                        genres: [],
                        studios: []
                      });
                    }}
                    className="mx-auto"
                  >
                    Reset Filters
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="saved" className="px-6 pb-6 focus-visible:outline-none focus-visible:ring-0">
              {isAuthenticated ? (
                <SavedContent 
                  key={refreshSavedContent} 
                  onContentRemoved={() => setRefreshSavedContent(prev => prev + 1)} 
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full mb-4">
                    <UserCircle className="w-10 h-10 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Sign in to view saved content</h3>
                  <p className="text-gray-500 mb-6 max-w-md">
                    Save your favorite content for later when you sign in to your account.
                  </p>
                  <Button 
                    onClick={() => router.push('/sign-in')}
                    className="bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 text-white"
                  >
                    Sign In
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="px-6 pb-6 focus-visible:outline-none focus-visible:ring-0">
              {isAuthenticated ? (
                <RecommendationHistory 
                  onContentRemoved={() => setActiveTab('history')} 
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full mb-4">
                    <UserCircle className="w-10 h-10 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Sign in to view your history</h3>
                  <p className="text-gray-500 mb-6 max-w-md">
                    Keep track of your content exploration when you sign in to your account.
                  </p>
                  <Button 
                    onClick={() => router.push('/sign-in')}
                    className="bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 text-white"
                  >
                    Sign In
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="preferences" className="px-6 pb-6 focus-visible:outline-none focus-visible:ring-0">
              {isAuthenticated ? (
                <UserPreferences 
                  key={refreshPreferences}
                  onPreferencesUpdated={handlePreferencesUpdated} 
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full mb-4">
                    <UserCircle className="w-10 h-10 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Sign in to manage preferences</h3>
                  <p className="text-gray-500 mb-6 max-w-md">
                    Customize your content preferences when you sign in to your account.
                  </p>
                  <Button 
                    onClick={() => router.push('/sign-in')}
                    className="bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 text-white"
                  >
                    Sign In
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </motion.div>

      {/* Help Dialog */}
      <Dialog open={isHelpDialogOpen} onOpenChange={setIsHelpDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">
              How Lore Lens Works
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                What is Lore Lens?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Lore Lens is your personal content discovery tool that helps you find your next favorite story across various media types including anime, movies, web series, novels, manga, and more.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Key Features
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>Search across multiple content types with a single query</li>
                <li>Apply filters to narrow down results by rating, year, genres, and studios</li>
                <li>Get personalized recommendations based on your preferences</li>
                <li>Save content to your library for later access</li>
                <li>Track your content exploration history</li>
                <li>Manage your content preferences for better recommendations</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Getting Started
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>Select one or more content types you&apos;re interested in</li>
                <li>Enter keywords in the search box or use the filters to narrow your search</li>
                <li>Toggle the &quot;Personalized&quot; switch to get recommendations tailored to your preferences</li>
                <li>Click on a content card to view more details</li>
                <li>Save interesting content by clicking the bookmark icon</li>
              </ol>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Managing Your Preferences
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Visit the Preferences tab to customize your content discovery experience:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>Set your preferred content types (anime, movies, novels, etc.)</li>
                <li>Specify your minimum rating threshold for recommendations</li>
                <li>Add your favorite genres to get more relevant suggestions</li>
                <li>Add your favorite studios or creators to discover similar content</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                The more information you provide in your preferences, the better our personalized recommendations will be!
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsHelpDialogOpen(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Login Prompt Dialog */}
      <Dialog open={isLoginPromptOpen} onOpenChange={setIsLoginPromptOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign in required</DialogTitle>
            <DialogDescription>
              You need to be signed in to access this feature.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <UserCircle className="w-16 h-16 text-blue-500" />
          </div>
          <DialogFooter className="sm:justify-center gap-2">
            <Button
              variant="ghost"
              onClick={() => setIsLoginPromptOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => router.push('/sign-in')}
              className="bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 text-white"
            >
              Sign In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
  );
}

