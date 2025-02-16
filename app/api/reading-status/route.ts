import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Get reading status for a user
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const novelId = searchParams.get("novelId");

        const supabase = createServerSupabaseClient();

        // Get the reading status
        let statusQuery = supabase
            .from("reading_status")
            .select(`
                *,
                last_chapter:chapters(
                    id,
                    title,
                    chapter_number
                )
            `)
            .eq("user_id", session.user.id)
            .order("last_read_at", { ascending: false });

        if (novelId) {
            statusQuery = statusQuery.eq("novel_id", novelId);
        }

        const { data: statusData, error: statusError } = await statusQuery;

        if (statusError) throw statusError;

        if (!statusData || statusData.length === 0) {
            return NextResponse.json([]);
        }

        return NextResponse.json(statusData);
    } catch (error) {
        console.error("Error fetching reading status:", error);
        return NextResponse.json(
            { error: "Failed to fetch reading status" },
            { status: 500 }
        );
    }
}

// Update or create reading status
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const body = await request.json();
        const { novel_id, status, last_read_chapter_id } = body;

        if (!novel_id || !status) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const supabase = createServerSupabaseClient();

        const { data, error } = await supabase
            .from("reading_status")
            .upsert(
                {
                    user_id: session.user.id,
                    novel_id,
                    status,
                    last_read_chapter_id,
                    last_read_at: new Date().toISOString(),
                },
                {
                    onConflict: "user_id,novel_id",
                }
            )
            .select(`
                *,
                last_chapter:chapters(
                    id,
                    title,
                    chapter_number
                )
            `)
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error updating reading status:", error);
        return NextResponse.json(
            { error: "Failed to update reading status" },
            { status: 500 }
        );
    }
}

// Delete reading status
export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const novelId = searchParams.get("novelId");

        if (!novelId) {
            return NextResponse.json(
                { error: "Novel ID is required" },
                { status: 400 }
            );
        }

        const supabase = createServerSupabaseClient();

        const { error } = await supabase
            .from("reading_status")
            .delete()
            .eq("user_id", session.user.id)
            .eq("novel_id", novelId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting reading status:", error);
        return NextResponse.json(
            { error: "Failed to delete reading status" },
            { status: 500 }
        );
    }
} 