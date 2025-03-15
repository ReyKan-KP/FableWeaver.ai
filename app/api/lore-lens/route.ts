import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { RecommendationAgent } from '@/app/(authenticated)/lore-lens/_agents/recommendation-agent';
import type { SearchResult, AgentContext, ContentItem } from '@/app/(authenticated)/lore-lens/_agents/types';
import { v4 as uuidv4 } from 'uuid';
import { ImageSearchAgent } from '@/app/(authenticated)/lore-lens/_agents/image-search-agent';

const supabase = createServerSupabaseClient();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export const maxDuration = 60;

// Input validation schema
const searchSchema = z.object({
  query: z.string().optional(),
  contentTypes: z.array(z.string()),
  filters: z.object({
    minRating: z.number(),
    yearStart: z.number(),
    yearEnd: z.number(),
    genres: z.array(z.string()),
    studios: z.array(z.string()),
  }),
  isPersonalized: z.boolean(),
  userId: z.string().optional(),
});

// Use the specified Gemini model
const MODEL_NAME = "gemini-2.0-flash";

export async function POST(req: Request) {
  try {
    console.log('API Route: Received POST request');
    console.log('Serper API Key available:', !!process.env.SERPER_API_KEY);
    
    const body = await req.json();
    console.log('Request body:', body);
    
    const validatedData = searchSchema.parse(body);
    console.log('Validated data:', validatedData);
    
    const { query, contentTypes, filters, isPersonalized, userId } = validatedData;

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ 
      model: MODEL_NAME,  // Use the specified model
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    });

    // Create agent context
    const context: AgentContext = {
      userId,
      isPersonalized,
      filters,
      model
    };

    // Initialize recommendation agent
    const recommendationAgent = new RecommendationAgent(context);

    // Generate base prompt for content recommendations
    const basePrompt = `Generate 5 diverse content recommendations for a user interested in ${contentTypes.join(', ')} with the following criteria:
    - Search query: ${query || 'None specified'}
    - Minimum rating: ${filters.minRating}
    - Year range: ${filters.yearStart} to ${filters.yearEnd}
    - Preferred genres: ${filters.genres.length > 0 ? filters.genres.join(', ') : 'Any'}
    - Preferred studios: ${filters.studios.length > 0 ? filters.studios.join(', ') : 'Any'}
    
    For each recommendation, provide:
    - A unique name
    - Content type (${contentTypes.join(', ')})
    - Brief description
    - Release year (between ${filters.yearStart} and ${filters.yearEnd})
    - Rating (between ${filters.minRating} and 10)
    - Studio name
    - List of genres
    
    Format as a JSON array of objects.`;

    console.log('Generating recommendations...');

    try {
      // Generate content recommendations
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: basePrompt }]}]
      });
      
      const response = await result.response;
      const text = response.text();
      
      // Extract and parse JSON content
      let contentItems: ContentItem[] = [];
      
      try {
        // Clean the text to remove markdown code block formatting
        const cleanedText = text.replace(/```json\s*|\s*```/g, '').trim();
        const extractedJson = JSON.parse(cleanedText);
        
        if (Array.isArray(extractedJson)) {
          contentItems = extractedJson;
        } else {
          throw new Error('Generated content is not an array');
        }
      } catch (parseError) {
        console.error('Error parsing generated content:', parseError);
        console.log('Raw generated text:', text);
        
        // Try to extract JSON array using regex as a fallback
        try {
          const arrayMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
          if (arrayMatch) {
            contentItems = JSON.parse(arrayMatch[0]);
            console.log('Successfully extracted JSON array using regex');
          } else {
            throw new Error('Could not extract JSON array');
          }
        } catch (extractError) {
          console.error('Failed to extract JSON array:', extractError);
          
          // Use fallback content items
          contentItems = [];
        }
      }
      
      // Validate and fix each item
      contentItems = contentItems.map(item => {
        return {
          id: uuidv4(),
          name: typeof item.name === 'string' ? item.name : 'Unknown Title',
          type: typeof item.type === 'string' ? item.type : (contentTypes[0] || 'movie'),
          description: typeof item.description === 'string' ? item.description : 'No description available',
          release_year: typeof item.release_year === 'number' ? item.release_year : 2000,
          rating: typeof item.rating === 'number' ? item.rating : 7.0,
          studio: typeof item.studio === 'string' ? item.studio : 'Unknown Studio',
          genres: Array.isArray(item.genres) ? item.genres : ['Unknown'],
          image_url: typeof item.image_url === 'string' ? item.image_url : '',
          views_count: typeof item.views_count === 'number' ? item.views_count : 0,
          likes_count: typeof item.likes_count === 'number' ? item.likes_count : 0,
          comments_count: typeof item.comments_count === 'number' ? item.comments_count : 0
        };
      });
      
      // If no valid content items were generated, use fallbacks
      if (contentItems.length === 0) {
        console.log('No valid content items generated, using fallbacks');
        contentItems = [
          {
            id: uuidv4(),
            name: `${query || 'Recommended'} Movie 1`,
            type: contentTypes[0] || 'movie',
            description: 'A highly recommended movie based on your search criteria.',
            release_year: 2020,
            rating: 8.0,
            studio: 'Major Studio',
            genres: filters.genres.length > 0 ? filters.genres : ['Action', 'Drama'],
            image_url: '',
            views_count: 0,
            likes_count: 0,
            comments_count: 0
          },
          {
            id: uuidv4(),
            name: `${query || 'Recommended'} Movie 2`,
            type: contentTypes[0] || 'movie',
            description: 'Another great recommendation matching your preferences.',
            release_year: 2021,
            rating: 7.5,
            studio: 'Popular Productions',
            genres: filters.genres.length > 0 ? filters.genres : ['Adventure', 'Thriller'],
            image_url: '',
            views_count: 0,
            likes_count: 0,
            comments_count: 0
          }
        ];
      }
      
      // Use the image search agent to find proper images for all content items
      console.log('Using ImageSearchAgent to find high-quality images for all content items');
      console.log('Serper API Key available:', !!process.env.SERPER_API_KEY);
      
      try {
        const imageSearchAgent = new ImageSearchAgent(context);
        const startTime = Date.now();
        contentItems = await imageSearchAgent.findImageUrls(contentItems);
        const endTime = Date.now();
        console.log(`Image search completed in ${(endTime - startTime) / 1000} seconds`);
        console.log('Content items after image search:', contentItems.map(item => ({
          name: item.name,
          image_url: item.image_url
        })));
      } catch (imageSearchError) {
        console.error('Error during image search:', imageSearchError);
        // Continue with the process even if image search fails
      }
      
      console.log(`Generated ${contentItems.length} content items`);
      
      // Fetch user preferences and interactions if personalization is enabled
      let userPreferences;
      let userInteractions;
      
      if (isPersonalized && userId) {
        console.log('Fetching user preferences and interactions for personalization');
        
        try {
          const { data: preferences, error: preferencesError } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', userId)
            .single();
            
          if (preferencesError) {
            console.error('Error fetching user preferences:', preferencesError);
          } else if (preferences) {
            userPreferences = preferences;
            console.log('User preferences:', userPreferences);
          }
          
          const { data: interactions, error: interactionsError } = await supabase
            .from('user_content_interactions')
            .select(`
              *,
              content_metadata(*)
            `)
            .eq('user_id', userId);
            
          if (interactionsError) {
            console.error('Error fetching user interactions:', interactionsError);
          } else if (interactions) {
            userInteractions = interactions.map(interaction => ({
              ...interaction,
              content_metadata: interaction.content_metadata
            }));
            console.log(`Found ${userInteractions.length} user interactions`);
          }
        } catch (error) {
          console.error('Error in personalization data fetching:', error);
        }
      }
      
      // Get recommendations using the recommendation agent
      const recommendations = await recommendationAgent.getRecommendations(
        query || '',
        contentItems,
        userPreferences,
        userInteractions
      );
      
      console.log('Generating explanations...');
      const topResults = recommendations.slice(0, 10);
      let resultsWithExplanations = await Promise.all(
        topResults.map(async (result) => ({
          ...result,
          explanation: await recommendationAgent.generateExplanation(result)
        }))
      );
      console.log('Generated explanations for top results');

      // Check if any of the results are saved by the user
      if (userId) {
        console.log('Checking saved status for user:', userId);
        
        try {
          // Get all saved content IDs for this user
          const { data: savedItems, error: savedError } = await supabase
            .from('user_content_interactions')
            .select('content_id')
            .eq('user_id', userId)
            .eq('interaction_type', 'saved');
            
          if (savedError) {
            console.error('Error fetching saved items:', savedError);
          } else if (savedItems && savedItems.length > 0) {
            // Create a set of saved content IDs for faster lookup
            const savedContentIds = new Set(savedItems.map(item => item.content_id));
            
            // Mark saved items in the results
            resultsWithExplanations = resultsWithExplanations.map(result => ({
              ...result,
              content: {
                ...result.content,
                is_saved: savedContentIds.has(result.content.id)
              }
            }));
            
            console.log(`Marked ${savedContentIds.size} items as saved`);
          }
        } catch (error) {
          console.error('Error checking saved status:', error);
        }
      }

      // Store recommendations in Supabase
      if (resultsWithExplanations.length > 0) {
        console.log('Storing recommendations in Supabase...');
        
        try {
          // First, prepare the data for insertion
          const contentToUpsert = resultsWithExplanations.map(result => ({
            id: result.content.id,
            name: result.content.name,
            type: result.content.type,
            description: result.content.description,
            release_year: result.content.release_year,
            rating: result.content.rating,
            studio: result.content.studio,
            genres: result.content.genres,
            image_url: result.content.image_url,
            views_count: result.content.views_count || 0,
            likes_count: result.content.likes_count || 0,
            comments_count: result.content.comments_count || 0
          }));
          
          console.log('Upserting content items:', contentToUpsert.length);
          
          // Perform the upsert operation with the correct conflict target
          const { error: insertError } = await supabase
            .from('content_metadata')
            .upsert(contentToUpsert, { 
              onConflict: 'id',
              ignoreDuplicates: false
            });

          if (insertError) {
            console.error('Error storing recommendations:', insertError);
          } else {
            console.log('Successfully stored recommendations with improved image URLs');
            
            // Now store the recommendations in the content_recommendations table
            if (userId) {
              console.log('Storing user recommendations in content_recommendations table...');
              
              const recommendationsToStore = resultsWithExplanations.map((result, index) => ({
                user_id: userId,
                content_id: result.content.id,
                score: result.relevanceScore || result.personalizationScore || (10 - index) / 10, // Use relevance score or calculate based on position
                reason: result.explanation || (isPersonalized ? 'Personalized recommendation' : 'Search result')
              }));
              
              const { error: recError } = await supabase
                .from('content_recommendations')
                .upsert(recommendationsToStore, {
                  onConflict: 'user_id,content_id',
                  ignoreDuplicates: false
                });
                
              if (recError) {
                console.error('Error storing in content_recommendations:', recError);
              } else {
                console.log('Successfully stored in content_recommendations table');
              }
            }
          }
        } catch (error) {
          console.error('Error in upsert operation:', error);
        }
      }

      return NextResponse.json({
        results: resultsWithExplanations,
        total: recommendations.length,
        message: isPersonalized ? 'Personalized recommendations generated successfully' : 'Recommendations generated successfully'
      });

    } catch (error: unknown) {
      console.error('Error in recommendation process:', error);
      return NextResponse.json(
        { 
          error: 'Failed to generate recommendations',
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process search request', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// Save content endpoint
export async function PUT(req: Request) {
  try {
    const { contentId, userId } = await req.json();
    
    if (!contentId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: contentId and userId' },
        { status: 400 }
      );
    }

    console.log('Saving content interaction:', { contentId, userId });

    // Check if the content exists
    const { data: contentExists, error: contentError } = await supabase
      .from('content_metadata')
      .select('id')
      .eq('id', contentId)
      .single();

    if (contentError) {
      console.error('Content not found:', contentError);
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    // Upsert the interaction
    const { data, error } = await supabase
      .from('user_content_interactions')
      .upsert(
        {
          user_id: userId,
          content_id: contentId,
          interaction_type: 'saved',
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id,content_id' }
      );

    if (error) {
      console.error('Error saving interaction:', error);
      throw error;
    }

    console.log('Content saved successfully');
    return NextResponse.json({ 
      success: true,
      message: 'Content saved successfully'
    });
  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save content',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// Get saved content for a user
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      );
    }

    console.log('Fetching saved content for user:', userId);

    // Join user_content_interactions with content_metadata to get full content details
    const { data, error } = await supabase
      .from('user_content_interactions')
      .select(`
        *,
        content:content_metadata(*)
      `)
      .eq('user_id', userId)
      .eq('interaction_type', 'saved');

    if (error) {
      console.error('Error fetching saved content:', error);
      throw error;
    }

    // Transform the data to a more usable format
    const savedContent = data.map(item => ({
      interactionId: item.id,
      interactionType: item.interaction_type,
      updatedAt: item.updated_at,
      ...item.content
    }));

    console.log(`Retrieved ${savedContent.length} saved items for user ${userId}`);
    return NextResponse.json({ 
      success: true,
      savedContent,
      count: savedContent.length
    });
  } catch (error) {
    console.error('Get saved content error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve saved content',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// Delete saved content for a user
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const contentId = url.searchParams.get('contentId');
    const userId = url.searchParams.get('userId');
    
    if (!contentId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters: contentId and userId' },
        { status: 400 }
      );
    }

    console.log('Removing saved content:', { contentId, userId });

    // Delete the interaction
    const { data, error } = await supabase
      .from('user_content_interactions')
      .delete()
      .eq('user_id', userId)
      .eq('content_id', contentId)
      .eq('interaction_type', 'saved');

    if (error) {
      console.error('Error removing saved content:', error);
      throw error;
    }

    console.log('Content removed successfully');
    return NextResponse.json({ 
      success: true,
      message: 'Content removed successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to remove saved content',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
