import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const maxDuration = 60;
// Get user's bookmarks
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const novelId = searchParams.get("novelId");

        const supabase = createServerSupabaseClient();

        let query = supabase
            .from("novel_bookmarks")
            .select(`
                *,
                novel:novel_id (
                    id,
                    title,
                    cover_image,
                    chapter_count,
                    last_chapter_at
                ),
                chapter:chapter_id (
                    id,
                    title,
                    chapter_number
                )
            `)
            .eq("user_id", session.user.id)
            .order("created_at", { ascending: false });

        if (novelId) {
            query = query.eq("novel_id", novelId);
        }

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching bookmarks:", error);
        return NextResponse.json(
            { error: "Failed to fetch bookmarks" },
            { status: 500 }
        );
    }
}

// Create a bookmark
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const body = await request.json();
        const { novel_id, chapter_id, note } = body;

        if (!novel_id) {
            return NextResponse.json(
                { error: "Novel ID is required" },
                { status: 400 }
            );
        }

        const supabase = createServerSupabaseClient();

        const { data, error } = await supabase
            .from("novel_bookmarks")
            .upsert(
                {
                    user_id: session.user.id,
                    novel_id,
                    chapter_id,
                    note,
                },
                {
                    onConflict: "user_id,novel_id,chapter_id",
                }
            )
            .select(`
                *,
                novel:novel_id (
                    id,
                    title,
                    cover_image
                ),
                chapter:chapter_id (
                    id,
                    title,
                    chapter_number
                )
            `)
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error creating bookmark:", error);
        return NextResponse.json(
            { error: "Failed to create bookmark" },
            { status: 500 }
        );
    }
}

// Update a bookmark
export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const body = await request.json();
        const { id, note } = body;

        if (!id) {
            return NextResponse.json(
                { error: "Bookmark ID is required" },
                { status: 400 }
            );
        }

        const supabase = createServerSupabaseClient();

        const { data, error } = await supabase
            .from("novel_bookmarks")
            .update({
                note,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .eq("user_id", session.user.id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error updating bookmark:", error);
        return NextResponse.json(
            { error: "Failed to update bookmark" },
            { status: 500 }
        );
    }
}

// Delete a bookmark
export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "Bookmark ID is required" },
                { status: 400 }
            );
        }

        const supabase = createServerSupabaseClient();

        const { error } = await supabase
            .from("novel_bookmarks")
            .delete()
            .eq("id", id)
            .eq("user_id", session.user.id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting bookmark:", error);
        return NextResponse.json(
            { error: "Failed to delete bookmark" },
            { status: 500 }
        );
    }
} 