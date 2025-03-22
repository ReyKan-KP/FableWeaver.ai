import { createServerSupabaseClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function GET(
  request: NextRequest,
  { params }: { params: { novelId: string; characterId: string } }
) {
  const supabase = createServerSupabaseClient();
  
  // First verify that the character belongs to the novel
  const { data: character, error: verifyError } = await supabase
    .from("novels_characters")
    .select("novel_id")
    .eq("id", params.characterId)
    .eq("novel_id", params.novelId)
    .single();
    
  if (verifyError || !character) {
    return NextResponse.redirect(
      new URL(`/admin/novels/${params.novelId}/characters?error=Character not found`, request.url)
    );
  }
  
  // First delete character progression entries
  const { error: progressionError } = await supabase
    .from("character_progression")
    .delete()
    .eq("character_id", params.characterId);
    
  if (progressionError) {
    console.error("Error deleting character progression:", progressionError);
    return NextResponse.redirect(
      new URL(
        `/admin/novels/${params.novelId}/characters?error=Failed to delete character progression`,
        request.url
      )
    );
  }
  
  // Then delete the character
  const { error: deleteError } = await supabase
    .from("novels_characters")
    .delete()
    .eq("id", params.characterId);
    
  if (deleteError) {
    return NextResponse.redirect(
      new URL(
        `/admin/novels/${params.novelId}/characters?error=Failed to delete character: ${deleteError.message}`,
        request.url
      )
    );
  }
  
  // Revalidate the pages
  revalidatePath(`/admin/novels/${params.novelId}/characters`);
  
  return NextResponse.redirect(
    new URL(
      `/admin/novels/${params.novelId}/characters?success=Character deleted successfully`,
      request.url
    )
  );
} 