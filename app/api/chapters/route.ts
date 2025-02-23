import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export const maxDuration = 60;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const novelId = searchParams.get("novelId");

        if (!novelId) {
            return NextResponse.json(
                { error: "Novel ID is required" },
                { status: 400 }
            );
        }

        const supabase = createServerSupabaseClient();

        const { data, error } = await supabase
            .from("chapters")
            .select("id, title, chapter_number")
            .eq("novel_id", novelId)
            .eq("is_published", true)
            .order("chapter_number", { ascending: true });

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching chapters:", error);
        return NextResponse.json(
            { error: "Failed to fetch chapters" },
            { status: 500 }
        );
    }
} 