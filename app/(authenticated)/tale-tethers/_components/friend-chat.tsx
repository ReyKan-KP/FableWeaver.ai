"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  is_delivered: boolean;
}

interface FriendChatProps {
  friend: {
    user_id: string;
    user_name: string;
    avatar_url: string;
    is_active: boolean;
  };
  onBack: () => void;
}

export const FriendChat = ({ friend, onBack }: FriendChatProps) => {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    if (!session?.user?.id || !friend.user_id) return;

    setIsLoading(true);

    // Fetch existing messages
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("friend_messages")
        .select("*")
        .or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${friend.user_id}),and(sender_id.eq.${friend.user_id},receiver_id.eq.${session.user.id})`)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
      } else {
        setMessages(data || []);
      }
      setIsLoading(false);
    };

    fetchMessages();

    // Mark messages as read
    const markMessagesAsRead = async () => {
      const { error } = await supabase
        .from("friend_messages")
        .update({ is_read: true })
        .eq("sender_id", friend.user_id)
        .eq("receiver_id", session.user.id)
        .eq("is_read", false);

      if (error) {
        console.error("Error marking messages as read:", error);
      }
    };

    markMessagesAsRead();

    // Subscribe to new messages
    const channel = supabase
      .channel(`friend_messages:${session.user.id}:${friend.user_id}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events
          schema: "public",
          table: "friend_messages",
          filter: `sender_id=eq.${session.user.id},receiver_id=eq.${friend.user_id}`,
        },
        (payload) => {
          console.log("Received message:", payload);
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            // Check if message already exists to prevent duplicates
            if (prev.some((msg) => msg.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });

          // If the message is from the friend, mark it as read
          if (newMessage.sender_id === friend.user_id) {
            supabase
              .from("friend_messages")
              .update({ is_read: true })
              .eq("id", newMessage.id)
              .then(({ error }) => {
                if (error) {
                  console.error("Error marking message as read:", error);
                }
              });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friend_messages",
          filter: `sender_id=eq.${friend.user_id},receiver_id=eq.${session.user.id}`,
        },
        (payload) => {
          console.log("Received message:", payload);
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            // Check if message already exists to prevent duplicates
            if (prev.some((msg) => msg.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });

          // Mark received message as read
          supabase
            .from("friend_messages")
            .update({ is_read: true })
            .eq("id", newMessage.id)
            .then(({ error }) => {
              if (error) {
                console.error("Error marking message as read:", error);
              }
            });
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
        if (status === "SUBSCRIBED") {
          console.log("Successfully subscribed to messages");
        } else if (status === "CLOSED") {
          console.log("Subscription closed");
        } else if (status === "CHANNEL_ERROR") {
          console.error("Subscription error");
        }
      });

    return () => {
      console.log("Unsubscribing from channel");
      channel.unsubscribe();
    };
  }, [session?.user?.id, friend.user_id, supabase]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !session?.user?.id || isSending) return;

    setIsSending(true);
    const messageContent = input.trim();
    setInput(""); // Clear input immediately for better UX

    try {
      const { data, error } = await supabase.from("friend_messages").insert({
        sender_id: session.user.id,
        receiver_id: friend.user_id,
        content: messageContent,
        is_read: false,
      }).select().single();

      if (error) throw error;

      // Optimistically add the message to the UI
      if (data) {
        setMessages((prev) => [...prev, data]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Optionally show an error message to the user
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const messageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, x: -20 },
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getMessageStatus = (message: Message) => {
    if (message.sender_id === session?.user?.id) {
      if (message.is_read) {
        return "✓✓"; // Blue double tick
      } else if (message.is_delivered) {
        return "✓✓"; // Double tick
      } else {
        return "✓"; // Single tick
      }
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center p-2 md:p-4 border-b">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onBack}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Back to friends list</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="flex items-center space-x-2 md:space-x-3">
          <div className="relative">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Image
                    src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.user_name}`}
                    alt={friend.user_name}
                    width={40}
                    height={40}
                    className="rounded-full object-cover md:w-[55px] md:h-[55px]"
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{friend.is_active ? "Online" : "Offline"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {friend.is_active && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute bottom-0 right-0 h-2 w-2 md:h-3 md:w-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-800" 
              />
            )}
          </div>
          <div>
            <h3 className="font-medium text-sm md:text-base">{friend.user_name}</h3>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[10px] md:text-xs text-gray-500"
            >
              {friend.is_active ? "Online" : "Offline"}
            </motion.p>
          </div>
        </div>
      </div>

      <Card className="flex-1 border-0 shadow-none bg-[#bccff1] dark:bg-zinc-900">
        <ScrollArea
          className="h-full px-2 md:px-4 py-3 md:py-6 dark:bg-dot-white/[0.2] bg-dot-black/[0.2]"
          ref={scrollAreaRef}
        >
          <CardContent className="space-y-3 md:space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-gray-400" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex justify-center items-center h-full text-gray-500 text-sm md:text-base">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    variants={messageVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{
                      duration: 0.3,
                      type: "spring",
                      stiffness: 100,
                      damping: 15,
                    }}
                    className={`flex ${
                      message.sender_id === session?.user?.id
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    {message.sender_id !== session?.user?.id && (
                      <motion.div
                        className="w-[40px] h-[40px] md:w-[55px] md:h-[55px] rounded-full overflow-hidden mr-2 flex-shrink-0"
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <Image
                          src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.user_name}`}
                          alt={friend.user_name}
                          className="w-full h-full object-cover"
                          width={55}
                          height={55}
                        />
                      </motion.div>
                    )}
                    <motion.div
                      className={cn(
                        "flex flex-row rounded-full border p-1.5 md:p-2 items-center space-x-1 md:space-x-2 max-w-[85%] md:max-w-[75%]",
                        message.sender_id === session?.user?.id
                          ? "ml-auto bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 text-white"
                          : "bg-white dark:bg-gray-800"
                      )}
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <div className="px-3 md:px-5 py-1.5 md:py-2 flex items-center">
                        <p className="whitespace-pre-wrap leading-relaxed text-xs md:text-sm">
                          {message.content}
                        </p>
                        <div className="flex items-center ml-1.5 md:ml-2">
                          <span className="text-[8px] md:text-[10px] text-gray-300 dark:text-gray-400">
                            {formatTime(message.created_at)}
                          </span>
                          {message.sender_id === session?.user?.id && (
                            <span className={cn(
                              "ml-0.5 md:ml-1 text-[8px] md:text-[10px]",
                              message.is_read ? "text-blue-400" : "text-gray-400"
                            )}>
                              {getMessageStatus(message)}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                    {message.sender_id === session?.user?.id && (
                      <motion.div
                        className="w-[40px] h-[40px] md:w-[55px] md:h-[55px] rounded-full overflow-hidden ml-2 flex-shrink-0"
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <Image
                          src={session?.user?.image || "/images/default-avatar.png"}
                          alt="You"
                          className="w-full h-full object-cover bg-gradient-to-r from-blue-500 to-teal-500"
                          width={55}
                          height={55}
                        />
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            {isSending && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-end"
              >
                <motion.div
                  className="flex flex-row rounded-full border p-1.5 md:p-2 items-center space-x-1 md:space-x-2"
                  animate={{
                    scale: [1, 1.02, 1],
                    transition: {
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                  }}
                >
                  <div className="bg-white dark:bg-gray-800 rounded-full px-3 md:px-5 py-1.5 md:py-2 flex items-center gap-1.5 md:gap-2">
                    <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin text-gray-500 dark:text-gray-400" />
                    <span className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">
                      Sending...
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </CardContent>
        </ScrollArea>
        <CardFooter className="p-2 md:p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <form onSubmit={handleSendMessage} className="flex w-full gap-1.5 md:gap-2">
            <motion.div className="flex-1" whileHover={{ scale: 1.01 }}>
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={isSending}
                className="flex-1 bg-white dark:bg-gray-700 border-none rounded-full px-4 md:px-6 text-xs md:text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:text-gray-200 dark:placeholder-gray-400"
              />
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                type="submit"
                disabled={isSending}
                className="rounded-full px-4 md:px-6 bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 hover:from-violet-700 hover:via-blue-700 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isSending ? (
                  <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                ) : (
                  <Send className="w-3 h-3 md:w-4 md:h-4" />
                )}
              </Button>
            </motion.div>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}; 