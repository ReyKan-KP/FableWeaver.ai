import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createBrowserSupabaseClient } from "@/lib/supabase";

export const maxDuration = 60;

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const supabase = createBrowserSupabaseClient();

        // Get all users except the current user
        const { data: users, error } = await supabase
            .from('user')
            .select('user_id, user_name, avatar_url, is_active')
            .neq('user_id', session.user.id)
            .order('user_name');

        if (error) {
            console.error("Error fetching users:", error);
            return new NextResponse("Error fetching users", { status: 500 });
        }

        if (!users) {
            return NextResponse.json({ users: [] });
        }

        // Transform and filter active users with valid data
        const transformedUsers = users
            .filter(user => user.is_active && user.user_id && user.user_name)
            .map(user => ({
                id: user.user_id,
                name: user.user_name,
                image: user.avatar_url || null
            }));

        return NextResponse.json({ users: transformedUsers });
    } catch (error) {
        console.error("Error:", error);
        return new NextResponse(
            error instanceof Error ? error.message : "Internal Error",
            { status: 500 }
        );
    }
} 