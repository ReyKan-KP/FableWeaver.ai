import { createServerSupabaseClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(
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
    
    // Get the request body
    const { status, is_public } = await request.json();
    
    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }
    
    // Validate status
    const validStatuses = ["pending", "approved", "rejected", "draft"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }
    
    // Update the novel
    const { error: updateError } = await supabase
      .from("novels")
      .update({
        status,
        is_public: status === "approved" ? is_public : false,
        reviewed_at: status === "pending" ? null : new Date().toISOString(),
        reviewed_by: status === "pending" ? null : user.id,
      })
      .eq("id", params.novelId);
      
    if (updateError) {
      console.error("Error updating novel:", updateError);
      return NextResponse.json(
        { error: "Failed to update novel" },
        { status: 500 }
      );
    }
    
    // Revalidate the novel pages
    revalidatePath(`/admin/novels/${params.novelId}`);
    revalidatePath("/admin/novels");
    
    return NextResponse.json({
      message: "Novel status updated successfully",
      status,
      is_public,
    });
  } catch (error) {
    console.error("Error in update-status route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 