import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Get reading progress
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const novelId = searchParams.get("novelId");
        const chapterId = searchParams.get("chapterId");

        if (!novelId) {
            return NextResponse.json(
                { error: "Novel ID is required" },
                { status: 400 }
            );
        }

        const supabase = createServerSupabaseClient();

        // First, get the reading progress
        let query = supabase
            .from("reading_progress")
            .select(`
                *,
                chapter:chapters(
                    id,
                    title,
                    chapter_number
                )
            `)
            .eq("user_id", session.user.id)
            .eq("novel_id", novelId);

        if (chapterId) {
            query = query.eq("chapter_id", chapterId);
        }

        const { data: progressData, error: progressError } = await query;

        if (progressError) throw progressError;

        if (!progressData || progressData.length === 0) {
            return NextResponse.json([]);
        }

        return NextResponse.json(progressData);
    } catch (error) {
        console.error("Error fetching reading progress:", error);
        return NextResponse.json(
            { error: "Failed to fetch reading progress" },
            { status: 500 }
        );
    }
}

// Update reading progress
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const body = await request.json();
        const { novel_id, chapter_id, progress_percentage, last_position } = body;

        if (!novel_id || !chapter_id) {
            return NextResponse.json(
                { error: "Novel ID and Chapter ID are required" },
                { status: 400 }
            );
        }

        const supabase = createServerSupabaseClient();

        // Update reading progress
        const { data: progressData, error: progressError } = await supabase
            .from("reading_progress")
            .upsert(
                {
                    user_id: session.user.id,
                    novel_id,
                    chapter_id,
                    progress_percentage,
                    last_position,
                },
                {
                    onConflict: "user_id,novel_id,chapter_id",
                }
            )
            .select()
            .single();

        if (progressError) throw progressError;

        // Update reading status if not already set
        const { data: statusData, error: statusError } = await supabase
            .from("reading_status")
            .upsert(
                {
                    user_id: session.user.id,
                    novel_id,
                    status: "reading",
                    last_read_chapter_id: chapter_id,
                    last_read_at: new Date().toISOString(),
                },
                {
                    onConflict: "user_id,novel_id",
                }
            )
            .select()
            .single();

        if (statusError) throw statusError;

        return NextResponse.json({
            progress: progressData,
            status: statusData,
        });
    } catch (error) {
        console.error("Error updating reading progress:", error);
        return NextResponse.json(
            { error: "Failed to update reading progress" },
            { status: 500 }
        );
    }
}

// Delete reading progress
export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const novelId = searchParams.get("novelId");
        const chapterId = searchParams.get("chapterId");

        if (!novelId || !chapterId) {
            return NextResponse.json(
                { error: "Novel ID and Chapter ID are required" },
                { status: 400 }
            );
        }

        const supabase = createServerSupabaseClient();

        const { error } = await supabase
            .from("reading_progress")
            .delete()
            .eq("user_id", session.user.id)
            .eq("novel_id", novelId)
            .eq("chapter_id", chapterId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting reading progress:", error);
        return NextResponse.json(
            { error: "Failed to delete reading progress" },
            { status: 500 }
        );
    }
} 