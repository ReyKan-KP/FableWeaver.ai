import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase';
export const maxDuration = 60;
// Get user preferences
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();
    
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is the "no rows returned" error code
      console.error('Error fetching user preferences:', error);
      return NextResponse.json({ error: "Failed to fetch user preferences" }, { status: 500 });
    }
    
    // Return default empty arrays if no data exists
    return NextResponse.json(data || {
      user_id: session.user.id,
      favorite_genres: [],
      favorite_studios: [],
      min_rating: 7,
      preferred_content_types: []
    });
  } catch (error) {
    console.error('Error in GET user preferences:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Update user preferences
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { favorite_genres, favorite_studios, min_rating, preferred_content_types } = body;

    const supabase = createServerSupabaseClient();
    
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: session.user.id,
        favorite_genres: favorite_genres || [],
        favorite_studios: favorite_studios || [],
        min_rating: min_rating || 7,
        preferred_content_types: preferred_content_types || [],
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error updating user preferences:', error);
      return NextResponse.json({ error: "Failed to update user preferences" }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in POST user preferences:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 