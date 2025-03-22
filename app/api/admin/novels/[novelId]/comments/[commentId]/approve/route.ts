import { createServerSupabaseClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(
  req: NextRequest,
  { params }: { params: { novelId: string; commentId: string } }
) {
  const supabase = createServerSupabaseClient();
  const { novelId, commentId } = params;
  
  // Get the current user session
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Check if the user is an admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
    
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  
  try {
    // First verify the comment belongs to the novel
    const { data: comment } = await supabase
      .from("novel_comments")
      .select("user_id, is_flagged")
      .eq("id", commentId)
      .eq("novel_id", novelId)
      .single();
      
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }
    
    // Approve the comment (remove flag)
    const { error } = await supabase
      .from("novel_comments")
      .update({ 
        is_flagged: false,
        flag_reason: null,
        flagged_at: null,
        flagged_by: null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id
      })
      .eq("id", commentId);
      
    if (error) {
      console.error("Error approving comment:", error);
      return NextResponse.json({ error: "Failed to approve comment" }, { status: 500 });
    }
    
    // Only send a notification if the comment was previously flagged
    if (comment.is_flagged && comment.user_id) {
      // Get novel info
      const { data: novel } = await supabase
        .from("novels")
        .select("title")
        .eq("id", novelId)
        .single();
      
      if (novel) {
        await supabase
          .from("notifications")
          .insert({
            user_id: comment.user_id,
            type: "comment_approved",
            content: `Your comment on the novel "${novel.title}" has been reviewed and approved.`,
            data: { 
              novel_id: novelId,
              novel_title: novel.title
            }
          });
      }
    }
    
    // Revalidate the comments page
    revalidatePath(`/admin/novels/${novelId}/comments`);
    
    // Redirect back to the comments page
    return NextResponse.redirect(new URL(`/admin/novels/${novelId}/comments`, req.url));
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 