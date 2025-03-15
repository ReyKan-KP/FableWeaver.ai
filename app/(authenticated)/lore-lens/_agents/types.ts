export interface ContentItem {
  id: string;
  name: string;
  type: string;
  description: string;
  release_year: number;
  rating: number;
  studio: string;
  cover_image?: string;
  image_url: string;
  genres: string[];
  views_count: number;
  likes_count: number;
  comments_count: number;
  is_saved?: boolean;
}

export interface UserPreferences {
  favorite_genres: string[];
  favorite_studios: string[];
  min_rating: number;
  preferred_content_types: string[];
}

export interface UserInteraction {
  content_metadata: ContentItem;
  interaction_type: 'watched' | 'reading' | 'completed' | 'dropped' | 'planned';
  rating?: number;
  review?: string;
}

export interface SearchFilters {
  minRating: number;
  yearStart: number;
  yearEnd: number;
  genres: string[];
  studios: string[];
}

export interface AgentContext {
  userId?: string;
  isPersonalized: boolean;
  filters: SearchFilters;
  model: any; // Gemini model instance
}

export interface SearchResult {
  content: ContentItem;
  relevanceScore: number;
  personalizationScore?: number;
  explanation?: string;
} 