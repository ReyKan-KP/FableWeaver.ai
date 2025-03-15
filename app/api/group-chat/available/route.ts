import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createServerSupabaseClient } from "@/lib/supabase"

interface CharacterProfile {
    id: string
    name: string
    image_url?: string
}

interface UserProfile {
    user_id: string
    user_name: string
    avatar_url?: string
}

interface FriendshipData {
    id: string;
    user_id: string;
    friend_id: string;
    user: UserProfile & { is_active: boolean };
    friend: UserProfile & { is_active: boolean };
}

export const dynamic = "force-dynamic" // This opts out of static generation
export const maxDuration = 60;

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const supabase = createServerSupabaseClient()

        // Get all active characters
        const { data: characters, error: charError } = await supabase
            .from("character_profiles")
            .select("id, name, image_url")
            .eq("is_active", true)
            .eq("is_public", true)
            .order("name")

        if (charError) {
            console.error("Error fetching characters:", charError)
            return new NextResponse("Error fetching characters", { status: 500 })
        }

        // Get all active users who are friends with the current user
        const { data: friendships, error: friendshipError } = await supabase
            .from("friendships")
            .select(`
                id,
                user_id,
                friend_id,
                user:user!friendships_user_id_fkey (
                    user_id,
                    user_name,
                    avatar_url,
                    is_active
                ),
                friend:user!friendships_friend_id_fkey (
                    user_id,
                    user_name,
                    avatar_url,
                    is_active
                )
            `)
            .or(`user_id.eq.${session.user.id},friend_id.eq.${session.user.id}`)
            .eq("status", "accepted") as { data: FriendshipData[] | null, error: any };

        if (friendshipError) {
            console.error("Error fetching friendships:", friendshipError);
            return new NextResponse("Error fetching friends", { status: 500 });
        }

        // Process friendships to get friend data
        const friends = (friendships || []).map((friendship) => {
            const friend = friendship.user_id === session.user.id
                ? friendship.friend
                : friendship.user;
            
            return {
                id: friend.user_id,
                name: friend.user_name,
                image: friend.avatar_url,
                is_active: friend.is_active
            };
        }).filter(friend => friend.is_active);

        return NextResponse.json({
            characters: (characters || []).map((char: { id: any; name: any; image_url: any }) => ({
                id: char.id,
                name: char.name,
                image: char.image_url,
            })),
            users: friends,
        })
    } catch (error) {
        console.error("Error:", error)
        return new NextResponse(error instanceof Error ? error.message : "Internal Error", { status: 500 })
    }
}

