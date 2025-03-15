# Lore Lens AI Agents

This directory contains the AI agents that power the Lore Lens content discovery feature. These agents use specialized prompt templates to provide high-quality, content-specific recommendations and explanations.

## Agent Architecture

The Lore Lens system uses a multi-agent architecture:

1. **SearchAgent**: Handles semantic search across content items, using specialized templates for different content types
2. **PersonalizationAgent**: Reranks content based on user preferences and interaction history
3. **RecommendationAgent**: Orchestrates the overall recommendation process and generates explanations
4. **ImageSearchAgent**: Finds high-quality images for content items

## Prompt Templates

The system uses specialized prompt templates for different content types and agent functions, defined in `prompt-templates.ts`:

### Content Type-Specific Templates

- **Base Template**: Generic template for all content types
- **Anime Template**: Specialized for anime with focus on studios, art style, and target demographics
- **Movie Template**: Specialized for films with focus on directors, cinematography, and cultural impact
- **Web Series Template**: Specialized for streaming content with focus on platforms, binge-worthiness, and release strategies
- **Manga Template**: Specialized for Japanese comics with focus on art style, publication history, and visual storytelling
- **Manhua Template**: Specialized for Chinese comics with focus on color usage, cultivation themes, and cultural elements
- **Manhwa Template**: Specialized for Korean comics with focus on webtoon format, vertical scrolling, and digital design
- **Light Novel Template**: Specialized for Japanese light novels with focus on illustrations, adaptation status, and narrative hooks
- **Web Novel Template**: Specialized for online fiction with focus on platforms, update schedules, and reader engagement

### Function-Specific Templates

- **Personalization Template**: For personalizing content based on user preferences and history
- **Explanation Template**: For generating natural, conversational explanations of recommendations
- **Related Content Template**: For finding similar content based on thematic and stylistic connections
- **Image Search Template**: For finding high-quality official images for content items

## Helper Functions

The system includes helper functions to select the appropriate template based on content type:

- `getSearchTemplateForContentType(contentType)`: Returns the appropriate search template
- `getImagePriorityForContentType(contentType)`: Returns the appropriate image search priority

## Usage

The agents are instantiated with a context object that includes:

```typescript
interface AgentContext {
  userId?: string;
  isPersonalized: boolean;
  filters: SearchFilters;
  model: any; // Gemini model instance
}
```

Example usage:

```typescript
// Initialize the recommendation agent
const context = {
  userId: "user123",
  isPersonalized: true,
  filters: { /* filter values */ },
  model: geminiModel
};

const recommendationAgent = new RecommendationAgent(context);

// Get personalized recommendations
const recommendations = await recommendationAgent.getRecommendations(
  "fantasy with strong female lead",
  contentItems,
  userPreferences,
  userInteractions
);
```

## Prompt Template Design Principles

Our prompt templates follow these design principles:

1. **Content-Type Specificity**: Each template is tailored to the unique aspects of its content type
2. **Clear Instructions**: Templates provide clear, structured instructions to the AI model
3. **Consistent Output Format**: All templates enforce a consistent JSON output format
4. **Conversational Tone**: Explanation templates use a natural, conversational tone
5. **Domain Expertise**: Templates incorporate domain-specific terminology and evaluation criteria
6. **User-Centric**: Templates focus on aspects that matter most to users of each content type

## Content Type Considerations

Each content type has unique characteristics that our templates address:

- **Anime**: Japanese animation with distinct studios, seasons, and art styles
- **Movies**: Cinematic works with directors, actors, and theatrical releases
- **Web Series**: Streaming platform content designed for binge-watching
- **Manga**: Japanese comics with specific publication formats and artistic styles
- **Manhua**: Chinese comics often featuring color, cultivation themes, and digital distribution
- **Manhwa**: Korean comics typically using webtoon format with vertical scrolling
- **Light Novels**: Japanese illustrated novels with anime-adjacent themes and adaptations
- **Web Novels**: Online serialized fiction across various platforms and languages

## Extending the System

To add support for a new content type:

1. Add a new template to the `contentTypeTemplates` object in `prompt-templates.ts`
2. Add mappings for the new type in the `typeMap` objects in the helper functions
3. Add image priority information to the `imageTypePriorities` object

## Performance Considerations

- Templates are designed to work efficiently with the Gemini model
- Response parsing includes robust error handling and fallbacks
- Content items are processed in type-specific groups to improve relevance 