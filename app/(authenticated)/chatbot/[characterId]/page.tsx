"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import  Chat  from "@/components/chat";
import type { Message, Character } from "@/types/chat";

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
    },
  });

  const characterId = params.characterId as string;
  const [character, setCharacter] = useState<Character | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        setError("Failed to initialize chat. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();
  }, [characterId, session, status]);

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (isLoading || !character || !sessionId) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 py-24">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">{character.name}</h1>
        <p className="text-gray-600">{character.description}</p>
      </div>
      <Chat
        characterId={characterId}
        sessionId={sessionId}
        initialMessages={messages}
      />
    </div>
  );
}
