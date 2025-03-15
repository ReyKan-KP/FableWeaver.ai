import { createServerSupabaseClient } from "@/lib/supabase";

export type NotificationType = 
  | "friend_request" 
  | "message" 
  | "comment" 
  | "like" 
  | "system"
  | "story_update"
  | "thread_mention";

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
}

export async function createNotification({
  userId,
  type,
  title,
  message,
  data = null
}: CreateNotificationParams) {
  const supabase = createServerSupabaseClient();
  
  const { data: notification, error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      type,
      title,
      message,
      data,
      is_read: false
    })
    .select()
    .single();
    
  if (error) {
    console.error("Error creating notification:", error);
    return null;
  }
  
  return notification;
}

export async function markNotificationAsRead(notificationId: string) {
  const supabase = createServerSupabaseClient();
  
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);
    
  if (error) {
    console.error("Error marking notification as read:", error);
    return false;
  }
  
  return true;
}

export async function markAllNotificationsAsRead(userId: string) {
  const supabase = createServerSupabaseClient();
  
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);
    
  if (error) {
    console.error("Error marking all notifications as read:", error);
    return false;
  }
  
  return true;
}

export async function getUnreadNotificationCount(userId: string) {
  const supabase = createServerSupabaseClient();
  
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);
    
  if (error) {
    console.error("Error getting unread notification count:", error);
    return 0;
  }
  
  return count || 0;
}

export async function getRecentNotifications(userId: string, limit = 20) {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
    
  if (error) {
    console.error("Error getting recent notifications:", error);
    return [];
  }
  
  return data || [];
} 