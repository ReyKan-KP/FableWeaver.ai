"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2 } from "lucide-react";
import type { GroupChat, GroupChatMessage } from "@/types/chat";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { createBrowserSupabaseClient } from "@/lib/supabase";

const supabase = createBrowserSupabaseClient();
async function getProfileImageUrl(senderId: string): Promise<string> {
  const { data, error } = await supabase
    .from("character_profiles")
    .select("image_url")
    .eq("id", senderId)
    .single();

  if (error) {
    console.error("Error fetching profile image:", error);
    return "";
  }

  return data?.image_url || "";
}

export default function GroupChatSession() {
  const { sessionId } = useParams();
  const { data: session } = useSession();
  const [messages, setMessages] = useState<GroupChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [characterImages, setCharacterImages] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/group-chat/${sessionId}`);
        const data = await res.json();
        setMessages(data.messages || []);
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast({
          title: "Error",
          description: "Failed to load messages",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id && sessionId) {
      fetchMessages();
    }
  }, [session?.user?.id, sessionId]);

  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollAreaRef.current) {
        setTimeout(() => {
          scrollAreaRef.current?.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: "smooth",
          });
        }, 100);
      }
    };

    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const loadCharacterImages = async () => {
      const characterMessages = messages.filter(
        (m) => m.sender_type === "character"
      );
      const uniqueCharacterIds = Array.from(
        new Set(characterMessages.map((m) => m.sender_id))
      );

      for (const id of uniqueCharacterIds) {
        const imageUrl = await getProfileImageUrl(id);
        setCharacterImages((prev) => ({ ...prev, [id]: imageUrl }));
      }
    };

    loadCharacterImages();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/group-chat/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      if (!res.ok) throw new Error("Failed to send message");

      const data = await res.json();
      setMessages(data.messages || []);
      setInput("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const messageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, x: -20 },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-7xl mx-auto h-[80vh] bg-[#bccff1] dark:bg-zinc-900 border-none shadow-lg">
        <ScrollArea
          className="h-[73vh] px-4 py-6 dark:bg-dot-white/[0.2] bg-dot-black/[0.2]"
          ref={scrollAreaRef}
        >
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
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
                      className="w-[55px] h-[55px] rounded-full overflow-hidden mr-2 flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                      }}
                    >
                      <Image
                        src={
                          message.sender_type === "character"
                            ? characterImages[message.sender_id] ||
                              "/images/default-character.png"
                            : "/images/default-avatar.png"
                        }
                        alt={message.sender_name}
                        width={55}
                        height={55}
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                  )}
                  <motion.div
                    className={cn(
                      "flex flex-row rounded-full border p-2 items-center space-x-2",
                      message.sender_id === session?.user?.id
                        ? "ml-auto px[-5]"
                        : ""
                    )}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <div className="bg-background rounded-full px-10 py-2 flex items-center overflow-x-auto">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 mb-1 ">
                          {message.sender_name}
                        </span>
                        <p className="whitespace-pre-wrap leading-relaxed text-sm dark:text-gray-200">
                          {message.content}
                        </p>
                      </div>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 ml-2">
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </span>
                    </div>
                  </motion.div>
                  {message.sender_id === session?.user?.id && (
                    <motion.div
                      className="w-[55px] h-[55px] rounded-full overflow-hidden ml-2 flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                      }}
                    >
                      <Image
                        src={
                          session?.user?.image || "/images/default-avatar.png"
                        }
                        alt="You"
                        width={55}
                        height={55}
                        className="w-full h-full object-cover bg-gradient-to-r from-blue-500 to-teal-500"
                      />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {sending && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <motion.div
                  className="flex flex-row rounded-full border p-2 items-center space-x-2"
                  animate={{
                    scale: [1, 1.02, 1],
                    transition: {
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                  }}
                >
                  <div className="bg-white dark:bg-gray-800 rounded-full px-5 py-2 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-500 dark:text-gray-400" />
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                      Thinking...
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </div>
        </ScrollArea>
        <form
          onSubmit={handleSendMessage}
          className="p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm flex gap-2"
        >
          <motion.div className="flex-1" whileHover={{ scale: 1.01 }}>
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={sending}
              className="flex-1 bg-white dark:bg-gray-700 border-none rounded-full px-6 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:text-gray-200 dark:placeholder-gray-400"
            />
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              type="submit"
              disabled={sending}
              className="rounded-full px-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </motion.div>
        </form>
      </Card>
    </div>
  );
}
