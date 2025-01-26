"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2 } from "lucide-react";
import type { Message } from "@/types/chat";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ChatProps {
  characterId: string;
  sessionId: string;
  initialMessages?: Message[];
  characterImage?: string;
}

export default function Chat({
  characterId,
  sessionId,
  initialMessages = [],
  characterImage,
}: ChatProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !session?.user?.id || isLoading) return;

    setIsLoading(true);
    const userMessage = {
      role: "user" as const,
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character_id: characterId,
          user_input: input,
          session_id: sessionId,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setMessages(data.history || []);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const messageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-[#bccff1] dark:bg-zinc-900 border-none shadow-lg">
      <ScrollArea
        className="h-[600px] px-4 py-6 dark:bg-dot-white/[0.2] bg-dot-black/[0.2]"
        ref={scrollAreaRef}
      >
        <CardContent className="space-y-4">
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
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <motion.div
                    className="w-[55px] h-[55px] rounded-full overflow-hidden mr-2 flex-shrink-0"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <Image
                      src={characterImage || "/images/default-character.png"}
                      alt="Character"
                      className="w-full h-full object-cover"
                      width={55}
                      height={55}
                    />
                  </motion.div>
                )}
                <motion.div
                  className={cn(
                    "flex flex-row rounded-full border p-2 items-center space-x-2",
                    message.role === "user" ? "ml-auto" : ""
                  )}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <div className="bg-background rounded-full px-5 py-2 flex items-center">
                    <p className="whitespace-pre-wrap leading-relaxed text-sm dark:text-gray-200">
                      {message.content}
                    </p>
                    {message.timestamp && (
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 ml-2">
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </span>
                    )}
                  </div>
                </motion.div>
                {message.role === "user" && (
                  <motion.div
                    className="w-[55px] h-[55px] rounded-full overflow-hidden ml-2 flex-shrink-0"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <Image
                      src={session?.user?.image || "/images/default-avatar.png"}
                      alt="User"
                      className="w-full h-full object-cover bg-gradient-to-r from-blue-500 to-teal-500"
                      width={55}
                      height={55}
                    />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <motion.div
                className="flex flex-row rounded-full border p-2 items-center space-x-2 "
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
        </CardContent>
      </ScrollArea>
      <CardFooter className="p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="flex w-full gap-2">
          <motion.div className="flex-1" whileHover={{ scale: 1.01 }}>
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 bg-white dark:bg-gray-700 border-none rounded-full px-6 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:text-gray-200 dark:placeholder-gray-400"
            />
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              type="submit"
              disabled={isLoading}
              className="rounded-full px-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </motion.div>
        </form>
      </CardFooter>
    </Card>
  );
}
