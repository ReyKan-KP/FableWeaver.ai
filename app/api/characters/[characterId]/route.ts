import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(
    request: Request,
    { params }: { params: { characterId: string } }
) {
    try {
        const { data, error } = await supabase
            .from('character_profiles')
            .select('*')
            .eq('id', params.characterId)
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching character:', error);
        return NextResponse.json(
            { error: 'Failed to fetch character' },
            { status: 500 }
        );
    }
} 