import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const body = await request.json();
        const { comment_id, comment_type, reason } = body;

        if (!comment_id || !comment_type || !reason) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const supabase = createServerSupabaseClient();

        // First, check if the user has already reported this comment
        const { data: existingReport } = await supabase
            .from("comment_reports")
            .select()
            .eq("comment_id", comment_id)
            .eq("user_id", session.user.id)
            .single();

        if (existingReport) {
            return NextResponse.json(
                { error: "You have already reported this comment" },
                { status: 400 }
            );
        }

        // Create the report
        const { error: reportError } = await supabase
            .from("comment_reports")
            .insert({
                comment_id,
                user_id: session.user.id,
                comment_type,
                reason
            });

        if (reportError) throw reportError;

        // Increment the report count and update the reason
        const table = comment_type === "novel" ? "novel_comments" : "chapter_comments";
        const { error: updateError } = await supabase
            .from(table)
            .update({
                reported_count: supabase.rpc("increment"),
                report_reason: reason
            })
            .eq("id", comment_id);

        if (updateError) throw updateError;

        // If the comment has been reported multiple times, mark it for review
        const { data: comment } = await supabase
            .from(table)
            .select("reported_count")
            .eq("id", comment_id)
            .single();

        if (comment && comment.reported_count >= 5) {
            await supabase
                .from(table)
                .update({ is_approved: false })
                .eq("id", comment_id);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error reporting comment:", error);
        return NextResponse.json(
            { error: "Failed to report comment" },
            { status: 500 }
        );
    }
} 