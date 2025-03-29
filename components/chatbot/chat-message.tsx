"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { MessageCircle, User, Volume2, Wand2 } from "lucide-react"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { createBrowserSupabaseClient } from "@/lib/supabase"
import { cn } from "@/lib/utils"

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt?: Date;
}

interface ChatMessageProps {
  message: Message;
  isSpeaking?: boolean;
  onSpeakMessage?: (content: string) => void;
}

export default function ChatMessage({ 
  message, 
  isSpeaking = false,
  onSpeakMessage
}: ChatMessageProps) {
  const [displayedText, setDisplayedText] = useState("")
  const [isTyping, setIsTyping] = useState(message.role === "assistant")
  const isUser = message.role === "user"
  const { data: session, status } = useSession();
  const supabase = createBrowserSupabaseClient();
  const user = session?.user;

  // Handle click on assistant message to speak
  const handleMessageClick = () => {
    if (!isUser && onSpeakMessage && !isTyping) {
      onSpeakMessage(message.content);
    }
  };

  // Simulate typing effect for assistant messages
  useEffect(() => {
    if (message.role === "assistant") {
      let i = 0
      const content = message.content
      setDisplayedText("")

      const typingInterval = setInterval(() => {
        if (i < content.length) {
          setDisplayedText((prev) => prev + content.charAt(i))
          i++
        } else {
          clearInterval(typingInterval)
          setIsTyping(false)
        }
      }, 15) // Adjust typing speed here

      return () => clearInterval(typingInterval)
    } else {
      setDisplayedText(message.content)
      setIsTyping(false)
    }
  }, [message])

  const messageVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, x: -20 },
  }

  // Audio wave animation for speaking indicator
  const audioWaveVariants = {
    start: { scaleY: 0.5 },
    end: { scaleY: [0.2, 0.5, 1, 0.5, 0.2] },
  };

  // Get timestamp if available
  const timestamp = message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }) : null;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={messageVariants}
      transition={{ duration: 0.4, type: "spring", damping: 15 }}
      className={`flex items-start ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <motion.div
          className="w-8 h-8 rounded-full overflow-hidden mr-2 flex-shrink-0"
          whileHover={{ scale: 1.1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Image 
            src="/images/logo.png" 
            alt="Weaver Whisperer" 
            width={32} 
            height={32}
            className="object-cover w-full h-full" 
          />
        </motion.div>
      )}

      <motion.div
        whileHover={{ scale: 1.02 }}
        className={cn(
          "relative rounded-3xl border p-2 flex items-center bg-background",
          isUser ? "ml-auto" : "",
          isSpeaking ? "border-primary shadow-[0_0_10px_rgba(var(--primary)/0.3)]" : "",
          !isUser && !isTyping ? "cursor-pointer hover:bg-secondary/10" : ""
        )}
        onClick={handleMessageClick}
        title={!isUser ? "Click to hear this message" : ""}
      >
        <p className="px-3 py-1.5 text-sm whitespace-pre-wrap leading-relaxed">
          {displayedText}
          {isTyping && (
            <span className="inline-flex ml-1">
              <span className="w-1 h-4 bg-current mx-0.5 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
              <span className="w-1 h-4 bg-current mx-0.5 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
              <span className="w-1 h-4 bg-current mx-0.5 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
            </span>
          )}
        </p>
        
        <div className="flex items-center gap-1 min-w-[40px] justify-end">
          {timestamp && (
            <span className="text-[10px] text-gray-500 dark:text-gray-400">
              {timestamp}
            </span>
          )}
          
          {isSpeaking && !isUser && (
            <span className="ml-1 relative flex items-center justify-center w-4 h-4">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.7, 1, 0.7] 
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity,
                  repeatType: "loop" 
                }}
                className="absolute inset-0 bg-primary/20 rounded-full"
              />
              <div className="relative flex items-center justify-center gap-[2px] h-full">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className="w-[2px] bg-primary rounded-full"
                    style={{ height: "60%" }}
                    initial="start"
                    animate="end"
                    variants={audioWaveVariants}
                    transition={{
                      repeat: Infinity,
                      repeatType: "reverse",
                      duration: 0.4,
                      delay: i * 0.1,
                    }}
                  />
                ))}
              </div>
            </span>
          )}
          
          {!isUser && !isSpeaking && !isTyping && (
            <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-primary">
              <Volume2 size={10} />
            </span>
          )}
        </div>
      </motion.div>

      {isUser && (
        <motion.div
          className="w-8 h-8 rounded-full overflow-hidden ml-2 flex-shrink-0"
          whileHover={{ scale: 1.1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Avatar className="h-full w-full">
            <AvatarImage
              src={session?.user?.image || "/images/default-avatar.png"}
              alt={session?.user?.name || ""}
              className="object-cover"
            />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-teal-500">
              {session?.user?.name?.charAt(0).toUpperCase() ||
                session?.user?.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </motion.div>
      )}

      {isSpeaking && (
        <div className="absolute right-2 bottom-2 flex items-center gap-1 text-primary">
          <Wand2 size={14} className="text-primary animate-pulse" />
          <span className="text-xs font-medium">ElevenLabs</span>
          <div className="flex items-center gap-[2px]">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 h-3 bg-primary rounded-full"
                animate={{
                  height: ["3px", "8px", "3px"],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

