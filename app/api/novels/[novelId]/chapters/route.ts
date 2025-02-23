import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export const maxDuration = 60;

export async function GET(
    request: Request,
    { params }: { params: { novelId: string } }
) {
    try {
        const { novelId } = params;

        if (!novelId) {
            return NextResponse.json(
                { error: "Novel ID is required" },
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

        // Then fetch all published chapters
        const { data: chapters, error: chaptersError } = await supabase
            .from("chapters")
            .select("id, title, chapter_number")
            .eq("novel_id", novelId)
            .eq("is_published", true)
            .order("chapter_number", { ascending: true });

        if (chaptersError) throw chaptersError;

        return NextResponse.json(chapters);
    } catch (error) {
        console.error("Error fetching chapters:", error);
        return NextResponse.json(
            { error: "Failed to fetch chapters" },
            { status: 500 }
        );
    }
} 