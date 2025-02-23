import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function GET() {
    try {
        const supabase = createRouteHandlerClient({ cookies });

        // Get all chapters and group them by novel_id, counting only published ones
        const { data, error } = await supabase
            .from("chapters")
            .select("novel_id, is_published")
            .eq("is_published", true);

        if (error) {
            console.error("Error fetching published chapters:", error);
            return new NextResponse("Error fetching published chapters", { status: 500 });
        }

        // Count published chapters for each novel
        const publishedCounts: { [key: string]: number } = {};
        data.forEach((chapter) => {
            publishedCounts[chapter.novel_id] = (publishedCounts[chapter.novel_id] || 0) + 1;
        });

        return NextResponse.json(publishedCounts);
    } catch (error) {
        console.error("[PUBLISHED_CHAPTERS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
} 