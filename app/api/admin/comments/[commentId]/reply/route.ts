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
    
    if (!content || !novelId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Get the parent comment to determine the novel_id
    const { data: parentComment, error: commentError } = await supabase
      .from("novel_comments")
      .select("novel_id")
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
      .from("novel_comments")
      .insert({
        user_id: user.id,
        novel_id: parentComment.novel_id,
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
    revalidatePath(`/admin/novels/${novelId}/comments`);
    
    // Redirect back to the comments page
    return NextResponse.redirect(
      new URL(`/admin/novels/${novelId}/comments?success=Reply posted successfully`, request.url)
    );
  } catch (error) {
    console.error("Error processing comment reply:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
} 