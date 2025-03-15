import { ContentItem, AgentContext, SearchResult, UserPreferences, UserInteraction } from './types';
import { personalizationTemplate } from './prompt-templates';

export class PersonalizationAgent {
  private context: AgentContext;

  constructor(context: AgentContext) {
    this.context = context;
  }

  async personalizeResults(
    results: SearchResult[],
    preferences: UserPreferences,
    interactions: UserInteraction[]
  ): Promise<SearchResult[]> {
    if (!this.context.isPersonalized || !this.context.userId) {
      return results;
    }

    // Format user interactions for the prompt
    const formattedInteractions = interactions.slice(0, 5).map(interaction => `
    - ${interaction.content_metadata.name} (${interaction.content_metadata.type})
      * Status: ${interaction.interaction_type}
      * Rating: ${interaction.rating || 'Not rated'}
      * Genres: ${interaction.content_metadata.genres.join(', ')}
      * Studio: ${interaction.content_metadata.studio}
    `).join('\n');

    // Format content items for the prompt
    const formattedItems = results.map((result, index) => `
    Item ${index + 1}:
    Title: ${result.content.name}
    Type: ${result.content.type}
    Genres: ${result.content.genres.join(', ')}
    Studio: ${result.content.studio}
    Rating: ${result.content.rating}
    Year: ${result.content.release_year}
    Image: ${result.content.image_url || 'No image available'}
    Base Relevance Score: ${result.relevanceScore}
    `).join('\n');

    // Replace placeholders in the template
    const prompt = personalizationTemplate
      .replace('{{FAVORITE_GENRES}}', preferences.favorite_genres?.join(', ') || 'None specified')
      .replace('{{FAVORITE_STUDIOS}}', preferences.favorite_studios?.join(', ') || 'None specified')
      .replace('{{MIN_RATING}}', preferences.min_rating?.toString() || 'Not set')
      .replace('{{PREFERRED_CONTENT_TYPES}}', preferences.preferred_content_types?.join(', ') || 'All types')
      .replace('{{USER_INTERACTIONS}}', formattedInteractions)
      .replace('{{CONTENT_ITEMS}}', formattedItems);

    try {
      const result = await this.context.model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }]}],
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 1024,
        }
      });
      const response = await result.response;
      const text = response.text();
      
      let scores;
      try {
        // Clean the text to remove markdown code block formatting
        const cleanedText = text.replace(/```json\s*|\s*```/g, '').trim();
        scores = JSON.parse(cleanedText);
        
        if (!Array.isArray(scores)) {
          throw new Error('Response is not an array');
        }
        
        // Validate each score object has required properties
        const validScores = scores.every((score: any) => 
          typeof score === 'object' && 
          score !== null && 
          'index' in score && 
          'score' in score && 
          'explanation' in score &&
          typeof score.index === 'number' &&
          typeof score.score === 'number' &&
          typeof score.explanation === 'string'
        );
        
        if (!validScores) {
          throw new Error('Some score objects are missing required properties');
        }
      } catch (error) {
        console.error('Error parsing personalization results:', error);
        console.error('Raw response:', text);
        
        // Try to extract JSON array using regex as a fallback
        try {
          const arrayMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
          if (arrayMatch) {
            scores = JSON.parse(arrayMatch[0]);
            console.log('Successfully extracted JSON array using regex');
          } else {
            throw new Error('Could not extract JSON array');
          }
        } catch (extractError) {
          console.error('Failed to extract JSON array:', extractError);
          return results; // Return original results if parsing fails
        }
      }

      // Combine original relevance scores with personalization scores
      return scores.map((score: any) => {
        const originalResult = results[score.index - 1];
        if (!originalResult) {
          console.warn(`No result found for index ${score.index}, skipping`);
          return null;
        }
        
        return {
          ...originalResult,
          personalizationScore: score.score,
          // Combine both scores with personalization having slightly more weight
          relevanceScore: (originalResult.relevanceScore * 0.4) + (score.score * 0.6),
          explanation: score.explanation
        };
      })
      .filter((result: SearchResult | null): result is SearchResult => result !== null)
      .sort((a: SearchResult, b: SearchResult) => b.relevanceScore - a.relevanceScore);
    } catch (error) {
      console.error('Personalization agent error:', error);
      return results;
    }
  }

  analyzeUserPreferences(interactions: UserInteraction[]): {
    genreAffinities: Map<string, number>;
    studioAffinities: Map<string, number>;
    contentTypePreferences: Map<string, number>;
  } {
    const genreAffinities = new Map<string, number>();
    const studioAffinities = new Map<string, number>();
    const contentTypePreferences = new Map<string, number>();

    interactions.forEach(interaction => {
      const weight = this.getInteractionWeight(interaction);
      const { content_metadata } = interaction;

      // Update genre affinities
      content_metadata.genres.forEach(genre => {
        const currentScore = genreAffinities.get(genre) || 0;
        genreAffinities.set(genre, currentScore + weight);
      });

      // Update studio affinities
      const currentStudioScore = studioAffinities.get(content_metadata.studio) || 0;
      studioAffinities.set(content_metadata.studio, currentStudioScore + weight);

      // Update content type preferences
      const currentTypeScore = contentTypePreferences.get(content_metadata.type) || 0;
      contentTypePreferences.set(content_metadata.type, currentTypeScore + weight);
    });

    return {
      genreAffinities,
      studioAffinities,
      contentTypePreferences
    };
  }

  private getInteractionWeight(interaction: UserInteraction): number {
    // Base weights for different interaction types
    const baseWeights = {
      completed: 1.0,
      watching: 0.8,
      planned: 0.3,
      dropped: -0.2
    };

    let weight = baseWeights[interaction.interaction_type as keyof typeof baseWeights] || 0;

    // Adjust weight based on rating if available
    if (interaction.rating) {
      weight *= (interaction.rating / 5); // Normalize rating to 0-1 scale
    }

    return weight;
  }
} 