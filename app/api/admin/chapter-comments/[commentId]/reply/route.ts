import { createServerSupabaseClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get admin user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Verify user is admin
    const { data: adminData, error: adminError } = await supabase
      .from("user")
      .select("role")
      .eq("id", user.id)
      .single();
      
    if (adminError || !adminData || adminData.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }
    
    // Get form data
    const formData = await request.formData();
    const content = formData.get("content") as string;
    const novelId = formData.get("novelId") as string;
    const chapterId = formData.get("chapterId") as string;
    
    if (!content || !novelId || !chapterId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Get the parent comment to determine the chapter_id
    const { data: parentComment, error: commentError } = await supabase
      .from("chapter_comments")
      .select("chapter_id")
      .eq("id", params.commentId)
      .single();
      
    if (commentError || !parentComment) {
      return NextResponse.json(
        { error: "Parent comment not found" },
        { status: 404 }
      );
    }
    
    // Create the reply
    const { data: reply, error: replyError } = await supabase
      .from("chapter_comments")
      .insert({
        user_id: user.id,
        chapter_id: parentComment.chapter_id,
        content,
        parent_comment_id: params.commentId,
        is_approved: true  // Admin replies are auto-approved
      })
      .select()
      .single();
      
    if (replyError) {
      return NextResponse.json(
        { error: `Failed to create reply: ${replyError.message}` },
        { status: 500 }
      );
    }
    
    // Revalidate the comments page
    revalidatePath(`/admin/novels/${novelId}/chapters/${chapterId}/comments`);
    
    // Redirect back to the comments page
    return NextResponse.redirect(
      new URL(
        `/admin/novels/${novelId}/chapters/${chapterId}/comments?success=Reply posted successfully`,
        request.url
      )
    );
  } catch (error) {
    console.error("Error processing chapter comment reply:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
} 