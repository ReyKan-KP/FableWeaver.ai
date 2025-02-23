import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const maxDuration = 60;

// GET endpoint to fetch a specific chapter
export async function GET(
    req: Request,
    { params }: { params: { chapterId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const supabase = createServerSupabaseClient();

        // Get chapter and verify ownership through the novel
        const { data: chapter, error } = await supabase
            .from("chapters")
            .select(`
        *,
        novel:novels(
          id,
          user_id,
          title,
          genre
        )
      `)
            .eq("id", params.chapterId)
            .single();

        if (error || !chapter) {
            return NextResponse.json(
                { error: "Chapter not found" },
                { status: 404 }
            );
        }

        // Verify ownership
        if (chapter.novel.user_id !== session.user.id) {
            return NextResponse.json(
                { error: "Access denied" },
                { status: 403 }
            );
        }

        return NextResponse.json({ chapter });
    } catch (error) {
        console.error("Error fetching chapter:", error);
        return NextResponse.json(
            { error: "Failed to fetch chapter" },
            { status: 500 }
        );
    }
}

// PATCH endpoint to update a chapter
export async function PATCH(
    req: Request,
    { params }: { params: { chapterId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { title, content, summary } = await req.json();
        if (!content || !summary) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const supabase = createServerSupabaseClient();

        // First verify ownership through the novel
        const { data: chapter, error: fetchError } = await supabase
            .from("chapters")
            .select(`
        *,
        novel:novels(
          user_id
        )
      `)
            .eq("id", params.chapterId)
            .single();

        if (fetchError || !chapter) {
            return NextResponse.json(
                { error: "Chapter not found" },
                { status: 404 }
            );
        }

        if (chapter.novel.user_id !== session.user.id) {
            return NextResponse.json(
                { error: "Access denied" },
                { status: 403 }
            );
        }

        // Update the chapter
        const { data: updatedChapter, error: updateError } = await supabase
            .from("chapters")
            .update({
                title: title || chapter.title,
                content,
                summary,
            })
            .eq("id", params.chapterId)
            .select()
            .single();

        if (updateError) {
            return NextResponse.json(
                { error: "Failed to update chapter" },
                { status: 500 }
            );
        }

        return NextResponse.json({ chapter: updatedChapter });
    } catch (error) {
        console.error("Error updating chapter:", error);
        return NextResponse.json(
            { error: "Failed to update chapter" },
            { status: 500 }
        );
    }
}

// DELETE endpoint to remove a chapter
export async function DELETE(
    req: Request,
    { params }: { params: { chapterId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const supabase = createServerSupabaseClient();

        // First verify ownership through the novel
        const { data: chapter, error: fetchError } = await supabase
            .from("chapters")
            .select(`
        *,
        novel:novels(
          user_id
        )
      `)
            .eq("id", params.chapterId)
            .single();

        if (fetchError || !chapter) {
            return NextResponse.json(
                { error: "Chapter not found" },
                { status: 404 }
            );
        }

        if (chapter.novel.user_id !== session.user.id) {
            return NextResponse.json(
                { error: "Access denied" },
                { status: 403 }
            );
        }

        // Delete the chapter
        const { error: deleteError } = await supabase
            .from("chapters")
            .delete()
            .eq("id", params.chapterId);

        if (deleteError) {
            return NextResponse.json(
                { error: "Failed to delete chapter" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting chapter:", error);
        return NextResponse.json(
            { error: "Failed to delete chapter" },
            { status: 500 }
        );
    }
} 