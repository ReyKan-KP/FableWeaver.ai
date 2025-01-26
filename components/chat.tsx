"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Message } from "@/types/chat";

interface ChatProps {
  characterId: string;
  sessionId: string;
  initialMessages?: Message[];
}

export default function Chat({
  characterId,
  sessionId,
  initialMessages = [],
}: ChatProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [scrollAreaRef]); //Corrected dependency

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
      // Rollback the optimistic update
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <ScrollArea className="h-[600px] p-4" ref={scrollAreaRef}>
        <CardContent className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.timestamp && (
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </ScrollArea>
      <CardFooter className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex w-full gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send"}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
