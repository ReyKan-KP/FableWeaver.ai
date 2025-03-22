import { createServerSupabaseClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(
  request: NextRequest,
  { params }: { params: { novelId: string } }
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
    const feedback = formData.get("feedback") as string || ""; // Optional feedback
    
    // Update the novel status to approved
    const { data: novel, error: updateError } = await supabase
      .from("novels")
      .update({
        status: "approved",
        admin_feedback: feedback,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id
      })
      .eq("id", params.novelId)
      .select()
      .single();
      
    if (updateError) {
      return NextResponse.json(
        { error: `Failed to approve novel: ${updateError.message}` },
        { status: 500 }
      );
    }
    
    // TODO: Send notification to the novel author
    
    // Revalidate pages
    revalidatePath(`/admin/novels/${params.novelId}`);
    revalidatePath(`/admin/novels`);
    
    // Redirect back to the novel page
    return NextResponse.redirect(
      new URL(`/admin/novels/${params.novelId}?success=Novel approved successfully`, request.url)
    );
  } catch (error) {
    console.error("Error approving novel:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
} 