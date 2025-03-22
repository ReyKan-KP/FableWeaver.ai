"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Send, Loader2, ArrowLeft, Info, Users, Sparkles } from "lucide-react";
import type { GroupChat, GroupChatMessage } from "@/types/chat";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserAvatar } from "@/components/user-avatar";

const supabase = createBrowserSupabaseClient();

interface GroupChatPayload {
  session_id: string;
  messages: GroupChatMessage[];
  group_name: string;
  characters: { id: string; name: string; image_url: string }[];
  [key: string]: any;
}

interface GroupInfo {
  messages: GroupChatMessage[];
  characters: { id: string; name: string; image_url: string }[];
  users: {
    user_id: string | null | undefined;
    user_name: string;
    image: string | null | undefined;
  }[];
}

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

async function getUserImageUrl(senderId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from("user")
      .select("avatar_url")
      .eq("user_id", senderId)
      .single();

    if (error || !data?.avatar_url) {
      return "/images/default-avatar.png";
    }

    return data.avatar_url;
  } catch {
    return "/images/default-avatar.png";
  }
}

export default function GroupChatSession() {
  const { sessionId } = useParams();
  const { data: session } = useSession();
  const [messages, setMessages] = useState<GroupChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [characterImages, setCharacterImages] = useState<
    Record<string, string>
  >({});
  const [userImages, setUserImages] = useState<Record<string, string>>({});
  const [showInfo, setShowInfo] = useState(false);
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/group-chat/${sessionId}`);
        if (!res.ok) throw new Error("Failed to load messages");
        const data = await res.json();
        setMessages(data.messages || []);
        
        // Add success toast for initial load
        if (loading) {
          toast("Chat Loaded", {
            description: "Welcome to the group chat!",
          });
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast.error("Error Loading Chat", {
          description: "Failed to load chat messages. Please try refreshing.",
        });
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id && sessionId) {
      fetchMessages();

      // Set up real-time subscription
      const channel = supabase
        .channel(`group_chat_${sessionId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "group_chat_history",
            filter: `session_id=eq.${sessionId}`,
          },
          (payload: RealtimePostgresChangesPayload<GroupChatPayload>) => {
            const newData = payload.new as GroupChatPayload;
            if (
              newData &&
              "messages" in newData &&
              Array.isArray(newData.messages)
            ) {
              setMessages(newData.messages);
            }
          }
        )
        .subscribe();

      // Cleanup subscription on unmount
      return () => {
        channel.unsubscribe();
      };
    }
  }, [session?.user?.id, sessionId, loading]);

  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollAreaRef.current) {
        const scrollArea = scrollAreaRef.current;
        const scrollHeight = scrollArea.scrollHeight;
        const height = scrollArea.clientHeight;
        const maxScroll = scrollHeight - height;

        scrollArea.scrollTo({
          top: maxScroll,
          behavior: "smooth",
        });
      }
    };

    // Scroll immediately for initial load
    scrollToBottom();

    // And then again after a short delay to ensure content is rendered
    const timeoutId = setTimeout(scrollToBottom, 100);

    return () => clearTimeout(timeoutId);
  }, [messages, sending]);

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

  useEffect(() => {
    const loadUserImages = async () => {
      const userIds = groupInfo?.users
        .map((u) => u.user_id)
        .filter((id): id is string => id !== null && id !== undefined);

      if (!userIds) return;

      for (const id of userIds) {
        const imageUrl = await getUserImageUrl(id);
        console.log(imageUrl);
        setUserImages((prev) => ({ ...prev, [id]: imageUrl }));
      }
    };

    if (groupInfo?.users) {
      loadUserImages();
    }
  }, [groupInfo?.users]);
  console.log(userImages);

  useEffect(() => {
    const fetchGroupInfo = async () => {
      try {
        const res = await fetch(`/api/group-chat/${sessionId}`);
        if (!res.ok) throw new Error("Failed to load group information");
        const data = await res.json();
        setGroupInfo(data);
        setMessages(data.messages || []);
      } catch (error) {
        console.error("Error fetching group info:", error);
        toast.error("Error", {
          description: "Failed to load group information. Some features may be limited.",
        });
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchGroupInfo();
    }
  }, [sessionId]);

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
      toast.error("Error Sending Message", {
        description: "Failed to send your message. Please try again.",
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
  console.log(groupInfo);
  return (
    <div className="container mx-auto py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div className="flex items-center gap-4">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Link
              href="/character-confluence"
              className="p-2 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </motion.div>
          <div className="flex items-center gap-3">
            {/* Combined Stack */}
            <div className="flex -space-x-4">
              {(() => {
                const allParticipants = [
                  ...(groupInfo?.characters?.map((char) => ({
                    id: char.id,
                    name: char.name,
                    image:
                      characterImages[char.id] ||
                      "/images/default-character.png",
                    type: "character",
                  })) || []),
                  ...(groupInfo?.users?.map((user) => ({
                    id: user.user_id || "",
                    name: user.user_name,
                    image:
                      userImages[user.user_id ?? ""] ||
                      "/images/default-avatar.png",
                    type: "user",
                  })) || []),
                ].sort(() => Math.random() - 0.5);

                const displayParticipants = allParticipants.slice(0, 3);
                const remainingCount = allParticipants.length - 3;

                return (
                  <>
                    {displayParticipants.map((participant) => (
                      <motion.div
                        key={participant.id}
                        className="w-12 h-12 rounded-full overflow-hidden border-2 border-white dark:border-gray-800"
                        whileHover={{ scale: 1.1, zIndex: 10 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                        }}
                        style={{ perspective: 1000 }}
                      >
                        <Image
                          src={participant.image}
                          alt={participant.name}
                          width={48}
                          height={48}
                          className={cn(
                            "w-full h-full object-cover",
                            participant.type === "character"
                              ? "bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500"
                              : "bg-gradient-to-r from-blue-500 to-purple-500"
                          )}
                        />
                      </motion.div>
                    ))}
                    {remainingCount > 0 && (
                      <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-white dark:border-gray-800">
                        <span className="text-sm font-medium">
                          +{remainingCount}
                        </span>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">
                Group Chat
              </h1>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mt-1">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{groupInfo?.users?.length || 0} Users</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  <span>{groupInfo?.characters?.length || 0} Characters</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={() => setShowInfo(!showInfo)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors group"
                aria-label="Toggle group info"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Users className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-blue-500 dark:group-hover:text-blue-400" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{showInfo ? "Hide" : "Show"} group info</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </motion.div>

      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="bg-gradient-to-r from-violet-500/10 via-blue-500/10 to-teal-500/10 dark:from-violet-500/5 dark:via-blue-500/5 dark:to-teal-500/5 backdrop-blur-sm rounded-lg p-4 mb-6">
              {/* Characters Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-gray-700 dark:text-gray-200">
                  <Sparkles className="w-5 h-5" />
                  Characters
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {groupInfo?.characters.map((character) => (
                    <div
                      key={character.id}
                      className="flex items-center gap-2 bg-white/50 dark:bg-gray-800/50 rounded-lg p-2"
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden">
                        <Image
                          src={
                            characterImages[character.id] ||
                            "/images/default-character.png"
                          }
                          alt={character.name}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Link
                        href={`/chatbot/${character.name.toLowerCase().replace(/\s+/g, '-')}`}
                        className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:underline"
                      >
                        {character.name}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              {/* Users Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-gray-700 dark:text-gray-200">
                  <Users className="w-5 h-5" />
                  Users
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {groupInfo?.users.map((user) => (
                    <div
                      key={user.user_id}
                      className="flex items-center gap-2 bg-white/50 dark:bg-gray-800/50 rounded-lg p-2"
                    >
                      <UserAvatar
                        userId={user.user_id ?? ""}
                        userName={user.user_name}
                        avatarUrl={userImages[user.user_id ?? ""]}
                        size="sm"
                      />
                      <Link href={`/user/${user.user_name}`} className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:underline">
                        {user.user_name}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                            : userImages[
                                message.sender_id ??
                                  "/images/default-character.png"
                              ]
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
                          userImages[message.sender_id ?? ""] ||
                          "/images/default-avatar.png"
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
