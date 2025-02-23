export interface AISettings {
  id: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  autoModeration?: boolean;
  contentFiltering?: boolean;
  characterConsistency?: boolean;
  apiKey?: string;
} 