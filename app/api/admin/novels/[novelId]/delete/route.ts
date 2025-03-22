import { createServerSupabaseClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { novelId: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get the current user and verify they are an admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Verify user is an admin
    const { data: adminData, error: adminError } = await supabase
      .from("user")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();
      
    if (adminError || !adminData?.is_admin) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }
    
    // Start a transaction to delete all related data
    const { error: deleteError } = await supabase.rpc("delete_novel", {
      novel_id: params.novelId
    });
    
    if (deleteError) {
      console.error("Error deleting novel:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete novel" },
        { status: 500 }
      );
    }
    
    // Revalidate the novels page
    revalidatePath("/admin/novels");
    
    return NextResponse.json({
      message: "Novel deleted successfully"
    });
  } catch (error) {
    console.error("Error in delete route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 