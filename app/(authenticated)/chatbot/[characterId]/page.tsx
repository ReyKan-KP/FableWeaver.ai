"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Chat from "@/components/chat";
import type { Message, Character } from "@/types/chat";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Info, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import CharacterChatLoading from "./loading";
import { toast } from "sonner";

interface ChatSessionResponse {
  session_id: string;
  messages: Message[];
  continued: boolean;
  error?: string;
}


export default function CharacterChatPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/sign-in");
      toast.error("Authentication Required", {
        description: "Please sign in to chat with characters",
      });
    },
  });

  const characterId = params.characterId as string;
  const [character, setCharacter] = useState<Character | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user?.id) return;

    const initializeChat = async () => {
      try {
        // Fetch character data
        const characterResponse = await fetch(`/api/characters/${characterId}`);
        if (!characterResponse.ok) {
          throw new Error("Failed to fetch character");
        }
        const characterData: Character = await characterResponse.json();
        setCharacter(characterData);
        
        toast("Character Loaded", {
          description: `Ready to chat with ${characterData.name}!`,
        });

        // Initialize or retrieve chat session
        const sessionResponse = await fetch("/api/chat-sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            character_id: characterId,
          }),
        });

        if (!sessionResponse.ok) {
          throw new Error("Failed to initialize chat session");
        }

        const sessionData: ChatSessionResponse = await sessionResponse.json();
        setSessionId(sessionData.session_id);
        setMessages(sessionData.messages);
      } catch (error) {
        console.error("Error initializing chat:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to initialize chat";
        setError(errorMessage);
        toast.error("Chat Initialization Failed", {
          description: errorMessage,
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();
  }, [characterId, session, status]);

  useEffect(() => {
    if (showInfo) {
      toast("Character Info", {
        description: "Showing character details and background",
      });
    }
  }, [showInfo]);

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto p-4"
      >
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-6 py-4 rounded-lg shadow-sm">
          <p className="font-medium">Error</p>
          <p className="mt-1">{error}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/characters")}
            className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-full hover:bg-red-200 dark:hover:bg-red-900/70 transition-colors"
          >
            Return to Characters
          </motion.button>
        </div>
      </motion.div>
    );
  }

  if (isLoading || !character || !sessionId) {
    return <CharacterChatLoading />;
  }

  return (
    <div className="max-w-5xl mx-auto p-4 py-6 min-h-screen ">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div className="flex items-center gap-4">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Link
              href="/character-realm"
              className="p-2 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </motion.div>
          <div className="flex items-center gap-3">
            <motion.div
              className="w-12 h-12 rounded-full overflow-hidden"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              style={{ perspective: 1000 }}
            >
              <motion.div
                whileHover={{ rotateY: 15, rotateX: -15 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Image
                  src={character.image_url || "/images/default-character.png"}
                  alt={character.name}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500"
                />
              </motion.div>
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">
                {character.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                From: {character.content_source}
              </p>
            </div>
          </div>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={() => setShowInfo(!showInfo)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors group"
                aria-label="Toggle character info"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Info className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-blue-500 dark:group-hover:text-blue-400" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{showInfo ? "Hide" : "Show"} character info</p>
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
              <p className="text-gray-700 dark:text-gray-200">
                {character.description}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <Chat
          characterId={characterId}
          sessionId={sessionId}
          initialMessages={messages}
          characterImage={character.image_url}
        />
      </motion.div>
    </div>
  );
}
