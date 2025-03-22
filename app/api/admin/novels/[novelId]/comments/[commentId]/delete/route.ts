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
      .select("*")
      .eq("id", commentId)
      .eq("novel_id", novelId)
      .single();
      
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }
    
    // Delete the comment
    const { error } = await supabase
      .from("novel_comments")
      .delete()
      .eq("id", commentId);
      
    if (error) {
      console.error("Error deleting comment:", error);
      return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
    }
    
    // Notify the comment author if it's not an anonymous comment
    if (comment.user_id) {
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
            type: "comment_deleted_admin",
            content: `An admin has removed your comment on the novel "${novel.title}".`,
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