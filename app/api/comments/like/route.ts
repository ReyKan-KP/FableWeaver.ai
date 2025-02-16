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

        const { searchParams } = new URL(request.url);
        const comment_id = searchParams.get("comment_id");
        const comment_type = searchParams.get("comment_type");
        const action = searchParams.get("action");

        if (!comment_id || !comment_type || !action) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        if (action !== 'like' && action !== 'dislike') {
            return NextResponse.json(
                { error: "Invalid action" },
                { status: 400 }
            );
        }

        const supabase = createServerSupabaseClient();

        // Check if any reaction exists
        const { data: existingReaction } = await supabase
            .from("comment_reactions")
            .select()
            .eq("comment_id", comment_id)
            .eq("user_id", session.user.id)
            .single();

        const table = comment_type === "novel" ? "novel_comments" : "chapter_comments";

        // If there's an existing reaction and it's different from the new action
        if (existingReaction && existingReaction.reaction_type !== action) {
            // Remove the old reaction
            const { error: deleteError } = await supabase
                .from("comment_reactions")
                .delete()
                .eq("comment_id", comment_id)
                .eq("user_id", session.user.id);

            if (deleteError) throw deleteError;

            // Decrement the old reaction count
            const { error: decrementError } = await supabase.rpc(
                existingReaction.reaction_type === 'like'
                    ? "decrement_comment_likes"
                    : "decrement_comment_dislikes",
                {
                    p_comment_id: comment_id,
                    p_table_name: table
                }
            );

            if (decrementError) throw decrementError;

            // Create the new reaction
            const { error: reactionError } = await supabase
                .from("comment_reactions")
                .insert({
                    comment_id,
                    user_id: session.user.id,
                    comment_type,
                    reaction_type: action
                });

            if (reactionError) throw reactionError;

            // Increment the new reaction count
            const { error: incrementError } = await supabase.rpc(
                action === 'like'
                    ? "increment_comment_likes"
                    : "increment_comment_dislikes",
                {
                    p_comment_id: comment_id,
                    p_table_name: table
                }
            );

            if (incrementError) throw incrementError;
        }
        // If there's no existing reaction
        else if (!existingReaction) {
            // Create the new reaction
            const { error: reactionError } = await supabase
                .from("comment_reactions")
                .insert({
                    comment_id,
                    user_id: session.user.id,
                    comment_type,
                    reaction_type: action
                });

            if (reactionError) throw reactionError;

            // Increment the reaction count
            const { error: updateError } = await supabase.rpc(
                action === 'like'
                    ? "increment_comment_likes"
                    : "increment_comment_dislikes",
                {
                    p_comment_id: comment_id,
                    p_table_name: table
                }
            );

            if (updateError) throw updateError;
        }
        // If the same reaction already exists, return error
        else {
            return NextResponse.json(
                { error: `Already ${action}d this comment` },
                { status: 400 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error adding reaction:", error);
        return NextResponse.json(
            { error: "Failed to add reaction" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const comment_id = searchParams.get("comment_id");
        const comment_type = searchParams.get("comment_type");
        const action = searchParams.get("action");

        if (!comment_id || !comment_type || !action) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        if (action !== 'like' && action !== 'dislike') {
            return NextResponse.json(
                { error: "Invalid action" },
                { status: 400 }
            );
        }

        const supabase = createServerSupabaseClient();

        // Delete the reaction
        const { error: deleteError } = await supabase
            .from("comment_reactions")
            .delete()
            .eq("comment_id", comment_id)
            .eq("user_id", session.user.id)
            .eq("reaction_type", action);

        if (deleteError) throw deleteError;

        // Update the counts
        const table = comment_type === "novel" ? "novel_comments" : "chapter_comments";
        const { error: updateError } = await supabase.rpc(
            action === 'like' ? "decrement_comment_likes" : "decrement_comment_dislikes",
            {
                p_comment_id: comment_id,
                p_table_name: table
            }
        );

        if (updateError) throw updateError;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error removing reaction:", error);
        return NextResponse.json(
            { error: "Failed to remove reaction" },
            { status: 500 }
        );
    }
} 