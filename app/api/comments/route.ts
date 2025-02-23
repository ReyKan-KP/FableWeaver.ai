import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface Comment {
    id: string;
    content: string;
    likes_count: number;
    created_at: string;
    updated_at: string;
    is_edited: boolean;
    is_deleted: boolean;
    is_pinned: boolean;
    is_approved: boolean;
    reported_count: number;
    report_reason?: string;
    user_id: string;
    novel_id?: string;
    chapter_id?: string;
    parent_comment_id: string | null;
    replies?: Comment[];
}

interface User {
    user_id: string;
    user_name: string;
    avatar_url: string;
}

export const maxDuration = 60;

// Get comments for a novel or chapter
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const novelId = searchParams.get("novelId");
        const chapterId = searchParams.get("chapterId");
        const parentCommentId = searchParams.get("parentCommentId");

        console.log("GET /api/comments - Request params:", {
            novelId,
            chapterId,
            parentCommentId
        });

        if (!novelId && !chapterId) {
            console.log("GET /api/comments - Missing novelId or chapterId");
            return NextResponse.json(
                { error: "Novel ID or Chapter ID is required" },
                { status: 400 }
            );
        }

        const supabase = createServerSupabaseClient();
        const table = novelId ? "novel_comments" : "chapter_comments";
        const idField = novelId ? "novel_id" : "chapter_id";
        const idValue = novelId || chapterId;

        // Fetch comments
        const { data: comments, error: commentsError } = await supabase
            .from(table)
            .select(`
                *,
                replies:${table}!parent_comment_id (
                    id,
                    content,
                    likes_count,
                    created_at,
                    updated_at,
                    is_edited,
                    is_deleted,
                    is_pinned,
                    is_approved,
                    reported_count,
                    report_reason,
                    user_id,
                    ${idField}
                )
            `)
            .eq(idField, idValue)
            .is("parent_comment_id", parentCommentId)
            .eq("is_deleted", false)
            .eq("is_approved", true)
            .order("is_pinned", { ascending: false })
            .order("created_at", { ascending: false });

        if (commentsError) throw commentsError;

        if (!comments || comments.length === 0) {
            console.log("GET /api/comments - No comments found");
            return NextResponse.json([]);
        }

        // Collect all user IDs
        const userIds = new Set<string>();
        comments.forEach((comment: Comment) => {
            userIds.add(comment.user_id);
            comment.replies?.forEach((reply: Comment) => {
                userIds.add(reply.user_id);
            });
        });

        // Fetch user data
        const { data: users, error: usersError } = await supabase
            .from("user")
            .select("user_id, user_name, avatar_url")
            .in("user_id", Array.from(userIds));

        if (usersError) throw usersError;

        // Create user map
        const userMap = new Map(users?.map(user => [user.user_id, user]));

        // Fetch likes for authenticated user
        const session = await getServerSession(authOptions);
        let userLikes = new Set<string>();

        if (session?.user?.id) {
            const { data: likes } = await supabase
                .from("comment_likes")
                .select("comment_id")
                .eq("user_id", session.user.id)
                .eq("comment_type", novelId ? "novel" : "chapter");

            if (likes) {
                userLikes = new Set(likes.map(like => like.comment_id));
            }
        }

        // Combine data
        const commentsWithUsers = comments.map((comment: Comment) => ({
            ...comment,
            user: userMap.get(comment.user_id),
            has_liked: userLikes.has(comment.id),
            replies: comment.replies
                ?.filter(reply => !reply.is_deleted && reply.is_approved)
                ?.map((reply: Comment) => ({
                    ...reply,
                    user: userMap.get(reply.user_id),
                    has_liked: userLikes.has(reply.id)
                }))
        }));

        console.log("GET /api/comments - Success:", {
            commentCount: commentsWithUsers.length,
            userCount: userMap.size,
            source: novelId ? "novel" : "chapter"
        });

        return NextResponse.json(commentsWithUsers);
    } catch (error) {
        console.error("Error in GET /api/comments:", error);
        return NextResponse.json(
            { error: "Failed to fetch comments" },
            { status: 500 }
        );
    }
}

// Create a new comment
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        console.log("POST /api/comments - Session:", {
            userId: session?.user?.id,
            isAuthenticated: !!session?.user
        });

        if (!session?.user?.id) {
            console.log("POST /api/comments - Not authenticated");
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const body = await request.json();
        const { novel_id, chapter_id, content, parent_comment_id } = body;

        console.log("POST /api/comments - Request body:", {
            novel_id,
            chapter_id,
            content,
            parent_comment_id
        });

        if ((!novel_id && !chapter_id) || !content) {
            console.log("POST /api/comments - Missing required fields");
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Verify that we're not mixing novel and chapter comments
        if (novel_id && chapter_id) {
            return NextResponse.json(
                { error: "Cannot post to both novel and chapter" },
                { status: 400 }
            );
        }

        const supabase = createServerSupabaseClient();
        const table = novel_id ? "novel_comments" : "chapter_comments";
        const idField = novel_id ? "novel_id" : "chapter_id";
        const idValue = novel_id || chapter_id;

        // Verify parent comment if replying
        if (parent_comment_id) {
            const { data: parentComment, error: parentError } = await supabase
                .from(table)
                .select("id")
                .eq("id", parent_comment_id)
                .eq(idField, idValue)
                .single();

            if (parentError || !parentComment) {
                return NextResponse.json(
                    { error: "Invalid parent comment" },
                    { status: 400 }
                );
            }
        }

        console.log("POST /api/comments - Inserting comment:", {
            table,
            idField,
            idValue
        });

        // Create comment
        const { data: comment, error: commentError } = await supabase
            .from(table)
            .insert({
                user_id: session.user.id,
                [idField]: idValue,
                content,
                parent_comment_id,
                is_deleted: false,
                is_pinned: false,
                is_approved: true,
                reported_count: 0,
                likes_count: 0
            })
            .select()
            .single();

        if (commentError) throw commentError;

        // Fetch user data
        const { data: user, error: userError } = await supabase
            .from("user")
            .select("user_id, user_name, avatar_url")
            .eq("user_id", session.user.id)
            .single();

        if (userError) throw userError;

        const commentWithUser = {
            ...comment,
            user,
            has_liked: false,
            replies: []
        };

        console.log("POST /api/comments - Success:", {
            commentWithUser,
            source: novel_id ? "novel" : "chapter"
        });

        return NextResponse.json(commentWithUser);
    } catch (error) {
        console.error("Error in POST /api/comments:", error);
        return NextResponse.json(
            { error: "Failed to create comment" },
            { status: 500 }
        );
    }
}

// Update a comment
export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        const comment_type = searchParams.get("comment_type");

        if (!id || !comment_type) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { content } = body;

        if (!content) {
            return NextResponse.json(
                { error: "Content is required" },
                { status: 400 }
            );
        }

        const supabase = createServerSupabaseClient();
        const table = comment_type === "novel" ? "novel_comments" : "chapter_comments";

        const { data, error } = await supabase
            .from(table)
            .update({
                content,
                is_edited: true,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .eq("user_id", session.user.id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error updating comment:", error);
        return NextResponse.json(
            { error: "Failed to update comment" },
            { status: 500 }
        );
    }
}

// Delete a comment
export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        const comment_type = searchParams.get("comment_type");

        if (!id || !comment_type) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const supabase = createServerSupabaseClient();
        const table = comment_type === "novel" ? "novel_comments" : "chapter_comments";

        const { error } = await supabase
            .from(table)
            .update({ is_deleted: true })
            .eq("id", id)
            .eq("user_id", session.user.id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting comment:", error);
        return NextResponse.json(
            { error: "Failed to delete comment" },
            { status: 500 }
        );
    }
} 