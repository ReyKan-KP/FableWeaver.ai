import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

const supabase = createServerSupabaseClient();
export const maxDuration = 60;
// Define types for the recommendation data
interface ContentMetadata {
  id: string;
  name: string;
  type: string;
  description: string;
  release_year: number;
  rating: number;
  studio: string;
  genres: string[];
  image_url: string;
  views_count: number;
  likes_count: number;
  comments_count: number;
}

interface RecommendationData {
  id: string;
  user_id: string;
  content_id: string;
  score: number;
  reason: string;
  created_at: string;
  content: ContentMetadata;
}

// Get user recommendations
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      );
    }

    console.log('Fetching recommendations for user:', userId);

    // Join content_recommendations with content_metadata to get full content details
    const { data, error, count } = await supabase
      .from('content_recommendations')
      .select(`
        *,
        content:content_metadata(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
      .throwOnError();

    if (error) {
      console.error('Error fetching recommendations:', error);
      throw error;
    }

    // Transform the data to a more usable format
    const recommendations = (data as RecommendationData[]).map(item => ({
      recommendationId: item.id,
      score: item.score,
      reason: item.reason,
      createdAt: item.created_at,
      content: item.content
    }));

    // Get total count in a separate query
    const { count: totalCount } = await supabase
      .from('content_recommendations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    console.log(`Retrieved ${recommendations.length} recommendations for user ${userId}`);
    return NextResponse.json({ 
      success: true,
      recommendations,
      count: totalCount || 0,
      limit,
      offset
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve recommendations',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// Delete user recommendations
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const recommendationId = url.searchParams.get('recommendationId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('content_recommendations')
      .delete()
      .eq('user_id', userId);
    
    // If recommendationId is provided, delete only that specific recommendation
    if (recommendationId) {
      query = query.eq('id', recommendationId);
      console.log(`Deleting recommendation ${recommendationId} for user ${userId}`);
    } else {
      console.log(`Deleting all recommendations for user ${userId}`);
    }

    const { error } = await query;

    if (error) {
      console.error('Error deleting recommendations:', error);
      throw error;
    }

    return NextResponse.json({ 
      success: true,
      message: recommendationId 
        ? 'Recommendation deleted successfully' 
        : 'All recommendations deleted successfully'
    });
  } catch (error) {
    console.error('Delete recommendations error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete recommendations',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 