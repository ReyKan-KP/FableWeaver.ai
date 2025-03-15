"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase";
import { NotificationPanel } from "../../../../components/layout/notification-panel";

export async function NotificationCount({ userId }: { userId: string }) {
  const supabase = createBrowserSupabaseClient();
  
  // Get the count of unread notifications for the initial server render
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  
  return (
    <NotificationPanel userId={userId} />
  );
}