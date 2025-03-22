import { createServerSupabaseClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(
  req: NextRequest,
  { params }: { params: { chapterId: string; revisionId: string } }
) {
  const supabase = createServerSupabaseClient();
  const { chapterId, revisionId } = params;
  
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
    // First get the revision data
    const { data: revision, error: revisionError } = await supabase
      .from("chapter_revisions")
      .select("*")
      .eq("id", revisionId)
      .eq("chapter_id", chapterId)
      .single();
      
    if (revisionError || !revision) {
      return NextResponse.json({ error: "Revision not found" }, { status: 404 });
    }
    
    // Get the current chapter data
    const { data: chapter, error: chapterError } = await supabase
      .from("chapters")
      .select("content, title, novel_id, user_id")
      .eq("id", chapterId)
      .single();
      
    if (chapterError || !chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }
    
    // First, create a new revision with the current content
    const { error: createRevisionError } = await supabase
      .from("chapter_revisions")
      .insert({
        chapter_id: chapterId,
        content: chapter.content,
        title: chapter.title,
        word_count: revision.word_count, // Use the same word count calculation method
        created_by: user.id, // Admin is creating this revision
        revision_note: "Automatic backup before revision restore"
      });
      
    if (createRevisionError) {
      console.error("Error creating backup revision:", createRevisionError);
      return NextResponse.json({ error: "Failed to create backup revision" }, { status: 500 });
    }
    
    // Update the chapter with the revision content
    const { error: updateError } = await supabase
      .from("chapters")
      .update({ 
        content: revision.content,
        title: revision.title,
        word_count: revision.word_count,
        updated_at: new Date().toISOString(),
        updated_by: user.id
      })
      .eq("id", chapterId);
      
    if (updateError) {
      console.error("Error updating chapter with revision:", updateError);
      return NextResponse.json({ error: "Failed to restore revision" }, { status: 500 });
    }
    
    // Notify the chapter author
    if (chapter.user_id) {
      // Get novel info
      const { data: novel } = await supabase
        .from("novels")
        .select("title")
        .eq("id", chapter.novel_id)
        .single();
      
      if (novel) {
        await supabase
          .from("notifications")
          .insert({
            user_id: chapter.user_id,
            type: "chapter_revision_restored",
            content: `An admin has restored a previous version of your chapter "${chapter.title}" in "${novel.title}".`,
            data: { 
              novel_id: chapter.novel_id,
              novel_title: novel.title,
              chapter_id: chapterId,
              chapter_title: chapter.title
            }
          });
      }
    }
    
    // Revalidate the chapter page
    revalidatePath(`/admin/novels/${chapter.novel_id}/chapters/${chapterId}`);
    
    // Redirect back to the chapter page
    return NextResponse.redirect(new URL(`/admin/novels/${chapter.novel_id}/chapters/${chapterId}`, req.url));
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 