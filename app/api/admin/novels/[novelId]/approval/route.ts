import { createServerSupabaseClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { novelId: string } }
) {
  const supabase = createServerSupabaseClient();
  const { novelId } = params;
  
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
    const formData = await req.formData();
    const status = formData.get("status") as string;
    const reason = formData.get("reason") as string || null;
    
    // Validate the status
    if (!status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    
    // Update the novel status
    const { error } = await supabase
      .from("novels")
      .update({ 
        status,
        rejection_reason: status === "rejected" ? reason : null,
        // If approved, set is_public to the current value
        // If rejected, set is_public to false
        is_public: status === "approved" ? undefined : false,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id
      })
      .eq("id", novelId);
      
    if (error) {
      console.error("Error updating novel status:", error);
      return NextResponse.json({ error: "Failed to update novel status" }, { status: 500 });
    }
    
    // Send notification to the novel author
    const { data: novel } = await supabase
      .from("novels")
      .select("user_id, title")
      .eq("id", novelId)
      .single();
      
    if (novel) {
      await supabase
        .from("notifications")
        .insert({
          user_id: novel.user_id,
          type: status === "approved" ? "novel_approved" : "novel_rejected",
          content: status === "approved" 
            ? `Your novel "${novel.title}" has been approved by an admin.`
            : `Your novel "${novel.title}" has been rejected by an admin. Reason: ${reason || "No reason provided"}`,
          data: { 
            novel_id: novelId,
            novel_title: novel.title,
            status,
            reason: reason || null
          }
        });
    }
    
    return NextResponse.json({
      success: true,
      message: `Novel ${status === "approved" ? "approved" : "rejected"} successfully`
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 