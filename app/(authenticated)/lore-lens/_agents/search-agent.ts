import { ContentItem, AgentContext, SearchResult } from './types';
import { getSearchTemplateForContentType, baseSearchTemplate } from './prompt-templates';

export class SearchAgent {
  private context: AgentContext;

  constructor(context: AgentContext) {
    this.context = context;
  }

  async searchContent(query: string, contentItems: ContentItem[]): Promise<SearchResult[]> {
    if (!query.trim() || contentItems.length === 0) {
      return contentItems.map(content => ({
        content,
        relevanceScore: 1,
        explanation: 'No search query provided, showing all results'
      }));
    }

    // Group content items by type for specialized processing
    const contentByType = this.groupContentByType(contentItems);
    let allResults: SearchResult[] = [];

    // Process each content type group with its specialized template
    for (const [contentType, items] of Object.entries(contentByType)) {
      if (items.length === 0) continue;
      
      // Get the appropriate template for this content type
      const template = getSearchTemplateForContentType(contentType);
      
      // Format content items for the prompt
      const formattedItems = items.map((content, index) => `
      Item ${index + 1}:
      Title: ${content.name}
      Type: ${content.type}
      Description: ${content.description}
      Genres: ${content.genres.join(', ')}
      Studio: ${content.studio}
      Rating: ${content.rating}
      Year: ${content.release_year}
      Image: ${content.image_url || 'No image available'}
      `).join('\n');
      
      // Replace placeholders in the template
      const prompt = template
        .replace('{{QUERY}}', query)
        .replace('{{CONTENT_ITEMS}}', formattedItems);

      try {
        const result = await this.context.model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }]}],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
            topK: 40,
            topP: 0.95,
          }
        });
        const response = await result.response;
        const text = response.text();
        
        let scores;
        try {
          // Clean the text to remove markdown code block formatting
          const cleanedText = text.replace(/```json\s*|\s*```/g, '').trim();
          scores = JSON.parse(cleanedText);
          
          // Validate scores array structure
          if (!Array.isArray(scores) || scores.length === 0) {
            console.warn(`Response for ${contentType} is not a valid array or is empty, using default scoring`);
            allResults = [...allResults, ...items.map(content => ({
              content,
              relevanceScore: 1,
              explanation: 'Default ranking due to invalid response format'
            }))];
            continue;
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
            console.warn(`Some score objects for ${contentType} are missing required properties, using default scoring`);
            allResults = [...allResults, ...items.map(content => ({
              content,
              relevanceScore: 1,
              explanation: 'Default ranking due to invalid score format'
            }))];
            continue;
          }
        } catch (error) {
          console.error(`Error parsing search results for ${contentType}:`, error);
          console.error('Raw response:', text);
          
          // Try to extract JSON array using regex as a fallback
          try {
            const arrayMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
            if (arrayMatch) {
              scores = JSON.parse(arrayMatch[0]);
              console.log(`Successfully extracted JSON array for ${contentType} using regex`);
            } else {
              throw new Error('Could not extract JSON array');
            }
          } catch (extractError) {
            console.error(`Failed to extract JSON array for ${contentType}:`, extractError);
            
            // Fallback to default scoring
            allResults = [...allResults, ...items.map(content => ({
              content,
              relevanceScore: 1,
              explanation: 'Error in search ranking, showing default order'
            }))];
            continue;
          }
        }

        const typeResults = scores.map((score: any) => {
          // Ensure index is within bounds (1-indexed in the prompt, 0-indexed in the array)
          const index = typeof score.index === 'number' ? score.index - 1 : 0;
          const validIndex = index >= 0 && index < items.length;
          
          return {
            content: validIndex ? items[index] : items[0],
            relevanceScore: typeof score.score === 'number' ? score.score : 0.5,
            explanation: score.explanation || 'No explanation provided'
          };
        }).filter((item: any) => item.content !== undefined);
        
        // Add results from this content type to the overall results
        allResults = [...allResults, ...typeResults];
      } catch (error) {
        console.error(`Search agent error for ${contentType}:`, error);
        allResults = [...allResults, ...items.map(content => ({
          content,
          relevanceScore: 1,
          explanation: 'Error in search ranking, showing default order'
        }))];
      }
    }
    
    // If we somehow ended up with no results, return all content items with default scoring
    if (allResults.length === 0) {
      console.warn('No valid results after processing, using default scoring');
      return contentItems.map(content => ({
        content,
        relevanceScore: 1,
        explanation: 'Default ranking due to processing issues'
      }));
    }
    
    // Sort all results by relevance score
    return allResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  // Helper method to group content items by their type
  private groupContentByType(items: ContentItem[]): Record<string, ContentItem[]> {
    const groupedContent: Record<string, ContentItem[]> = {};
    
    items.forEach(item => {
      const type = item.type.toLowerCase();
      if (!groupedContent[type]) {
        groupedContent[type] = [];
      }
      groupedContent[type].push(item);
    });
    
    return groupedContent;
  }

  filterContentByPreferences(items: ContentItem[]): ContentItem[] {
    const { filters } = this.context;
    
    return items.filter(item => {
      // Apply rating filter
      if (item.rating < filters.minRating) return false;

      // Apply year range filter
      if (item.release_year < filters.yearStart || item.release_year > filters.yearEnd) return false;

      // Apply genre filter if specified
      if (filters.genres.length > 0 && 
          !item.genres.some(genre => filters.genres.includes(genre))) return false;

      // Apply studio filter if specified
      if (filters.studios.length > 0 && !filters.studios.includes(item.studio)) return false;

      return true;
    });
  }
} 