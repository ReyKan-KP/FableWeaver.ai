import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createBrowserSupabaseClient } from "@/lib/supabase";

interface CharacterProfile {
    id: string;
    name: string;
    image_url?: string;
}

interface UserProfile {
    user_id: string;
    user_name: string;
    avatar_url?: string;
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const supabase = createBrowserSupabaseClient();

        // Get all active characters
        const { data: characters, error: charError } = await supabase
            .from('character_profiles')
            .select('id, name, image_url')
            .eq('is_active', true)
            .eq('is_public', true)
            .order('name');

        if (charError) {
            console.error("Error fetching characters:", charError);
            return new NextResponse("Error fetching characters", { status: 500 });
        }

        // Get all active users except the current user
        const { data: users, error: userError } = await supabase
            .from('user')
            .select('user_id, user_name, avatar_url')
            .neq('user_id', session.user.id)
            .eq('is_active', true)
            .order('user_name');

        if (userError) {
            console.error("Error fetching users:", userError);
            return new NextResponse("Error fetching users", { status: 500 });
        }

        return NextResponse.json({
            characters: (characters || []).map(char => ({
                id: char.id,
                name: char.name,
                image: char.image_url
            })),
            users: (users || []).map(user => ({
                id: user.user_id,
                name: user.user_name,
                image: user.avatar_url
            }))
        });
    } catch (error) {
        console.error("Error:", error);
        return new NextResponse(
            error instanceof Error ? error.message : "Internal Error",
            { status: 500 }
        );
    }
} 