import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { nanoid } from "nanoid";
import type { CreateGroupChatRequest, GroupChat } from "@/types/chat";

const MAX_USERS = 10;
const MAX_CHARACTERS = 5;

interface CharacterProfile {
    id: string;
    name: string;
}

interface UserProfile {
    user_id: string;
    user_name: string;
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { group_name, users_id, characters_id } = body as CreateGroupChatRequest;

        // Validate input
        if (!group_name?.trim()) {
            return new NextResponse("Group name is required", { status: 400 });
        }

        if (!Array.isArray(users_id) || !Array.isArray(characters_id)) {
            return new NextResponse("Invalid users or characters format", { status: 400 });
        }

        if (characters_id.length === 0) {
            return new NextResponse("At least one character is required", { status: 400 });
        }

        if (characters_id.length > MAX_CHARACTERS) {
            return new NextResponse(`Maximum ${MAX_CHARACTERS} characters allowed`, { status: 400 });
        }

        if (users_id.length > MAX_USERS) {
            return new NextResponse(`Maximum ${MAX_USERS} users allowed`, { status: 400 });
        }

        const supabase = createBrowserSupabaseClient();

        // Verify all characters exist and are active
        const { data: characters, error: charError } = await supabase
            .from('character_profiles')
            .select('id')
            .in('id', characters_id)
            .eq('is_active', true);

        if (charError || !characters || characters.length !== characters_id.length) {
            return new NextResponse("One or more characters are invalid or inactive", { status: 400 });
        }

        // Verify all users exist and are active
        if (users_id.length > 0) {
            const { data: users, error: userError } = await supabase
                .from('user')
                .select('user_id')
                .in('user_id', users_id)
                .eq('is_active', true);

            if (userError || !users || users.length !== users_id.length) {
                return new NextResponse("One or more users are invalid or inactive", { status: 400 });
            }
        }

        // Create a new group chat
        const { data: group, error } = await supabase
            .from('group_chat_history')
            .insert({
                creator_id: session.user.id,
                users_id: [session.user.id, ...users_id],
                characters_id,
                session_id: nanoid(),
                group_name: group_name.trim(),
                messages: [],
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select('*')
            .single();

        if (error) {
            console.error("Error creating group chat:", error);
            return new NextResponse("Error creating group chat", { status: 500 });
        }

        return NextResponse.json({ group });
    } catch (error) {
        console.error("Error:", error);
        return new NextResponse(
            error instanceof Error ? error.message : "Internal Error",
            { status: 500 }
        );
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const supabase = createBrowserSupabaseClient();

        // Get all active group chats where the user is a member
        const { data: groups, error } = await supabase
            .from('group_chat_history')
            .select('*')
            .contains('users_id', [session.user.id])
            .eq('is_active', true)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error("Error fetching group chats:", error);
            return new NextResponse("Error fetching group chats", { status: 500 });
        }

        if (!groups || groups.length === 0) {
            return NextResponse.json({ groups: [] });
        }

        // Safely get all unique character IDs from all groups
        const allCharacterIds = Array.from(
            new Set(
                groups.flatMap(g => Array.isArray(g.characters_id) ? g.characters_id : [])
            )
        );

        // Only fetch characters if we have IDs
        let characters: CharacterProfile[] = [];
        if (allCharacterIds.length > 0) {
            const { data: chars } = await supabase
                .from('character_profiles')
                .select('id, name')
                .in('id', allCharacterIds);
            characters = (chars || []) as CharacterProfile[];
        }

        // Safely get all unique user IDs from all groups
        const allUserIds = Array.from(
            new Set(
                groups.flatMap(g => Array.isArray(g.users_id) ? g.users_id : [])
            )
        );

        // Only fetch users if we have IDs
        let users: UserProfile[] = [];
        if (allUserIds.length > 0) {
            const { data: usrs } = await supabase
                .from('user')
                .select('user_id, user_name')
                .in('user_id', allUserIds);
            users = (usrs || []) as UserProfile[];
        }

        // Create maps for quick lookup
        const characterMap = new Map(
            characters.map(c => [c.id, c.name])
        );
        const userMap = new Map(
            users.map(u => [u.user_id, u.user_name])
        );

        // Transform the groups data with safe array checks
        const transformedGroups = groups.map(group => ({
            ...group,
            character_names: (Array.isArray(group.characters_id) ? group.characters_id : [])
                .map((id: string) => characterMap.get(id) || 'Unknown Character'),
            user_names: (Array.isArray(group.users_id) ? group.users_id : [])
                .map((id: string) => userMap.get(id) || 'Unknown User'),
            character_count: Array.isArray(group.characters_id) ? group.characters_id.length : 0,
            user_count: Array.isArray(group.users_id) ? group.users_id.length : 0
        }));

        return NextResponse.json({ groups: transformedGroups });
    } catch (error) {
        console.error("Error:", error);
        return new NextResponse(
            error instanceof Error ? error.message : "Internal Error",
            { status: 500 }
        );
    }
} 