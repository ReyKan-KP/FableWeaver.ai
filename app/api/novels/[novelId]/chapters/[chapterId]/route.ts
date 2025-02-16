import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(
    request: Request,
    { params }: { params: { novelId: string; chapterId: string } }
) {
    try {
        const { novelId, chapterId } = params;

        if (!novelId || !chapterId) {
            return NextResponse.json(
                { error: "Novel ID and Chapter ID are required" },
                { status: 400 }
            );
        }

        const supabase = createServerSupabaseClient();

        // First check if the novel is public
        const { data: novel, error: novelError } = await supabase
            .from("novels")
            .select("is_public")
            .eq("id", novelId)
            .single();

        if (novelError) throw novelError;

        if (!novel?.is_public) {
            return NextResponse.json(
                { error: "Novel is not public" },
                { status: 403 }
            );
        }

        // Then fetch the chapter
        const { data: chapter, error: chapterError } = await supabase
            .from("chapters")
            .select("*")
            .eq("novel_id", novelId)
            .eq("id", chapterId)
            .eq("is_published", true)
            .single();

        if (chapterError) throw chapterError;

        if (!chapter) {
            return NextResponse.json(
                { error: "Chapter not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(chapter);
    } catch (error) {
        console.error("Error fetching chapter:", error);
        return NextResponse.json(
            { error: "Failed to fetch chapter" },
            { status: 500 }
        );
    }
} 