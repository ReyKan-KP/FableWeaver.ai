"use client";

import { useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { Bell, BellRing, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  created_at: string;
};

// Map notification types to priority levels
const typeToPriority: Record<string, "high" | "medium" | "low"> = {
  "friend_request": "high",
  "message": "high",
  "comment": "medium",
  "like": "low",
  "system": "medium",
};

// Priority-based styling
const priorityColors: Record<string, string> = {
  high: "border-l-4 border-destructive",
  medium: "border-l-4 border-primary",
  low: "border-l-4 border-secondary",
};

// Animation variants
const notificationVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export function NotificationPanel({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("unread");

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    // Fetch initial notifications
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (data && !error) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    };

    fetchNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel('notification_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          setNotifications(prev => 
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          );
          
          // Recalculate unread count
          setUnreadCount(prev => 
            notifications.filter(n => !n.is_read).length
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const markAsRead = async (notificationId: string) => {
    const supabase = createBrowserSupabaseClient();
    
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);
      
    if (!error) {
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => prev - 1);
    }
  };

  const dismissNotification = async (notificationId: string) => {
    // Update both is_read and updated_at in the database
    const supabase = createBrowserSupabaseClient();
    
    // The updated_at will be automatically updated by the database trigger
    // when we update the record
    const { error } = await supabase
      .from("notifications")
      .update({ 
        is_read: true,
        // No need to explicitly set updated_at as it's handled by the database default
      })
      .eq("id", notificationId);
      
    if (!error) {
      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Decrement unread count if the notification was unread
      const wasUnread = notifications.find(n => n.id === notificationId && !n.is_read);
      if (wasUnread) {
        setUnreadCount(prev => prev - 1);
      }
    }
  };

  const markAllAsRead = async () => {
    const supabase = createBrowserSupabaseClient();
    
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
      
    if (!error) {
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "friend_request":
        return "👤";
      case "message":
        return "💬";
      case "comment":
        return "💭";
      case "like":
        return "❤️";
      case "system":
        return "🔔";
      default:
        return "📣";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 48) {
      return "1 day ago";
    } else if (diffInHours < 72) {
      return "2 days ago";
    } else if (diffInHours < 96) {
      return "3 days ago";
    } else {
      return `${Math.floor(diffInHours / 24)} days ago`;
    }
  };

  const getPriority = (type: string): "high" | "medium" | "low" => {
    return typeToPriority[type] || "medium";
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          onClick={() => setIsOpen(!isOpen)}
        >
          {unreadCount > 0 ? (
            <>
              <BellRing className="h-5 w-5" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            </>
          ) : (
            <Bell className="h-5 w-5" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-primary">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs"
            >
              Mark all as read
            </Button>
          )}
        </div>
        
        <Tabs defaultValue="unread" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="unread" className="relative">
                Unread
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1 text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="read">Read</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="unread" className="p-0 m-0">
            <ScrollArea className="h-[350px]">
              <motion.div
                className="p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <AnimatePresence mode="sync">
                  {notifications.filter(n => !n.is_read).length > 0 ? (
                    notifications
                      .filter(n => !n.is_read)
                      .map((notification) => {
                        const priority = getPriority(notification.type);
                        return (
                          <motion.div
                            key={notification.id}
                            variants={notificationVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            transition={{ duration: 0.2 }}
                            className="mb-3"
                          >
                            <motion.div
                              className={`flex items-start space-x-4 p-4 bg-card rounded-lg shadow-sm 
                                border border-border hover:shadow-md transition-all
                                ${priorityColors[priority]} bg-secondary/10`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="text-xl">
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1">
                                <h4 className="text-sm font-semibold text-primary">
                                  {notification.title}
                                </h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {notification.message}
                                </p>
                                <span className="text-xs text-muted-foreground/60 mt-2 block">
                                  {formatDate(notification.created_at)}
                                </span>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                  className="text-primary hover:text-primary-foreground hover:bg-primary h-8 w-8"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    dismissNotification(notification.id);
                                  }}
                                  className="text-muted-foreground hover:text-muted-foreground/80 hover:bg-muted h-8 w-8"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </motion.div>
                          </motion.div>
                        );
                      })
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8 text-muted-foreground"
                    >
                      <Bell className="h-8 w-8 mx-auto mb-3 text-muted-foreground/60" />
                      <p>No unread notifications</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="read" className="p-0 m-0">
            <ScrollArea className="h-[350px]">
              <motion.div
                className="p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <AnimatePresence mode="sync">
                  {notifications.filter(n => n.is_read).length > 0 ? (
                    notifications
                      .filter(n => n.is_read)
                      .map((notification) => {
                        const priority = getPriority(notification.type);
                        return (
                          <motion.div
                            key={notification.id}
                            variants={notificationVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            transition={{ duration: 0.2 }}
                            className="mb-3"
                          >
                            <motion.div
                              className={`flex items-start space-x-4 p-4 bg-card rounded-lg shadow-sm 
                                border border-border hover:shadow-md transition-all
                                ${priorityColors[priority]}`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="text-xl">
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1">
                                <h4 className="text-sm font-semibold text-primary">
                                  {notification.title}
                                </h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {notification.message}
                                </p>
                                <span className="text-xs text-muted-foreground/60 mt-2 block">
                                  {formatDate(notification.created_at)}
                                </span>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    dismissNotification(notification.id);
                                  }}
                                  className="text-muted-foreground hover:text-muted-foreground/80 hover:bg-muted h-8 w-8"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </motion.div>
                          </motion.div>
                        );
                      })
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8 text-muted-foreground"
                    >
                      <Bell className="h-8 w-8 mx-auto mb-3 text-muted-foreground/60" />
                      <p>No read notifications</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}