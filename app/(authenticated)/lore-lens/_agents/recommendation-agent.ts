import { SearchAgent } from './search-agent';
import { PersonalizationAgent } from './personalization-agent';
import { ImageSearchAgent } from './image-search-agent';
import { 
  ContentItem, 
  AgentContext, 
  SearchResult, 
  UserPreferences, 
  UserInteraction 
} from './types';
import { explanationTemplate, relatedContentTemplate } from './prompt-templates';

export class RecommendationAgent {
  private searchAgent: SearchAgent;
  private personalizationAgent: PersonalizationAgent;
  private imageSearchAgent: ImageSearchAgent;
  private context: AgentContext;

  constructor(context: AgentContext) {
    this.context = context;
    this.searchAgent = new SearchAgent(context);
    this.personalizationAgent = new PersonalizationAgent(context);
    this.imageSearchAgent = new ImageSearchAgent(context);
  }

  async getRecommendations(
    query: string,
    contentItems: ContentItem[],
    userPreferences?: UserPreferences,
    userInteractions?: UserInteraction[]
  ): Promise<SearchResult[]> {
    // First, apply basic filters
    const filteredItems = this.searchAgent.filterContentByPreferences(contentItems);

    // Enhance content items with better image URLs
    const enhancedItems = await this.imageSearchAgent.findImageUrls(filteredItems);

    // Then, perform semantic search if query exists
    const searchResults = await this.searchAgent.searchContent(query, enhancedItems);

    // Finally, apply personalization if enabled and user data is available
    if (this.context.isPersonalized && userPreferences && userInteractions) {
      return this.personalizationAgent.personalizeResults(
        searchResults,
        userPreferences,
        userInteractions
      );
    }

    return searchResults;
  }

  async generateExplanation(result: SearchResult): Promise<string> {
    // Replace placeholders in the template
    const prompt = explanationTemplate
      .replace('{{TITLE}}', result.content.name)
      .replace('{{TYPE}}', result.content.type)
      .replace('{{GENRES}}', result.content.genres.join(', '))
      .replace('{{CREATOR}}', result.content.studio)
      .replace('{{RATING}}', result.content.rating.toString())
      .replace('{{YEAR}}', result.content.release_year.toString())
      .replace('{{DESCRIPTION}}', result.content.description)
      .replace('{{RELEVANCE_SCORE}}', result.relevanceScore.toString())
      .replace('{{PERSONALIZATION_SCORE}}', result.personalizationScore 
        ? `Personalization Score: ${result.personalizationScore}` 
        : '')
      .replace('{{ORIGINAL_EXPLANATION}}', result.explanation || 'None provided');

    try {
      const response = await this.context.model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }]}],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 256,
        }
      });
      return response.response.text();
    } catch (error) {
      console.error('Explanation generation error:', error);
      return result.explanation || 'No explanation available';
    }
  }

  async suggestRelatedContent(
    content: ContentItem,
    allContent: ContentItem[]
  ): Promise<SearchResult[]> {
    // Format content items for the prompt
    const formattedItems = allContent.map((item, index) => `
    Item ${index + 1}:
    Title: ${item.name}
    Type: ${item.type}
    Genres: ${item.genres.join(', ')}
    Studio: ${item.studio}
    Description: ${item.description}
    Image: ${item.image_url}
    `).join('\n');

    // Replace placeholders in the template
    const prompt = relatedContentTemplate
      .replace('{{TITLE}}', content.name)
      .replace('{{TYPE}}', content.type)
      .replace('{{DESCRIPTION}}', content.description)
      .replace('{{GENRES}}', content.genres.join(', '))
      .replace('{{CREATOR}}', content.studio)
      .replace('{{CONTENT_ITEMS}}', formattedItems);

    try {
      const result = await this.context.model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }]}],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        }
      });
      const response = await result.response;
      const text = response.text();
      
      let scores;
      try {
        scores = JSON.parse(text);
        if (!Array.isArray(scores)) {
          throw new Error('Response is not an array');
        }
      } catch (error) {
        console.error('Error parsing related content results:', error);
        console.error('Raw response:', text);
        return [];
      }

      return scores.map((score: any) => ({
        content: allContent[score.index - 1],
        relevanceScore: score.score,
        explanation: score.explanation
      })).sort((a: { relevanceScore: number; }, b: { relevanceScore: number; }) => b.relevanceScore - a.relevanceScore);
    } catch (error) {
      console.error('Related content suggestion error:', error);
      return [];
    }
  }
} 