import { createServerSupabaseClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(
  req: NextRequest,
  { params }: { params: { chapterId: string } }
) {
  const supabase = createServerSupabaseClient();
  const { chapterId } = params;
  
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
    // First get the current chapter status
    const { data: chapter } = await supabase
      .from("chapters")
      .select("is_published, novel_id")
      .eq("id", chapterId)
      .single();
      
    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }
    
    // Toggle the published status
    const newStatus = !chapter.is_published;
    
    const { error } = await supabase
      .from("chapters")
      .update({ 
        is_published: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq("id", chapterId);
      
    if (error) {
      console.error("Error updating chapter status:", error);
      return NextResponse.json({ error: "Failed to update chapter status" }, { status: 500 });
    }
    
    // Update novel's last_chapter_at if chapter is being published
    if (newStatus) {
      await supabase
        .from("novels")
        .update({ 
          last_chapter_at: new Date().toISOString() 
        })
        .eq("id", chapter.novel_id);
    }
    
    // Get novel and chapter info for notification
    const { data: novelData } = await supabase
      .from("novels")
      .select("user_id, title")
      .eq("id", chapter.novel_id)
      .single();
      
    const { data: chapterData } = await supabase
      .from("chapters")
      .select("title, chapter_number")
      .eq("id", chapterId)
      .single();
    
    // Send notification to the novel author
    if (novelData && chapterData) {
      await supabase
        .from("notifications")
        .insert({
          user_id: novelData.user_id,
          type: newStatus ? "chapter_published_admin" : "chapter_unpublished_admin",
          content: newStatus 
            ? `An admin has published your chapter "${chapterData.title}" in "${novelData.title}".`
            : `An admin has unpublished your chapter "${chapterData.title}" in "${novelData.title}".`,
          data: { 
            novel_id: chapter.novel_id,
            novel_title: novelData.title,
            chapter_id: chapterId,
            chapter_title: chapterData.title,
            chapter_number: chapterData.chapter_number
          }
        });
    }
    
    // Revalidate the page
    revalidatePath(`/admin/novels/${chapter.novel_id}`);
    revalidatePath(`/admin/novels/${chapter.novel_id}/chapters/${chapterId}`);
    
    // Redirect back to the chapter page
    return NextResponse.redirect(new URL(`/admin/novels/${chapter.novel_id}/chapters/${chapterId}`, req.url));
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 